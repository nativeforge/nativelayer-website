/**
 * `<svg-insert>` — fetches an SVG file and inlines it into the DOM.
 *
 * @element svg-insert
 *
 * @attr {string} src
 *   URL of the SVG file to fetch and inline. Changing this attribute after
 *   connection re-fetches and replaces the SVG.
 *
 * @attr {string} [svg-*]
 *   Any attribute prefixed with `svg-` is forwarded to the injected `<svg>`
 *   element with the prefix stripped.
 *   @example svg-class="icon" → class="icon" on the <svg>
 *   @example svg-aria-hidden="true" → aria-hidden="true" on the <svg>
 *   These attributes are removed from the `<svg-insert>` wrapper after forwarding.
 *
 * @attr {boolean} [keep-parent]
 *   By default the `<svg-insert>` element is replaced in the DOM by the
 *   fetched `<svg>`. When `keep-parent` is present, the `<svg>` is appended
 *   as a child instead and the wrapper element is preserved.
 *
 * @example
 * <!-- basic usage — element is replaced by the <svg> -->
 * <svg-insert src="/icons/logo.svg"></svg-insert>
 *
 * @example
 * <!-- forward attributes onto the <svg> -->
 * <svg-insert src="/icons/logo.svg" svg-class="icon" svg-aria-hidden="true"></svg-insert>
 *
 * @example
 * <!-- keep the wrapper element -->
 * <svg-insert src="/icons/logo.svg" keep-parent></svg-insert>
 */
export declare class svgInsert extends HTMLElement {
  /**
   * The fetched and injected `<svg>` element.
   * `null` until the first successful fetch.
   */
  readonly _svg: SVGSVGElement | null;
}
