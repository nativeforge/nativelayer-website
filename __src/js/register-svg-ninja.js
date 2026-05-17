import svgNinja from '/__src/components/svg-ninja.js';

const TAG = 'svg-ninja';

if (!customElements.get(TAG)) {
  customElements.define(TAG, svgNinja);
}

export default svgNinja;
