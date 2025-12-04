class docAside extends HTMLElement {
  constructor() {
    super();
    // No shadow DOM - render in light DOM
    this.triangleColor = this.getAttribute('triangle-color') || 'hsla(var(--o-bg), .6)';
  }

  static get observedAttributes() {
    return ['triangle-color'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'triangle-color' && oldValue !== newValue) {
      this.triangleColor = newValue || 'hsla(var(--o-bg), .6)';
      this.updateTriangleColor();
    }
  }

  updateTriangleColor() {
    // Remove any existing triangle color styles
    const existingStyle = document.getElementById('doc-aside-triangle-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new style element
    const style = document.createElement('style');
    style.id = 'doc-aside-triangle-style';
    style.textContent = `
      doc-aside summary::marker,
      summary::-webkit-details-marker {
        color: ${this.triangleColor} !important;
      }
    `;
    document.head.appendChild(style);
  }

  connectedCallback() {
    // Apply initial triangle color
    this.updateTriangleColor();

    this.innerHTML = `
    <style>

      :root {
        --doc-aside-width: 296px;
        --doc-aside-padding: calc(var(--space-unit, 0.5rem)* 3);
      }

      doc-aside {
          
        box-sizing: border-box;
        font-family: var(--ff-2, sans-serif);
        padding-top: var(--doc-aside-padding) ;
        padding-left: var(--doc-aside-padding);
        position: fixed !important;
        top: var(--nav-height, calc(var(--space-unit, 0.5rem)* 4));
        left: 0;
        bottom: 0;
        width: var(--doc-aside-width);
      }

      @media (max-width: 880px) {
        doc-aside {
          display: none;
        }
      }

      doc-aside .doc-aside {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        background-color: hsla(var(--o-bg), .1);
        padding-right: var(--doc-aside-padding);

        li,a { padding: calc(var(--space-unit)*1/2) 0; }

        li.--raw-aside-active a {
          background-color: var(--color-sec);
          color: var(--color-o-sec);
        }

        /* Title styling for H1 */
        .doc-aside-title {
          padding: calc(var(--space-unit)*8) var(--doc-aside-padding) calc(var(--space-unit)*2);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-o-bg);
          border-bottom: 1px solid hsla(var(--o-bg), .2);
          margin-bottom: calc(var(--space-unit)*2);
        }

        .doc-aside-title a {
          text-decoration: none;
          color: inherit;
        }

        .doc-aside-title a:hover {
          color: var(--color-sec);
        }

        /* ol element with its own scroll context */
        .doc-aside-list {
          position: sticky;
          top: var(--nav-height, calc(var(--space-unit, 0.5rem)* 4));
          padding-top: calc(var(--space-unit)*2);
          padding-left: var(--doc-aside-padding);
          padding-bottom: calc(var(--space-unit)*4);
          overflow-y: auto;
          overflow-x: hidden;
          height: 100%;
          flex: 1;
          scrollbar-width: thin;
          scrollbar-color: hsla(var(--o-bg), .3) transparent;
        }

        /* Custom scrollbar for webkit browsers */
        .doc-aside-list::-webkit-scrollbar {
          width: 6px;
        }

        .doc-aside-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .doc-aside-list::-webkit-scrollbar-thumb {
          background: hsla(var(--o-bg), .3);
          border-radius: 3px;
        }

        .doc-aside-list::-webkit-scrollbar-thumb:hover {
          background: hsla(var(--o-bg), .5);
        }

        /* Reset list styles */
        doc-aside ol {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        /* Base list item styling */
        doc-aside ol > li {
          list-style-type: none !important;
          padding: 0;
          margin: 0;
        }

        /* Details element styling */
        doc-aside details {
          margin: 0;
          padding: 0;
        }

        /* Summary styling for expandable items */
        doc-aside summary {
          display: flex;
          align-items: center;
          padding: 4px 0;
          cursor: pointer;
        }

        /* Style the native triangle marker */
        summary::marker {
          color: hsla(var(--o-bg), .6);
        }

        /* WebKit browsers */
        summary::-webkit-details-marker {
          color: hsla(var(--o-bg), .6);
        }

        /* All text elements in doc-aside */
        doc-aside, doc-aside * {
          color: var(--color-o-bg);
        }

        doc-aside a {
          color: var(--color-o-bg);
          text-decoration: none;
        }

        doc-aside a:hover {
          opacity: 0.7;
        }

        /* Remove debug borders */
        details[open] {
          border: none !important;
        }

        /* Simple list items without children */
        doc-aside .nav-item {
          display: flex;
          align-items: center;
          width: 100%;
        }

        /* Nested lists styling */
        doc-aside ol ol {
          padding-left: 0;
          margin: 0;
        }

        /* Active state */
        doc-aside .--raw-aside-active a {
          background-color: var(--color-sec);
          color: var(--color-o-sec);
        }

        /* Ensure links are clickable and styled */
        doc-aside a {
          text-decoration: none;
          color: inherit;
          display: block;
          width: 100%;
        }

        doc-aside a:hover {
          color: var(--color-sec);
        }

        /* Smooth scrolling for the whole document */
        html {
          scroll-behavior: smooth;
        }

        /* Add scroll margin to headings so they appear below the fixed header */
        :root h1, :root h2, :root h3, :root h4, :root h5, :root h6 {
          scroll-margin-top: calc(var(--nav-height) + var(--space-unit, 0.5rem) * 3) !important;
        }
      }
    </style>
    <aside>
      <h1 class="doc-aside-title"></h1>
      <ol class="doc-aside-list">
      </ol>
    </aside>
    `
    
    // Initialize the aside functionality
    this.structureAside();
  }
  
  structureAside() {
    // Build a flat navigation list from headings in doc-body
    const buildNavigation = (docBodyElement) => {
      const navList = this.querySelector('ol');
      const titleElement = this.querySelector('.doc-aside-title');
      if (!navList) return;

      // Extract H1 for the title
      const h1 = docBodyElement.querySelector('h1');
      if (h1 && titleElement) {
        // Ensure h1 has an id
        if (!h1.id) {
          h1.id = h1.textContent.trim().toLowerCase().replace(/\s+/g, '-');
        }
        
        // Create anchor for the title
        const titleAnchor = document.createElement('a');
        titleAnchor.href = '#' + h1.id;
        titleAnchor.textContent = h1.textContent;
        titleAnchor.addEventListener('click', (e) => {
          e.preventDefault();
          this.scrollToHeading(h1.id);
        });
        
        titleElement.innerHTML = '';
        titleElement.appendChild(titleAnchor);
      }

      // Get only h2-h6 for the navigation tree
      const headings = docBodyElement.querySelectorAll('h2, h3, h4, h5, h6');
      navList.innerHTML = '';
      
      // Build hierarchical structure with details/summary
      this.buildHierarchicalNav(headings, navList);
    };

    // Build hierarchical navigation with details/summary
    this.buildHierarchicalNav = (headings, container) => {
      const headingArray = Array.from(headings);
      let i = 0;

      const processHeadings = (parentContainer, maxLevel = 6) => {
        while (i < headingArray.length) {
          const heading = headingArray[i];
          
          // Ensure heading has an id
          if (!heading.id) {
            heading.id = heading.textContent.trim().toLowerCase().replace(/\s+/g, '-');
          }

          const level = parseInt(heading.tagName.substring(1));
          
          // If this heading is at a higher level than we're processing, return
          if (level <= maxLevel) {
            return;
          }

          // Check if this heading has children
          let hasChildren = false;
          for (let j = i + 1; j < headingArray.length; j++) {
            const nextLevel = parseInt(headingArray[j].tagName.substring(1));
            if (nextLevel > level) {
              hasChildren = true;
              break;
            } else if (nextLevel <= level) {
              break;
            }
          }

          const li = document.createElement('li');

          if (hasChildren) {
            // Create details/summary structure
            const details = document.createElement('details');
            
            // Open level 2 (h2) elements by default
            if (level === 2) {
              details.open = true;
            }
            
            const summary = document.createElement('summary');
            
            const anchor = document.createElement('a');
            anchor.href = '#' + heading.id;
            anchor.textContent = heading.textContent;
            
            // Add click handler for smooth scrolling
            anchor.addEventListener('click', (e) => {
              e.preventDefault(); // Prevent default link behavior
              e.stopPropagation(); // Prevent details toggle when clicking link
              this.scrollToHeading(heading.id);
            });
            
            summary.appendChild(anchor);
            details.appendChild(summary);
            
            // Create nested list for children
            const childList = document.createElement('ol');
            details.appendChild(childList);
            
            li.appendChild(details);
            parentContainer.appendChild(li);
            
            i++; // Move to next heading
            
            // Process children
            processHeadings(childList, level);
          } else {
            // Simple item without children
            const anchor = document.createElement('a');
            anchor.href = '#' + heading.id;
            anchor.textContent = heading.textContent;
            
            // Add click handler for smooth scrolling
            anchor.addEventListener('click', (e) => {
              e.preventDefault(); // Prevent default link behavior
              this.scrollToHeading(heading.id);
            });
            
            const navItem = document.createElement('div');
            navItem.className = 'nav-item';
            navItem.appendChild(anchor);
            
            li.appendChild(navItem);
            parentContainer.appendChild(li);
            
            i++; // Move to next heading
          }
        }
      };

      processHeadings(container, 1);
    };

    // Smooth scroll to heading method
    this.scrollToHeading = (headingId) => {
      const targetElement = document.getElementById(headingId);
      if (targetElement) {
        // Update URL without page reload
        const newUrl = `${window.location.pathname}#${headingId}`;
        window.history.pushState({ headingId }, '', newUrl);
        
        // Get the nav height and space unit values
        const navHeight = getComputedStyle(document.documentElement).getPropertyValue('--nav-height');
        const spaceUnit = getComputedStyle(document.documentElement).getPropertyValue('--space-unit');
        
        // Calculate offset: nav height + 3 space units
        // Convert CSS values to pixels for calculation
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
    };

    // Function to wait for re-md content to be processed
    const waitForRemdContent = async () => {
      const docBody = document.querySelector('doc-body');
      if (!docBody) return;

      // Wait for re-md elements to be processed
      const remdElements = docBody.querySelectorAll('re-md');
      if (remdElements.length > 0) {
        // Create a promise that resolves when all re-md elements are processed
        await new Promise(resolve => {
          const observer = new MutationObserver((mutations) => {
            // Check if re-md elements have been processed (they'll have content)
            const allProcessed = Array.from(remdElements).every(el => el.children.length > 0);
            if (allProcessed) {
              observer.disconnect();
              resolve();
            }
          });

          // Observe changes in re-md elements
          remdElements.forEach(el => {
            observer.observe(el, {
              childList: true,
              subtree: true
            });
          });
        });
      }

      // Now build the navigation
      buildNavigation(docBody);
    };

    // Listen for both events
    document.addEventListener('doc-body-ready', () => {
      waitForRemdContent();
    });

    document.addEventListener('DOMContentLoaded', () => {
      waitForRemdContent();
    });
  }
}

export default docAside