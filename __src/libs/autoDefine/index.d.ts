/**
 * How a kebab-case tag name is transformed when constructing file/class names.
 *
 * - `'kebab'`  — `my-element` → `my-element` (default)
 * - `'camel'`  — `my-element` → `myElement`
 * - `'pascal'` — `my-element` → `MyElement`
 * - `'snake'`  — `my-element` → `my_element`
 */
export type NamingConvention = 'pascal' | 'camel' | 'kebab' | 'snake';

export interface AutoDefineOptions {
  /**
   * Scope of the DOM to scan for undefined custom elements.
   * Accepts an `HTMLElement` or a CSS selector string.
   * Default: `document.body`
   */
  root?: HTMLElement | string;

  /**
   * Base path searched for component files. Should be root-relative
   * (e.g. `'/components/'`) or an absolute URL.
   *
   * For each discovered tag, the following candidates are tried in order:
   * 1. `{path}/{FileName}.js`
   * 2. `{path}/{tag-name}/{FileName}.js`
   * 3. `{path}/{tag-name}/index.js`
   *
   * Default: `'/components/'`
   */
  path?: string;

  /**
   * How tag names are transformed when constructing file and class names.
   *
   * - A convention name tries that convention only. Default: `'kebab'`.
   * - `true` tries `'kebab'`, `'camel'`, `'pascal'`, then `'snake'`.
   * - An array tries only those conventions, in order.
   *
   * For each convention, the three candidate paths are tried before the next
   * convention. The first module that self-registers or exports a constructor wins.
   */
  caseConvention?: NamingConvention | true | NamingConvention[];

  /**
   * Watch for dynamically added custom elements and define them on the fly.
   * Use `signal` to disconnect the observer when no longer needed.
   * Default: `false`
   */
  observe?: boolean;

  /**
   * Provide an `AbortSignal` to disconnect the MutationObserver
   * (only relevant when `observe: true`).
   */
  signal?: AbortSignal;

  /**
   * Log resolution attempts and results to the console.
   * Default: `false`
   */
  debug?: boolean;

  /**
   * Only register tags that match one of these names or prefix patterns.
   * A pattern is an exact tag name (`'native-topbar'`) or a trailing wildcard
   * (`'native-*'`, meaning the tag starts with `native-`). Matching is
   * case-insensitive. An empty array registers nothing. Omit to consider every
   * undefined custom element.
   *
   * When `exclude` is also set, a tag must match `include` and miss `exclude`.
   */
  include?: string[];

  /**
   * Skip tags that match one of these names or prefix patterns.
   * Same pattern rules as `include`. Applied after `include`.
   */
  exclude?: string[];
}

/**
 * Result returned by `autoDefine`.
 */
export interface AutoDefineResult {
  /** Tags that were successfully imported and registered. */
  resolved: string[];
  /** Tags that could not be resolved or had no usable export. */
  failed: string[];
}

/**
 * Scans the DOM for undefined custom elements and automatically imports and
 * registers them via `customElements.define()`.
 *
 * For each discovered tag name, the library constructs a file name using the
 * chosen `caseConvention` and attempts to import from up to three candidate
 * paths under `path`. If the imported module self-registers (calls
 * `customElements.define` internally), that is respected. Otherwise the
 * module's default export is used as the constructor.
 *
 * @example
 * // Zero-config
 * const { resolved, failed } = await autoDefine()
 *
 * @example
 * // Custom path, case-convention, with observer
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
export function autoDefine(options?: AutoDefineOptions): Promise<AutoDefineResult>;
