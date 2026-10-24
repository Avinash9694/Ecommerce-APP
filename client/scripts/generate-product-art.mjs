// Generates deterministic placeholder artwork for every catalog product and category
// so the storefront never dead-links to a remote image host.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.resolve(here, '../../server/src/seed/catalog.json');
const outProducts = path.resolve(here, '../public/products');
const outCategories = path.resolve(here, '../public/categories');

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));

const PALETTES = {
  audio: { bg: '#eef2ff', bg2: '#e0e7ff', ink: '#312e81', accent: '#6366f1' },
  wearables: { bg: '#ecfeff', bg2: '#cffafe', ink: '#164e63', accent: '#06b6d4' },
  'home-kitchen': { bg: '#fff7ed', bg2: '#ffedd5', ink: '#7c2d12', accent: '#f97316' },
  'bags-travel': { bg: '#f5f5f4', bg2: '#e7e5e4', ink: '#292524', accent: '#78716c' },
  stationery: { bg: '#fefce8', bg2: '#fef9c3', ink: '#713f12', accent: '#eab308' },
  fitness: { bg: '#f0fdf4', bg2: '#dcfce7', ink: '#14532d', accent: '#22c55e' },
};

// Simple silhouettes drawn with primitives, keyed by product slug. Centre is (400, 400).
const SHAPES = {
  'aurora-wireless-headphones': (c) =>
    `<path d="M220 430 a180 180 0 0 1 360 0" fill="none" stroke="${c.ink}" stroke-width="28" stroke-linecap="round"/>
     <rect x="190" y="400" width="90" height="150" rx="36" fill="${c.ink}"/>
     <rect x="520" y="400" width="90" height="150" rx="36" fill="${c.ink}"/>
     <rect x="212" y="425" width="46" height="100" rx="22" fill="${c.accent}"/>
     <rect x="542" y="425" width="46" height="100" rx="22" fill="${c.accent}"/>`,
  'pulse-true-wireless-earbuds': (c) =>
    `<rect x="230" y="300" width="340" height="220" rx="80" fill="${c.ink}" opacity="0.12"/>
     <circle cx="330" cy="380" r="52" fill="${c.ink}"/><rect x="310" y="400" width="40" height="110" rx="20" fill="${c.ink}"/>
     <circle cx="470" cy="380" r="52" fill="${c.ink}"/><rect x="450" y="400" width="40" height="110" rx="20" fill="${c.ink}"/>
     <circle cx="330" cy="380" r="18" fill="${c.accent}"/><circle cx="470" cy="380" r="18" fill="${c.accent}"/>`,
  'echo-portable-speaker': (c) =>
    `<rect x="230" y="260" width="340" height="280" rx="60" fill="${c.ink}"/>
     <circle cx="400" cy="400" r="80" fill="${c.bg}"/><circle cx="400" cy="400" r="40" fill="${c.accent}"/>
     <rect x="300" y="230" width="200" height="34" rx="17" fill="${c.accent}"/>`,
  'studio-desk-microphone': (c) =>
    `<rect x="330" y="200" width="140" height="240" rx="70" fill="${c.ink}"/>
     <rect x="350" y="240" width="100" height="120" rx="20" fill="${c.accent}" opacity="0.8"/>
     <rect x="385" y="440" width="30" height="110" fill="${c.ink}"/>
     <rect x="280" y="550" width="240" height="30" rx="15" fill="${c.ink}"/>`,
  'stride-fitness-band': (c) =>
    `<rect x="340" y="140" width="120" height="520" rx="60" fill="${c.ink}"/>
     <rect x="330" y="300" width="140" height="200" rx="40" fill="${c.accent}"/>
     <rect x="360" y="340" width="80" height="120" rx="16" fill="${c.bg}"/>`,
  'horizon-smartwatch': (c) =>
    `<rect x="360" y="120" width="80" height="560" rx="30" fill="${c.ink}" opacity="0.7"/>
     <rect x="270" y="270" width="260" height="260" rx="70" fill="${c.ink}"/>
     <rect x="300" y="300" width="200" height="200" rx="50" fill="${c.accent}"/>
     <circle cx="400" cy="400" r="60" fill="none" stroke="${c.bg}" stroke-width="12"/>
     <rect x="535" y="360" width="22" height="60" rx="8" fill="${c.ink}"/>`,
  'nimbus-sleep-ring': (c) =>
    `<circle cx="400" cy="400" r="190" fill="none" stroke="${c.ink}" stroke-width="70"/>
     <circle cx="400" cy="400" r="190" fill="none" stroke="${c.accent}" stroke-width="18" stroke-dasharray="40 900" stroke-linecap="round"/>`,
  'trail-gps-watch': (c) =>
    `<rect x="355" y="110" width="90" height="580" rx="30" fill="${c.ink}" opacity="0.7"/>
     <circle cx="400" cy="400" r="160" fill="${c.ink}"/><circle cx="400" cy="400" r="120" fill="${c.accent}"/>
     <path d="M400 320 l40 100 l-40 -25 l-40 25 z" fill="${c.bg}"/>`,
  'ember-pour-over-kettle': (c) =>
    `<path d="M250 520 Q230 300 400 290 Q570 300 550 520 Z" fill="${c.ink}"/>
     <path d="M250 420 Q170 330 150 250" fill="none" stroke="${c.ink}" stroke-width="26" stroke-linecap="round"/>
     <path d="M540 380 Q640 330 620 300" fill="none" stroke="${c.ink}" stroke-width="22" stroke-linecap="round"/>
     <rect x="240" y="520" width="320" height="40" rx="12" fill="${c.accent}"/>
     <circle cx="400" cy="275" r="22" fill="${c.accent}"/>`,
  'terra-ceramic-mug-set': (c) =>
    `<rect x="190" y="300" width="130" height="200" rx="26" fill="${c.ink}"/><path d="M320 350 q60 0 60 50 q0 50 -60 50" fill="none" stroke="${c.ink}" stroke-width="22"/>
     <rect x="440" y="300" width="130" height="200" rx="26" fill="${c.accent}"/><path d="M570 350 q60 0 60 50 q0 50 -60 50" fill="none" stroke="${c.accent}" stroke-width="22"/>`,
  'nordic-cast-iron-pan': (c) =>
    `<circle cx="340" cy="420" r="190" fill="${c.ink}"/><circle cx="340" cy="420" r="150" fill="${c.ink}" opacity="0.7"/>
     <rect x="500" y="400" width="200" height="44" rx="22" fill="${c.ink}"/><circle cx="680" cy="422" r="12" fill="${c.bg}"/>`,
  'lumen-desk-lamp': (c) =>
    `<rect x="250" y="590" width="300" height="30" rx="15" fill="${c.ink}"/>
     <path d="M400 590 L400 420 L300 260" fill="none" stroke="${c.ink}" stroke-width="22" stroke-linecap="round"/>
     <path d="M230 250 L370 250 L410 330 L270 330 Z" fill="${c.ink}"/>
     <ellipse cx="340" cy="332" rx="70" ry="14" fill="${c.accent}"/>`,
  'commuter-laptop-backpack': (c) =>
    `<rect x="250" y="220" width="300" height="400" rx="80" fill="${c.ink}"/>
     <path d="M320 220 q80 -90 160 0" fill="none" stroke="${c.ink}" stroke-width="26"/>
     <rect x="290" y="420" width="220" height="170" rx="40" fill="${c.accent}" opacity="0.9"/>
     <rect x="360" y="400" width="80" height="18" rx="9" fill="${c.bg}"/>`,
  'weekender-duffel': (c) =>
    `<rect x="170" y="330" width="460" height="230" rx="110" fill="${c.ink}"/>
     <path d="M300 330 q100 -140 200 0" fill="none" stroke="${c.ink}" stroke-width="24"/>
     <rect x="300" y="330" width="200" height="230" fill="${c.accent}" opacity="0.5"/>`,
  'slim-card-wallet': (c) =>
    `<rect x="230" y="300" width="340" height="220" rx="34" fill="${c.ink}"/>
     <rect x="230" y="300" width="340" height="80" rx="34" fill="${c.accent}"/>
     <rect x="270" y="420" width="140" height="22" rx="11" fill="${c.bg}" opacity="0.8"/>`,
  'carry-on-hard-shell-suitcase': (c) =>
    `<rect x="270" y="230" width="260" height="380" rx="40" fill="${c.ink}"/>
     <rect x="340" y="170" width="120" height="60" rx="20" fill="none" stroke="${c.ink}" stroke-width="20"/>
     <line x1="400" y1="230" x2="400" y2="610" stroke="${c.accent}" stroke-width="12"/>
     <circle cx="320" cy="625" r="18" fill="${c.ink}"/><circle cx="480" cy="625" r="18" fill="${c.ink}"/>`,
  'linen-hardcover-notebook': (c) =>
    `<rect x="260" y="210" width="280" height="380" rx="20" fill="${c.ink}"/>
     <rect x="280" y="210" width="20" height="380" fill="${c.accent}"/>
     <rect x="440" y="210" width="40" height="110" fill="${c.accent}"/>`,
  'brass-fountain-pen': (c) =>
    `<g transform="rotate(-45 400 400)">
       <rect x="340" y="140" width="120" height="420" rx="40" fill="${c.ink}"/>
       <path d="M360 560 L400 680 L440 560 Z" fill="${c.accent}"/>
       <rect x="350" y="200" width="100" height="24" fill="${c.accent}"/>
     </g>`,
  'desk-organiser-set': (c) =>
    `<rect x="190" y="440" width="260" height="120" rx="18" fill="${c.ink}"/>
     <rect x="230" y="330" width="220" height="100" rx="18" fill="${c.ink}" opacity="0.75"/>
     <rect x="480" y="300" width="130" height="260" rx="24" fill="${c.accent}"/>
     <rect x="500" y="200" width="18" height="140" rx="9" fill="${c.ink}"/><rect x="560" y="180" width="18" height="160" rx="9" fill="${c.ink}"/>`,
  'weekly-planner-2026': (c) =>
    `<rect x="240" y="210" width="320" height="380" rx="24" fill="${c.bg2}" stroke="${c.ink}" stroke-width="14"/>
     <rect x="240" y="210" width="320" height="90" rx="24" fill="${c.ink}"/>
     ${[0, 1, 2].map((r) => [0, 1, 2, 3].map((k) => `<rect x="${275 + k * 70}" y="${330 + r * 80}" width="50" height="50" rx="10" fill="${r === 1 && k === 2 ? c.accent : c.ink}" opacity="${r === 1 && k === 2 ? 1 : 0.18}"/>`).join('')).join('')}`,
  'cork-yoga-mat': (c) =>
    `<rect x="160" y="340" width="480" height="120" rx="60" fill="${c.ink}"/>
     <circle cx="580" cy="400" r="90" fill="${c.accent}"/><circle cx="580" cy="400" r="50" fill="${c.ink}"/><circle cx="580" cy="400" r="18" fill="${c.bg}"/>`,
  'adjustable-dumbbell-pair': (c) =>
    `<rect x="300" y="380" width="200" height="40" rx="20" fill="${c.ink}"/>
     <rect x="200" y="300" width="100" height="200" rx="22" fill="${c.ink}"/><rect x="500" y="300" width="100" height="200" rx="22" fill="${c.ink}"/>
     <rect x="150" y="330" width="60" height="140" rx="18" fill="${c.accent}"/><rect x="590" y="330" width="60" height="140" rx="18" fill="${c.accent}"/>`,
  'resistance-band-set': (c) =>
    `${[0, 1, 2, 3, 4].map((i) => `<path d="M180 ${300 + i * 50} Q400 ${220 + i * 60} 620 ${300 + i * 50}" fill="none" stroke="${i === 2 ? c.accent : c.ink}" stroke-width="22" stroke-linecap="round" opacity="${0.5 + i * 0.12}"/>`).join('')}`,
  'insulated-steel-bottle-1l': (c) =>
    `<rect x="320" y="200" width="160" height="430" rx="50" fill="${c.ink}"/>
     <rect x="350" y="140" width="100" height="70" rx="20" fill="${c.accent}"/>
     <rect x="320" y="330" width="160" height="150" fill="${c.accent}" opacity="0.5"/>`,
};

const CATEGORY_SHAPES = {
  audio: SHAPES['aurora-wireless-headphones'],
  wearables: SHAPES['horizon-smartwatch'],
  'home-kitchen': SHAPES['ember-pour-over-kettle'],
  'bags-travel': SHAPES['commuter-laptop-backpack'],
  stationery: SHAPES['brass-fountain-pen'],
  fitness: SHAPES['cork-yoga-mat'],
};

function svg(palette, body, { variant = 1 } = {}) {
  const angle = variant === 1 ? 135 : 45;
  const dots =
    variant === 2
      ? `<circle cx="140" cy="660" r="90" fill="${palette.accent}" opacity="0.18"/><circle cx="680" cy="150" r="60" fill="${palette.ink}" opacity="0.08"/>`
      : `<rect x="-120" y="560" width="1040" height="400" fill="${palette.ink}" opacity="0.05" transform="rotate(-8 400 760)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img">
  <defs><linearGradient id="g" gradientTransform="rotate(${angle})"><stop offset="0" stop-color="${palette.bg}"/><stop offset="1" stop-color="${palette.bg2}"/></linearGradient></defs>
  <rect width="800" height="800" fill="url(#g)"/>
  ${dots}
  <g transform="${variant === 2 ? 'translate(400 400) scale(0.82) rotate(-6) translate(-400 -400)' : ''}">${body}</g>
</svg>
`;
}

await mkdir(outProducts, { recursive: true });
await mkdir(outCategories, { recursive: true });

for (const product of catalog.products) {
  const palette = PALETTES[product.category];
  const shape = SHAPES[product.slug];
  if (!shape) throw new Error(`No shape for ${product.slug}`);
  await writeFile(
    path.join(outProducts, `${product.slug}-1.svg`),
    svg(palette, shape(palette), { variant: 1 }),
  );
  await writeFile(
    path.join(outProducts, `${product.slug}-2.svg`),
    svg(palette, shape(palette), { variant: 2 }),
  );
}
for (const category of catalog.categories) {
  const palette = PALETTES[category.slug];
  await writeFile(
    path.join(outCategories, `${category.slug}.svg`),
    svg(palette, CATEGORY_SHAPES[category.slug](palette)),
  );
}
console.info(
  `Wrote ${catalog.products.length * 2} product and ${catalog.categories.length} category images`,
);
