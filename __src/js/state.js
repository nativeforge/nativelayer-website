import { restate } from '/__src/libs/restate/restate.esm.min.js';

const state = restate({
  nav: {
    docs: [
      { name: 'routerx', themeColorHsl: '348 100% 50%'},
      { name: 'restate', themeColorHsl: '220 100% 50%'},
      { name: 'reflectx', themeColorHsl: '130 100% 50%'},
      { name: 're-md', themeColorHsl: '255 75% 50%'},
      { name: 'manifesto', themeColorHsl: '50 100% 60%'},
      { name: 'doc-quick', themeColorHsl: '18 100% 50%'},
      { name: 'svg-insert', themeColorHsl: '0 0% 40%'},
      { name: 'monitor-loading', themeColorHsl: '0 0% 40%'},
      { name: 'ready-element', themeColorHsl: '0 0% 40%'},
      { name: 'auto-define', themeColorHsl: '0 0% 40%'},
      { name: 'wait-for-elements-ready', themeColorHsl: '0 0% 40%'},
      { name: 'make-ready', themeColorHsl: '0 0% 40%'},
    ],
  },
  chapters: [],
  
});

export { state };