import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { STORAGE_KEY_REMOTE_FONTS } from '../constants';
import {
  getRemoteFontFileUrl,
  type RemoteFontDescriptor,
  type RemoteFontId,
} from './remoteFonts';

type RemoteFontMetadata = {
  id: RemoteFontId;
  version: string;
  downloadedAt: number;
  files: Record<string, string>;
};

type RemoteFontMetadataById = Partial<Record<RemoteFontId, RemoteFontMetadata>>;

function filenameFromPath(path: string): string {
  return path.split('/').filter(Boolean).pop() ?? path;
}

function getRemoteFontDirectoryHandle(font: RemoteFontDescriptor): Directory {
  return new Directory(Paths.document, 'fonts', font.id, font.version);
}

function getRemoteFontsRootDirectoryHandle(): Directory {
  return new Directory(Paths.document, 'fonts');
}

function getRemoteFontFileHandle(
  font: RemoteFontDescriptor,
  filePath: string,
): File {
  return new File(getRemoteFontDirectoryHandle(font), filenameFromPath(filePath));
}

export function getRemoteFontDirectory(font: RemoteFontDescriptor): string {
  return getRemoteFontDirectoryHandle(font).uri;
}

export function getRemoteFontFileUri(
  font: RemoteFontDescriptor,
  filePath: string,
): string {
  return getRemoteFontFileHandle(font, filePath).uri;
}

export function getRemoteFontSources(font: RemoteFontDescriptor): Record<string, string> {
  return Object.fromEntries(
    font.files.map((file) => [
      file.family,
      getRemoteFontFileUri(font, file.path),
    ]),
  );
}

async function readRemoteFontMetadata(): Promise<RemoteFontMetadataById> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY_REMOTE_FONTS);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as RemoteFontMetadataById;
  } catch {
    return {};
  }
}

async function saveRemoteFontMetadata(
  nextMetadata: RemoteFontMetadataById,
): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEY_REMOTE_FONTS,
    JSON.stringify(nextMetadata),
  );
}

async function filesExist(font: RemoteFontDescriptor): Promise<boolean> {
  return font.files.every((file) =>
    getRemoteFontFileHandle(font, file.path).exists,
  );
}

async function saveDownloadedMetadata(
  font: RemoteFontDescriptor,
  files: Record<string, string>,
): Promise<void> {
  const metadata = await readRemoteFontMetadata();
  metadata[font.id] = {
    id: font.id,
    version: font.version,
    downloadedAt: Date.now(),
    files,
  };
  await saveRemoteFontMetadata(metadata);
}

export async function getDownloadedRemoteFontSources(
  font: RemoteFontDescriptor,
): Promise<Record<string, string> | null> {
  const metadata = await readRemoteFontMetadata();
  const saved = metadata[font.id];
  const sources = getRemoteFontSources(font);

  if (saved?.version === font.version && await filesExist(font)) {
    return saved.files;
  }

  if (await filesExist(font)) {
    await saveDownloadedMetadata(font, sources);
    return sources;
  }

  return null;
}

export async function downloadRemoteFont(
  font: RemoteFontDescriptor,
): Promise<Record<string, string>> {
  const fontDirectory = getRemoteFontDirectoryHandle(font);
  fontDirectory.create({ idempotent: true, intermediates: true });

  const sources: Record<string, string> = {};

  for (const file of font.files) {
    const localFile = getRemoteFontFileHandle(font, file.path);
    if (localFile.exists) {
      localFile.delete();
    }

    try {
      const downloadedFile = await File.downloadFileAsync(
        getRemoteFontFileUrl(font, file),
        localFile,
        { idempotent: true },
      );
      sources[file.family] = downloadedFile.uri;
    } catch (err) {
      if (localFile.exists) {
        localFile.delete();
      }
      throw err;
    }
  }

  await saveDownloadedMetadata(font, sources);
  return sources;
}

export async function clearDownloadedRemoteFonts(): Promise<void> {
  const fontsRoot = getRemoteFontsRootDirectoryHandle();
  if (fontsRoot.exists) {
    fontsRoot.delete();
  }
  await AsyncStorage.removeItem(STORAGE_KEY_REMOTE_FONTS);
}
