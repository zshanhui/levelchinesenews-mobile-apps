export const SYSTEM_ARTICLE_FONT_ID = 'system';
export const NOTO_SANS_SC_FONT_ID = 'notoSansSc';

export type RemoteFontId = string;
export type ArticleFontId = typeof SYSTEM_ARTICLE_FONT_ID | RemoteFontId;

export type RemoteFontFile = {
  family: string;
  path: string;
  sizeBytes?: number;
  sha256?: string;
};

export type RemoteFontDescriptor = {
  id: RemoteFontId;
  label: string;
  version: string;
  baseUrl: string;
  families: {
    body: string;
    pinyin?: string;
    bold?: string;
  };
  files: RemoteFontFile[];
};

const JSDELIVR_NOTO_SANS_SC_BASE_URL =
  'https://cdn.jsdelivr.net/npm/@expo-google-fonts/noto-sans-sc@0.4.2';

export const remoteArticleFonts: RemoteFontDescriptor[] = [
  {
    id: NOTO_SANS_SC_FONT_ID,
    label: 'Noto Sans SC',
    version: '0.4.2',
    baseUrl: JSDELIVR_NOTO_SANS_SC_BASE_URL,
    families: {
      body: 'NotoSansSC_400Regular',
      pinyin: 'NotoSansSC_200ExtraLight',
      bold: 'NotoSansSC_400Regular',
    },
    files: [
      {
        family: 'NotoSansSC_400Regular',
        path: '400Regular/NotoSansSC_400Regular.ttf',
        sizeBytes: 10_100_000,
      },
      {
        family: 'NotoSansSC_200ExtraLight',
        path: '200ExtraLight/NotoSansSC_200ExtraLight.ttf',
        sizeBytes: 10_100_000,
      },
    ],
  },
];

export function getRemoteArticleFont(id: string): RemoteFontDescriptor | undefined {
  return remoteArticleFonts.find((font) => font.id === id);
}

export function getRemoteFontBaseUrl(font: RemoteFontDescriptor): string {
  return font.baseUrl.trim().replace(/\/$/, '');
}

export function getRemoteFontFileUrl(
  font: RemoteFontDescriptor,
  file: RemoteFontFile,
): string {
  return `${getRemoteFontBaseUrl(font)}/${file.path.replace(/^\//, '')}`;
}

export function getRemoteFontDownloadSizeBytes(
  font: RemoteFontDescriptor,
): number | undefined {
  const sizes = font.files.map((file) => file.sizeBytes);
  if (sizes.some((size) => size == null)) return undefined;
  return sizes.reduce<number>((total, size) => total + Number(size), 0);
}
