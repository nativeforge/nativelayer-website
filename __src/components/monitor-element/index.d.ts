// ── monitor-element — TypeScript declarations ────────────────────────────────

export interface ComponentInfo {
  /** Custom element tag name, e.g. `"my-header"` */
  tag: string
  /** Display label shown in the monitor, e.g. `"<my-header>"` */
  label: string
  /** Whether the component has resolved its `ready` Promise */
  ready: boolean
  /** Elapsed ms when the component became ready, or `null` if still waiting */
  time: number | null
}

export interface MonitorDoneDetail {
  /** Total time from `connectedCallback` to all-ready, in milliseconds */
  elapsed: number
  /** Final state of every discovered component */
  components: ComponentInfo[]
}

/**
 * `<monitor-element>` — self-contained loading overlay custom element.
 *
 * Scans its `app` target for custom elements, auto-defines them via `autoDefine`,
 * waits for every element to resolve its `ready` Promise via `waitForElementsReady`,
 * then sets a reveal attribute on the app container (default: `ready`), fades out,
 * and removes itself from the DOM.
 *
 * The overlay uses the page's own CSS custom properties (`--bcolor-hsl`, `--fcolor-hsl`,
 * `--accent-color-hsl`, `--ff-2`, `--ff-3`, `--space-unit`) for colours and typography,
 * so it automatically matches your site's theme. Two overlay-specific properties can
 * be overridden: `--ls-green` (ready dot / text colour) and `--ls-muted` (inactive text).
 *
 * **The page must provide CSS** for the hidden/revealed states on the `app` target:
 *
 * ```css
 * main:not([ready]) { opacity: 0; transform: translateY(1rem); }
 * main[ready]       { opacity: 1; transform: translateY(0); transition: opacity 0.4s ease, transform 0.4s ease; }
 * ```
 *
 * @fires monitor-done  When all components are ready.
 *
 * @example
 * ```html
 * <monitor-element app="main" path="/__src/components/" brand="My App"></monitor-element>
 * ```
 */
export declare class monitorElement extends HTMLElement {
  /**
   * CSS selector of the app container to scan and reveal.
   * The monitor removes this attribute at startup and sets it again when done.
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
   * Brand name shown in the monitor header.
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
   * How long (in milliseconds) the overlay remains visible after all components
   * are ready, before fading out and removing itself.
   * @default 800
   * @attr show-duration
   */
  'show-duration': number

  connectedCallback(): Promise<void>
}

// ── Global augmentations ───────────────────────────────────────────────────

declare global {
  interface HTMLElementTagNameMap {
    'monitor-element': monitorElement
  }

  interface HTMLElementEventMap {
    /**
     * Fired (bubbling + composed) when all components are ready.
     * Dispatched before the `show-duration` delay and overlay fade-out begin.
     */
    'monitor-done': CustomEvent<MonitorDoneDetail>
  }
}
