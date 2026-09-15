// Android presentation adapter for the imported Web styles. Geometry is untouched.
// The approved text/audio bubbles keep their Web finish; the surrounding tools,
// Projects and Groups use the welcome CTA palette instead of legacy pink/cyan.
const palette = ['080610', '0b0816', '19122f', '2b1b5c', '372574', '5137a1', '7960b2', 'd1ced8', 'f3f2f6'];
const approved = new Set([...palette, '4e349f', 'bda3e5', '8162b7']);

function tone(red, green, blue) {
  const values = [red, green, blue].map(value => value / 255);
  const max = Math.max(...values), min = Math.min(...values), delta = max - min;
  const light = (max + min) / 2;
  if (!delta) return null;
  const saturation = delta / (1 - Math.abs(2 * light - 1));
  let hue = max === values[0] ? (values[1] - values[2]) / delta
    : max === values[1] ? (values[2] - values[0]) / delta + 2
      : (values[0] - values[1]) / delta + 4;
  hue = (hue * 60 + 360) % 360;
  // Keep neutral surfaces and semantic red/amber/green status colours.
  if (saturation < .12 || !((hue >= 245 && hue <= 335) || (hue >= 175 && hue <= 205))) return null;
  const index = light < .06 ? 0 : light < .1 ? 1 : light < .15 ? 2 : light < .23 ? 3
    : light < .32 ? 4 : light < .60 ? 5 : light < .74 ? 6 : light < .9 ? 7 : 8;
  return palette[index];
}

function recolour(value) {
  return value.replace(/url\([^)]*\)|#[\da-f]{3,8}\b|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)/gi, colour => {
    if (colour.startsWith('url(')) return colour;
    if (colour.startsWith('#')) {
      let hex = colour.slice(1).toLowerCase();
      if (hex.length === 3 || hex.length === 4) hex = [...hex].map(char => char + char).join('');
      if (hex.length !== 6 && hex.length !== 8) return colour;
      if (approved.has(hex.slice(0, 6))) return colour;
      const replacement = tone(...[0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16)));
      return replacement ? `#${replacement}${hex.slice(6)}` : colour;
    }
    const channels = colour.match(/[\d.]+/g).map(Number);
    const replacement = tone(...channels.slice(0, 3));
    if (!replacement) return colour;
    const rgb = [0, 2, 4].map(offset => parseInt(replacement.slice(offset, offset + 2), 16));
    return channels.length === 4 ? `rgba(${rgb.join(',')},${channels[3]})` : `rgb(${rgb.join(',')})`;
  });
}

export function applyMessagingBrand(css, postcss) {
  const root = postcss.parse(css);
  root.walkRules(rule => {
    if (!/\.(?:mw-|mwp-|agw)/.test(rule.selector)) return;
    if (/mw-(?:bubble|audio-capsule|track-capsule|waveform|message(?:\.|:|\s|$))/.test(rule.selector)) return;
    rule.walkDecls(declaration => {
      if (/^(?:--|color$|background|border|outline|box-shadow$|text-shadow$|fill$|stroke|accent-color$|caret-color$)/.test(declaration.prop)) {
        declaration.value = recolour(declaration.value);
      }
    });
  });
  return root.toString();
}
