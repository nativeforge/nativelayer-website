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
 * ::component-name {attr: 'value', attr2: 'value'}
 * [markdown content here]
 * ::
 * 
 * Slot Support:
 * ::component-name
 *   @slotName(content for named slot)
 *   @default(content for default slot)
 * ::
 * 
 * Example:
 * ::doc-alert {type: 'warning', icon: 'true'}
 * This is a **warning** message with `inline code`.
 * ::
 * 
 * Result: The re-md element vanishes and is replaced by the transformed HTML elements.
 */

class remd extends HTMLElement {
  constructor() {
    super();
    this.isProcessing = false;
    this.originalContent = null;
  }

  static get observedAttributes() {
    return ['src', 'transform'];
  }

  connectedCallback() {
    // Hide content immediately if there's inline content (prevents flash of raw markdown)
    if (!this.getAttribute('src') && this.textContent.trim()) {
      this.style.opacity = '0';
    }
    
    // Capture original content before any processing if no src attribute
    if (!this.getAttribute('src') && !this.originalContent) {
      // Try innerHTML first, fallback to textContent
      const rawContent = this.innerHTML || this.textContent;
      this.originalContent = this.cleanupInlineContent(rawContent);
    }
    
    this.waitForConnection().then(() => {
      this.processMarkdown();
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

  /**
   * Clean up inline content by removing common leading whitespace
   */
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

  /**
   * Main processing method
   */
  async processMarkdown() {
    const src = this.getAttribute('src');
    const transform = this.getAttribute('transform');

    this.isProcessing = true;
    
    // Hide content during processing with smooth transition
    this.style.opacity = '0';
    this.style.transition = 'opacity 0.2s ease';

    try {
      let markdownContent;

      if (src) {
        // Show loading state for external files
        this.innerHTML = '<p>Loading markdown...</p>';
        
        // Fetch markdown content from external file
        markdownContent = await this.fetchMarkdown(src);
      } else {
        // Use stored original content for inline markdown
        markdownContent = this.originalContent;
        
        if (!markdownContent) {
          this.innerHTML = '<p style="color: red;">Error: No markdown content found. Provide either src attribute or inline content.</p>';
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
      console.error('remd error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get table CSS styles
   */
  getTableCSS() {
    return `
      /* Table styles */
      @media (prefers-color-scheme: light) {
        .re-md-table {
          --color: var(--o-bg, black);
          --bgcolor: var(--bg, white);
        }
      }
      @media (prefers-color-scheme: dark) {
        .re-md-table {
          --color: var(--bg, white);
          --bgcolor: var(--o-bg, black);
        }
      }
      
      .table-wrapper {
        width: 100%;
        overflow-x: auto;
        margin-top: calc(var(--space-unit, 0.5rem) * 4);
        margin-bottom: calc(var(--space-unit, 0.5rem) * 6);
      }
      
      .re-md-table {

        --color: var(--o-bg, black);
        --bgcolor: var(--bg, white);

        white-space: nowrap;
        border-collapse: collapse;
        font-size: var(--f-size-p, 1rem);
        border-radius: calc(var(--size-unit, 0.5rem) * 0.5);
        overflow-x: hidden;
        box-shadow: 0 0 0 1px hsla(var(--o-bg, 0 0% 0%), 0.1);
        font-family: var(--ff-3, monospace);
      }
      
      .re-md-table thead {
        background-color: hsla(from var(--color) h s l / 0.5);
        color: hsla(from var(--color) h s l / 1);
      }
      
      .re-md-table th {
        padding: calc(var(--space-unit, 0.5rem) * 2) calc(var(--space-unit, 0.5rem) * 3);
        font-weight: 600;
        text-align: left;
        font-size: var(--f-size-s, 0.75rem);
        color: hsla(from var(--color) h s l / 0.7);
      }
      
      .re-md-table th {
        color: hsla(from var(--bgcolor) h s l / 0.9);
      }

      .re-md-table th:not(:first-child) {
        border-left: 1px dotted hsla(from var(--bgcolor) h s l / 0.5);
      }
      
      .re-md-table tbody tr {
        border-bottom: 1px dotted;
        border-color: hsla(from var(--color) h s l / 0.5);
      }

      .re-md-table tbody tr:last-child {
        border-bottom: none;
      }

      .re-md-table tbody tr:nth-child(even) {
        background-color: hsla(from var(--color) h s l / 0.09);
      }

      .re-md-table td {
        padding: calc(var(--space-unit, 0.5rem) * 2) calc(var(--space-unit, 0.5rem) * 3);
        color: hsla(from var(--color) h s l / 0.85);
        font-size: var(--f-size-s, 0.75rem);
      }
      
      .re-md-table td:not(:first-child) {
        border-left: 1px dotted hsla(from var(--color) h s l / 0.5);
      }
    `;
  }

  /**
   * Replace the re-md element with its parsed content
   */
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
      
      // Add table CSS if document contains tables
      if (this.hasTable) {
        styleContent += this.getTableCSS();
      }
      
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
          // If it's a heading element, ensure it has an ID
          if (element.nodeType === Node.ELEMENT_NODE && /^h[1-6]$/i.test(element.tagName)) {
            if (!element.id) {
              const headingText = element.textContent.trim();
              element.id = headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            }
          }
          this.appendChild(element);
        }
      });
    }

    // Remove the re-md element's attributes but keep the element
    while (this.attributes.length > 0) {
      this.removeAttribute(this.attributes[0].name);
    }
  }

  convertMarkdownHeadings(text) {
    // Convert markdown headings (e.g., # Heading) to HTML
    return text.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
      const level = hashes.length;
      return `<h${level}>${content.trim()}</h${level}>`;
    });
  }

  /**
   * Fetch markdown file from URL
   */
  async fetchMarkdown(src) {
    const response = await fetch(src);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${src}: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  }

  /**
   * Parse transform rules from the transform attribute
   * Example: "(h1: doc-title, p: p, code: doc-code {color: '#33f', lines: '2,4'})"
   */
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

  /**
   * Split rules by commas, but respect braces
   */
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

  /**
   * Parse individual rule
   * Examples: 
   * - "h1: doc-title"
   * - "code: doc-code {color: '#33f', lines: '2,4'}"
   */
  parseRule(rule) {
    // Match pattern: mdElement : htmlElement { attributes }
    const match = rule.match(/^\s*(\w+)\s*:\s*([a-zA-Z][\w-]*)\s*(?:\{([^}]*)\})?\s*$/);
    
    if (!match) {
      console.warn(`Invalid transform rule: "${rule}"`);
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
   * Example: "color: '#33f', lines: '2,4'"
   */
  parseAttributes(attributesStr) {
    const attributes = {};
    
    if (!attributesStr) {
      return attributes;
    }

    // Split by commas and parse key-value pairs
    const pairs = attributesStr.split(',');
    
    for (const pair of pairs) {
      const [key, value] = pair.split(':').map(s => s.trim());
      
      if (key && value) {
        // Remove quotes from value
        const cleanValue = value.replace(/^['"]|['"]$/g, '');
        attributes[key] = cleanValue;
      }
    }

    return attributes;
  }

  /**
   * Convert markdown to HTML using transform rules
   */
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
    // Pre-process the markdown to handle any escaped characters
    markdown = markdown.replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1');
    
    const lines = markdown.split('\n');
    const htmlLines = [];
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeBlockLang = '';
    let inList = false;
    let listItems = [];
    let listType = '';
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
          // Start component block
          const componentMatch = line.match(/^::([a-zA-Z][\w-]*)\s*(?:\{([^}]*)\})?\s*$/);
          if (componentMatch) {
            inComponent = true;
            componentName = componentMatch[1];
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
      
      // Handle code blocks
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

      // Handle lists
      if (line.match(/^\s*[-*+]\s+/) || line.match(/^\s*\d+\.\s+/)) {
        if (!inList) {
          inList = true;
          listType = line.match(/^\s*\d+\.\s+/) ? 'ol' : 'ul';
          listItems = [];
        }
        
        const content = line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, '');
        const processedContent = this.processInlineElements(content, transformRules);
        
        const liRule = transformRules.get('li') || { element: 'li', attributes: {} };
        const liAttrs = this.attributesToString(liRule.attributes);
        
        listItems.push(`<${liRule.element}${liAttrs}>${processedContent}</${liRule.element}>`);
        continue;
      } else if (inList) {
        // End list
        const listRule = transformRules.get(listType) || { element: listType, attributes: {} };
        const listAttrs = this.attributesToString(listRule.attributes);
        
        htmlLines.push(`<${listRule.element}${listAttrs}>${listItems.join('')}</${listRule.element}>`);
        inList = false;
        listItems = [];
        listType = '';
      }

      // Handle empty lines
      if (line.trim() === '') {
        if (!inList) {
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
    if (inList && listItems.length > 0) {
      const listRule = transformRules.get(listType) || { element: listType, attributes: {} };
      const listAttrs = this.attributesToString(listRule.attributes);
      htmlLines.push(`<${listRule.element}${listAttrs}>${listItems.join('')}</${listRule.element}>`);
    }

    // Close any remaining component block
    if (inComponent && componentContent.trim()) {
      const processedComponent = await this.processComponentWithSlots(componentContent.trim(), componentName, componentAttributes, transformRules);
      htmlLines.push(processedComponent);
    }

    return htmlLines.join('\n');
  }

  /**
   * Process component content with slot support
   * Handles @slotName() and @default() syntax
   */
  async processComponentWithSlots(content, componentName, componentAttributes, transformRules) {
    const slots = this.parseSlots(content);
    const attrs = this.attributesToString(componentAttributes);
    
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

  /**
   * Parse slot syntax from component content
   * Returns object with slot names as keys and content as values
   */
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

  /**
   * Check if a line is part of a table
   */
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

  /**
   * Parse markdown table into HTML table structure with built-in styling
   */
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



  /**
   * Process inline elements (bold, italic, links, inline code)
   */
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

  /**
   * Convert attributes object to HTML attribute string
   */
  attributesToString(attributes) {
    if (!attributes || Object.keys(attributes).length === 0) {
      return '';
    }

    const attrPairs = Object.entries(attributes)
      .map(([key, value]) => `${key}="${this.escapeHtml(value)}"`)
      .join(' ');

    return ` ${attrPairs}`;
  }

  /**
   * Escape HTML characters
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Detect language from file extension
   */
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

  /**
   * Detect language from code content
   */
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

  /**
   * Load theme CSS from URL
   */
  async loadThemeCSS(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load theme CSS: ${url}`);
      return await response.text();
    } catch (error) {
      console.error('Error loading theme CSS:', error);
      return '';
    }
  }

  /**
   * Render code block with syntax highlighting
   */
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
    const focusAttr = attributes['line-focus'] || '';
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
    const bgHslAttr = attributes['bg-hsl'] || 'var(--c2)';
    
    // Generate unique ID for this code block
    const uniqueId = 'code-' + Math.random().toString(36).substr(2, 9);
    
    // Load theme CSS (use default if not specified)
    let themeCSS = '';
    const themeCssAttr = attributes['theme-css'] || './code-syntax.css';
    if (themeCssAttr) {
      const themeCssUrls = themeCssAttr.split(/[\s,]+/).filter(Boolean);
      const themeCssContents = await Promise.all(themeCssUrls.map(url => this.loadThemeCSS(url)));
      themeCSS = themeCssContents.join('\n');
    }
    
    // Component CSS
    const componentCSS = `
      ${themeCSS}
      
      .code-block-${uniqueId} {
        display: flex;
        width: 100%;
        margin-top: calc(var(--space-unit, 0.5rem)*2);
        margin-bottom: calc(var(--space-unit, 0.5rem)*6);
        background-color: hsla(from black h s l / 0.07);
      }
      
      .code-block-${uniqueId} .wrapper {
        display: flex;
        position: relative;
        width: 100%;
        font-family: var(--ff-3, monospace);
        font-size: var(--f-size-p);
        line-height: 1.42;
        background-color: hsla(var(--o-bg, ${bgHslAttr}), .2);
        box-shadow: 0 0 0 1px hsla(var(--o-bg, 0, 0%, 0%), 0.4) inset;
        column-gap: calc(var(--space-unit, 0.5rem)*2);
        padding: calc(var(--space-unit, 0.5rem)*2);
        border-radius: calc(var(--size-unit, 0.5rem)*0.5);
        overflow: auto;
      }
      
      .code-block-${uniqueId} .line-numbers {
        user-select: none;
        text-align: right;
        color: hsla(var(--o-bg, 0 0% 0%), .32);
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
      }
      
      .code-block-${uniqueId} .line-number {
        white-space: pre;
        margin-right: 8px;
        opacity: 0.3;
      }
      
      .code-block-${uniqueId} .code-lines {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: auto;
      }
      
      .code-block-${uniqueId} .code-line {
        white-space: pre;
      }
      
      .code-block-${uniqueId} .focus {
        background: hsla(var(--acc, 180 100% 50%), .2);
      }
      
      .code-block-${uniqueId} button.copy-btn {
        position: absolute;
        top: calc(var(--space-unit, 0.5rem)*2);
        right: calc(var(--space-unit, 0.5rem)*2);
        background: var(--color-bg, hsl(0 0% 100%));
        color: var(--color-o-bg, hsl(0 0% 0%));
        box-shadow: 0 0 0 1px hsla(var(--o-bg, 0, 0%, 0%), 0.4) inset;
        border: none;
        padding: calc(var(--space-unit, 0.5rem)*1/2) calc(var(--space-unit, 0.5rem)*2);
        border-radius: calc(var(--size-unit, 0.5rem)*0.5);
        cursor: pointer;
        font-size: var(--f-size-s);
        font-family: var(--ff-3);
      }
    `;
    
    // Store code in a data attribute with base64 encoding to avoid escaping issues
    const base64Code = btoa(unescape(encodeURIComponent(rawCode)));
    
    // Build the HTML
    const html = `
      <style>${componentCSS}</style>
      <div class="code-block-${uniqueId}">
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
