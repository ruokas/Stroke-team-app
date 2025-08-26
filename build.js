import fs from 'fs';
import nunjucks from 'nunjucks';

nunjucks.configure('templates', { autoescape: false });

try {
  const html = nunjucks.render('index.njk');
  await fs.promises.writeFile('index.html', html);
} catch (error) {
  console.error('Failed to build index.html:', error);
  process.exit(1);
}
