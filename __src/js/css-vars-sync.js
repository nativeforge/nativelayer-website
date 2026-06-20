const CHANNEL_NAME = 'nativelayer-css-vars';

let channel = null;
let lastPayload = '';
let broadcastScheduled = false;

function getChannel() {
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

function collectDeclaredRootVarNames() {
  const names = new Set();
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        const selector = rule.selectorText;
        if (!selector || !selector.includes(':root')) continue;
        const style = rule.style;
        for (let i = 0; i < style.length; i++) {
          const prop = style[i];
          if (prop.startsWith('--')) names.add(prop);
        }
      }
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

export function broadcastCSSVars() {
  const vars = collectRootCSSVars();
  const themeMode = document.documentElement.getAttribute('theme-mode') || '';
  const payload = JSON.stringify({ vars, themeMode });

  if (payload === lastPayload) return;
  lastPayload = payload;

  getChannel().postMessage({ type: 'css-vars', vars, themeMode });
}

function scheduleBroadcast() {
  if (broadcastScheduled) return;
  broadcastScheduled = true;
  requestAnimationFrame(() => {
    broadcastScheduled = false;
    broadcastCSSVars();
  });
}

export function listenForCSSVars() {
  getChannel().onmessage = (event) => {
    const { type, vars, themeMode } = event.data || {};
    if (type !== 'css-vars' || !vars) return;

    const root = document.documentElement;
    if (themeMode && root.getAttribute('theme-mode') !== themeMode) {
      root.setAttribute('theme-mode', themeMode);
    }
    applyRootCSSVars(vars, root);
  };
}

export function requestCSSVars() {
  getChannel().postMessage({ type: 'request-css-vars' });
}

export function initCSSVarsBroadcaster() {
  getChannel().onmessage = (event) => {
    if (event.data?.type === 'request-css-vars') scheduleBroadcast();
  };

  const observer = new MutationObserver(() => scheduleBroadcast());
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['theme-mode'],
  });

  requestAnimationFrame(() => broadcastCSSVars());

  return { broadcastCSSVars, requestCSSVars, observer };
}
