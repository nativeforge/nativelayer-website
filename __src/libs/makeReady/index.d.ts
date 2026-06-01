/**
 * Injects the readyElement lifecycle contract into any HTMLElement subclass
 * via prototype injection, without altering the existing prototype chain.
 *
 * After calling `makeReady`, the class gains:
 * - `el.ready` — a Promise that resolves once the element is functional
 * - `el.isReady` — boolean, true after ready has resolved
 * - `el._resolveReady()` — call this manually when using `readyEvent` / `readyAttribute` strategies
 *
 * Ready resolution strategy (first match wins):
 * 1. Class already has `ready` on its prototype — no-op
 * 2. `static readyEvent` — resolves when that custom event fires on the instance
 * 3. `static readyAttribute` — resolves when that attribute appears on the instance
 * 4. `connectedCallback` returns a Promise — resolves when it settles
 * 5. Synchronous fallback — resolves immediately after `connectedCallback`
 */
export function makeReady<T extends typeof HTMLElement>(ComponentClass: T): T;
