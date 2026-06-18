// ── monitor-loading — type definitions ──────────────────────────────────────

/** Detail payload shared by both events. */
export interface MonitorLoadingEventDetail {
  /** Total elapsed time in milliseconds from start to all-ready. */
  elapsed: number
  /** Components that were tracked. */
  components: MonitorLoadingComponentInfo[]
}

/** Per-component entry in the event detail. */
export interface MonitorLoadingComponentInfo {
  /** The hyphenated tag name (e.g. `"top-bar"`). */
  tag: string
  /** The tag wrapped in angle brackets (e.g. `"<top-bar>"`). Monitor mode only. */
  label?: string
  /** Whether the component resolved its `ready` promise. Monitor mode only. */
  ready?: boolean
  /** Whether the component was patched with `makeReady`. Monitor mode only. */
  patched?: boolean
  /** Time in ms when the component became ready, relative to start. Monitor mode only. */
  time?: number | null
}

/**
 * `<monitor-loading>` — unified loading overlay Custom Element.
 *
 * Without the `monitor` attribute: renders a minimal progress bar.
 * With the `monitor` attribute: renders a verbose component list with
 * status dots, ready times, and makeReady patch badges.
 *
 * Both modes:
 * - Wrap `customElements.define` to patch every component class with
 *   `makeReady` before registration.
 * - Use `autoDefine` to auto-import all custom elements found in the target.
 * - Use `waitForElementsReady` to wait for every component to resolve.
 * - Set `--show-duration-delay` on `:root` for reveal animations.
 * - Fade out and remove themselves from the DOM when done.
 *
 * @fires loader-done            - Progress-bar mode (no `monitor` attribute).
 * @fires monitor-done - Monitor mode (`monitor` attribute present).
 *
 * @example
 * // Progress-bar mode
 * <monitor-loading target="body" path="/__src/components/" brand="My App"></monitor-loading>
 *
 * @example
 * // Monitor mode
 * <monitor-loading monitor target="body" path="/__src/components/"></monitor-loading>
 */
declare class MonitorLoading extends HTMLElement {
  /**
   * CSS selector for the element to reveal when all components are ready.
   * @default 'body'
   */
  target: string

  /**
   * Components directory path passed to `autoDefine`.
   * @default '/__src/components/'
   */
  path: string

  /**
   * Naming convention for `autoDefine` (e.g. `'kebab'`, `'pascal'`).
   * @default 'kebab'
   */
  'case-convention': string

  /**
   * Brand name displayed in the overlay header.
   * @default '@nativelayer.dev'
   */
  brand: string

  /**
   * URL of the SVG used as the brand icon.
   * @default '/__src/img/native-lines-logo.svg'
   */
  'svg-icon-url': string

  /**
   * HTML attribute set on the target element when all components are ready.
   * @default 'ready'
   */
  'reveal-attribute': string

  /**
   * Milliseconds to keep the overlay visible after all components are ready,
   * before beginning the fade-out.
   * @default 800 (progress-bar mode) | 0 (monitor mode)
   */
  'show-duration': number

  /**
   * CSS transition duration in milliseconds for each progress bar step.
   * Progress-bar mode only.
   * @default 800
   */
  'step-duration': number

  /**
   * Duration in milliseconds of the overlay fade-out transition.
   * Also added to `--show-duration-delay` on `:root`.
   * @default 640
   */
  'overlay-fade': number

  /**
   * Boolean attribute. When present, switches to verbose monitor mode:
   * shows a component list with status dots, ready times, and patch badges.
   * When absent, shows a minimal progress bar.
   */
  monitor: boolean

  /** @internal */
  connectedCallback(): Promise<void>
}

export type { MonitorLoading }
export default MonitorLoading
