// Static copy of the globe's vinyl loader (meewav-vinyl GlobeLoading/Vinyl),
// rendered by index.html before the feature bundle executes. CSS keyframes
// replace the Web Animations rotor so the disc spins without JavaScript.

const MW_PATH = 'M 12 110 ' +
  'C 26 97, 39 61, 54 36 ' +
  'C 59 28, 63 29, 64 41 ' +
  'L 69 92 ' +
  'C 70 101, 73 102, 78 89 ' +
  'L 104 24 ' +
  'C 109 12, 114 15, 117 29 ' +
  'L 131 99 ' +
  'C 133 108, 136 102, 139 91 ' +
  'L 150 51 ' +
  'C 153 41, 158 43, 159 54 ' +
  'L 165 79 ' +
  'C 168 91, 176 89, 183 80 ' +
  'C 197 62, 208 35, 218 10';

// Same deterministic grooves as meewav-vinyl record-utils.js.
const GROOVE_CIRCLES = Array.from({ length: 220 }, (_, i) => {
  const radius = 190 + i * 1.375;
  const opacity = 0.035 + ((i * 37) % 17) / 240;
  const width = i % 9 === 0 ? 0.8 : 0.45;
  return `<circle cx="500" cy="500" r="${radius.toFixed(3)}" stroke="white" stroke-width="${width}" opacity="${opacity.toFixed(4)}"/>`;
}).join('');

const GROOVE_BANDS = [238, 310, 372, 431, 471].map(r =>
  `<circle cx="500" cy="500" r="${r}" stroke="#030304" stroke-width="3.5" opacity=".8"/>` +
  `<circle cx="500" cy="500" r="${r + 2}" stroke="#838383" stroke-width=".6" opacity=".15"/>`,
).join('');

const STYLE = `<style>
.meewav-feature-loading{position:fixed;inset:0;z-index:10;display:grid;align-content:center;justify-items:center;gap:clamp(24px,4vh,38px);padding:24px;box-sizing:border-box;border:0;border-radius:0;box-shadow:none;background:#05060b;color:#dad7df;color-scheme:dark;--accent:#a675f5}
.meewav-feature-loading__artwork{width:clamp(128px,min(48vw,36vh),280px);aspect-ratio:1;pointer-events:none;border:0;border-radius:0;box-shadow:none;background:transparent}
.meewav-feature-loading .vinyl-shell{position:relative;width:100%;aspect-ratio:1;z-index:1}
.meewav-feature-loading .vinyl-pose{width:100%;height:100%}
.meewav-feature-loading .vinyl{display:block;position:relative;width:100%;height:100%;border:0;border-radius:50%;padding:0;background:#060607;isolation:isolate;box-shadow:10px 20px 22px rgb(0 0 0/50%),20px 39px 52px -15px rgb(0 0 0/45%),1px 3px 3px 2px #070708}
.meewav-feature-loading .vinyl>span{position:absolute;display:block;border-radius:50%;pointer-events:none}
.meewav-feature-loading .vinyl-base{inset:0;background:#070708;box-shadow:inset 1px 1px 1px #5a5a5c,inset -1px -1px 2px #020203}
.meewav-feature-loading .vinyl-rotor{inset:.65%;overflow:hidden;border-radius:50%;animation:meewav-vinyl-turn 1.8s linear infinite;will-change:transform}
.meewav-feature-loading .vinyl-rotor>span{position:absolute;display:block;border-radius:50%}
.meewav-feature-loading .vinyl-microgrooves{inset:0;background:repeating-radial-gradient(circle closest-side at center,transparent 0px,rgb(75 75 77/10%) .45px,#020203 .8px,rgb(31 31 32/38%) 1.25px,#09090a 1.75px,#040405 2.15px),conic-gradient(from -20deg,#0a0a0b,#090909 20%,#111112 40%,#050506 62%,#0e0e0f 83%,#0a0a0b)}
.meewav-feature-loading .vinyl-grooves{position:absolute;inset:0;width:100%;height:100%;opacity:.95}
.meewav-feature-loading .vinyl-runout{inset:31.2%;background:radial-gradient(circle closest-side,#090909 86%,#141414 88%,#050505 89%,#111 91%,#080808 93%,#050505 96%,#202020 97%,#050505 99%);border:1px solid #111;box-shadow:0 0 0 3px #060607,0 0 0 4px rgb(255 255 255/3%)}
.meewav-feature-loading .vinyl-label{inset:31.6%;overflow:hidden;box-shadow:0 1px 1px 1px #050505,0 -1px 1px rgb(255 255 255/10%),1px 2px 4px #000}
.meewav-feature-loading .vinyl-label svg{width:100%;height:100%;display:block}
.meewav-feature-loading .vinyl-specular{inset:.6%;background:conic-gradient(from 0deg,transparent 0deg,transparent 18deg,rgb(241 241 246/4%) 26deg,rgb(234 234 238/16%) 39deg,rgb(239 239 244/30%) 47deg,rgb(220 220 228/19%) 57deg,rgb(175 175 182/7%) 75deg,rgb(240 240 243/17%) 92deg,rgb(231 231 236/9%) 99deg,transparent 112deg,transparent 182deg,rgb(181 181 189/4%) 202deg,rgb(239 239 245/26%) 221deg,rgb(239 239 245/32%) 228deg,rgb(221 221 228/19%) 238deg,rgb(171 171 176/4%) 251deg,transparent 262deg,transparent 286deg,rgb(232 232 238/12%) 302deg,rgb(241 241 243/20%) 312deg,rgb(223 223 228/10%) 324deg,transparent 343deg,transparent 360deg);mask-image:radial-gradient(circle closest-side,transparent 36%,#000 38%,#000 96%,transparent 100%);-webkit-mask-image:radial-gradient(circle closest-side,transparent 36%,#000 38%,#000 96%,transparent 100%);mix-blend-mode:screen}
.meewav-feature-loading .vinyl-hairlines{inset:.7%;opacity:.3;background:repeating-radial-gradient(circle closest-side at center,transparent 0px,transparent 1px,rgb(0 0 0/70%) 1.35px,transparent 1.6px,rgb(255 255 255/14%) 1.9px,transparent 2.15px);mask-image:radial-gradient(circle closest-side,transparent 37%,#000 40%,#000 96%,transparent 99%);-webkit-mask-image:radial-gradient(circle closest-side,transparent 37%,#000 40%,#000 96%,transparent 99%)}
.meewav-feature-loading .vinyl-edge{inset:0;border:1px solid rgb(0 0 0/80%);box-shadow:inset 1px 1px 1px rgb(255 255 255/30%),inset -1px -1px 1px #030303,inset 0 0 0 4px rgb(0 0 0/50%),inset 0 0 0 5px rgb(255 255 255/6%),inset 0 0 0 7px rgb(0 0 0/60%)}
.meewav-feature-loading .vinyl-spindle{width:2.6%;aspect-ratio:1;left:50%;top:50%;transform:translate(-50%,-50%);background:conic-gradient(from 15deg,#c0c0be,#626263 36deg,#414143 79deg,#b9b8b6 144deg,#eeeae3 187deg,#737374 237deg,#b0b0b0 283deg,#f5f4f1 330deg,#c0c0be);border:1px solid #101012;box-shadow:1px 3px 3px #000,0 0 0 2px #0c0c0d,inset 0 0 2px 1px rgb(255 255 255/30%)}
.meewav-feature-loading .vinyl-spindle::after{content:'';position:absolute;inset:10%;border-radius:50%;background:linear-gradient(115deg,rgb(255 255 255/40%),transparent 50%,rgb(0 0 0/30%));filter:blur(.3px)}
.meewav-feature-loading__text{margin:0;font:500 13px/1.5 Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:.035em;text-align:center}
@keyframes meewav-vinyl-turn{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.meewav-feature-loading .vinyl-rotor{animation:none;will-change:auto}}
</style>`;

/** Loader markup injected inside #root; React clears it when the feature mounts. */
export function featureLoadingHtml(label) {
  return `${STYLE}<div class="meewav-feature-loading" role="status" aria-live="polite"><div class="meewav-feature-loading__artwork" aria-hidden="true"><div class="vinyl-shell"><div class="vinyl-pose"><div class="vinyl"><span class="vinyl-base"></span><span class="vinyl-rotor"><span class="vinyl-microgrooves"></span><svg class="vinyl-grooves" viewBox="0 0 1000 1000" aria-hidden="true"><g fill="none">${GROOVE_CIRCLES}${GROOVE_BANDS}</g></svg><span class="vinyl-runout"></span><span class="vinyl-label"><svg viewBox="0 0 400 400" aria-hidden="true"><defs><filter id="meewav-paper-loading" x="0%" y="0%" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch" seed="8"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".18"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/></filter></defs><circle cx="200" cy="200" r="198" fill="#222224"/><circle cx="200" cy="200" r="198" filter="url(#meewav-paper-loading)" opacity=".8"/><circle cx="200" cy="200" r="197" fill="none" stroke="#b4b4b4" stroke-opacity=".13"/><circle cx="200" cy="200" r="142" fill="none" stroke="#000" stroke-opacity=".35"/><circle cx="200" cy="200" r="141" fill="none" stroke="#fff" stroke-opacity=".035"/><path d="${MW_PATH}" transform="translate(118 102) scale(.72)" fill="none" stroke="var(--accent,#a675f5)" stroke-width="10.5" stroke-linecap="round" stroke-linejoin="round"/><text x="202" y="289" fill="#f0edf1" text-anchor="middle" font-family="'Helvetica Neue',Helvetica,Arial,sans-serif" font-weight="300" font-size="36" letter-spacing="3.5">Meewav</text></svg></span></span><span class="vinyl-specular"></span><span class="vinyl-hairlines"></span><span class="vinyl-edge"></span><span class="vinyl-spindle"></span></div></div></div></div><p class="meewav-feature-loading__text">${label}</p></div>`;
}
