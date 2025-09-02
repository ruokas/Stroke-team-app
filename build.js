import fs from 'fs/promises';
import nunjucks from 'nunjucks';
import postcss from 'postcss';
import cssnano from 'cssnano';
import autoprefixer from 'autoprefixer';

nunjucks.configure('templates', { autoescape: false });

async function buildHtml() {
  const html = nunjucks.render('index.njk');
  await fs.writeFile('index.html', html);
}

async function buildCss() {
  const files = ['css/layout.css', 'css/components.css', 'css/forms.css'];
  const contents = await Promise.all(files.map(f => fs.readFile(f, 'utf8')));
  const result = await postcss([autoprefixer, cssnano]).process(contents.join('\n'), { from: undefined });
  await fs.writeFile('css/style.css', result.css);
}

async function copySw() {
  try {
    await fs.copyFile('src/sw.js', 'sw.js');
  } catch (error) {
    console.error('Failed to copy service worker:', error);
    throw error;
  }
}

async function copyManifest() {
  try {
    await fs.copyFile('src/manifest.json', 'manifest.json');
  } catch (error) {
    console.error('Failed to copy manifest:', error);
    throw error;
  }
}

try {
  await Promise.all([buildHtml(), buildCss(), copySw(), copyManifest()]);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
