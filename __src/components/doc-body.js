import { scrollToHeadingById, updateUrlHash } from '/__src/js/utils.js';
import { readyElement } from "/__src/components/ready-element.js";

class docBody extends readyElement {
  constructor() {
    super();
    this._chapterIndex = -1;
    this._chapterMap = [];
    this.injectStyles();
  }

  get chapterIndex() { return this._chapterIndex; }
  set chapterIndex(value) {
    this._chapterIndex = value;
    this.dispatchEvent(new CustomEvent('chapter-change', {
      bubbles: true,
      composed: true,
      detail: { index: value, map: this._chapterMap }
    }));
  }

  get chapterMap() { return this._chapterMap; }
  set chapterMap(value) { this._chapterMap = value; }
  

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
      
      // Note: Initial hash scroll is handled by router.js
      
      // Dispatch custom event when content is ready
      const event = new CustomEvent('doc-body-ready', {
        bubbles: true,
        detail: { docBody: this }
      });
      this.dispatchEvent(event);
      
      this._resolveReady();
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
        content: var(--link-icon, "#");
        display: inline-block;
        margin-left: 8px;
        opacity: 0;
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
        opacity: var(--link-icon-opacity, 0.4);
      }

      doc-body h1.copied::after,
      doc-body h2.copied::after,
      doc-body h3.copied::after,
      doc-body h4.copied::after,
      doc-body h5.copied::after,
      doc-body h6.copied::after {
        content: var(--link-icon-copied, "# copied!");
        opacity: var(--link-icon-opacity, 0.4);
      }

      doc-body {
        position: relative;
        top: calc( var(--top-bar-height) + var(--space-unit) * 4);
        left: var(--doc-aside-width);
        min-height: calc(100dvh - var(--top-bar-height) - var(--space-unit) * 4);
        padding-left: var(--page-padding-x);
        /* padding-right: var(--page-padding-x); */
        
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / var(--fcolor, 0.8));
        padding-bottom: calc(var(--space-unit, 0.5rem) * 64);
        display: flex;
        flex-direction: column;
        width: calc(100% - var(--doc-aside-width) - var(--page-padding-x, 1rem) * 1);
        max-width: 60rem;
        row-gap: calc(var(--space-unit, 0.5rem) * 3);
        line-height: 1.6;
        counter-reset: h2;
      }

      doc-body > re-md {
        flex: 1 1 auto;
        min-height: 0;
      }

      doc-body:has(> flex-container) {
        padding-bottom: calc(var(--space-unit) * 4);
      }

      @media (max-width: 60rem) {
        doc-body {
          left: 0;
          width: calc(100% - var(--page-padding-x, 1rem) * 2);
        }
      }

      doc-body a {
        text-decoration: underline;
        text-decoration-style: dotted;
        text-decoration-thickness: 1px;
        text-underline-offset: 4px;
        text-decoration-color: hsla(var(--link-color-hsl, var(--fcolor-hsl, 0 0% 0%)) / var(--link-underline-opacity, 0.8));
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / var(--link-color-opacity, 0.8));
        &::after {
          content: "🔗";
          display: inline-block;
          margin-left: calc(var(--space-unit) * 0.5);
          cursor: pointer;
          vertical-align: middle;
        }
      }

      doc-body svg {
        width: 6rem;
        height: auto;
      }

      doc-body :where(h1, h2, h3, h4, h5, h6) {
        scroll-margin-top: calc( var(--top-bar-height, calc(var(--space-unit, 0.5rem) * 2) ) + calc(var(--space-unit, 0.5rem) * 1) );
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
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / var(--number-opacity, 0.25));
        margin-right: var(--space-unit, 0.5rem);
      }

      doc-body re-md h3 {
        counter-reset: h4;
        counter-increment: h3;
      }

      doc-body re-md h3::before {
        content: counter(h2) "." counter(h3) " ";
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / var(--number-opacity, 0.25));
        margin-right: var(--space-unit, 0.5rem);
      }

      doc-body re-md h4 {
        counter-reset: h5;
        counter-increment: h4;
      }

      doc-body re-md h4::before {
        content: counter(h2) "." counter(h3) "." counter(h4) " ";
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / var(--number-opacity, 0.25));
        margin-right: var(--space-unit, 0.5rem);
      }

      doc-body re-md h5 {
        counter-reset: h6;
        counter-increment: h5;
      }

      doc-body re-md h5::before {
        content: counter(h2) "." counter(h3) "." counter(h4) "." counter(h5) " ";
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / var(--number-opacity, 0.25));
        margin-right: var(--space-unit, 0.5rem);
      }

      doc-body re-md h6 {
        counter-increment: h6;
      }

      doc-body re-md h6::before {
        content: counter(h2) "." counter(h3) "." counter(h4) "." counter(h5) "." counter(h6) " ";
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / var(--number-opacity, 0.25));
        margin-right: var(--space-unit, 0.5rem);
      }

      /* Chapter-mode: counters work across sections */
      doc-body re-md[chapter-mode] {
        counter-reset: h2 !important;
      }

      doc-body re-md[chapter-mode] h2 {
        counter-reset: h3 !important;
        counter-increment: h2 !important;
      }

      doc-body re-md[chapter-mode] h3 {
        counter-reset: h4 !important;
        counter-increment: h3 !important;
      }

      doc-body re-md[chapter-mode] h4 {
        counter-reset: h5 !important;
        counter-increment: h4 !important;
      }

      doc-body re-md[chapter-mode] h5 {
        counter-reset: h6 !important;
        counter-increment: h5 !important;
      }

      doc-body re-md[chapter-mode] h6 {
        counter-increment: h6 !important;
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
      
      e.preventDefault();
      e.stopPropagation();
      
      // Update URL
      updateUrlHash(heading.id);
      
      // Check for chapter-mode
      const remdElement = document.querySelector('re-md');
      const isChapterMode = remdElement && remdElement.hasAttribute('chapter-mode');
      
      if (isChapterMode) {
        // Chapter mode: activate parent section first
        const contentWrapper = remdElement.querySelector('div[ref="re-md-content"]');
        if (contentWrapper) {
          // Remove --chapter-active from all sections
          const allSections = contentWrapper.querySelectorAll('section');
          allSections.forEach(section => {
            section.classList.remove('--chapter-active');
          });
          
          // Find parent section and activate it
          const parentSection = heading.closest('section');
          if (parentSection) {
            parentSection.classList.add('--chapter-active');
            
            // Update chapterIndex
            if (this.chapterMap) {
              const sectionRef = parentSection.getAttribute('ref');
              const index = this.chapterMap.indexOf(sectionRef);
              if (index !== -1) {
                this.chapterIndex = index;
              }
            }
          }
          
          // Activate nav item in doc-aside
          const docAside = document.querySelector('doc-aside');
          if (docAside && docAside.activateNavItem) {
            docAside.activateNavItem(heading.id);
          }
        }
        
        // Wait for layout update before scrolling
        requestAnimationFrame(() => {
          scrollToHeadingById(heading.id);
        });
      } else {
        // Normal mode: scroll immediately
        scrollToHeadingById(heading.id);
      }
      
      // Always copy link to clipboard
      const url = `${window.location.origin}${window.location.pathname}#${heading.id}`;
      this.copyToClipboard(url, heading);
    });
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