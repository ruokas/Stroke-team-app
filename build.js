import fs from 'fs/promises';
import path from 'node:path';
import nunjucks from 'nunjucks';
import postcss from 'postcss';
import cssnano from 'cssnano';
import autoprefixer from 'autoprefixer';
import { bpMeds } from './js/bpMeds.js';
import { loadEnvConfig } from './build/envConfig.js';

const envConfig = loadEnvConfig();
const envConfigJson = JSON.stringify(envConfig);
const outDir = 'public';

nunjucks.configure('templates', { autoescape: false });

async function buildHtml() {
  const html = nunjucks.render('index.njk', {
    bpMeds,
    envConfig,
    envConfigJson,
  });
  await fs.writeFile(path.join(outDir, 'index.html'), html);
}

async function buildCss() {
  const files = ['css/layout.css', 'css/components.css', 'css/forms.css'];
  const contents = await Promise.all(files.map(f => fs.readFile(f, 'utf8')));
  const result = await postcss([autoprefixer, cssnano]).process(contents.join('\n'), { from: undefined });
  await fs.mkdir(path.join(outDir, 'css'), { recursive: true });
  await fs.writeFile(path.join(outDir, 'css', 'style.css'), result.css);
}

async function copySw() {
  try {
    await fs.copyFile('src/sw.js', path.join(outDir, 'sw.js'));
  } catch (error) {
    console.error('Failed to copy service worker:', error);
    throw error;
  }
}

async function copyManifest() {
  try {
    await fs.copyFile('src/manifest.json', path.join(outDir, 'manifest.json'));
  } catch (error) {
    console.error('Failed to copy manifest:', error);
    throw error;
  }
}

async function copyStaticDirs() {
  await Promise.all([
    fs.cp('css', path.join(outDir, 'css'), { recursive: true }),
    fs.cp('js', path.join(outDir, 'js'), { recursive: true }),
    fs.cp('icons', path.join(outDir, 'icons'), { recursive: true }),
    fs.cp('locales', path.join(outDir, 'locales'), { recursive: true }),
  ]);
}

try {
  await fs.mkdir(outDir, { recursive: true });
  await copyStaticDirs();
  await Promise.all([buildHtml(), buildCss(), copySw(), copyManifest()]);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
