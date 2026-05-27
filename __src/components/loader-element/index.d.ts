// ── loader-element — TypeScript declarations ─────────────────────────────────

export interface LoaderComponentInfo {
  /** Custom element tag name, e.g. `"my-header"` */
  tag: string
}

export interface LoaderDoneDetail {
  /** Total time from `connectedCallback` to all-ready, in milliseconds */
  elapsed: number
  /** Every discovered custom element tag */
  components: LoaderComponentInfo[]
}

/**
 * `<loader-element>` — minimal progress-bar loading overlay custom element.
 *
 * Scans its `app` target for custom elements, auto-defines them via `autoDefine`,
 * waits for every element to resolve its `ready` Promise via `waitForElementsReady`,
 * then animates a progress bar to 100%, sets a reveal attribute on the app container
 * (default: `ready`), fades out, and removes itself from the DOM.
 *
 * The progress bar advances one step per component that dispatches a `ready` event.
 * Each step animates with a CSS transition whose duration is set by `step-duration`.
 *
 * The overlay uses the page's own CSS custom properties (`--bcolor-hsl`, `--fcolor-hsl`,
 * `--ff-2`, `--f-size-2`) for colours and typography, so it automatically matches your
 * site's theme. The bar colour can be overridden via `--ls-green`.
 *
 * **The page must provide CSS** for the hidden/revealed states on the `app` target:
 *
 * ```css
 * main:not([ready]) { opacity: 0; }
 * main[ready]       { opacity: 1; transition: opacity 0.4s ease; }
 * ```
 *
 * @fires loader-done  When all components are ready.
 *
 * @example
 * ```html
 * <loader-element app="main" path="/__src/components/" brand="My App"></loader-element>
 * ```
 */
export declare class loaderElement extends HTMLElement {
  /**
   * CSS selector of the app container to scan and reveal.
   * The loader removes this attribute at startup and sets it again when done.
   * @default 'body'
   * @attr app
   */
  app: string

  /**
   * Name of the boolean attribute set on the `app` target when loading completes.
   * No inline styles are written — use CSS attribute selectors to animate reveal.
   * @default 'ready'
   * @attr reveal-attribute
   */
  'reveal-attribute': string

  /**
   * Base path passed to `autoDefine` for locating component files.
   * @default '/components/'
   * @attr path
   */
  path: string

  /**
   * Naming convention for `autoDefine` file resolution.
   * @default 'kebab'
   * @attr naming
   */
  naming: 'kebab' | 'camel' | 'pascal' | 'snake'

  /**
   * Brand name shown above the progress bar.
   * @default '@nativelayer.dev'
   * @attr brand
   */
  brand: string

  /**
   * URL path to an SVG file used as the brand icon.
   * The SVG is fetched and inlined via `svg-ninja`, so it inherits CSS custom
   * properties from the overlay (e.g. `--fcolor-hsl` for stroke colour).
   * @default '/__src/img/native-lines-logo.svg'
   * @attr svg-icon-url
   */
  'svg-icon-url': string

  /**
   * How long (in milliseconds) the overlay remains visible after reaching 100%,
   * before fading out and removing itself.
   * @default 800
   * @attr show-duration
   */
  'show-duration': number

  /**
   * CSS transition duration (in milliseconds) applied to each progress step.
   * Controls how smoothly the bar fills as each component becomes ready.
   * @default 800
   * @attr step-duration
   */
  'step-duration': number

  connectedCallback(): Promise<void>
}

// ── Global augmentations ───────────────────────────────────────────────────

declare global {
  interface HTMLElementTagNameMap {
    'loader-element': loaderElement
  }

  interface HTMLElementEventMap {
    /**
     * Fired (bubbling + composed) when all components are ready.
     * Dispatched before the `show-duration` delay and overlay fade-out begin.
     */
    'loader-done': CustomEvent<LoaderDoneDetail>
  }
}
