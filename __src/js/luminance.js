const hslToRgb = (h,s,l) => {
  s /= 100
  l /= 100
  const k = n => (n + h/30) % 12
  const a = s * Math.min(l, 1-l)
  const f = n =>
    l - a * Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n),1)))
  return [255*f(0), 255*f(8), 255*f(4)]
}

const luminanceRGB = (r,g,b) =>
  [r,g,b]
    .map(v => ((v/=255) <= .03928 ? v/12.92 : ((v+.055)/1.055) ** 2.4))
    .reduce((a,v,i) => a + v * [.2126,.7152,.0722][i], 0)

const luminanceHex = (hex) => {
  const [r,g,b] = hex.match(/\w\w/g).map(v => parseInt(v, 16))
  return luminanceRGB(r,g,b)
}

const luminanceHSL = (h,s,l) =>
  luminanceRGB(...hslToRgb(h,s,l))

const adjustedHSL = (hslString, { min = 35, max = 80, strength = 1.5, maxShift = 25 } = {}) => {
  const [h, s, l] = hslString.replaceAll('%', '').split(' ').map(Number);
  const lum = luminanceHSL(h, s, l);
  const deviation = lum - 0.5;
  const normalized = Math.abs(deviation) / 0.5;
  const curve = Math.pow(normalized, strength);
  const shift = Math.sign(deviation) * curve * maxShift;
  const adjustedL = Math.max(min, Math.min(max, l - shift)).toFixed(2);
  return `${h} ${s}% ${adjustedL}%`;
}

const processAccentColors = () => {
  document.addEventListener('DOMContentLoaded', ()=> {
    document.querySelectorAll('[accent-color-hsl]').forEach(el => {
      const accentColorHsl = el.getAttribute('accent-color-hsl');
      const luminance = luminanceHSL(...accentColorHsl.replaceAll('%', '').split(' ').map(Number));

      const adjusted = adjustedHSL(accentColorHsl, { min: 35, max: 60, strength: 1, maxShift: 20 });
      console.log(adjusted);
      el.style.setProperty('--accent-color-hsl', accentColorHsl);
      el.style.setProperty('--accent-color-hsl-adjusted', adjusted);

      if(luminance > 0.7){
        el.classList.add('--accent-is-light');
      }
      else if(luminance < 0.1){
        el.classList.add('--accent-is-dark');
      }
      else {
        el.classList.remove('--accent-is-light');
        el.classList.remove('--accent-is-dark');
      }

    });
    
  })
};

export { processAccentColors, adjustedHSL, luminanceHSL }