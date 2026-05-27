/**
 * How a kebab-case tag name is transformed when constructing file/class names.
 *
 * - `'pascal'` — `my-element` → `MyElement` (default)
 * - `'camel'`  — `my-element` → `myElement`
 * - `'kebab'`  — `my-element` → `my-element` (no change)
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
   * Default: `'pascal'`
   */
  naming?: NamingConvention;

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
}

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
 * @example
 * // Zero-config
 * await autoDefine()
 *
 * @example
 * // Custom path, naming, with observer
 * const controller = new AbortController()
 * await autoDefine({ path: '/elements/', naming: 'kebab', observe: true, signal: controller.signal })
 * // later: controller.abort()
 */
export function autoDefine(options?: AutoDefineOptions): Promise<void>;
