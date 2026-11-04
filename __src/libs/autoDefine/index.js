/**
 * @typedef {'pascal' | 'camel' | 'kebab' | 'snake'} NamingConvention
 */

/**
 * @typedef {Object} AutoDefineOptions
 * @property {HTMLElement | string} [root=document.body]
 *   Scope of the DOM to scan for undefined custom elements.
 * @property {string} [path='/components/']
 *   Base path searched for component files. Should be root-relative (e.g. `/components/`)
 *   or an absolute URL. For each discovered tag, the following candidates are tried in order:
 *   1. `{path}/{FileName}.js`
 *   2. `{path}/{tag-name}/{FileName}.js`
 *   3. `{path}/{tag-name}/index.js`
 * @property {NamingConvention | true | NamingConvention[]} [caseConvention='kebab']
 *   How tag names are transformed when constructing file and class names.
 *   - `'kebab'`  — `my-element` → `my-element` (default)
 *   - `'camel'`  — `my-element` → `myElement`
 *   - `'pascal'` — `my-element` → `MyElement`
 *   - `'snake'`  — `my-element` → `my_element`
 *   - `true`     — try `'kebab'`, `'camel'`, `'pascal'`, then `'snake'`
 *   - an array   — try only those conventions, in order
 *   For each convention the three candidate paths are tried before the next
 *   convention. The first module that self-registers or exports a constructor wins.
 * @property {boolean} [observe=false]
 *   Watch for dynamically added custom elements and define them on the fly.
 *   Use `signal` to disconnect the observer when no longer needed.
 * @property {AbortSignal} [signal]
 *   Disconnect the MutationObserver (only relevant when `observe: true`).
 * @property {boolean} [debug=false]
 *   Log resolution attempts and results to the console.
 * @property {string[]} [include]
 *   Only register tags that match one of these names or prefix patterns.
 *   A pattern is an exact tag name (`'native-topbar'`) or a trailing wildcard
 *   (`'native-*'`, meaning the tag starts with `native-`). Matching is
 *   case-insensitive. An empty array registers nothing. Omit to consider every
 *   undefined custom element.
 * @property {string[]} [exclude]
 *   Skip tags that match one of these names or prefix patterns. Same pattern
 *   rules as `include`. Applied after `include`.
 */

/**
 * @typedef {Object} AutoDefineResult
 * @property {string[]} resolved - Tags that were successfully imported and defined.
 * @property {string[]} failed   - Tags that could not be resolved or had no usable export.
 */

/**
 * Scans the DOM for undefined custom elements and automatically imports and
 * registers them via `customElements.define()`.
 *
 * For each discovered tag name, the library constructs a file name using the
 * chosen `naming` convention and attempts to import from up to three candidate
 * paths under `path`. If the imported module self-registers (calls
 * `customElements.define` internally), that is respected. Otherwise the
 * module's default export is used as the constructor.
 *
 * @param {AutoDefineOptions} [options={}]
 * @returns {Promise<AutoDefineResult>}
 *
 * @example
 * // Zero-config: scans document.body, looks in /components/, expects kebab-case files
 * const { resolved, failed } = await autoDefine()
 *
 * @example
 * // Custom path and case-convention, with observer
 * const controller = new AbortController()
 * await autoDefine({ path: '/elements/', caseConvention: 'kebab', observe: true, signal: controller.signal })
 * // later: controller.abort()
 *
 * @example
 * // Only register native-* tags, except native-icon
 * await autoDefine({ include: ['native-*'], exclude: ['native-icon'] })
 *
 * @example
 * // Try kebab, then camel, then pascal, then snake
 * await autoDefine({ caseConvention: true })
 *
 * @example
 * // Try only these conventions, in this order
 * await autoDefine({ caseConvention: ['kebab', 'camel'] })
 */
export async function autoDefine(options = {}) {
  const {
    root = document.body,
    path = '/components/',
    caseConvention,
    observe = false,
    signal,
    debug = false,
    include,
    exclude,
  } = options

  const conventions = resolveConventions(caseConvention)

  const includeMatchers = compileTagPatterns(include, 'include')
  const excludeMatchers = compileTagPatterns(exclude, 'exclude')

  const isSelected = (tag) => {
    if (includeMatchers && !includeMatchers.some((match) => match(tag))) return false
    if (excludeMatchers && excludeMatchers.some((match) => match(tag))) return false
    return true
  }

  if (observe && !signal) {
    console.warn('[autoDefine] observe: true set without a signal — the MutationObserver will never disconnect. Pass an AbortSignal to avoid memory leaks.')
  }

  const basePath = path.endsWith('/') ? path : `${path}/`

  const rootEl =
    typeof root === 'string'
      ? document.querySelector(root)
      : root

  if (!rootEl) {
    throw new Error('[autoDefine] root element not found')
  }

  const getUndefinedTags = () => {
    const seen = new Set()

    for (const el of rootEl.querySelectorAll('*')) {
      const tag = el.tagName.toLowerCase()
      if (tag.includes('-') && !seen.has(tag) && !customElements.get(tag)) {
        seen.add(tag)
      }
    }

    const selected = []
    const skipped = []

    for (const tag of seen) {
      if (isSelected(tag)) selected.push(tag)
      else skipped.push(tag)
    }

    if (debug && skipped.length) {
      console.log('[autoDefine] skipped by include/exclude:', skipped)
    }

    return selected
  }

  const processTag = async (tag) => {
    const expectedNames = conventions.map((convention) => applyNaming(tag, convention))
    let anyImported = false

    for (const fileName of expectedNames) {
      const candidates = [
        `${basePath}${fileName}.js`,
        `${basePath}${tag}/${fileName}.js`,
        `${basePath}${tag}/index.js`,
      ]

      for (const candidate of candidates) {
        try {
          if (debug) console.log(`[autoDefine] <${tag}> trying ${candidate}`)

          const mod = await import(/* @vite-ignore */ candidate)

          anyImported = true

          if (customElements.get(tag)) {
            if (debug) console.log(`[autoDefine] <${tag}> self-registered from ${candidate}`)
            return { tag, status: 'resolved' }
          }

          const Ctor = mod.default ?? mod[fileName]

          if (typeof Ctor === 'function') {
            customElements.define(tag, Ctor)
            if (debug) console.log(`[autoDefine] <${tag}> defined from ${candidate}`)
            return { tag, status: 'resolved' }
          }
        } catch {
          // candidate not found — try next
        }
      }
    }

    if (anyImported) {
      console.warn(`[autoDefine] <${tag}> file(s) found under ${basePath} but no usable export (expected default export or ${describeExpectedExports(expectedNames)})`)
    } else {
      console.warn(`[autoDefine] <${tag}> could not be resolved under ${basePath}`)
    }

    return { tag, status: 'failed' }
  }

  const processTags = async () => {
    const tags = getUndefinedTags()
    if (debug && tags.length) {
      console.log('[autoDefine] discovered undefined custom elements:', tags)
    }
    const results = await Promise.all(tags.map(processTag))
    return {
      resolved: results.filter(r => r.status === 'resolved').map(r => r.tag),
      failed:   results.filter(r => r.status === 'failed').map(r => r.tag),
    }
  }

  const result = await processTags()

  if (observe) {
    const containsCustomElement = (n) =>
      (n.tagName?.includes('-')) ||
      Array.from(n.querySelectorAll?.('*') ?? []).some(el => el.tagName.includes('-'))

    const observer = new MutationObserver(async (mutations) => {
      const hasNew = mutations
        .flatMap(m => Array.from(m.addedNodes).filter(n => n.nodeType === 1))
        .some(containsCustomElement)

      if (hasNew) await processTags()
    })

    observer.observe(rootEl, { childList: true, subtree: true })

    signal?.addEventListener('abort', () => observer.disconnect(), { once: true })
  }

  return result
}

/* -------------------- helpers -------------------- */

/**
 * Transform a kebab-case tag name using the given naming convention.
 *
 * @param {string} tag   - kebab-case custom element tag name
 * @param {NamingConvention} caseConvention
 * @returns {string}
 */
function applyNaming(tag, caseConvention) {
  const parts = tag.split('-')

  switch (caseConvention) {
    case 'pascal':
      return parts.map(capitalize).join('')

    case 'camel':
      return parts[0] + parts.slice(1).map(capitalize).join('')

    case 'kebab':
      return tag

    case 'snake':
      return parts.join('_')

    default:
      throw new Error(`[autoDefine] unknown case-convention: "${caseConvention}"`)
  }
}

/**
 * @param {string} word
 * @returns {string}
 */
function capitalize(word) {
  return word.length ? word[0].toUpperCase() + word.slice(1) : word
}

const ALL_CONVENTIONS = ['kebab', 'camel', 'pascal', 'snake']

/**
 * Conventions to try, in order.
 * Omitted means kebab. `true` means every convention. An array is that list.
 *
 * @param {NamingConvention | true | NamingConvention[] | undefined} caseConvention
 * @returns {NamingConvention[]}
 */
function resolveConventions(caseConvention) {
  if (caseConvention === undefined) return ['kebab']

  if (caseConvention === true) return ALL_CONVENTIONS

  if (typeof caseConvention === 'string') {
    assertKnownConvention(caseConvention)
    return [caseConvention]
  }

  if (!Array.isArray(caseConvention) || caseConvention.some((convention) => typeof convention !== 'string')) {
    throw new Error('[autoDefine] caseConvention must be a naming convention, true, or an array of naming conventions')
  }

  if (caseConvention.length === 0) {
    throw new Error('[autoDefine] caseConvention must list at least one naming convention, or be true')
  }

  const seen = new Set()

  for (const convention of caseConvention) {
    assertKnownConvention(convention)
    if (seen.has(convention)) {
      throw new Error(`[autoDefine] caseConvention lists "${convention}" more than once`)
    }
    seen.add(convention)
  }

  return caseConvention
}

/**
 * @param {string} convention
 */
function assertKnownConvention(convention) {
  if (!ALL_CONVENTIONS.includes(convention)) {
    throw new Error(`[autoDefine] unknown case-convention: "${convention}"`)
  }
}

/**
 * @param {string[]} names
 * @returns {string}
 */
function describeExpectedExports(names) {
  const unique = []

  for (const name of names) {
    if (!unique.includes(name)) unique.push(name)
  }

  const listed = unique.map((name) => `"${name}"`).join(', ')
  const label = unique.length === 1 ? 'named export' : 'named exports'
  return `${label} ${listed}`
}

/**
 * Compile `include` / `exclude` patterns into matchers.
 * Returns `null` when the option is omitted.
 *
 * @param {string[] | undefined} patterns
 * @param {'include' | 'exclude'} optionName
 * @returns {Array<(tag: string) => boolean> | null}
 */
function compileTagPatterns(patterns, optionName) {
  if (patterns == null) return null

  if (!Array.isArray(patterns)) {
    throw new Error(`[autoDefine] ${optionName} must be an array of strings`)
  }

  return patterns.map((pattern) => {
    if (typeof pattern !== 'string') {
      throw new Error(`[autoDefine] ${optionName} must be an array of strings`)
    }

    const normalized = pattern.trim().toLowerCase()

    if (!normalized) {
      throw new Error(`[autoDefine] ${optionName} contains an empty pattern`)
    }

    const star = normalized.indexOf('*')

    if (star !== -1) {
      if (star !== normalized.length - 1) {
        throw new Error(`[autoDefine] ${optionName} pattern "${pattern}" must be an exact tag name or end with a single *`)
      }

      const prefix = normalized.slice(0, -1)

      if (!prefix) {
        throw new Error(`[autoDefine] ${optionName} pattern "*" is too broad — use a prefix such as "native-*"`)
      }

      return (tag) => tag.startsWith(prefix)
    }

    if (!normalized.includes('-')) {
      throw new Error(`[autoDefine] ${optionName} pattern "${pattern}" must be a custom element tag name`)
    }

    return (tag) => tag === normalized
  })
}
