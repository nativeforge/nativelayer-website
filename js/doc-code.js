const hljs = (await import('https://esm.sh/highlight.js@11.9.0')).default

/**
 * doc-code: Intelligent code highlighting component
 * 
 * Auto-detects language from:
 * 1. Markdown code block language (```javascript)
 * 2. File extension (.js, .css, .py, etc.)
 * 3. Code content patterns (function, class, etc.)
 * 4. Falls back to plaintext
 * 
 * Attributes:
 * - src: External file path
 * - theme-css: CSS theme URLs
 * - line-focus: Highlight specific lines
 * 
 * No lang attribute needed - fully auto-detected!
 */
export class docCode extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    
    // Read and parse attributes in constructor
    this.themeCssAttr = this.getAttribute('theme-css') || ''
    this.focusAttr = this.getAttribute('line-focus') || ''
    this.bgHslAttr = this.getAttribute('bg-hsl') || 'var(--c2)'
    this.srcAttr = this.getAttribute('src')
    
    // Parse focus lines
    this.focusLines = this.focusAttr
      .split(/[\s,]+/)
      .map(n => parseInt(n, 10))
      .filter(n => !isNaN(n))
  }

  // Helper method to load theme CSS
  async loadThemeCSS() {
    if (!this.themeCssAttr) return
    
    const urls = this.themeCssAttr.split(/[\s,]+/).filter(Boolean)
    const sheets = await Promise.all(urls.map(async url => {
      const resp = await fetch(url)
      const css  = await resp.text()
      const sheet = new CSSStyleSheet()
      sheet.replaceSync(css)
      return sheet
    }))
    // adopt theme sheets
    this.shadowRoot.adoptedStyleSheets = sheets
  }

  // Helper method to detect language from file extension
  detectLangFromExtension(filename) {
      const ext = filename.split('.').pop()?.toLowerCase()
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
      }
      return extensionMap[ext] || null
  }

  // Helper method to detect language from code content
  detectLangFromContent(code) {
      const trimmedCode = code.trim()
      
      // Environment variables pattern
      if (/^[A-Z_]+=.+$/m.test(trimmedCode)) {
        return 'properties'
      }
      
      // JavaScript/TypeScript patterns
      if (/^(import\s|export\s|const\s|let\s|var\s|function\s|class\s|interface\s|type\s)/m.test(trimmedCode)) {
        return /^(import.*from|export.*from|interface\s|type\s)/m.test(trimmedCode) ? 'typescript' : 'javascript'
      }
      
      // Python patterns
      if (/^(def\s|class\s|import\s|from\s.*import|if\s.*:|for\s.*:|while\s.*:)/m.test(trimmedCode)) {
        return 'python'
      }
      
      // CSS patterns
      if (/^[.#]?\w+\s*\{[\s\S]*\}/.test(trimmedCode) || /^@(media|import|keyframes)/.test(trimmedCode)) {
        return 'css'
      }
      
      // HTML patterns
      if (/^<(!DOCTYPE|html|head|body|div|span|p|h[1-6]|a|img)/i.test(trimmedCode)) {
        return 'html'
      }
      
      // JSON patterns
      if (/^[\s]*[{\[]/.test(trimmedCode) && /[}\]][\s]*$/.test(trimmedCode)) {
        try {
          JSON.parse(trimmedCode)
          return 'json'
        } catch (e) {
          // Not valid JSON
        }
      }
      
      // SQL patterns
      if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s/i.test(trimmedCode)) {
        return 'sql'
      }
      
      return null
  }

  async connectedCallback() {
    // Load theme CSS
    await this.loadThemeCSS()

    // get raw markdown from external .md file (src attr) or content
    const content = this.textContent.trim()
    let rawCode = ''
    let detectedLang = null

    if (this.srcAttr) {
      // Load from external file
      const resp = await fetch(this.srcAttr)
      if (!resp.ok) throw new Error(`Failed to fetch ${this.srcAttr}`)
      rawCode = await resp.text()
      const lines = rawCode.split(/\r?\n/)
      if (lines[0].startsWith('```')) lines.shift()
      if (lines[lines.length - 1].startsWith('```')) lines.pop()
      rawCode = lines.join('\n').trim()
      
      // Auto-detect language: 1) file extension, 2) content analysis, 3) fallback to plaintext
      detectedLang = this.detectLangFromExtension(this.srcAttr) || this.detectLangFromContent(rawCode) || 'plaintext'
    } 
    else if (content) {
      // Parse content as markdown code block
      const codeBlockMatch = content.match(/^```(\w+)?\s*\r?\n([\s\S]*?)\r?\n```\s*$/m)
      
      if (codeBlockMatch) {
        // Content is a proper markdown code block
        detectedLang = codeBlockMatch[1] || this.detectLangFromContent(codeBlockMatch[2]) || 'plaintext'
        rawCode = codeBlockMatch[2]
      } else {
        // Check if content starts and ends with ``` (more flexible)
        const flexibleMatch = content.match(/^```(\w+)?\s*([\s\S]*?)```\s*$/m)
        if (flexibleMatch) {
          detectedLang = flexibleMatch[1] || this.detectLangFromContent(flexibleMatch[2]) || 'plaintext'
          rawCode = flexibleMatch[2].trim()
        } else {
          // Content is plain code without markdown wrapper
          rawCode = content
          detectedLang = this.detectLangFromContent(rawCode) || 'plaintext'
        }
      }
    } 
    else {
      // No src attribute and no content
      throw new Error("no 'src' attribute nor content")
    }

    // Map env to properties for highlighting
    if (detectedLang === 'env') detectedLang = 'properties';
    
    // highlight
    const hl = hljs.highlight(rawCode, { language: detectedLang }).value

    // split into lines
    const rawLines = rawCode.split('\n')
    const hlLines  = hl.split('\n')

    // build HTML
    const lineNumbers = rawLines
      .map((_, i) => `<div class="line-number">${i+1}</div>`)
      .join('')

    const codeLines = hlLines
      .map((line, i) => {
        const n   = i + 1
        const cls = this.focusLines.includes(n) ? 'code-line focus' : 'code-line'
        return `<div class="${cls}">${line || '&#8203;'}</div>`
      })
      .join('')

    // component styles (inline)
    const componentCSS = `
      :host {
        display: flex;
        width: 100%;
        margin-top: calc(var(--space-unit, 0.5rem)*2);
        margin-bottom: calc(var(--space-unit, 0.5rem)*6);
        width: 100%;
        background-color: hsla(from black h s l / 0.07);
      }
        
      .wrapper {
        display: flex;
        position: relative;
        width: 100%;
        font-family: var(--ff-3, monospace);
        font-size: var(--f-size-p);
        line-height: 1.42;
        background-color: hsla(var(--o-bg,${this.bgHslAttr}), .2);
        box-shadow: 0 0 0 1px hsla(var(--o-bg, 0, 0%, 0%), 0.4) inset;
        column-gap: calc(var(--space-unit, 0.5rem)*2);
        padding: calc(var(--space-unit, 0.5rem)*2);
        border-radius: calc(var(--size-unit, 0.5rem)*0.5);
        overflow: auto;
      }
      .line-numbers {
        user-select: none;
        text-align: right;
        color: hsla(var(--o-bg, 0 0% 0%), .32);
        display: flex;
        flex-direction: column;
        margin: 0; padding: 0;
      }
      .line-number { white-space: pre; margin-right: 8px; opacity: 0.3;}
      .code-lines {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: auto;
      }
      .code-line { white-space: pre; }
      .focus { background: hsla(var(--acc, 180 100% 50%), .2); }
      :host-context(.--mode-dark) .focus { background: hsla(var(--acc, 180 100% 50%), .1); }
      
      button.copy-btn {
        position: absolute;
        top: calc(var(--space-unit, 0.5rem)*2);
        right: calc(var(--space-unit, 0.5rem)*2);
        background: var(--o-bg, hsl(from hsl( 0 0% 0%) h s l) );
        color: var(--color-o-bg, 0 0% 0%);
        background: var(--color-bg, 0 0% 100%);
        box-shadow: 0 0 0 1px hsla(var(--o-bg, 0, 0%, 0%), 0.4) inset;
        border: none;
        padding: calc(var(--space-unit, 0.5rem)*1/2) calc(var(--space-unit, 0.5rem) *2);
        border-radius: calc(var(--size-unit, 0.5rem)* 0.5);
        cursor: pointer;
        font-size: var(--f-size-s);
        font-family: var(--ff-3);
      }
    `

    // attach styles + content
    this.shadowRoot.innerHTML = `
      <style>${componentCSS}</style>
      <div class="wrapper">
        <div class="line-numbers">${lineNumbers}</div>
        <div class="code-lines">${codeLines}</div>
        <button class="copy-btn">copy</button>
      </div>
    `

    // copy button
    const btn = this.shadowRoot.querySelector('.copy-btn')
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(rawCode)
      btn.textContent = 'copied!'
      setTimeout(() => btn.textContent = 'copy', 2400)
    })
  }
}

export default docCode
