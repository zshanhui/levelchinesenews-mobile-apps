import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  View,
} from 'react-native';

const PULL_THRESHOLD = 68;
const PULL_MAX = 112;
const PULL_DAMPING = 0.42;

function asElement(node: unknown): HTMLElement | null {
  if (!node) return null;
  if (typeof HTMLElement !== 'undefined' && node instanceof HTMLElement) {
    return node;
  }
  const host = node as { _nativeNode?: HTMLElement; getNativeRef?: () => unknown };
  if (host._nativeNode instanceof HTMLElement) return host._nativeNode;
  const inner = host.getNativeRef?.();
  if (inner instanceof HTMLElement) return inner;
  return null;
}

function isScrollableY(el: HTMLElement): boolean {
  const overflowY = window.getComputedStyle(el).overflowY;
  return overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
}

function findScroller(from: EventTarget | null, root: HTMLElement): HTMLElement {
  let el = from instanceof HTMLElement ? from : root;
  while (el) {
    if (isScrollableY(el)) return el;
    if (el === root) break;
    el = el.parentElement ?? root;
  }
  return root;
}

type WebPullToRefreshProps = {
  enabled: boolean;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  tintColor: string;
  children: React.ReactNode;
};

export function WebPullToRefresh({
  enabled,
  refreshing,
  onRefresh,
  tintColor,
  children,
}: WebPullToRefreshProps) {
  const wrapRef = useRef<View>(null);
  const pull = useRef(new Animated.Value(0)).current;
  const pullPx = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const refreshingRef = useRef(refreshing);
  const onRefreshRef = useRef(onRefresh);
  refreshingRef.current = refreshing;
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (refreshing) {
      pullPx.current = 0;
      pull.setValue(0);
    }
  }, [pull, refreshing]);

  useEffect(() => {
    if (!enabled) return;
    let root = asElement(wrapRef.current);
    let cancelled = false;
    let detach: (() => void) | undefined;

    const attach = (el: HTMLElement) => {
      const setPull = (next: number) => {
        pullPx.current = next;
        pull.setValue(next);
      };

      const onTouchStart = (event: TouchEvent) => {
        if (refreshingRef.current || event.touches.length !== 1) return;
        const scroller = findScroller(event.target, el);
        if (scroller.scrollTop > 1) {
          tracking.current = false;
          return;
        }
        tracking.current = true;
        startY.current = event.touches[0].clientY;
      };

      const onTouchMove = (event: TouchEvent) => {
        if (!tracking.current || refreshingRef.current || event.touches.length !== 1) {
          return;
        }
        const scroller = findScroller(event.target, el);
        const dy = event.touches[0].clientY - startY.current;
        if (scroller.scrollTop > 1 && pullPx.current <= 0) {
          tracking.current = false;
          setPull(0);
          return;
        }
        if (dy <= 0) {
          setPull(0);
          return;
        }
        event.preventDefault();
        const damped = Math.min(PULL_MAX, dy * PULL_DAMPING);
        setPull(damped);
      };

      const onTouchEnd = () => {
        if (!tracking.current) return;
        tracking.current = false;
        const shouldRefresh = pullPx.current >= PULL_THRESHOLD && !refreshingRef.current;
        Animated.spring(pull, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 280,
        }).start();
        pullPx.current = 0;
        if (shouldRefresh) void onRefreshRef.current();
      };

      el.addEventListener('touchstart', onTouchStart, { passive: true });
      el.addEventListener('touchmove', onTouchMove, { passive: false });
      el.addEventListener('touchend', onTouchEnd);
      el.addEventListener('touchcancel', onTouchEnd);
      detach = () => {
        el.removeEventListener('touchstart', onTouchStart);
        el.removeEventListener('touchmove', onTouchMove);
        el.removeEventListener('touchend', onTouchEnd);
        el.removeEventListener('touchcancel', onTouchEnd);
      };
    };

    const tryAttach = () => {
      if (cancelled) return;
      root = asElement(wrapRef.current);
      if (root) attach(root);
    };

    tryAttach();
    const raf = requestAnimationFrame(tryAttach);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      detach?.();
    };
  }, [enabled, pull]);

  if (!enabled) return children;

  return (
    <View ref={wrapRef} style={styles.root} collapsable={false}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.spinner,
          {
            opacity: pull.interpolate({
              inputRange: [0, 16, PULL_THRESHOLD],
              outputRange: [0, 0.35, 1],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                translateY: pull.interpolate({
                  inputRange: [0, PULL_MAX],
                  outputRange: [-8, 12],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        <ActivityIndicator color={tintColor} />
      </Animated.View>
      <Animated.View
        style={[styles.content, { transform: [{ translateY: pull }] }]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  spinner: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    zIndex: 2,
    alignItems: 'center',
  },
});
