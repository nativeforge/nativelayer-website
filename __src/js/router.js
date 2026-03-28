import { RouterX } from '/__src/libs/routerx/routerx.esm.min.js';
import { state } from '/__src/js/state.js';
import { scrollToHeadingById } from '/__src/js/utils.js';
import {luminanceHSL, adjustedHSL} from '/__src/js/luminance.js';

const router = new RouterX({ mode: 'history' });

// Cache DOM elements
let htmlElement = null;
let remdElement = null;
let docBodyElement = null;
let docAsideElement = null;

// Track cleanup resources
let currentObserver = null;
let currentTimeout = null;
let currentInterval = null;

// Store current product for handler access
let currentProduct = null;

// Helper: Cache DOM elements
const cacheDOMElements = () => {
  htmlElement = document.querySelector('html');
  remdElement = document.querySelector('re-md');
  docBodyElement = document.querySelector('doc-body');
  docAsideElement = document.querySelector('doc-aside');
};

// Helper: Cleanup all pending operations
const cleanup = () => {
  if (currentObserver) {
    currentObserver.disconnect();
    currentObserver = null;
  }
  if (currentTimeout) {
    clearTimeout(currentTimeout);
    currentTimeout = null;
  }
  if (currentInterval) {
    clearInterval(currentInterval);
    currentInterval = null;
  }
};

// Helper: Set theme based on product
const setTheme = (product) => {
  if (!htmlElement) return;

  const accentColorLuminance = luminanceHSL(...product.themeColorHsl.replaceAll('%', '').split(' ').map(Number));
  const adjusted = adjustedHSL(product.themeColorHsl, { min: 35, max: 65, strength: 1 });

  console.log(`[theme] luminance: ${accentColorLuminance.toFixed(3)} | adjusted: ${adjusted}`);

  htmlElement.style.setProperty('--accent-color-hsl', `${product.themeColorHsl}`);
  htmlElement.style.setProperty('--accent-color-hsl-adjusted', adjusted);

  if(accentColorLuminance > 0.7){
    htmlElement.classList.remove('--accent-is-dark');
    htmlElement.classList.add('--accent-is-light');
  }
  else if(accentColorLuminance < 0.1){
    htmlElement.classList.remove('--accent-is-light');
    htmlElement.classList.add('--accent-is-dark');
  }
  else {
    htmlElement.classList.remove('--accent-is-light');
    htmlElement.classList.remove('--accent-is-dark');
  }
};

// Helper: Activate chapter section based on hash
const activateChapter = (hash) => {
  if (!remdElement || !hash) return false;
  
  const contentWrapper = remdElement.querySelector('div[ref="re-md-content"]');
  if (!contentWrapper) return false;
  
  // Try to find section by ref first (for 0-introduction)
  let activeSection = contentWrapper.querySelector(`section[ref="${hash}"]`);
  
  // If not found, find heading by id and get its parent section
  if (!activeSection) {
    const headingInContent = document.getElementById(hash);
    activeSection = headingInContent?.closest('section');
  }
  
  if (!activeSection) return false;
  
  // Remove --chapter-active from all sections
  const allSections = contentWrapper.querySelectorAll('section');
  allSections.forEach(section => {
    section.classList.remove('--chapter-active');
  });
  
  activeSection.classList.add('--chapter-active');
  
  // Update chapterIndex on doc-body
  if (docBodyElement && docBodyElement.chapterMap) {
    const sectionRef = activeSection.getAttribute('ref');
    const index = docBodyElement.chapterMap.indexOf(sectionRef);
    if (index !== -1) {
      docBodyElement.chapterIndex = index;
    }
  }
  
  // Activate nav item in doc-aside
  if (docAsideElement && docAsideElement.activateNavItem) {
    docAsideElement.activateNavItem(hash);
  }
  
  return true;
};

// Helper: Setup chapter observer and activation
const setupChapterActivation = (hash) => {
  if (!remdElement || !remdElement.hasAttribute('chapter-mode') || !hash) {
    return null;
  }
  
  // Function to activate and scroll
  const activateAndScroll = () => {
    if (activateChapter(hash)) {
      // Wait for layout update, then scroll
      requestAnimationFrame(() => {
        scrollToHeadingById(hash);
      });
      return true;
    }
    return false;
  };
  
  // Use MutationObserver to wait for content
  const observer = new MutationObserver(() => {
    if (activateAndScroll()) {
      observer.disconnect();
      currentObserver = null;
    }
  });
  
  observer.observe(remdElement, { childList: true, subtree: true });
  currentObserver = observer;
  
  // Fallback: retry after content loads
  currentTimeout = setTimeout(() => {
    if (!activateAndScroll()) {
      currentInterval = setInterval(() => {
        if (activateAndScroll()) {
          clearInterval(currentInterval);
          currentInterval = null;
        }
      }, 100);
      
      // Safety: clear interval after 2 seconds
      setTimeout(() => {
        if (currentInterval) {
          clearInterval(currentInterval);
          currentInterval = null;
        }
      }, 2000);
    }
  }, 100);
  
  // Return cleanup function
  return () => {
    if (observer) observer.disconnect();
    if (currentTimeout) clearTimeout(currentTimeout);
    if (currentInterval) clearInterval(currentInterval);
    currentObserver = null;
    currentTimeout = null;
    currentInterval = null;
  };
};

//--------------------------------------------------------

// Global beforeEach: Cache DOM elements and cleanup previous route
router.beforeEach((to, from) => {
  cacheDOMElements();
  cleanup();
});

router.on('/', () => {
  console.log('Home page loaded');
  return true;
});

router.on('/about', () => {
  console.log('About page loaded');
  return true;
});

router.on('/demos', () => {
  console.log('demos page loaded');
  return true;
});

router.on('/docs', () => {
  console.log('Docs page loaded');
  return true;
});

router.on('/packages', () => {
  console.log('Packages page loaded');
  return true;
});

// Product route with lifecycle hooks
router.on('/docs/:product', (params, query, hash) => {
  // If no hash is present, add default hash #0-introduction
  if (!hash) {
    router.replace(`/docs/${currentProduct.name}#0-introduction`)
    return;
  }
  
  if (remdElement) {
    remdElement.setAttribute('src', `/__docs/${currentProduct.name}.md`);
  }
  
  // Setup chapter activation and return cleanup function
  return setupChapterActivation(hash);
}, 
{
  beforeEnter: async (params) => {
    // Validate product exists
    const product = state.nav.docs.find(doc => doc.name === params.product);
    
    if (!product) {
      console.error(`Product not found: ${params.product}`);
      router.replace('/404');
      return false; // Prevent handler execution
    }
    
    currentProduct = product;
    
    // Set theme
    cacheDOMElements();
    setTheme(product);
    
    console.log(`Product found: ${product.name}`);
    return true; // Allow handler to proceed
  },
  
  beforeLeave: () => {
    // Cleanup before leaving route
    cleanup();
    currentProduct = null;
  }
});

// 404 route
router.on('/404', () => {
  console.log('404 page loaded');
  return true;
});

// Not found handler
router.notFound(() => {
  console.log('404 - route not found');
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
router.onHashChange((newHash, oldHash) => {
  // Only handle if we're on a product docs page
  const currentRoute = router.getCurrentRoute();
  if (!currentRoute || !currentRoute.path.startsWith('/docs/')) return;
  
  // Only if product is valid (currentProduct is set in beforeEnter)
  if (!currentProduct) return;
  
  // Skip if no hash
  if (!newHash) return;
  
  // Activate chapter and scroll
  if (activateChapter(newHash)) {
    requestAnimationFrame(() => {
      scrollToHeadingById(newHash);
    });
  }
});

export {router};
