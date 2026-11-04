const root = document.documentElement;

export function syncThemeModeFromRoot(el) {
  const mode = root.getAttribute('theme-mode');
  if (mode) el.setAttribute('theme-mode', mode);
  else el.removeAttribute('theme-mode');
}

export function observeThemeModeRoot(el) {
  syncThemeModeFromRoot(el);
  const observer = new MutationObserver(() => syncThemeModeFromRoot(el));
  observer.observe(root, { attributes: true, attributeFilter: ['theme-mode'] });
  return observer;
}
