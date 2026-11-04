const CHANNEL_NAME = 'nativelayer-css-vars';
const MESSAGE_SOURCE = 'nativelayer-css-vars';

/** Vars always collected — Firefox/Safari may not enumerate custom props on getComputedStyle. */
const THEME_VAR_ALLOWLIST = [
  '--core-unit', '--space-unit', '--size-unit', '--space-ratio', '--size-ratio',
  '--top-bar-height', '--page-padding-x',
  '--lightness', '--darkness', '--accent-lightness',
  '--lightest', '--darkest',
  '--fcolor-hsl', '--bcolor-hsl',
  '--accent-color-hsl', '--accent-color-hsl-adjusted', '--over-accent-color-hsl',
  '--accent-color',
  '--font-1', '--font-2', '--font-3', '--font-4',
  '--ff-1', '--ff-2', '--ff-3', '--ff-4',
  '--f-size-t', '--f-size-s', '--f-size-p',
  '--f-size-4', '--f-size-3', '--f-size-2', '--f-size-1',
  '--f-size-l', '--f-size-xl', '--f-size-2xl', '--f-size-3xl',
  '--f-size-4xl', '--f-size-5xl', '--f-size-6xl', '--f-size-7xl',
  '--ratio-size', '--ratio-space', '--ratio-font-size', '--ratio-font-grow',
];

const DEMO_WIDGET_SELECTOR = 'nx-calculator, nx-weather-report, nx-radio-tuner, nx-breaking-news, nx-stock-market, nx-password-generator';

let channel = null;
let lastPayloadKey = '';
let lastPayload = null;
let broadcastScheduled = false;
const registeredWindows = new Set();

function getOrigin() {
  return window.location.origin;
}

function getChannel() {
  if (!channel && typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

function collectVarsFromStyle(style, names) {
  for (let i = 0; i < style.length; i++) {
    const prop = style[i];
    if (prop.startsWith('--')) names.add(prop);
  }
}

function collectVarsFromRules(rules, names) {
  for (const rule of rules) {
    try {
      if (rule.cssRules) {
        collectVarsFromRules(rule.cssRules, names);
        continue;
      }
      const selector = rule.selectorText;
      if (!selector || !selector.includes(':root')) continue;
      collectVarsFromStyle(rule.style, names);
    } catch {
      /* inaccessible rule */
    }
  }
}

function collectDeclaredRootVarNames() {
  const names = new Set(THEME_VAR_ALLOWLIST);
  for (const sheet of document.styleSheets) {
    try {
      collectVarsFromRules(sheet.cssRules, names);
    } catch {
      /* cross-origin or inaccessible stylesheet */
    }
  }
  return names;
}

export function collectRootCSSVars(root = document.documentElement) {
  const computed = getComputedStyle(root);
  const names = collectDeclaredRootVarNames();

  for (let i = 0; i < computed.length; i++) {
    const name = computed[i];
    if (name.startsWith('--')) names.add(name);
  }

  const vars = {};
  for (const name of names) {
    vars[name] = computed.getPropertyValue(name).trim();
  }

  return vars;
}

export function applyRootCSSVars(vars, root = document.documentElement) {
  for (const [name, value] of Object.entries(vars)) {
    if (!name.startsWith('--') || !value) continue;
    root.style.setProperty(name, value);
  }
}

function postToWindow(win, payload) {
  if (!win) return;
  try {
    win.postMessage(payload, getOrigin());
  } catch {
    /* detached or cross-origin frame */
  }
}

function propagateThemeToWidgets(themeMode) {
  if (!themeMode) return;
  document.querySelectorAll(DEMO_WIDGET_SELECTOR).forEach((el) => {
    el.setAttribute('theme-mode', themeMode);
  });
}

export function syncWidgetThemeFromRoot() {
  propagateThemeToWidgets(document.documentElement.getAttribute('theme-mode'));
}

function collectThumbIframeWindows() {
  const wins = new Set(registeredWindows);
  document.querySelectorAll('.demo-thumb-wrap iframe').forEach((iframe) => {
    const win = iframe.contentWindow;
    if (win) wins.add(win);
  });
  return wins;
}

function applyCSSVarsPayload(data) {
  const { vars, themeMode } = data;
  if (!vars) return;

  const root = document.documentElement;
  if (themeMode && root.getAttribute('theme-mode') !== themeMode) {
    root.setAttribute('theme-mode', themeMode);
  }
  applyRootCSSVars(vars, root);
  if (themeMode) propagateThemeToWidgets(themeMode);
}

function handleBroadcasterMessage(data) {
  if (data?.source !== MESSAGE_SOURCE) return;
  if (data.type === 'request-css-vars') scheduleBroadcast();
}

function deliverCSSVars(payload) {
  const ch = getChannel();
  if (ch) ch.postMessage(payload);

  for (const win of collectThumbIframeWindows()) {
    postToWindow(win, payload);
  }
}

function scheduleDeliverToWindow(win, payload) {
  postToWindow(win, payload);
  requestAnimationFrame(() => postToWindow(win, payload));
  setTimeout(() => postToWindow(win, payload), 50);
  setTimeout(() => postToWindow(win, payload), 200);
}

export function buildCSSVarsPayload() {
  const vars = collectRootCSSVars();
  const themeMode = document.documentElement.getAttribute('theme-mode') || '';
  return { type: 'css-vars', source: MESSAGE_SOURCE, vars, themeMode };
}

export function broadcastCSSVars() {
  const payload = buildCSSVarsPayload();
  const payloadKey = JSON.stringify({ vars: payload.vars, themeMode: payload.themeMode });

  if (payloadKey === lastPayloadKey) return;
  lastPayloadKey = payloadKey;
  lastPayload = payload;

  deliverCSSVars(payload);
}

function scheduleBroadcast() {
  if (broadcastScheduled) return;
  broadcastScheduled = true;
  requestAnimationFrame(() => {
    broadcastScheduled = false;
    broadcastCSSVars();
  });
}

let widgetThemeSyncScheduled = false;

function scheduleWidgetThemeSync() {
  if (widgetThemeSyncScheduled) return;
  widgetThemeSyncScheduled = true;
  requestAnimationFrame(() => {
    widgetThemeSyncScheduled = false;
    syncWidgetThemeFromRoot();
  });
}

export function listenForCSSVars() {
  window.addEventListener('message', (event) => {
    if (event.origin !== getOrigin()) return;
    const data = event.data;
    if (data?.source !== MESSAGE_SOURCE || data.type !== 'css-vars') return;
    applyCSSVarsPayload(data);
  });

  const ch = getChannel();
  if (ch) {
    ch.onmessage = (event) => {
      const data = event.data;
      if (data?.source !== MESSAGE_SOURCE || data.type !== 'css-vars') return;
      applyCSSVarsPayload(data);
    };
  }

  syncWidgetThemeFromRoot();

  const themeObserver = new MutationObserver(() => scheduleWidgetThemeSync());
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['theme-mode'],
  });

  if (document.body) {
    new MutationObserver(() => scheduleWidgetThemeSync()).observe(document.body, {
      childList: true,
      subtree: true,
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      new MutationObserver(() => scheduleWidgetThemeSync()).observe(document.body, {
        childList: true,
        subtree: true,
      });
      scheduleWidgetThemeSync();
    });
  }

  if (window.parent !== window) {
    const request = { type: 'request-css-vars', source: MESSAGE_SOURCE };
    postToWindow(window.parent, request);
    if (ch) ch.postMessage(request);
    requestAnimationFrame(() => {
      postToWindow(window.parent, request);
      if (ch) ch.postMessage(request);
    });
  }
}

export function requestCSSVars() {
  const request = { type: 'request-css-vars', source: MESSAGE_SOURCE };
  const ch = getChannel();
  if (ch) ch.postMessage(request);
  if (window.parent !== window) {
    postToWindow(window.parent, request);
  }
}

/**
 * Register a demo-thumb iframe so the parent pushes vars via postMessage
 * (reliable in Safari/Firefox; BroadcastChannel can be partitioned or miss timing).
 */
export function registerIframeForCSSVars(iframe) {
  const sync = () => {
    const win = iframe.contentWindow;
    if (!win) return;
    registeredWindows.add(win);
    if (lastPayload) scheduleDeliverToWindow(win, lastPayload);
  };

  iframe.addEventListener('load', sync);
  if (iframe.contentDocument?.readyState === 'complete') sync();

  return sync;
}

export function initCSSVarsBroadcaster() {
  window.addEventListener('message', (event) => {
    if (event.origin !== getOrigin()) return;
    handleBroadcasterMessage(event.data);
  });

  const ch = getChannel();
  if (ch) {
    ch.onmessage = (event) => handleBroadcasterMessage(event.data);
  }

  const observer = new MutationObserver(() => {
    scheduleBroadcast();
    scheduleWidgetThemeSync();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['theme-mode'],
  });

  requestAnimationFrame(() => broadcastCSSVars());

  return {
    broadcastCSSVars,
    requestCSSVars,
    registerIframeForCSSVars,
    observer,
  };
}
