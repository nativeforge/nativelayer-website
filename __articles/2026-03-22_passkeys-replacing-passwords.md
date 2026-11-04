# Passkeys Are Replacing Passwords: A Technical Deep Dive

Passkeys are shipping in mainstream consumer flows at major platforms: Apple, Google, Microsoft, GitHub, Shopify, PayPal. The password isn't going away this year, but the trajectory is clear. Here's how passkeys actually work under the hood.

## The Problem With Passwords

Passwords fail in three distinct ways:

1. **Phishing**: users are tricked into entering their password on a fake site
2. **Credential stuffing**: leaked password databases from breach A are tried against service B
3. **Server breach**: hashed passwords are brute-forced offline

All three attacks are impossible with passkeys.

## What a Passkey Is

A passkey is a **public/private key pair** generated on your device:

- The **private key** never leaves your device
- The **public key** is registered with the service
- Authentication proves possession of the private key via a cryptographic challenge

```
Registration:
  Your Device                    Server
  ─────────────────              ─────────────────────
  Generate key pair   →          Receive public key
  Store private key              Store public key (database)
  (in secure enclave)

Login:
  Your Device                    Server
  ─────────────────              ─────────────────────
                     ←           Challenge (random bytes)
  Sign challenge                 
  with private key   →           Verify signature
  (biometric unlock)             with stored public key
```

## The WebAuthn API

Passkeys are built on the WebAuthn standard. Here's the registration flow:

```js
// 1. Server sends a challenge
const challenge = await fetchChallengeFromServer();

// 2. Browser creates the credential
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: base64urlDecode(challenge),
    rp: { name: 'My App', id: 'myapp.com' },
    user: {
      id: new Uint8Array([1, 2, 3, 4]), // user ID bytes
      name: 'ada@example.com',
      displayName: 'Ada Lovelace',
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },  // ES256
      { type: 'public-key', alg: -257 } // RS256
    ],
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required', // requires biometric/PIN
    },
  },
});

// 3. Send public key to server
await registerPublicKey(credential);
```

The authentication flow is similar but calls `navigator.credentials.get()` with the server challenge.

## Phishing Resistance

The critical security property: passkeys are **origin-bound**. The `rp.id` is verified by the platform before signing. A passkey registered to `myapp.com` cannot be used on `myapp-phishing.com`. The cryptographic binding to origin is enforced in the secure enclave: the user cannot "accidentally" authenticate to the wrong site.

## Sync vs Device-Bound Passkeys

**Synced passkeys** (iCloud Keychain, Google Password Manager, 1Password) sync across your devices end-to-end encrypted. These are the consumer-facing passkeys most users encounter.

**Device-bound passkeys** (hardware security keys, enterprise authenticators) live on a specific device and don't sync. Higher security, less convenience, used in high-security enterprise scenarios.

## Current Adoption

GitHub, Shopify, Adobe, PayPal, and many others now support passkeys as a primary authentication method. iOS 16+ and Android 9+ support them natively. Windows Hello supports them via the platform authenticator.

The remaining obstacle is account recovery: if you lose all your devices and have no backup codes, recovery flows for passkeys need improvement. This is the active area of work in the FIDO Alliance.

---

*Posted in* **LIVE** · *March 2026*
