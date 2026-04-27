/** Injected once on web so scrollbars match the app (RN Web overflow regions). */

export const WEB_SCROLLBAR_STYLE_ID = 'lcn-web-scrollbar';

/** Thinner, parchment-tinted thumb; WebKit + Firefox. */
export const WEB_SCROLLBAR_CSS = `
*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
*::-webkit-scrollbar-track {
  background: transparent;
}
*::-webkit-scrollbar-thumb {
  background: rgba(44, 36, 25, 0.22);
  border-radius: 9999px;
}
*::-webkit-scrollbar-thumb:hover {
  background: rgba(44, 36, 25, 0.38);
}
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(44, 36, 25, 0.3) transparent;
}
`;

export function installWebScrollbarStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(WEB_SCROLLBAR_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = WEB_SCROLLBAR_STYLE_ID;
  el.appendChild(document.createTextNode(WEB_SCROLLBAR_CSS));
  document.head.appendChild(el);
}
