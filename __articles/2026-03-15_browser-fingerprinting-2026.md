# How Browsers Identify You Without Cookies

Browser fingerprinting has become the tracking method of choice as third-party cookies are deprecated. Understanding how it works, and what browsers are doing about it, is increasingly important for both developers and privacy-conscious users.

## What Is Browser Fingerprinting?

A browser fingerprint is a composite identifier built from properties that rarely change between sessions:

- User agent string (OS, browser version, architecture)
- Screen resolution and color depth
- Timezone and locale
- Installed fonts (enumerated via Canvas or CSS)
- WebGL renderer information (GPU model, driver)
- Audio context fingerprint (floating-point rounding differences per hardware)
- Canvas rendering fingerprint (anti-aliasing, font rendering)

Each property is unremarkable alone. Combined, they form an identifier unique enough to re-identify ~95% of users across sessions.

## The Canvas Fingerprint

The most reliable vector:

```js
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

ctx.textBaseline = 'top';
ctx.font = '14px Arial';
ctx.fillText('Browser fingerprint test 🌐', 2, 2);

const fingerprint = canvas.toDataURL();
// This string differs per OS, GPU, and font rendering engine
```

Two computers with identical hardware configurations may still differ due to GPU driver versions, OS-level text rendering settings, and subpixel hinting.

## WebGL Fingerprinting

```js
const gl = canvas.getContext('webgl');
const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
// "NVIDIA Corporation" + "GeForce RTX 4080/PCIe/SSE2"
```

This exposes the exact GPU model: a highly stable, hardware-level identifier.

## What Browsers Are Doing

**Firefox** has enabled fingerprinting protection that adds noise to Canvas and WebGL outputs. The `privacy.resistFingerprinting` setting has been in Nightly for years; the `privacy.fingerprintingProtection` setting is now available in standard Firefox.

**Brave** randomizes fingerprints per session and per site origin, making cross-site tracking via fingerprint ineffective even when the fingerprint itself is reproducible.

**Chrome** has limited response: it masks the `WEBGL_debug_renderer_info` renderer string by default since 2023, but canvas fingerprinting remains largely unaddressed.

**Safari** aggressively limits the data available to JavaScript: simplified user-agent strings, limited font access, and approximate canvas rendering output.

## The Entropy Arms Race

Fingerprinting libraries (FingerprintJS, ClientJS) continuously evolve to use higher-entropy sources:

- Battery API (partially mitigated by restrictions)
- Performance timing jitter
- CSS media feature combinations
- Speech synthesis voice list
- Intersection Observer timing

As browsers close one vector, the library ecosystem finds new ones.

## What Developers Should Know

If you're integrating third-party scripts, many analytics and fraud-detection SDKs fingerprint passively. Audit what you include. Tools like Privacy Badger and uBlock Origin in Element Zapper mode can show you what data leaves the page.

---

*Posted in* **ALERT** · *March 2026*
