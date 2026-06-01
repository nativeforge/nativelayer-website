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
    ],
  },
  chapters: [],
  
});

export { state };