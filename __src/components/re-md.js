// Import highlight.js for syntax highlighting
const hljs = (await import('https://esm.sh/highlight.js@11.9.0')).default;

/**
 * remd Custom Element
 * 
 * Processes markdown content (from external files or inline) and transforms 
 * them into custom HTML elements based on the transform attribute specification.
 * 
 * 
 * Usage (External File):
 * <re-md src="./path/file.md" transform="(h1: doc-title, code: inline-code, codeblock: doc-code {theme: 'dark'})">
 * 
 * Usage (Inline Content):
 * <re-md transform="(h1: doc-title, code: inline-code)">
 *   # My Title
 *   This is **inline markdown** content.
 * </re-md>
 * 
 * Element Types:
 * - code: Inline code `text`
 * - codeblock: Block code ```text``` (with built-in syntax highlighting)
 * 
 * Component Blocks (MDC-style):
 * ::component-name {class='value' id="value" data-foo="bar"}
 * [markdown content here]
 * ::
 * 
 * Attribute-only Blocks (apply attributes ONLY IF there is a single markdown element)
 * ::{class='highlight' style="color: red"}
 * > This is a blockquote
 * ::
 * 
 * Slot Support:
 * ::component-name
 *   @slotName(content for named slot)
 *   @default(content for default slot)
 * ::
 * 
 * Example:
 * ::doc-alert {type='warning' class="alert-box"}
 * This is a **warning** message with `inline code`.
 * ::
 * 
 */

class remd extends HTMLElement {
  constructor() {
    super();
    this.isProcessing = false;
    this.originalContent = null;
  }

  // Check if logging is enabled
  shouldLog() {
    return this.hasAttribute('logs');
  }

  // Log helper method
  log(...args) {
    if (this.shouldLog()) {
      console.log(...args);
    }
  }

  // Warn helper method
  warn(...args) {
    if (this.shouldLog()) {
      console.warn(...args);
    }
  }

  // Error helper method
  error(...args) {
    if (this.shouldLog()) {
      console.error(...args);
    }
  }

  static get observedAttributes() {
    return ['src', 'transform', 'logs'];
  }

  connectedCallback() {
    // Hide content immediately if there's inline content (prevents flash of raw markdown)
    if (!this.getAttribute('src') && this.textContent.trim()) {
      this.style.opacity = '0';
    }
    
    // Capture original content before any processing if no src attribute
    if (!this.getAttribute('src') && !this.originalContent) {
      // Use textContent to get unescaped content (preserves markdown syntax like >)
      const rawContent = this.textContent;
      this.originalContent = this.cleanupInlineContent(rawContent);
    }
    
    this.waitForConnection().then(() => {
      // Only process if not already processing (e.g., from attributeChangedCallback)
      if (!this.isProcessing) {
        this.processMarkdown();
      }
    });
  }

  /**
   * Wait for the element to be properly connected to the DOM with a stable parent
   */
  async waitForConnection() {
    return new Promise((resolve) => {
      const checkConnection = () => {
        // Check basic connection
        if (!this.isConnected || !this.parentNode || !document.contains(this)) {
          return false;
        }

        // Check if we're inside custom elements that might still be initializing
        let parent = this.parentNode;
        while (parent && parent !== document) {
          if (parent.tagName && parent.tagName.includes('-')) {
            // This is a custom element, check if it's fully initialized
            if (!parent.shadowRoot && parent.constructor.name !== 'HTMLElement') {
              // Custom element exists but shadow DOM not ready
              return false;
            }
          }
          parent = parent.parentNode;
        }

        resolve();
        return true;
      };

      // If already properly connected, resolve immediately
      if (checkConnection()) {
        return;
      }

      // Use MutationObserver to watch for when element gets properly connected
      const observer = new MutationObserver(() => {
        if (checkConnection()) {
          observer.disconnect();
        }
      });
      
      // Observe the document for changes
      observer.observe(document, {
        childList: true,
        subtree: true
      });

      // Also add a small timeout as fallback in case MutationObserver doesn't catch everything
      setTimeout(() => {
        if (checkConnection()) {
          observer.disconnect();
        }
      }, 50);
    });
  }

  // Clean up inline content by removing common leading whitespace
  cleanupInlineContent(content) {
    if (!content) return '';
    
    // Split into lines and filter out empty lines at start/end
    const lines = content.split('\n');
    
    // Remove empty lines from start and end
    while (lines.length > 0 && lines[0].trim() === '') {
      lines.shift();
    }
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
      lines.pop();
    }
    
    if (lines.length === 0) return '';
    
    // Find the minimum indentation (ignoring empty lines)
    const nonEmptyLines = lines.filter(line => line.trim() !== '');
    if (nonEmptyLines.length === 0) return '';
    
    const indentations = nonEmptyLines.map(line => {
      const match = line.match(/^(\s*)/);
      return match ? match[1].length : 0;
    });
    
    const minIndent = Math.min(...indentations);
    
    // Remove the common leading whitespace from all lines
    const cleanedLines = lines.map(line => {
      if (line.trim() === '') return ''; // Keep empty lines as empty
      return line.substring(minIndent);
    });
    
    return cleanedLines.join('\n');
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && !this.isProcessing) {
      this.processMarkdown();
    }
  }

  // Main processing method
  async processMarkdown() {
    const src = this.getAttribute('src');
    const transform = this.getAttribute('transform');

    this.isProcessing = true;
    
    // Hide content during processing with smooth transition
    this.style.opacity = '0';
    this.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

    try {
      let markdownContent;

      if (src) {
        // Show loading state for external files
        this.innerHTML = '<p>Loading content...</p>';
        
        // Fetch markdown content from external file
        markdownContent = await this.fetchMarkdown(src);
      } else {
        // Use stored original content for inline markdown
        markdownContent = this.originalContent;
        
        if (!markdownContent) {
          this.innerHTML = '<p style="color: red;">Error: No content found. Provide either src attribute or inline content.</p>';
          this.style.opacity = '1'; // Show error immediately
          return;
        }
      }
      
      // Parse transform rules
      const transformRules = this.parseTransformRules(transform);
      
      // Convert markdown to HTML with custom transforms
      const htmlContent = await this.markdownToHtml(markdownContent, transformRules);
      
      // Always replace the entire re-md element with its parsed content
      this.replaceWithContent(htmlContent);
      
      // Show content with smooth fade-in
      requestAnimationFrame(() => {
        this.style.opacity = '1';
      });

    } catch (error) {
      // For errors, also replace with error content
      const errorContent = `<p style="color: red;">Error processing markdown: ${error.message}</p>`;
      this.replaceWithContent(errorContent);
      this.style.opacity = '1'; // Show error immediately
      this.error('remd error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Get general element CSS styles (blockquote, code, etc.)
  getGeneralElementCSS() {
    return `
      /* General element styles */

      re-md[chapter-mode] section {
        visibility: hidden;
        height: 0;
        overflow: hidden;
        pointer-events: none;
      }

      re-md[chapter-mode] section.--chapter-active {
        visibility: visible;
        height: auto;
        pointer-events: auto;
        display: flex;
        flex-direction: column;
      }

      re-md[chapter-mode] .--chapter-active :is(h1, h2, h3, h4, h5, h6):first-child {
        margin-top: 0;
        padding-top: 0;
      }

      re-md {
        box-sizing: border-box;
        font-family: var(--ff-2, sans-serif);
      }

      re-md * {
        box-sizing: border-box;
        --fcolor: var(--o-bg, 0 0% 0%);
        --bcolor: var(--bg, 0 0% 100%);
      }

      re-md :where(h1, h2, h3, h4, h5, h6) {
        margin-top: calc(var(--space-unit, 0.5rem) * 3);
        margin-bottom: calc(var(--space-unit, 0.5rem) * 1.5);
      }

      re-md p {
        padding: calc(var(--space-unit, 0.5rem) * 1) 0;
        line-height: var(--remmd-line-height, 1.6);
      }

      re-md :where(ul li, ol li),
      re-md :where(ol li, ul li) {
        list-style-type: disc;
        padding-bottom: calc(var(--space-unit, 0.5rem) * 1);
      }

      re-md :where(ul, ol),
      re-md :where(ul ol) {
        padding: calc(var(--space-unit) * 1) 0 calc(var(--space-unit) * 1) calc(var(--space-unit) * 2);
      }

      re-md hr {
        width: 100%;
        padding: calc(var(--space-unit, 0.5rem) * 2) 0;
        border: none;
        border-top: 1px dotted hsla(var(--fcolor-hsl, 0 0% 0%) / var(--hr-border-opacity, 0.5));
      }

      re-md blockquote {
        font-size: var(--blockquote-font-size);
        margin: 0;
        padding: calc(var(--space-unit, 0.5rem) * 2) calc(var(--space-unit, 0.5rem) * 2);
        margin-block-end: calc(var(--space-unit, 0.5rem) * 6);
        background-color: hsla(var(--accent-color-hsl, var(--fcolor-hsl, 0 0% 0%)) / var(--blockquote-bg-opacity, 0.04));
        border-radius: calc(var(--size-unit, 0.5rem) * 0.25);
        border-left: 4px solid hsla( var(--accent-color-hsl, var(--fcolor-hsl, 0 0% 0%)) / var(--blockquote-border-opacity, 0.4));
      }

      re-md code {
        font-size: var(--codeblock-font-size);
        padding: calc(var(--space-unit, 0.5rem) * 1/3) var(--space-unit, 0.5rem);
        margin-inline: calc(var(--space-unit, 0.5rem) * 1/2);
        background-color: hsla(var(--accent-color-hsl, var(--fcolor-hsl)) / var(--inline-code-bg-opacity, 0.06));
        box-shadow: 0 0 0 1px hsla(var(--accent-color-hsl, var(--fcolor-hsl)) / var(--inline-code-border-opacity, 0.2));
        border-radius: calc(var(--size-unit, 0.5rem) * 1/2);
      }

      re-md code-block {
        font-size: var(--codeblock-font-size);
        padding: calc(var(--space-unit, 0.5rem) * 2) calc(var(--space-unit, 0.5rem) * 4);
        border-radius: calc(var(--size-unit, 0.5rem) * 0.25);
      }

      re-md code-block .copy-btn {
        font-size: var(--codeblock-font-size);
        box-shadow: 0 0 0 1px hsla(var(--accent-color-hsl, var(--fcolor-hsl)) / var(--inline-code-border-opacity, 0.2)) inset;
      }
    `;
  }

  // Get table CSS styles
  getTableCSS() {
    return `
      /* Table styles */

      re-md {
        --re-md-font-size: var(--f-size-p, 0.9rem);
      }

      re-md .table-wrapper {
        width: 100%;
        overflow-x: auto;
        margin-top: calc(var(--space-unit, 0.5rem) * 4);
        margin-bottom: calc(var(--space-unit, 0.5rem) * 6);
      }

      re-md .re-md-table {
        white-space: nowrap;
        border-collapse: collapse;
        overflow-x: hidden;
        font-family: var(--ff-3, monospace);
        font-size: var(--re-md-font-size);
        border-radius: calc(var(--size-unit, 0.5rem) * 1) calc(var(--size-unit, 0.5rem) * 1) 0 0;
        overflow: hidden;
      }

      re-md .re-md-table thead {
        background-color: hsla(var(--accent-color-hsl, var(--bcolor-hsl, 0 0% 100%)) / var(--table-thead-bg-opacity, 0.8));
      }

      re-md .re-md-table th {
        padding: calc(var(--space-unit, 0.5rem) * 2) calc(var(--space-unit, 0.5rem) * 3);
        font-weight: 300;
        text-align: left;
        color: hsla(var(--over-accent-color-hsl) / var(--table-thead-color-opacity, 0.8));
      }

      re-md .re-md-table th:not(:first-child) {
        border-left: 1px solid hsla(var(--bcolor-hsl, 0 0% 100%) / var(--table-th-border-opacity, 0.5));
      }

      re-md .re-md-table tbody tr:last-child {
        border-bottom: none;
      }

      re-md .re-md-table tbody tr:nth-child(even) {
        background-color: hsla(var(--accent-color-hsl, var(--fcolor-hsl, 0 0% 0%)) / var(--table-tr-even-bg-opacity, 0.08));
      }

      re-md .re-md-table td {
        padding: calc(var(--space-unit, 0.5rem) * 2) calc(var(--space-unit, 0.5rem) * 3);
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / var(--table-td-color-opacity, 0.85));
      }

      re-md .re-md-table td:not(:first-child) {
        border-left: 1px dotted hsla(var(--fcolor-hsl, 0 0% 0%) / var(--table-td-border-opacity, 0.5));
      }
    `;
  }

  // Replace the re-md element with its parsed content
  replaceWithContent(htmlContent) {
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = htmlContent;

    // Get all parsed elements
    const parsedElements = Array.from(tempContainer.childNodes);

    if (parsedElements.length > 0) {
      // Clear existing content
      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }

      // Add default styles first
      const styleTag = document.createElement('style');
      let styleContent = `
        /* Default re-md internal styles */
        re-md {
          width: 100%;
          overflow-x: hidden;
        }
      `;
      
      // Always add general element CSS (blockquote, code, etc.)
      styleContent += this.getGeneralElementCSS();
      
      // Always add table CSS
      styleContent += this.getTableCSS();
      
      styleTag.textContent = styleContent;
      this.appendChild(styleTag);

      // Process and append each element
      parsedElements.forEach(element => {
        // If it's a text node containing markdown-style headings, convert them
        if (element.nodeType === Node.TEXT_NODE) {
          const convertedText = this.convertMarkdownHeadings(element.textContent);
          if (convertedText !== element.textContent) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = convertedText;
            Array.from(wrapper.childNodes).forEach(node => {
              // If it's a heading, ensure it has an ID
              if (node.nodeType === Node.ELEMENT_NODE && /^h[1-6]$/i.test(node.tagName)) {
                if (!node.id) {
                  const headingText = node.textContent.trim();
                  node.id = headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                }
              }
              this.appendChild(node);
            });
          } else {
            this.appendChild(element);
          }
        } else {
          this.appendChild(element);
        }
      });
    }

    // Store chapter-mode attribute value before removing attributes
    const hasChapterMode = this.hasAttribute('chapter-mode');
    
    // Remove the re-md element's attributes but keep the element and style
    const attributesToRemove = Array.from(this.attributes)
      .filter(attr => attr.name !== 'style' && attr.name !== 'chapter-mode')
      .map(attr => attr.name);
    attributesToRemove.forEach(name => this.removeAttribute(name));
    
    // Generate IDs for all headings with section numbers
    this.generateHeadingIds();
    
    // Wrap content - only split into sections if chapter-mode attribute is present
    this.wrapContent(hasChapterMode);

    // Inline SVG images
    this.inlineSvgImages();
  }

  async inlineSvgImages() {
    const svgImgs = this.querySelectorAll('img[src$=".svg"]');
    if (!svgImgs.length) return;

    await Promise.all(Array.from(svgImgs).map(async (img) => {
      try {
        const response = await fetch(img.getAttribute('src'));
        if (!response.ok) return;

        const svgText = await response.text();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svg = svgDoc.documentElement;

        if (svg.tagName !== 'svg') return;

        const alt = img.getAttribute('alt');
        if (alt) svg.setAttribute('aria-label', alt);

        img.replaceWith(svg);
      } catch (e) {
        this.warn('Failed to inline SVG:', img.getAttribute('src'), e);
      }
    }));
  }

  // Generate IDs for headings with section numbers (e.g., 1-2-3-title)
  generateHeadingIds() {
    const headings = this.querySelectorAll('h2, h3, h4, h5, h6');
    const counters = [0, 0, 0, 0, 0]; // for h2-h6
    
    this.log('re-md: Generating IDs for', headings.length, 'headings');
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1));
      const index = level - 2;
      
      // Increment counter for this level
      counters[index]++;
      
      // Reset all deeper counters
      for (let i = index + 1; i < 5; i++) {
        counters[i] = 0;
      }
      
      // Build section number from counters
      const sectionParts = counters.slice(0, index + 1).filter(c => c > 0);
      const sectionNumber = sectionParts.join('-');
      
      // Generate ID
      const headingText = heading.textContent.replace(/^[\d.]+\s*/, '').trim();
      const baseId = headingText.toLowerCase().replace(/[^a-z0-9()]+/g, '-');
      const newId = `${sectionNumber}-${baseId}`;
      
      this.log(`re-md: Setting ${heading.tagName} "${headingText}" id to: ${newId}`);
      heading.id = newId;
    });
    
    // Handle h1 separately (no section number)
    const h1Elements = this.querySelectorAll('h1');
    h1Elements.forEach(h1 => {
      if (!h1.id) {
        const headingText = h1.textContent.replace(/^[\d.]+\s*/, '').trim();
        h1.id = headingText.toLowerCase().replace(/[^a-z0-9()]+/g, '-');
      }
    });
  }

  // Wrap content in a div and optionally split into sections
  wrapContent(shouldSplitIntoSections) {
    // Collect all child nodes
    const allNodes = Array.from(this.childNodes);
    const styleNodes = [];
    const contentNodes = [];
    
    // Separate style nodes from content nodes
    allNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'STYLE') {
        styleNodes.push(node);
      } else {
        contentNodes.push(node);
      }
    });
    
    // Create wrapper div with ref="0-introduction"
    const wrapper = document.createElement('div');
    wrapper.setAttribute('ref', 're-md-content');
    // Note: display: none is NOT set - wrapper is visible
    
    // Merge all style tags into a single style tag
    if (styleNodes.length > 0) {
      const mergedStyleTag = document.createElement('style');
      let mergedStyleContent = '';
      
      styleNodes.forEach(styleNode => {
        mergedStyleContent += styleNode.textContent + '\n';
      });
      
      mergedStyleTag.textContent = mergedStyleContent.trim();
      wrapper.appendChild(mergedStyleTag);
    }
    
    if (shouldSplitIntoSections) {
      // Split content into sections based on h2 headings
      const h2Elements = Array.from(this.querySelectorAll('h2'));
      
      if (h2Elements.length === 0) {
        // No h2 elements, wrap everything in section-0
        const section = document.createElement('section');
        section.setAttribute('ref', '0-introduction');
        
        // Move all content nodes to the section
        contentNodes.forEach(node => {
          section.appendChild(node);
        });
        
        wrapper.appendChild(section);
      } else {
        // Process content into sections
        let currentSection = null;
        let h2Index = 0;
        
        contentNodes.forEach(node => {
          // Check if this node is an h2 element
          if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'H2') {
            // Close previous section if exists
            if (currentSection) {
              wrapper.appendChild(currentSection);
            }
            
            // Start new section with h2's id as ref
            const h2Id = node.id || `h2-${h2Index}`;
            currentSection = document.createElement('section');
            currentSection.setAttribute('ref', h2Id);
            
            // Add the h2 to the section
            currentSection.appendChild(node);
            h2Index++;
          } else {
            // If we haven't started a section yet, create section-0
            if (!currentSection) {
              currentSection = document.createElement('section');
              currentSection.setAttribute('ref', '0-introduction');
            }
            
            // Add node to current section
            currentSection.appendChild(node);
          }
        });
        
        // Close the last section
        if (currentSection) {
          wrapper.appendChild(currentSection);
        }
      }
    } else {
      // No section splitting - just add all content nodes directly to wrapper
      contentNodes.forEach(node => {
        wrapper.appendChild(node);
      });
    }
    
    // Clear original content and add wrapper
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
    
    this.appendChild(wrapper);
  }

  convertMarkdownHeadings(text) {
    // Convert markdown headings (e.g., # Heading) to HTML
    return text.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
      const level = hashes.length;
      return `<h${level}>${content.trim()}</h${level}>`;
    });
  }

  // Fetch markdown file from URL
  async fetchMarkdown(src) {
    const response = await fetch(src);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${src}: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  }

  // Parse transform rules from the transform attribute
  // Example: "(h1: doc-title, p: p, code: doc-code {color='#33f' lines='2,4'})"
  parseTransformRules(transform) {
    const rules = new Map();

    // Default rules
    const defaults = {
      'h1': 'h1',
      'h2': 'h2', 
      'h3': 'h3',
      'h4': 'h4',
      'h5': 'h5',
      'h6': 'h6',
      'p': 'p',
      'ul': 'ul',
      'ol': 'ol',
      'li': 'li',
      'code': 'code',        // Inline code: `text`
      'codeblock': 'code',   // Block code: ```text```
      'blockquote': 'blockquote',
      'a': 'a',
      'img': 'img',
      'strong': 'strong',
      'em': 'em',
      'hr': 'hr',
      'table': 'table'
    };

    // Set default rules
    for (const [md, html] of Object.entries(defaults)) {
      rules.set(md, { element: html, attributes: {} });
    }

    if (!transform) {
      return rules;
    }

    // Remove outer parentheses and split by commas (but not inside braces)
    const cleanTransform = transform.replace(/^\s*\(\s*|\s*\)\s*$/g, '');
    const ruleParts = this.splitRules(cleanTransform);

    for (const rulePart of ruleParts) {
      const parsed = this.parseRule(rulePart.trim());
      if (parsed) {
        rules.set(parsed.mdElement, {
          element: parsed.htmlElement,
          attributes: parsed.attributes
        });
      }
    }

    return rules;
  }

  // Split rules by commas, but respect braces
  splitRules(str) {
    const rules = [];
    let current = '';
    let braceDepth = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      
      if (char === '{') {
        braceDepth++;
      } else if (char === '}') {
        braceDepth--;
      } else if (char === ',' && braceDepth === 0) {
        rules.push(current);
        current = '';
        continue;
      }
      
      current += char;
    }
    
    if (current.trim()) {
      rules.push(current);
    }
    
    return rules;
  }

  // Parse individual rule
  // Examples: 
  // - "h1: doc-title"
  // - "code: doc-code {color='#33f' lines='2,4'}"
  parseRule(rule) {
    // Match pattern: mdElement : htmlElement { attributes }
    const match = rule.match(/^\s*(\w+)\s*:\s*([a-zA-Z][\w-]*)\s*(?:\{([^}]*)\})?\s*$/);
    
    if (!match) {
      this.warn(`Invalid transform rule: "${rule}"`);
      return null;
    }

    const [, mdElement, htmlElement, attributesStr] = match;
    const attributes = this.parseAttributes(attributesStr);

    return {
      mdElement: mdElement.trim(),
      htmlElement: htmlElement.trim(),
      attributes
    };
  }

  /**
   * Parse attributes string
   * Example: "class='blue' id=\"quote-2\" data-foo=\"bar\""
   */
  parseAttributes(attributesStr) {
    const attributes = {};
    
    if (!attributesStr) {
      return attributes;
    }

    // Match attributes in the form: key='value' or key="value"
    // Supports attribute names with hyphens (e.g., data-foo)
    const attrRegex = /([\w-]+)\s*=\s*(['"])(.*?)\2/g;
    
    let match;
    while ((match = attrRegex.exec(attributesStr)) !== null) {
      const key = match[1];
      const value = match[3];
      attributes[key] = value;
    }

    return attributes;
  }

  // Convert markdown to HTML using transform rules
  processMarkdownContent(markdown, transformRules) {
    // Process headings first
    let content = markdown.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, title) => {
      const level = hashes.length;
      return `<h${level}>${title.trim()}</h${level}>`;
    });

    // Process lists
    content = content.replace(/^(\s*)[*+-]\s+(.+)$/gm, (match, indent, text) => {
      return `${indent}<li>${text}</li>`;
    });

    // Process code blocks with better language handling
    content = content.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      // Clean up the language identifier and handle special cases
      let language = lang.trim().toLowerCase() || 'plaintext';
      
      // Map common language aliases
      const languageMap = {
        'sh': 'bash',
        'shell': 'bash',
        'zsh': 'bash',
        'console': 'bash',
        'terminal': 'bash',
        'env': 'properties',
        '.env': 'properties',
        'dotenv': 'properties'
      };
      language = languageMap[language] || language;
      
      // Clean up the code content
      const cleanCode = code.trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      // Create doc-code element if specified in transform rules
      const codeRule = transformRules.get('codeblock');
      if (codeRule && codeRule.element === 'doc-code') {
        return `<doc-code language="${language}">${cleanCode}</doc-code>`;
      }
      
      // Default fallback
      return `<pre><code class="language-${language}">${cleanCode}</code></pre>`;
    });

    // Process inline code
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Process bold
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Process italic
    content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Process links
    content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    return content;
  }

  async markdownToHtml(markdown, transformRules) {
    // Replace escaped characters with placeholders before parsing
    const { text: processedMarkdown, placeholders } = this.escapeToPlaceholder(markdown);
    
    const lines = processedMarkdown.split('\n');
    const htmlLines = [];
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeBlockLang = '';
    let listStack = []; // Stack to track nested lists: [{type: 'ul'|'ol', indent: number}]
    let listHtml = []; // Accumulated HTML for current list structure
    let inComponent = false;
    let componentContent = '';
    let componentName = '';
    let componentAttributes = {};
    let inTable = false;
    let tableLines = [];
    
    // Track if document contains tables
    this.hasTable = false;
    
    // Process markdown content first
    const content = this.processMarkdownContent(markdown, transformRules);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Handle code blocks (must come before :: component check
      // so that :: lines inside fenced code blocks are treated as code)
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End code block - render with syntax highlighting
          const codeblockRule = transformRules.get('codeblock') || { element: 'code', attributes: {} };
          
          // Check if user wants a custom element (like doc-code)
          if (codeblockRule.element !== 'code' && customElements.get(codeblockRule.element)) {
            // Use custom element with markdown format
            const langPrefix = codeBlockLang ? codeBlockLang : '';
            const wrappedContent = `\`\`\`${langPrefix}\n${codeBlockContent.trim()}\n\`\`\``;
            const codeblockAttrs = this.attributesToString(codeblockRule.attributes);
            htmlLines.push(
              `<${codeblockRule.element}${codeblockAttrs}>${wrappedContent}</${codeblockRule.element}>`
            );
          } else {
            // Use built-in syntax highlighting
            const renderedCode = await this.renderCodeBlock(
              codeBlockContent,
              codeBlockLang,
              codeblockRule.attributes
            );
            htmlLines.push(renderedCode);
          }
          
          inCodeBlock = false;
          codeBlockContent = '';
          codeBlockLang = '';
        } else {
          // Start code block
          inCodeBlock = true;
          codeBlockLang = line.slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent += line + '\n';
        continue;
      }

      // Handle component blocks
      if (line.startsWith('::')) {
        if (inComponent && line.trim() === '::') {
          // End component block
          const processedComponent = await this.processComponentWithSlots(componentContent.trim(), componentName, componentAttributes, transformRules);
          htmlLines.push(processedComponent);
          
          inComponent = false;
          componentContent = '';
          componentName = '';
          componentAttributes = {};
        } else if (!inComponent) {
          // Start component block (with or without component name)
          const componentMatch = line.match(/^::([a-zA-Z][\w-]*)?\s*(?:\{([^}]*)\})?\s*$/);
          if (componentMatch) {
            inComponent = true;
            componentName = componentMatch[1] || ''; // Empty string if no component name
            componentAttributes = this.parseAttributes(componentMatch[2] || '');
          } else {
            // Invalid component syntax, treat as regular text
            const rule = transformRules.get('p') || { element: 'p', attributes: {} };
            const attrs = this.attributesToString(rule.attributes);
            const processedContent = this.processInlineElements(line, transformRules);
            htmlLines.push(`<${rule.element}${attrs}>${processedContent}</${rule.element}>`);
          }
        }
        continue;
      }

      if (inComponent) {
        componentContent += line + '\n';
        continue;
      }

      // Handle tables
      if (this.isTableLine(line)) {
        if (!inTable) {
          inTable = true;
          tableLines = [];
          this.hasTable = true; // Mark that we have a table
        }
        tableLines.push(line);
        continue;
      } else if (inTable) {
        // End table
        const tableHtml = this.parseTable(tableLines, transformRules);
        htmlLines.push(tableHtml);
        inTable = false;
        tableLines = [];
      }

      // Handle lists (with nesting support)
      const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
      if (listMatch) {
        const indent = listMatch[1].length;
        const marker = listMatch[2];
        const content = listMatch[3];
        const listType = /^\d+\.$/.test(marker) ? 'ol' : 'ul';
        
        const processedContent = this.processInlineElements(content, transformRules);
        const liRule = transformRules.get('li') || { element: 'li', attributes: {} };
        const liAttrs = this.attributesToString(liRule.attributes);
        
        if (listStack.length === 0) {
          // Start a new list
          const listRule = transformRules.get(listType) || { element: listType, attributes: {} };
          const listAttrs = this.attributesToString(listRule.attributes);
          listHtml.push(`<${listRule.element}${listAttrs}>`);
          listStack.push({ type: listType, indent });
        } else {
          const currentLevel = listStack[listStack.length - 1];
          
          if (indent > currentLevel.indent) {
            // Nested list - open new list inside current item
            // Remove the closing </li> from the last item to nest inside it
            const lastItem = listHtml[listHtml.length - 1];
            if (lastItem.endsWith(`</${liRule.element}>`)) {
              listHtml[listHtml.length - 1] = lastItem.slice(0, -(`</${liRule.element}>`.length));
            }
            
            const listRule = transformRules.get(listType) || { element: listType, attributes: {} };
            const listAttrs = this.attributesToString(listRule.attributes);
            listHtml.push(`<${listRule.element}${listAttrs}>`);
            listStack.push({ type: listType, indent });
          } else if (indent < currentLevel.indent) {
            // Going back up - close nested lists
            while (listStack.length > 0 && listStack[listStack.length - 1].indent > indent) {
              const closingLevel = listStack.pop();
              const closingListRule = transformRules.get(closingLevel.type) || { element: closingLevel.type, attributes: {} };
              listHtml.push(`</${closingListRule.element}>`);
              listHtml.push(`</${liRule.element}>`); // Close the parent li
            }
            
            // Check if we need a new list type at this level
            if (listStack.length > 0 && listStack[listStack.length - 1].type !== listType) {
              // Different list type at same level - close and reopen
              const closingLevel = listStack.pop();
              const closingListRule = transformRules.get(closingLevel.type) || { element: closingLevel.type, attributes: {} };
              listHtml.push(`</${closingListRule.element}>`);
              
              const listRule = transformRules.get(listType) || { element: listType, attributes: {} };
              const listAttrs = this.attributesToString(listRule.attributes);
              listHtml.push(`<${listRule.element}${listAttrs}>`);
              listStack.push({ type: listType, indent });
            }
          }
          // Same indent level - just add another item
        }
        
        listHtml.push(`<${liRule.element}${liAttrs}>${processedContent}</${liRule.element}>`);
        continue;
      } else if (listStack.length > 0) {
        // End all lists
        const liRule = transformRules.get('li') || { element: 'li', attributes: {} };
        while (listStack.length > 0) {
          const closingLevel = listStack.pop();
          const closingListRule = transformRules.get(closingLevel.type) || { element: closingLevel.type, attributes: {} };
          listHtml.push(`</${closingListRule.element}>`);
          if (listStack.length > 0) {
            listHtml.push(`</${liRule.element}>`); // Close parent li if there's still a parent
          }
        }
        htmlLines.push(listHtml.join(''));
        listHtml = [];
      }

      // Handle empty lines
      if (line.trim() === '') {
        if (listStack.length === 0) {
          htmlLines.push('');
        }
        continue;
      }

      // Handle headings
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const content = headingMatch[2];
        const headingTag = `h${level}`;
        
        const rule = transformRules.get(headingTag) || { element: headingTag, attributes: {} };
        const attrs = this.attributesToString(rule.attributes);
        const processedContent = this.processInlineElements(content, transformRules);
        
        htmlLines.push(`<${rule.element}${attrs}>${processedContent}</${rule.element}>`);
        continue;
      }

      // Handle horizontal rule
      if (line.match(/^---+$/)) {
        const rule = transformRules.get('hr') || { element: 'hr', attributes: {} };
        const attrs = this.attributesToString(rule.attributes);
        htmlLines.push(`<${rule.element}${attrs}>`);
        continue;
      }

      // Handle blockquotes
      if (line.startsWith('>')) {
        const content = line.replace(/^>\s*/, '');
        const rule = transformRules.get('blockquote') || { element: 'blockquote', attributes: {} };
        const attrs = this.attributesToString(rule.attributes);
        const processedContent = this.processInlineElements(content, transformRules);
        
        htmlLines.push(`<${rule.element}${attrs}>${processedContent}</${rule.element}>`);
        continue;
      }

      // Handle inline code
      if (line.includes('`')) {
        const processedLine = this.processInlineElements(line, transformRules);
        const rule = transformRules.get('p') || { element: 'p', attributes: {} };
        const attrs = this.attributesToString(rule.attributes);
        
        htmlLines.push(`<${rule.element}${attrs}>${processedLine}</${rule.element}>`);
        continue;
      }

      // Handle regular paragraphs
      if (line.trim()) {
        const rule = transformRules.get('p') || { element: 'p', attributes: {} };
        const attrs = this.attributesToString(rule.attributes);
        const processedContent = this.processInlineElements(line, transformRules);
        
        htmlLines.push(`<${rule.element}${attrs}>${processedContent}</${rule.element}>`);
      }
    }

    // Close any remaining table
    if (inTable && tableLines.length > 0) {
      this.hasTable = true; // Mark that we have a table
      const tableHtml = this.parseTable(tableLines, transformRules);
      htmlLines.push(tableHtml);
    }

    // Close any remaining list
    if (listStack.length > 0) {
      const liRule = transformRules.get('li') || { element: 'li', attributes: {} };
      while (listStack.length > 0) {
        const closingLevel = listStack.pop();
        const closingListRule = transformRules.get(closingLevel.type) || { element: closingLevel.type, attributes: {} };
        listHtml.push(`</${closingListRule.element}>`);
        if (listStack.length > 0) {
          listHtml.push(`</${liRule.element}>`);
        }
      }
      htmlLines.push(listHtml.join(''));
    }

    // Close any remaining component block
    if (inComponent && componentContent.trim()) {
      const processedComponent = await this.processComponentWithSlots(componentContent.trim(), componentName, componentAttributes, transformRules);
      htmlLines.push(processedComponent);
    }

    // Restore escaped characters from placeholders
    const result = htmlLines.join('\n');
    return this.restorePlaceholders(result, placeholders);
  }

  // Replace escaped characters with unique placeholder tokens
  // This prevents them from being interpreted as markdown syntax
  escapeToPlaceholder(markdown) {
    const placeholders = new Map();
    let counter = 0;
    
    const text = markdown.replace(/\\([\\`*_{}[\]()#+\-.!>|])/g, (match, char) => {
      const placeholder = `\u0000ESC${counter++}\u0000`;
      placeholders.set(placeholder, char);
      return placeholder;
    });
    
    return { text, placeholders };
  }

  // Restore placeholder tokens to their original literal characters
  restorePlaceholders(html, placeholders) {
    let result = html;
    for (const [placeholder, char] of placeholders) {
      result = result.split(placeholder).join(this.escapeHtml(char));
    }
    return result;
  }

  // Process component content with slot support
  // Handles @slotName() and @default() syntax
  // If componentName is empty, applies attributes to the first rendered element
  async processComponentWithSlots(content, componentName, componentAttributes, transformRules) {
    const slots = this.parseSlots(content);
    const attrs = this.attributesToString(componentAttributes);
    
    // Special case: No component name specified - apply attributes directly to the output element
    if (!componentName) {
      const trimmedContent = content.trim();
      
      // Single-line content: process as inline and apply attributes
      if (!trimmedContent.includes('\n')) {
        // Process as inline content only (no <p> wrapper)
        const processedInline = this.processInlineElements(trimmedContent, transformRules);
        
        if (!attrs) {
          return processedInline;
        }
        
        // Inject attributes into the element
        return this.injectAttributesIntoFirstElement(processedInline, componentAttributes);
      }
      
      // Multi-line content: just process as markdown, ignore attributes (no element to apply them to)
      return await this.markdownToHtml(content, transformRules);
    }
    
    if (Object.keys(slots).length === 0) {
      // No slots found, process as regular content
      const processedContent = await this.markdownToHtml(content, transformRules);
      return `<${componentName}${attrs}>${processedContent}</${componentName}>`;
    }
    
    // Build component with slots
    let componentHtml = `<${componentName}${attrs}>`;
    
    // Add default slot content if present
    if (slots.default) {
      const processedDefault = await this.markdownToHtml(slots.default, transformRules);
      componentHtml += processedDefault;
    }
    
    // Add named slots
    for (const [slotName, slotContent] of Object.entries(slots)) {
      if (slotName !== 'default') {
        const processedSlot = await this.markdownToHtml(slotContent, transformRules);
        componentHtml += `<div slot="${slotName}">${processedSlot}</div>`;
      }
    }
    
    componentHtml += `</${componentName}>`;
    return componentHtml;
  }

  // Inject attributes into the first HTML element found in the content
  injectAttributesIntoFirstElement(htmlContent, attributes) {
    if (!htmlContent || Object.keys(attributes).length === 0) {
      return htmlContent;
    }
    
    // Find the first HTML opening tag
    const firstTagMatch = htmlContent.match(/^(\s*)(<(\w+)((?:\s+[\w-]+(?:\s*=\s*["'][^"']*["'])?)*)\s*(\/?)>)/);
    
    if (!firstTagMatch) {
      // No HTML tag found, wrap in a div with attributes
      const attrs = this.attributesToString(attributes);
      return `<div${attrs}>${htmlContent}</div>`;
    }
    
    const indent = firstTagMatch[1];
    const fullTag = firstTagMatch[2];
    const tagName = firstTagMatch[3];
    const existingAttrs = firstTagMatch[4];
    const selfClosing = firstTagMatch[5];
    
    // Parse existing attributes
    const existingAttrObj = this.parseExistingAttributes(existingAttrs);
    
    // Merge attributes (new attributes override existing ones)
    const mergedAttrs = { ...existingAttrObj, ...attributes };
    const attrsString = this.attributesToString(mergedAttrs);
    
    // Build the new opening tag
    const newTag = `<${tagName}${attrsString}${selfClosing ? ' /' : ''}>`;
    
    // Replace the first tag with the new one
    return indent + newTag + htmlContent.substring(indent.length + fullTag.length);
  }

  // Parse existing HTML attributes from a tag string
  parseExistingAttributes(attrString) {
    const attributes = {};
    
    if (!attrString || !attrString.trim()) {
      return attributes;
    }
    
    // Match attributes in the form: key="value" or key='value' or key
    const attrRegex = /([\w-]+)(?:\s*=\s*["']([^"']*)["'])?/g;
    
    let match;
    while ((match = attrRegex.exec(attrString)) !== null) {
      const key = match[1];
      const value = match[2] !== undefined ? match[2] : '';
      if (key) {
        attributes[key] = value;
      }
    }
    
    return attributes;
  }

  // Parse slot syntax from component content
  // Returns object with slot names as keys and content as values
  parseSlots(content) {
    const slots = {};
    const lines = content.split('\n');
    let currentSlot = null;
    let currentContent = [];
    let inSlot = false;
    let parenthesesCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for slot start: @slotName( or @default(
      const slotMatch = line.match(/^@(\w+)\s*\(/);
      if (slotMatch && !inSlot) {
        currentSlot = slotMatch[1];
        inSlot = true;
        parenthesesCount = 0;
        
        // Count opening parentheses in this line
        for (const char of line) {
          if (char === '(') parenthesesCount++;
          if (char === ')') parenthesesCount--;
        }
        
        // If parentheses are balanced on same line, it's a single-line slot
        if (parenthesesCount === 0) {
          // Extract content between parentheses
          const contentMatch = line.match(/^@\w+\s*\(\s*(.*?)\s*\)$/);
          if (contentMatch) {
            slots[currentSlot] = contentMatch[1];
          }
          currentSlot = null;
          inSlot = false;
        }
        continue;
      }
      
      if (inSlot) {
        // Count parentheses to find slot end
        for (const char of line) {
          if (char === '(') parenthesesCount++;
          if (char === ')') parenthesesCount--;
        }
        
        if (parenthesesCount === 0) {
          // End of slot - don't include the closing parenthesis line
          const lineWithoutClosing = line.replace(/\s*\)\s*$/, '');
          if (lineWithoutClosing.trim()) {
            currentContent.push(lineWithoutClosing);
          }
          
          slots[currentSlot] = currentContent.join('\n').trim();
          currentContent = [];
          currentSlot = null;
          inSlot = false;
        } else {
          // Inside slot content
          currentContent.push(line);
        }
      } else if (!line.startsWith('@')) {
        // Regular content outside slots - treat as default slot
        if (!slots.default) {
          slots.default = '';
        }
        if (slots.default) {
          slots.default += '\n' + line;
        } else {
          slots.default = line;
        }
      }
    }
    
    // Clean up default slot content
    if (slots.default) {
      slots.default = slots.default.trim();
    }
    
    return slots;
  }

  // Check if a line is part of a table
  isTableLine(line) {
    const trimmed = line.trim();
    // Check if line contains pipes and is not empty
    if (!trimmed || !trimmed.includes('|')) {
      return false;
    }
    
    // Check for separator line (|---|---|)
    if (/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(trimmed)) {
      return true;
    }
    
    // Check for regular table row (| col1 | col2 |)
    if (/^\s*\|.*\|\s*$/.test(trimmed) || /^[^|]*\|[^|]*/.test(trimmed)) {
      return true;
    }
    
    return false;
  }

  // Parse markdown table into HTML table structure with built-in styling
  parseTable(tableLines, transformRules) {
    if (tableLines.length === 0) {
      return '';
    }

    // Get the table transform rule
    const tableRule = transformRules.get('table') || { element: 'table', attributes: {} };
    const attrs = this.attributesToString(tableRule.attributes);
    
    // Parse table rows
    const rows = tableLines.map(line => {
      // Remove leading/trailing pipes and whitespace
      const trimmed = line.trim().replace(/^\||\|$/g, '');
      // Split by pipes and trim each cell
      return trimmed.split('|').map(cell => cell.trim());
    });
    
    if (rows.length < 2) {
      // Need at least header and separator
      return `<${tableRule.element}${attrs}>${tableLines.join('\n')}</${tableRule.element}>`;
    }
    
    // First row is header
    const headerRow = rows[0];
    
    // Second row should be separator (|---|---|)
    const separatorRow = rows[1];
    const isSeparator = separatorRow.every(cell => /^:?-+:?$/.test(cell));
    
    if (!isSeparator) {
      // Not a valid markdown table, return as-is
      return `<${tableRule.element}${attrs}>${tableLines.join('\n')}</${tableRule.element}>`;
    }
    
    // Parse alignment from separator row
    const alignments = separatorRow.map(cell => {
      const hasLeft = cell.startsWith(':');
      const hasRight = cell.endsWith(':');
      
      if (hasLeft && hasRight) return 'center';
      if (hasRight) return 'right';
      if (hasLeft) return 'left';
      return '';
    });
    
    // Data rows start after separator
    const dataRows = rows.slice(2);
    
    // Generate unique ID for this table
    const uniqueId = '-' + Math.random().toString(36).substr(2, 9);
    
    // Build HTML table (CSS is now in top-level <style> tag)
    let tableHtml = `<div class="table-wrapper">`;
    tableHtml += `<${tableRule.element} class="re-md-table" id="table-id-${uniqueId}"${attrs}>`;
    
    // Build thead
    tableHtml += '<thead><tr>';
    headerRow.forEach((cell, i) => {
      const alignAttr = alignments[i] ? ` style="text-align: ${alignments[i]}"` : '';
      const processedCell = this.processInlineElements(cell, transformRules);
      tableHtml += `<th${alignAttr}>${processedCell}</th>`;
    });
    tableHtml += '</tr></thead>';
    
    // Build tbody
    if (dataRows.length > 0) {
      tableHtml += '<tbody>';
      dataRows.forEach(row => {
        tableHtml += '<tr>';
        row.forEach((cell, i) => {
          const alignAttr = alignments[i] ? ` style="text-align: ${alignments[i]}"` : '';
          const processedCell = this.processInlineElements(cell, transformRules);
          tableHtml += `<td${alignAttr}>${processedCell}</td>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody>';
    }
    
    tableHtml += `</${tableRule.element}>`;
    tableHtml += `</div>`; // Close table-wrapper
    
    return tableHtml;
  }

  // Process inline elements (bold, italic, links, inline code)
  processInlineElements(text, transformRules) {
    let processed = text;

    // Handle inline code first (to avoid conflicts)
    processed = processed.replace(/`([^`]+)`/g, (match, code) => {
      const rule = transformRules.get('code') || { element: 'code', attributes: {} };
      const attrs = this.attributesToString(rule.attributes);
      return `<${rule.element}${attrs}>${this.escapeHtml(code)}</${rule.element}>`;
    });

    // Handle bold
    processed = processed.replace(/\*\*([^*]+)\*\*/g, (match, text) => {
      const rule = transformRules.get('strong') || { element: 'strong', attributes: {} };
      const attrs = this.attributesToString(rule.attributes);
      return `<${rule.element}${attrs}>${text}</${rule.element}>`;
    });

    // Handle italic
    processed = processed.replace(/\*([^*]+)\*/g, (match, text) => {
      const rule = transformRules.get('em') || { element: 'em', attributes: {} };
      const attrs = this.attributesToString(rule.attributes);
      return `<${rule.element}${attrs}>${text}</${rule.element}>`;
    });

    // Handle images (must come before links since they use similar syntax)
    processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      const rule = transformRules.get('img') || { element: 'img', attributes: {} };
      const attrs = this.attributesToString({...rule.attributes, src: src, alt: alt});
      return `<${rule.element}${attrs}>`;
    });

    // Handle links
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const rule = transformRules.get('a') || { element: 'a', attributes: {} };
      const attrs = this.attributesToString({...rule.attributes, href: url});
      return `<${rule.element}${attrs}>${text}</${rule.element}>`;
    });

    return processed;
  }

  // Convert attributes object to HTML attribute string
  attributesToString(attributes) {
    if (!attributes || Object.keys(attributes).length === 0) {
      return '';
    }

    const attrPairs = Object.entries(attributes)
      .map(([key, value]) => `${key}="${this.escapeHtml(value)}"`)
      .join(' ');

    return ` ${attrPairs}`;
  }

  // Escape HTML characters
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Detect language from file extension
  detectLangFromExtension(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const extensionMap = {
      'env': 'properties',
      'js': 'javascript',
      'jsx': 'javascript', 
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'php': 'php',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'html': 'html',
      'htm': 'html',
      'xml': 'xml',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'toml': 'toml',
      'ini': 'ini',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'fish': 'bash',
      'ps1': 'powershell',
      'dockerfile': 'dockerfile',
      'md': 'markdown',
      'markdown': 'markdown',
      'tex': 'latex',
      'r': 'r',
      'R': 'r',
      'dart': 'dart',
      'lua': 'lua',
      'perl': 'perl',
      'pl': 'perl'
    };
    return extensionMap[ext] || null;
  }

  // Detect language from code content
  detectLangFromContent(code) {
    const trimmedCode = code.trim();
    
    // Environment variables pattern
    if (/^[A-Z_]+=.+$/m.test(trimmedCode)) {
      return 'properties';
    }
    
    // JavaScript/TypeScript patterns
    if (/^(import\s|export\s|const\s|let\s|var\s|function\s|class\s|interface\s|type\s)/m.test(trimmedCode)) {
      return /^(import.*from|export.*from|interface\s|type\s)/m.test(trimmedCode) ? 'typescript' : 'javascript';
    }
    
    // Python patterns
    if (/^(def\s|class\s|import\s|from\s.*import|if\s.*:|for\s.*:|while\s.*:)/m.test(trimmedCode)) {
      return 'python';
    }
    
    // CSS patterns
    if (/^[.#]?\w+\s*\{[\s\S]*\}/.test(trimmedCode) || /^@(media|import|keyframes)/.test(trimmedCode)) {
      return 'css';
    }
    
    // HTML patterns
    if (/^<(!DOCTYPE|html|head|body|div|span|p|h[1-6]|a|img)/i.test(trimmedCode)) {
      return 'html';
    }
    
    // JSON patterns
    if (/^[\s]*[{\[]/.test(trimmedCode) && /[}\]][\s]*$/.test(trimmedCode)) {
      try {
        JSON.parse(trimmedCode);
        return 'json';
      } catch (e) {
        // Not valid JSON
      }
    }
    
    // SQL patterns
    if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s/i.test(trimmedCode)) {
      return 'sql';
    }
    
    return null;
  }

  // Load theme CSS from URL
  async loadThemeCSS(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load theme CSS: ${url}`);
      return await response.text();
    } catch (error) {
      this.error('Error loading theme CSS:', error);
      return '';
    }
  }

  // Render code block with syntax highlighting
  async renderCodeBlock(code, language, attributes = {}) {
    const rawCode = code.trim();
    
    // Auto-detect language if not provided
    let detectedLang = language || this.detectLangFromContent(rawCode) || 'plaintext';
    
    // Map env to properties for highlighting
    if (detectedLang === 'env') detectedLang = 'properties';
    
    // Highlight the code
    const highlighted = hljs.highlight(rawCode, { language: detectedLang }).value;
    
    // Split into lines
    const rawLines = rawCode.split('\n');
    const hlLines = highlighted.split('\n');
    
    // Parse focus lines from attributes
    const focusAttr = this.getAttribute('line-focus') || '';
    const focusLines = focusAttr
      .split(/[\s,]+/)
      .map(n => parseInt(n, 10))
      .filter(n => !isNaN(n));
    
    // Build line numbers
    const lineNumbers = rawLines
      .map((_, i) => `<div class="line-number">${i + 1}</div>`)
      .join('');
    
    // Build code lines
    const codeLines = hlLines
      .map((line, i) => {
        const n = i + 1;
        const cls = focusLines.includes(n) ? 'code-line focus' : 'code-line';
        return `<div class="${cls}">${line || '&#8203;'}</div>`;
      })
      .join('');
    
    // Get background color from attributes or use default
    const bgHslAttr = attributes['bg-hsl'] || 'var(--accent-color-hsl)';
    
    // Generate unique ID for this code block
    const uniqueId = Math.random().toString(36).substr(2, 9);
    
    // Load theme CSS (use default if not specified)
    let themeCSS = '';
    const themeCssAttr = this.getAttribute('theme-css') || '/__src/css/code-syntax.css';
    if (themeCssAttr) {
      const themeCssUrls = themeCssAttr.split(/[\s,]+/).filter(Boolean);
      const themeCssContents = await Promise.all(themeCssUrls.map(url => this.loadThemeCSS(url)));
      themeCSS = themeCssContents.join('\n');
    }
    
    // Component CSS
    const componentCSS = `
      ${themeCSS}
      
      .code-block {
        --codeblock-font-size: var(--f-size-p, 0.8rem);
        display: flex;
        width: 100%;
        margin-top: calc(var(--space-unit, 0.5rem)*2);
        margin-bottom: calc(var(--space-unit, 0.5rem)*6);
      }
      
      .code-block .wrapper {
        display: flex;
        position: relative;
        width: 100%;
        font-family: var(--ff-3, monospace);
        line-height: 1.42;
        background-color: hsla(var(--accent-color-hsl, var(--fcolor-hsl, ${bgHslAttr})) / var(--code-block-bg-opacity,0.04));
        column-gap: calc(var(--space-unit, 0.5rem)*2);
        padding: calc(var(--space-unit, 0.5rem)*2);
        overflow: hidden;
        border-radius: calc(var(--size-unit, 0.5rem) * 0.5);
        box-shadow: 0 0 0 1px hsla(var(--accent-color-hsl, var(--fcolor-hsl)) / var(--inline-code-border-opacity, 0.4)) inset;
      }
      
      .code-block .line-numbers {
        user-select: none;
        text-align: right;
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / var(--line-numbers-opacity, 0.2));
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
      }
      
      .code-block .line-number {
        white-space: pre;
        margin-right: calc(var(--space-unit, 0.5rem) * 0.5);
        font-size: var(--codeblock-font-size);
        font-family: var(--ff-3, monospace);
      }
      
      .code-block .code-lines {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: auto;
      }
      
      .code-block .code-line {
        white-space: pre;
        font-size: var(--codeblock-font-size);
      }
      
      .code-block .focus {
        background: hsla(var(--acc-hsl, 180 100% 50%) / var(--code-block-focus-opacity, 0.2));
      }
      
      .code-block button.copy-btn {
        position: absolute;
        top: calc(var(--space-unit, 0.5rem)*2);
        right: calc(var(--space-unit, 0.5rem)*2);
        background: hsla(var(--bcolor-hsl, 0 0% 100%) / 1);
        color: hsla(var(--fcolor-hsl, 0 0% 0%) / 1);
        border: none;
        padding: calc(var(--space-unit, 0.5rem) * 1/2) calc(var(--space-unit, 0.5rem) * 2);
        border-radius: calc(var(--size-unit, 0.5rem) * 0.5);
        cursor: pointer;
        font-size: var(--codeblock-font-size);
        font-family: var(--ff-3, monospace);
        box-shadow: 0 0 0 1px hsla(var(--accent-color-hsl, var(--fcolor-hsl)) / var(--inline-code-border-opacity, 0.2)) inset;
      }
    `;
    
    // Store code in a data attribute with base64 encoding to avoid escaping issues
    const base64Code = btoa(unescape(encodeURIComponent(rawCode)));
    
    // Build the HTML
    const html = `
      <style>${componentCSS}</style>
      <div class="code-block" id="code-block-${uniqueId}">
        <div class="wrapper">
          <div class="line-numbers">${lineNumbers}</div>
          <div class="code-lines">${codeLines}</div>
          <button class="copy-btn" data-code-b64="${base64Code}" onclick="const code=decodeURIComponent(escape(atob(this.getAttribute('data-code-b64'))));navigator.clipboard.writeText(code);this.textContent='copied!';setTimeout(()=>this.textContent='copy',2400)">copy</button>
        </div>
      </div>
    `;
    
    return html;
  }
}

export default remd
