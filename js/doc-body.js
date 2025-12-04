class docBody extends HTMLElement {
  constructor() {
    super();
    // Inject styles into document head
    this.injectStyles();
  }
  

  connectedCallback() {
    // Dispatch doc-body-ready event when content is ready
    requestAnimationFrame(() => {
      const event = new CustomEvent('doc-body-ready', {
        bubbles: true,
        composed: true,
        detail: { docBody: this }
      });
      this.dispatchEvent(event);
    });
    
    // Wait for content to be fully processed (including re-md elements)
    this.waitForContentReady().then(() => {
      // Add click handlers to heading link icons
      this.addHeadingLinkHandlers();
      
      // Handle initial page load with hash fragment
      this.handleInitialHash();
      
      // Dispatch custom event when content is ready
      const event = new CustomEvent('doc-body-ready', {
        bubbles: true,
        detail: { docBody: this }
      });
      this.dispatchEvent(event);
    });
  }

  // Inject all styles into document head
  injectStyles() {
    if (document.getElementById('doc-body-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'doc-body-styles';
    style.textContent = `
      doc-body ::where(ul, ol) {
        list-style: inside !important;
      }

      doc-body h1,
      doc-body h2,
      doc-body h3,
      doc-body h4,
      doc-body h5,
      doc-body h6 {
        position: relative;
        cursor: pointer;
      }

      doc-body h1::after,
      doc-body h2::after,
      doc-body h3::after,
      doc-body h4::after,
      doc-body h5::after,
      doc-body h6::after {
        content: "🔗";
        display: inline-block;
        margin-left: 8px;
        opacity: 0;
        font-size: 0.8em;
        cursor: pointer;
        transition: opacity 0.4s ease;
        vertical-align: middle;
      }

      doc-body h1:hover::after,
      doc-body h2:hover::after,
      doc-body h3:hover::after,
      doc-body h4:hover::after,
      doc-body h5:hover::after,
      doc-body h6:hover::after {
        opacity: 0.6;
      }

      doc-body h1.copied::after,
      doc-body h2.copied::after,
      doc-body h3.copied::after,
      doc-body h4.copied::after,
      doc-body h5.copied::after,
      doc-body h6.copied::after {
        content: "🔗 copied!";
        opacity: 1;
        color: var(--color-sec);
      }

      doc-body {
        position: relative;
        top: var(--nav-height, calc(var(--space-unit, 0.5rem) * 4));
        left: var(--doc-aside-width);
        right: var(--page-padding-h);
        padding-left: var(--page-padding-h, 1rem);
        padding-right: var(--page-padding-h, 1rem);
        color: var(--color-o-bg);
        padding-bottom: calc(var(--space-unit, 0.5rem) * 64);
        display: flex;
        flex-direction: column;
        max-width: 960px;
        width: calc(100% - var(--doc-aside-width) - var(--page-padding-h, 1rem) * 2);
        row-gap: calc(var(--space-unit, 0.5rem) * 3);
        line-height: 1.6;
        counter-reset: h2;
      }

      @media (max-width: 880px) {
        doc-body {
          left: 0;
          width: calc(100% - var(--page-padding-h, 1rem) * 2);
        }
      }

      doc-body a {
        border-block-end: 1px dotted var(--color-o-bg);
      }

      doc-body :where(h1, h2, h3, h4, h5, h6) {
        scroll-margin-top: calc(var(--nav-height, 2rem) + calc(var(--space-unit, 0.5rem) * 2));
        scroll-margin-left: calc(296px + calc(var(--space-unit) * 3));
      }

      doc-body :where(h1) { margin-top: calc(var(--space-unit, 0.5rem) * 8); }
      doc-body :where(h2) { margin-top: calc(var(--space-unit, 0.5rem) * 6); }
      doc-body :where(h3) { margin-top: calc(var(--space-unit, 0.5rem) * 4); }
      doc-body :where(h4) { margin-top: calc(var(--space-unit, 0.5rem) * 3); }
      doc-body :where(h5) { margin-top: calc(var(--space-unit, 0.5rem) * 2); }
      doc-body :where(h6) { margin-top: calc(var(--space-unit, 0.5rem) * 1); }

      doc-body re-md h1 {
        counter-reset: h2;
      }

      doc-body re-md h2 {
        counter-reset: h3;
        counter-increment: h2;
      }

      doc-body re-md h2::before {
        content: counter(h2) ". ";
        color: hsla(var(--o-bg), .4);
        margin-right: var(--space-unit, 0.5rem);
      }

      doc-body re-md h3 {
        counter-reset: h4;
        counter-increment: h3;
      }

      doc-body re-md h3::before {
        content: counter(h2) "." counter(h3) " ";
        color: hsla(var(--o-bg), .4);
        margin-right: var(--space-unit, 0.5rem);
      }

      doc-body re-md h4 {
        counter-reset: h5;
        counter-increment: h4;
      }

      doc-body re-md h4::before {
        content: counter(h2) "." counter(h3) "." counter(h4) " ";
        color: hsla(var(--o-bg), .4);
        margin-right: var(--space-unit, 0.5rem);
      }

      doc-body re-md h5 {
        counter-reset: h6;
        counter-increment: h5;
      }

      doc-body re-md h5::before {
        content: counter(h2) "." counter(h3) "." counter(h4) "." counter(h5) " ";
        color: hsla(var(--o-bg), .4);
        margin-right: var(--space-unit, 0.5rem);
      }

      doc-body re-md h6 {
        counter-increment: h6;
      }

      doc-body re-md h6::before {
        content: counter(h2) "." counter(h3) "." counter(h4) "." counter(h5) "." counter(h6) " ";
        color: hsla(var(--o-bg), .4);
        margin-right: var(--space-unit, 0.5rem);
      }
    `;
    document.head.appendChild(style);
  }

  // Add click handlers to heading link icons
  addHeadingLinkHandlers() {
    // Add click handler to the doc-body element for event delegation
    this.addEventListener('click', (e) => {
      // Find closest heading ancestor of the clicked element
      const heading = e.target.closest('h1, h2, h3, h4, h5, h6');
      if (!heading) return;
      
      // Ensure heading has an ID
      if (!heading.id) {
        const headingText = heading.textContent.replace(/^[\d.]+\s*/, '').trim();
        heading.id = headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
      
      const rect = heading.getBoundingClientRect();
      const clickX = e.clientX;
      const headingRight = rect.right;
      
      // Handle both regular clicks and icon clicks
      if (e.target === heading || clickX > headingRight - 40) {
        e.preventDefault();
        e.stopPropagation();
        
        // Update URL and scroll to heading
        const newUrl = `${window.location.pathname}#${heading.id}`;
        window.history.pushState({ headingId: heading.id }, '', newUrl);
        
        // Get nav height for offset
        const navHeight = parseInt(getComputedStyle(document.documentElement)
          .getPropertyValue('--nav-height')) || 64;
        
        // Calculate position
        const elementRect = heading.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      const scrollToPosition = absoluteElementTop - (navHeight + 24); // 24px extra padding
        
        // Smooth scroll
        window.scrollTo({
          top: scrollToPosition,
          behavior: 'smooth'
        });
        
        // Always copy link to clipboard
        const url = `${window.location.origin}${window.location.pathname}#${heading.id}`;
        this.copyToClipboard(url, heading);
      }
    });
  }

  // Handle initial page load with hash fragment
  async handleInitialHash() {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#')) return;

    const headingId = hash.substring(1); // Remove the '#'
    
    // Function to attempt scroll
    const attemptScroll = async () => {
      const heading = document.getElementById(headingId);
      if (!heading) return false;

      // Get nav height for offset
      const navHeight = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-height')) || 60;
      
      // Calculate position
      const elementRect = heading.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      const scrollToPosition = absoluteElementTop - navHeight - 24; // 24px extra padding
      
      // Instant scroll first to ensure proper positioning
      window.scrollTo(0, scrollToPosition);
      
      return true;
    };

    // First wait for content to be ready
    await this.waitForContentReady();

    // Try multiple times with increasing delays
    const attempts = [0, 100, 300, 500, 1000];
    for (const delay of attempts) {
      await new Promise(resolve => setTimeout(resolve, delay));
      if (await attemptScroll()) {
        // After successful scroll, do one final adjustment after a delay
        setTimeout(() => {
          attemptScroll();
        }, 100);
        break;
      }
    }
  }

  // Smooth scroll to heading method
  scrollToHeading(headingId, updateUrl = true) {
    const targetElement = document.getElementById(headingId);
    if (targetElement) {
      // Update URL without page reload (only if requested)
      if (updateUrl) {
        const newUrl = `${window.location.pathname}#${headingId}`;
        window.history.pushState({ headingId }, '', newUrl);
      }
      
      // Get the nav height and space unit values
      const navHeight = getComputedStyle(document.documentElement).getPropertyValue('--nav-height');
      const spaceUnit = getComputedStyle(document.documentElement).getPropertyValue('--space-unit');
      
      // Calculate offset: nav height + 3 space units
      const navHeightPx = parseFloat(navHeight) || 60; // fallback
      const spaceUnitPx = parseFloat(spaceUnit) || 8; // fallback
      const offset = navHeightPx + (spaceUnitPx * 3);
      
      // Get target position
      const elementRect = targetElement.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      const scrollToPosition = absoluteElementTop - offset;
      
      // Smooth scroll to calculated position
      window.scrollTo({
        top: scrollToPosition,
        behavior: 'smooth'
      });
    }
  }

  // Copy URL to clipboard with user feedback
  async copyToClipboard(url, heading) {
    console.log('copyToClipboard called with:', url); // Debug
    
    try {
      await navigator.clipboard.writeText(url);
      console.log('Clipboard write successful'); // Debug
      
      // Show 'copied' feedback via CSS class
      heading.classList.add('copied');
      console.log('Added copied class to:', heading.textContent); // Debug
      
      // Remove feedback after 3 seconds
      setTimeout(() => {
        heading.classList.remove('copied');
        console.log('Removed copied class'); // Debug
      }, 3000);
      
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      
      // Try alternative clipboard method for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Show success feedback
        heading.classList.add('copied');
        setTimeout(() => {
          heading.classList.remove('copied');
        }, 3000);
        
      } catch (fallbackErr) {
        console.error('Fallback copy method failed:', fallbackErr);
        // Last resort: show the URL for manual copying
        prompt('Copy this link:', url);
      }
    }
  }

  async waitForContentReady() {
    return new Promise((resolve) => {
      // Check if there are any re-md elements that might still be processing
      const checkContentReady = () => {
        const remdElements = this.querySelectorAll('re-md');
        
        if (remdElements.length === 0) {
          // No re-md elements, content is ready
          resolve();
        } else {
          // Wait for re-md elements to process their content
          const observer = new MutationObserver(() => {
            // Check if all re-md elements have content
            const allProcessed = Array.from(remdElements).every(el => el.children.length > 0);
            if (allProcessed) {
              observer.disconnect();
              resolve();
            }
          });
          
          // Observe each re-md element
          remdElements.forEach(el => {
            observer.observe(el, {
              childList: true,
              subtree: true
            });
          });
        }
      };
      
      // Initial check
      checkContentReady();
    });
  }
}

export default docBody