import { RouterX } from '/__src/libs/routerx/routerx.esm.min.js';
import { state } from '/__src/js/state.js';

const router = new RouterX({ mode: 'history', ignoreSameNavigation: true });

// Store current product for handler access
let currentProduct = null;

// Helper: get the doc-quick element
const getDocQuick = () => document.querySelector('doc-quick');

//--------------------------------------------------------

// Global beforeEach: block same-page navigation
router.beforeEach((to, query, hash) => {
  const current = router.getCurrentRoute();
  if (current) {
    const sameHash = (hash || '') === (current.hash || '');
    const currentQuery = current.query || {};
    const incomingQuery = query || {};
    const sameQuery =
      Object.keys(incomingQuery).length === Object.keys(currentQuery).length &&
      Object.entries(incomingQuery).every(([k, v]) => currentQuery[k] === v);
    if (to === current.path && sameQuery && sameHash) return false;
  }
});

router.on('/', () => true);
router.on('/about', () => true);
router.on('/demos', () => true);
router.on('/docs', () => true);
router.on('/packages', () => true);
router.on('/test', () => true);

// Product route with lifecycle hooks
router.on('/docs/:product', (params, query, hash) => {
  // If no hash is present, add default hash #0-introduction
  if (!hash) {
    router.replace(`/docs/${currentProduct.name}#0-introduction`);
    return;
  }

  const docQuick = getDocQuick();
  if (docQuick) {
    docQuick.setAttribute('src', `/__docs/${currentProduct.name}.md`);
    docQuick.setAttribute('hash', hash);
  }
},
{
  beforeEnter: async (params) => {
    const product = state.nav.docs.find(doc => doc.name === params.product);

    if (!product) {
      console.error(`Product not found: ${params.product}`);
      router.replace('/404');
      return false;
    }

    currentProduct = product;

    const docQuick = getDocQuick();
    if (docQuick) {
      docQuick.setAttribute('theme-color-hsl', product.themeColorHsl);
    }

    return true;
  },

  beforeLeave: () => {
    currentProduct = null;
  }
});

// 404 route
router.on('/404', () => true);

// Not found handler
router.notFound(() => {
  router.navigate('/404');
  return true;
});

// Update top-bar navigation active state after every route change
router.afterEach(() => {
  const topBar = document.querySelector('top-bar');
  if (topBar && topBar.setActiveNavItem) {
    topBar.setActiveNavItem();
  }
});

// Handle hash-only changes on /docs/:product routes
router.onHashChange((newHash) => {
  const currentRoute = router.getCurrentRoute();
  if (!currentRoute?.path.startsWith('/docs/') || !currentProduct || !newHash) return;

  const docQuick = getDocQuick();
  if (docQuick) docQuick.setAttribute('hash', newHash);
});

// Global same-page link interceptor
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;
  if (link.target === '_blank' || link.hasAttribute('download')) return;

  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

  const target = new URL(href, window.location.origin);
  if (target.origin !== window.location.origin) return;

  const normalize = p => p.replace(/\/$/, '') || '/';
  if (normalize(target.pathname) === normalize(window.location.pathname) && target.search === window.location.search) {
    e.preventDefault();
  }
});

export { router };
