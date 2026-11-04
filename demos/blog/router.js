import { RouterX } from '/__src/libs/routerx/routerx.esm.min.js';

const BLOG_HOME = '/demos/blog';

export const router = new RouterX({
  mode: 'history',
  ignoreSameNavigation: true,
});

let currentPageId = null;
let preventSameLinkNavigation = true;
const routeHandlers = new Map();

function normalizePath(path) {
  return path.replace(/\/$/, '') || '/';
}

function pathToPageId(path) {
  const n = normalizePath(path);
  if (n === BLOG_HOME) return 'home';
  if (n === `${BLOG_HOME}/posts`) return 'posts';
  if (n === `${BLOG_HOME}/post`) return 'post';
  if (n === `${BLOG_HOME}/about`) return 'about';
  if (n === `${BLOG_HOME}/links`) return 'links';
  return null;
}

function isBlogPath(pathname) {
  const n = normalizePath(pathname);
  return n === BLOG_HOME || n.startsWith(`${BLOG_HOME}/`);
}

function isSameLocation(urlA, urlB) {
  const a = new URL(urlA, location.origin);
  const b = new URL(urlB, location.origin);
  return (
    normalizePath(a.pathname) === normalizePath(b.pathname) &&
    a.search === b.search &&
    a.hash === b.hash
  );
}

function toLocationPath(url) {
  const u = new URL(url, location.origin);
  return `${u.pathname}${u.search}${u.hash}`;
}

function notifyRouteHandler(pageId, query) {
  routeHandlers.get(pageId)?.(query || {});
}

router.on(BLOG_HOME, (_params, query) => {
  notifyRouteHandler('home', query);
  return true;
});

router.on(`${BLOG_HOME}/posts`, (_params, query) => {
  notifyRouteHandler('posts', query);
  return true;
});

router.on(`${BLOG_HOME}/post`, (_params, query) => {
  notifyRouteHandler('post', query);
  return true;
});

router.on(`${BLOG_HOME}/about`, (_params, query) => {
  notifyRouteHandler('about', query);
  return true;
});

router.on(`${BLOG_HOME}/links`, (_params, query) => {
  notifyRouteHandler('links', query);
  return true;
});

router.notFound((path) => {
  if (isBlogPath(path)) {
    location.replace(`${BLOG_HOME}/posts/`);
  }
});

/** Register a callback for in-page query updates (posts filters, post slug, etc.). */
export function onBlogRoute(pageId, handler) {
  routeHandlers.set(pageId, handler);
  return () => routeHandlers.delete(pageId);
}

export function buildPostsUrl({ signal = null, topic = null } = {}) {
  const q = new URLSearchParams();
  if (signal) q.set('signal', signal);
  if (topic) q.set('topic', topic);
  const qs = q.toString();
  return `${BLOG_HOME}/posts${qs ? `?${qs}` : ''}`;
}

export function buildPostUrl(slug) {
  return `${BLOG_HOME}/post?slug=${encodeURIComponent(slug)}`;
}

function navigateBlogLink(url) {
  const target = new URL(url, location.origin);
  const targetPage = pathToPageId(target.pathname);
  const dest = toLocationPath(target);

  if (targetPage && targetPage === currentPageId) {
    router.navigate(dest);
    return;
  }

  location.assign(dest);
}

function installPreventSameLinkNavigation() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const link = e.composedPath().find((el) => el instanceof HTMLAnchorElement);
    if (!link) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    const target = new URL(href, location.origin);
    if (target.origin !== location.origin) return;
    if (!isBlogPath(target.pathname)) return;

    e.preventDefault();

    if (preventSameLinkNavigation && isSameLocation(target.href, location.href)) return;

    navigateBlogLink(target.href);
  });
}

/**
 * Boot RouterX on a blog MPA page.
 * @param {string} pageId - 'home' | 'posts' | 'post' | 'about' | 'links'
 * @param {{ preventSameLinkNavigation?: boolean }} [options]
 */
export function startBlogRouter(pageId, options = {}) {
  currentPageId = pageId;
  preventSameLinkNavigation = options.preventSameLinkNavigation !== false;

  if (preventSameLinkNavigation && !startBlogRouter._linkGuardInstalled) {
    installPreventSameLinkNavigation();
    startBlogRouter._linkGuardInstalled = true;
  }

  router.start();
}

startBlogRouter._linkGuardInstalled = false;

export { normalizePath, pathToPageId, isSameLocation };
