/**
 * waitElementsReady
 *
 * @param {HTMLElement | string} target
 * @param {Object} options
 */
export async function waitElementsReady(
  target = document.body,
  options = {}
) {
  const {
    revealClass = "--ready",
    timeout = 4000,
    observeMutations = true,
  } = options;

  const root =
    typeof target === "string"
      ? document.querySelector(target)
      : target;

  if (!root) {
    throw new Error("Target element not found");
  }

  root.classList.remove(revealClass);

  const isCustomElement = (el) =>
    el.tagName.includes("-");

  const getCustomElements = () =>
    Array.from(root.querySelectorAll("*")).filter(isCustomElement);

  const waitForDefinition = (el) =>
    customElements.whenDefined(el.tagName.toLowerCase());

  const waitForReadySignal = async (el) => {
    if (el.ready instanceof Promise) {
      return el.ready;
    }

    if (typeof el.whenReady === "function") {
      return el.whenReady();
    }

    if (el.hasAttribute("ready")) {
      return;
    }

    return Promise.resolve();
  };

  const withTimeout = (promise, label) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout waiting for ${label}`)),
          timeout
        )
      ),
    ]);

  const processElements = async () => {
    const elements = getCustomElements();

    await Promise.all(
      elements.map(async (el) => {
        await withTimeout(waitForDefinition(el), el.tagName);
        await withTimeout(waitForReadySignal(el), el.tagName);
      })
    );
  };

  await processElements();

  if (observeMutations) {
    const observer = new MutationObserver(async (mutations) => {
      const added = mutations.flatMap((m) =>
        Array.from(m.addedNodes).filter(
          (n) => n.nodeType === 1 && isCustomElement(n)
        )
      );

      if (added.length) {
        await processElements();
        root.classList.add(revealClass);
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
    });
  }

  root.classList.add(revealClass);
}