import { readyElement } from '/__src/components/ready-element.js';

class baseProfileCard extends readyElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['profile'];
  }

  get username() {
    const val = this.getAttribute('profile') || '';
    return val.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
  }

  connectedCallback() {
    this._render({ state: 'loading' });
    this._fetch();
    this._resolveReady();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) {
      this._render({ state: 'loading' });
      this._fetch();
    }
  }

  async _fetch() {
    const username = this.username;
    if (!username) { this._render({ state: 'error', msg: 'No profile specified.' }); return; }
    try {
      const res = await fetch(`https://api.github.com/users/${username}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      this._render({ state: 'loaded', data });
    } catch (e) {
      this._render({ state: 'error', msg: 'Could not load profile.' });
    }
  }

  _render({ state, data, msg }) {
    this.shadowRoot.innerHTML = `
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :host {
        display: block;
        font-family: var(--ff-2, sans-serif);
        color: hsl(var(--fcolor-hsl));
      }

      .card {
        display: flex;
        flex-direction: column;
        gap: calc(var(--space-unit, 0.5rem) * 3);
        padding: calc(var(--space-unit, 0.5rem) * 4);
        background: hsla(var(--fcolor-hsl) / 0.04);
        border: 1px solid hsla(var(--fcolor-hsl) / 0.12);
        border-radius: calc(var(--space-unit, 0.5rem) * 2);
      }

      /* Loading */
      .state-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 12rem;
        opacity: 0.4;
        font-size: 0.85rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      /* Error */
      .state-error {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 8rem;
        opacity: 0.5;
        font-size: 0.85rem;
      }

      /* Header row */
      .profile-header {
        display: flex;
        align-items: center;
        gap: calc(var(--space-unit, 0.5rem) * 3);
      }

      .avatar-wrap {
        flex-shrink: 0;
        position: relative;
      }

      .avatar {
        width: calc(var(--space-unit, 0.5rem) * 14);
        height: calc(var(--space-unit, 0.5rem) * 14);
        border-radius: 50%;
        display: block;
        object-fit: cover;
        border: 2px solid hsla(var(--fcolor-hsl) / 0.15);
      }

      .profile-meta {
        display: flex;
        flex-direction: column;
        gap: calc(var(--space-unit, 0.5rem) * 0.75);
        min-width: 0;
      }

      .profile-name {
        font-family: var(--ff-1, sans-serif);
        font-size: var(--f-size-2, 1.2rem);
        font-weight: 600;
        color: hsl(var(--fcolor-hsl));
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .profile-login {
        font-family: var(--ff-3, monospace);
        font-size: 0.85rem;
        color: hsla(var(--fcolor-hsl) / 0.5);
      }

      .profile-company {
        font-size: 0.8rem;
        color: hsla(var(--fcolor-hsl) / 0.6);
      }

      /* Bio */
      .profile-bio {
        font-size: var(--f-size-p, 0.9rem);
        line-height: 1.6;
        color: hsla(var(--fcolor-hsl) / 0.75);
        font-weight: 300;
      }

      /* Location & blog */
      .profile-details {
        display: flex;
        flex-wrap: wrap;
        gap: calc(var(--space-unit, 0.5rem) * 1.5);
      }

      .profile-detail {
        display: flex;
        align-items: center;
        gap: calc(var(--space-unit, 0.5rem) * 1);
        font-size: 0.8rem;
        color: hsla(var(--fcolor-hsl) / 0.6);
      }

      .profile-detail svg {
        width: 0.9rem;
        height: 0.9rem;
        flex-shrink: 0;
        opacity: 0.6;
      }

      .profile-detail a {
        color: inherit;
        text-decoration: none;
        transition: color 0.2s ease;
        &:hover { color: hsl(var(--fcolor-hsl)); }
      }

      /* Stats */
      .profile-stats {
        display: flex;
        gap: calc(var(--space-unit, 0.5rem) * 3);
        padding-block: calc(var(--space-unit, 0.5rem) * 2);
        border-top: 1px solid hsla(var(--fcolor-hsl) / 0.08);
        border-bottom: 1px solid hsla(var(--fcolor-hsl) / 0.08);
      }

      .stat {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: calc(var(--space-unit, 0.5rem) * 0.5);
      }

      .stat-value {
        font-family: var(--ff-1, sans-serif);
        font-size: var(--f-size-2, 1.2rem);
        font-weight: 700;
        color: hsl(var(--fcolor-hsl));
      }

      .stat-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: hsla(var(--fcolor-hsl) / 0.45);
      }

      /* Link */
      .profile-link {
        display: inline-flex;
        align-items: center;
        gap: calc(var(--space-unit, 0.5rem) * 1);
        align-self: flex-start;
        font-size: 0.8rem;
        font-family: var(--ff-3, monospace);
        color: hsla(var(--fcolor-hsl) / 0.6);
        text-decoration: none;
        border: 1px solid hsla(var(--fcolor-hsl) / 0.15);
        padding: calc(var(--space-unit, 0.5rem) * 1) calc(var(--space-unit, 0.5rem) * 2);
        border-radius: calc(var(--space-unit, 0.5rem) * 1);
        transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        &:hover {
          color: hsl(var(--fcolor-hsl));
          border-color: hsla(var(--fcolor-hsl) / 0.4);
          background: hsla(var(--fcolor-hsl) / 0.05);
        }
      }

      .profile-link svg {
        width: 0.9rem;
        height: 0.9rem;
        flex-shrink: 0;
      }
    </style>

    ${state === 'loading' ? `
      <div class="card">
        <div class="state-loading">Loading profile…</div>
      </div>
    ` : state === 'error' ? `
      <div class="card">
        <div class="state-error">${msg}</div>
      </div>
    ` : `
      <div class="card">

        <div class="profile-header">
          <div class="avatar-wrap">
            <img class="avatar" src="${data.avatar_url}&s=160" alt="${data.login}" loading="lazy">
          </div>
          <div class="profile-meta">
            <span class="profile-name">${data.name || data.login}</span>
            <span class="profile-login">@${data.login}</span>
            ${data.company ? `<span class="profile-company">${data.company}</span>` : ''}
          </div>
        </div>

        ${data.bio ? `<p class="profile-bio">${data.bio}</p>` : ''}

        ${data.location || data.blog ? `
        <div class="profile-details">
          ${data.location ? `
          <span class="profile-detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            ${data.location}
          </span>` : ''}
          ${data.blog ? `
          <span class="profile-detail">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <a href="${data.blog.startsWith('http') ? data.blog : 'https://' + data.blog}" target="_blank" rel="noopener">${data.blog.replace(/^https?:\/\//, '')}</a>
          </span>` : ''}
        </div>` : ''}

        <div class="profile-stats">
          <div class="stat">
            <span class="stat-value">${data.public_repos}</span>
            <span class="stat-label">Repos</span>
          </div>
          <div class="stat">
            <span class="stat-value">${data.followers}</span>
            <span class="stat-label">Followers</span>
          </div>
          <div class="stat">
            <span class="stat-value">${data.following}</span>
            <span class="stat-label">Following</span>
          </div>
        </div>

        <a class="profile-link" href="${data.html_url}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          View on GitHub
        </a>

      </div>
    `}`;
  }
}

export default baseProfileCard;
