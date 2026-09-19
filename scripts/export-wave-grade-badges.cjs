// Export the canonical web SVG component, rather than redraw its badges for Android.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const web = process.argv[2];
if (!web) throw new Error('Pass the canonical Meewav-Web directory');
const load = Module.createRequire(path.join(web, 'package.json'));
const ts = load('typescript');
const React = load('react');
const {renderToStaticMarkup} = load('react-dom/server');
const sharp = load('sharp');
require.extensions['.css'] = () => {};
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (mod, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020}
  });
  mod._compile(result.outputText, filename);
};
const {MeewavGradeBadge} = require(path.join(web, 'src/features/grades/MeewavGradeBadge.tsx'));
(async () => {
  for (let level = 1; level <= 6; level++) {
    const html = renderToStaticMarkup(React.createElement(MeewavGradeBadge, {level, variant:'icon'}));
    const svg = html.slice(html.indexOf('<svg'), html.lastIndexOf('</svg>') + 6).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192"');
    await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname, `../app/src/main/res/drawable-nodpi/wave_grade_${level}.png`));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
