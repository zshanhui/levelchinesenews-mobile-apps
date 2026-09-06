import * as Linking from 'expo-linking';
import { router, usePathname, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  lastArticleRouteHref,
  loadLastArticleRoute,
  parseArticleRouteFromUrl,
  pathnameHasArticle,
} from './lastArticleRoute';

/** Once per JS process: open the launch deep link, or the last article after a process kill. */
export function useRestoreArticleOnLaunch() {
  const navigationState = useRootNavigationState();
  const pathname = usePathname();
  const didRestore = useRef(false);

  useEffect(() => {
    if (didRestore.current) return;
    if (!navigationState?.key) return;

    let cancelled = false;
    (async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        const fromUrl = parseArticleRouteFromUrl(initialUrl);
        const route = fromUrl ?? (await loadLastArticleRoute());
        if (cancelled || !route) return;
        if (pathnameHasArticle(pathname, route.id)) return;
        const href = lastArticleRouteHref(route);
        if (fromUrl) {
          router.replace(href);
        } else {
          router.push(href);
        }
      } catch {
        // ignore restore failures
      } finally {
        if (!cancelled) {
          didRestore.current = true;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigationState?.key, pathname]);
}
