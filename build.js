import fs from 'fs/promises';
import nunjucks from 'nunjucks';
import postcss from 'postcss';
import cssnano from 'cssnano';
import autoprefixer from 'autoprefixer';
import dotenv from 'dotenv';
import { bpMeds } from './js/bpMeds.js';

dotenv.config({ quiet: true });
dotenv.config({ path: '.env.production', override: false, quiet: true });

const envConfig = {
  apiBase: process.env.API_BASE || '',
  supabaseAnonKey: process.env.SUPABASE_ANONPUBLIC || '',
  supabaseProjectUrl: process.env.SUPABASE_PROJECT_URL || '',
};

const envConfigJson = JSON.stringify(envConfig);

nunjucks.configure('templates', { autoescape: false });

async function buildHtml() {
  const html = nunjucks.render('index.njk', {
    bpMeds,
    envConfig,
    envConfigJson,
  });
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
