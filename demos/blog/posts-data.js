export const signals = ['live', 'field', 'alert', 'pipeline', 'landscape', 'meta'];

export const signalLabels = {
  live:      'LIVE',
  field:     'FIELD NOTE',
  alert:     'ALERT',
  pipeline:  'PIPELINE',
  landscape: 'LANDSCAPE',
  meta:      'META',
};

export const signalAccent = {
  live:      '--blog-signal-live',
  field:     '--blog-signal-field',
  alert:     '--blog-signal-alert',
  pipeline:  '--blog-signal-pipeline',
  landscape: '--blog-signal-landscape',
  meta:      '--blog-signal-meta',
};

export const topics = [
  'analog',
  'power',
  'digital',
  'bench',
  'rf',
  'passives',
  'microcontrollers',
  'assembly',
  'safety',
];

export const topicLabels = {
  analog:           'Analog',
  power:            'Power',
  digital:          'Digital',
  bench:            'Bench',
  rf:               'RF',
  passives:         'Passives',
  microcontrollers: 'Microcontrollers',
  assembly:         'Assembly',
  safety:           'Safety',
};

export const posts = [
  {
    slug: 'bench-supply-ripple',
    title: 'Bench Supply Ripple Under Load',
    excerpt: 'Why the scope looks clean at the terminals until you clip the probe at the load.',
    signal: 'field',
    topics: ['power', 'bench'],
    date: '2026-06-18',
    readTime: 5,
  },
  {
    slug: 'op-amp-offset-drift',
    title: 'Op-Amp Offset Drift Over Temperature',
    excerpt: 'Trim pots, chopper amps, and when the datasheet offset spec actually matters.',
    signal: 'live',
    topics: ['analog', 'bench'],
    date: '2026-06-14',
    readTime: 6,
  },
  {
    slug: 'ceramic-decoupling-motor',
    title: 'Ceramic Decoupling on a Motor Driver',
    excerpt: 'Placement, ESL, and the spike that disappears when the cap hugs the IC pins.',
    signal: 'live',
    topics: ['passives', 'power'],
    date: '2026-06-10',
    readTime: 5,
  },
  {
    slug: 'scope-probe-compensation',
    title: 'Oscilloscope Probe Compensation',
    excerpt: 'The square wave squiggle test and why 10× probes lie without adjustment.',
    signal: 'field',
    topics: ['bench', 'analog'],
    date: '2026-05-28',
    readTime: 6,
  },
  {
    slug: 'smps-inductor-whine',
    title: 'Switch-Mode Supply Inductor Whine',
    excerpt: 'Mechanical resonance, load steps, and taming audible magnetostriction.',
    signal: 'live',
    topics: ['power', 'analog'],
    date: '2026-04-30',
    readTime: 7,
  },
  {
    slug: 'mosfet-vs-bjt-relay',
    title: 'MOSFET vs BJT for Driving a Relay Coil',
    excerpt: 'Flyback diodes, logic-level FETs, and when a transistor still wins on cost.',
    signal: 'live',
    topics: ['digital', 'power'],
    date: '2026-05-20',
    readTime: 5,
  },
  {
    slug: 'esd-mat-wrist-strap',
    title: 'ESD Mats and Wrist Straps in a Home Lab',
    excerpt: 'Resistance to ground, weekly checks, and why carpet season matters.',
    signal: 'alert',
    topics: ['safety', 'bench'],
    date: '2026-03-15',
    readTime: 6,
  },
  {
    slug: 'hand-soldering-0402',
    title: 'Hand-Soldering 0402 Passives',
    excerpt: 'Tweezers, flux, and a tip size that does not move the part across the pad.',
    signal: 'pipeline',
    topics: ['assembly', 'passives'],
    date: '2026-06-05',
    readTime: 7,
  },
  {
    slug: 'panel-meter-shunt',
    title: 'Panel Meter Shunt Resistor Sizing',
    excerpt: 'Millivolt drops, Kelvin sense, and keeping the shunt off the hot air path.',
    signal: 'live',
    topics: ['analog', 'power'],
    date: '2026-04-12',
    readTime: 5,
  },
  {
    slug: 'two-layer-ground-bounce',
    title: 'Ground Bounce on a Two-Layer Board',
    excerpt: 'Return paths, slotting mistakes, and why the logic analyzer shows ghosts.',
    signal: 'field',
    topics: ['digital', 'assembly'],
    date: '2026-06-01',
    readTime: 6,
  },
  {
    slug: 'lifepo4-cutoff-hysteresis',
    title: 'LiFePO₄ Pack Cutoff Hysteresis',
    excerpt: 'BMS thresholds, recovery voltage, and avoiding chatter at empty.',
    signal: 'landscape',
    topics: ['power', 'safety'],
    date: '2026-05-10',
    readTime: 7,
  },
  {
    slug: 'ntc-inrush-limiter',
    title: 'NTC Thermistor Inrush Limiting',
    excerpt: 'Cold resistance, bypass relays, and when the NTC never cools between cycles.',
    signal: 'live',
    topics: ['passives', 'power'],
    date: '2026-03-22',
    readTime: 8,
  },
  {
    slug: 'ferrite-bead-datasheet',
    title: 'Reading a Ferrite Bead Datasheet',
    excerpt: 'Impedance curves, DC bias derating, and pairing with a real capacitor.',
    signal: 'field',
    topics: ['rf', 'passives'],
    date: '2026-02-18',
    readTime: 6,
  },
  {
    slug: 'to220-heatsink-without-fan',
    title: 'Heat Sinking a TO-220 Without a Fan',
    excerpt: 'θJA vs θJC, ambients in enclosures, and when a bolt torque spec matters.',
    signal: 'landscape',
    topics: ['power', 'bench'],
    date: '2026-06-20',
    readTime: 6,
  },
  {
    slug: 'lc-output-ringing',
    title: 'LC Output Filter Ringing',
    excerpt: 'Damping ratios, load steps on an LC post-filter, and scope probe ground loops.',
    signal: 'pipeline',
    topics: ['analog', 'power'],
    date: '2026-05-05',
    readTime: 7,
  },
  {
    slug: 'contactor-rc-snubber',
    title: 'RC Snubbers Across Contactors',
    excerpt: 'Arc suppression, resistor wattage, and not blasting your PLC input.',
    signal: 'live',
    topics: ['power', 'assembly'],
    date: '2026-06-25',
    readTime: 5,
  },
  {
    slug: 'wire-gauge-5a-dc',
    title: 'Wire Gauge for 5 A DC Bench Runs',
    excerpt: 'IR drop, connector contact rating, and when to fuse near the source.',
    signal: 'live',
    topics: ['power', 'bench'],
    date: '2026-06-22',
    readTime: 5,
  },
  {
    slug: 'star-ground-audio-preamp',
    title: 'Star Grounding for Audio Preamps',
    excerpt: 'Return currents, motorboating hum, and a single tie point that actually helps.',
    signal: 'pipeline',
    topics: ['analog', 'assembly'],
    date: '2026-05-15',
    readTime: 6,
  },
  {
    slug: 'multimeter-calibration-check',
    title: 'Calibrating a Cheap Multimeter',
    excerpt: 'Reference cells, decade boxes, and tracking drift over a year of bench use.',
    signal: 'field',
    topics: ['bench', 'analog'],
    date: '2026-07-02',
    readTime: 6,
  },
  {
    slug: 'mains-snubber-cap-choice',
    title: 'Film vs Ceramic for Mains Snubbers',
    excerpt: 'Class X/Y ratings, self-healing film, and why a random ceramic is a bad bet.',
    signal: 'landscape',
    topics: ['passives', 'safety'],
    date: '2026-07-03',
    readTime: 7,
  },
  {
    slug: 'thermal-pad-linear-regulator',
    title: 'Thermal Pad Thickness for Linear Regulators',
    excerpt: 'Gap fill, compressibility, and reading θJA with and without a pad.',
    signal: 'field',
    topics: ['power', 'assembly'],
    date: '2026-07-04',
    readTime: 6,
  },
  {
    slug: 'isolation-transformer-types',
    title: 'Toroidal vs EI Isolation Transformers',
    excerpt: 'Leakage, shield windings, and bench isolation for scope work.',
    signal: 'field',
    topics: ['power', 'safety'],
    date: '2026-07-16',
    readTime: 8,
  },
  {
    slug: 'bms-passive-balancing',
    title: 'Passive BMS Cell Balancing',
    excerpt: 'Bleed resistors, balance current limits, and state-of-charge spread over months.',
    signal: 'field',
    topics: ['power', 'digital'],
    date: '2026-07-21',
    readTime: 8,
  },
  {
    slug: 'flux-residue-corrosion',
    title: 'Flux Residue and Board Corrosion',
    excerpt: 'No-clean myths, conformal coat over contamination, and white fuzz in the field.',
    signal: 'alert',
    topics: ['assembly', 'safety'],
    date: '2026-07-22',
    readTime: 7,
  },
  {
    slug: 'mcu-brownout-margins',
    title: 'MCU Brownout Reset Margins',
    excerpt: 'BOD levels, slow rail ramp, and flash writes that fail before reset fires.',
    signal: 'meta',
    topics: ['microcontrollers', 'digital'],
    date: '2026-07-21',
    readTime: 7,
  },
  {
    slug: 'bench-fume-extraction',
    title: 'Bench Fume Extraction Basics',
    excerpt: 'Flow rate, filter stages, and positioning the inlet without blasting your iron tip.',
    signal: 'field',
    topics: ['safety', 'bench'],
    date: '2026-07-01',
    readTime: 6,
  },
  {
    slug: 'quartz-load-capacitors',
    title: 'Quartz Crystal Load Capacitors',
    excerpt: 'Pierce oscillators, stray capacitance, and pulling when you pick the wrong pair.',
    signal: 'meta',
    topics: ['rf', 'passives'],
    date: '2026-04-05',
    readTime: 6,
  },
];

export function getPostAccent(post) {
  const token = signalAccent[post.signal]
  return token ? `var(${token})` : 'var(--blog-accent)'
}

export function getPostSignalLabel(post) {
  return signalLabels[post.signal];
}

export function getPostTopicLabels(post) {
  return post.topics.map(t => topicLabels[t]);
}

export function formatTopicsAttr(post) {
  return getPostTopicLabels(post).join('|');
}

/** Default: `{date}_{slug}.md`. Override with optional `post.articleFile`. */
export function getArticleFile(post) {
  if (post.articleFile) return post.articleFile;
  return `${post.date}_${post.slug}.md`;
}

export function getLatestPosts(limit = 3) {
  return [...posts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

/** "JULY 2026" from the newest post date (UTC month to match ISO dates). */
export function getBroadcastLabel() {
  const latest = getLatestPosts(1)[0];
  const iso = latest?.date ?? new Date().toISOString().slice(0, 10);
  const [year, month] = iso.split('-').map(Number);
  const monthName = new Date(Date.UTC(year, month - 1, 1))
    .toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })
    .toUpperCase();
  return `${monthName} ${year}`;
}

export function getPost(slug) {
  return posts.find(p => p.slug === slug) || null;
}

export function getPostsBySignal(signal) {
  return posts.filter(p => p.signal === signal);
}

export function getPostsByTopic(topic) {
  return posts.filter(p => p.topics.includes(topic));
}

export function filterPosts({ signal = null, topic = null } = {}) {
  return posts
    .filter(p => {
      if (signal && p.signal !== signal) return false;
      if (topic && !p.topics.includes(topic)) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}