/**
 * makeReady(ComponentClass)
 *
 * Injects the readyElement lifecycle contract into any HTMLElement subclass
 * without requiring it to extend readyElement. Works via prototype injection
 * so the existing prototype chain is preserved.
 *
 * Ready resolution strategy (first match wins):
 *
 *   1. Component already has a `ready` Promise (already a readyElement) — no-op.
 *   2. `static readyEvent = 'my-event'` — resolves when that event fires on the instance.
 *   3. `static readyAttribute = 'ready'` — resolves when that attribute appears on the instance.
 *   4. `connectedCallback` returns a Promise (async connectedCallback) — resolves when it settles.
 *   5. Synchronous fallback — resolves immediately after connectedCallback returns.
 *
 * @template {typeof HTMLElement} T
 * @param {T} ComponentClass
 * @returns {T}
 */
export function makeReady(ComponentClass) {
  // 1. Already has the contract — nothing to do.
  if ('ready' in ComponentClass.prototype) return ComponentClass

  // ── Inject `ready` Promise + `_resolveReady` + `isReady` ──────────────────

  Object.defineProperty(ComponentClass.prototype, 'ready', {
    get() {
      if (!this.__readyPromise) {
        this.__readyPromise = new Promise(resolve => {
          this.__resolveReady = resolve
        })
      }
      return this.__readyPromise
    },
    // Support old-style readyElement implementations that assign
    // `this.ready = new Promise(...)` in the constructor (instance property).
    // Without a setter, that assignment throws "has only a getter".
    // Capturing the promise here means our getter returns it correctly
    // and waitForElementsReady can track it without any changes to the
    // component — its own _resolveReady instance method resolves the
    // same promise naturally.
    set(v) {
      this.__readyPromise = v
    },
    configurable: true,
  })

  Object.defineProperty(ComponentClass.prototype, 'isReady', {
    get() { return !!this.__readyResolved },
    configurable: true,
  })

  ComponentClass.prototype._resolveReady = function _resolveReady() {
    if (this.__readyResolved) return
    this.__readyResolved = true
    // Ensure the promise exists before resolving it.
    void this.ready
    requestAnimationFrame(() => {
      this.setAttribute('ready', '')
      this.dispatchEvent(new Event('ready', { bubbles: true, composed: true }))
      this.__resolveReady()
    })
  }

  // ── Wrap connectedCallback ─────────────────────────────────────────────────

  const original = ComponentClass.prototype.connectedCallback

  ComponentClass.prototype.connectedCallback = function connectedCallback() {
    // Strategy 2 — static readyEvent
    const readyEvent = ComponentClass.readyEvent
    if (readyEvent) {
      this.addEventListener(readyEvent, () => this._resolveReady(), { once: true })
      original?.call(this)
      return
    }

    // Strategy 3 — static readyAttribute
    const readyAttr = ComponentClass.readyAttribute
    if (readyAttr) {
      if (this.hasAttribute(readyAttr)) {
        original?.call(this)
        this._resolveReady()
      } else {
        const observer = new MutationObserver(() => {
          if (this.hasAttribute(readyAttr)) {
            observer.disconnect()
            this._resolveReady()
          }
        })
        observer.observe(this, { attributes: true, attributeFilter: [readyAttr] })
        original?.call(this)
      }
      return
    }

    // Strategy 4 — async connectedCallback (returns a Promise)
    // Strategy 5 — synchronous fallback
    const result = original?.call(this)
    if (result instanceof Promise) {
      result.then(() => this._resolveReady())
    } else {
      this._resolveReady()
    }
  }

  return ComponentClass
}
