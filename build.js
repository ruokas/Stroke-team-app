import fs from 'fs';
import nunjucks from 'nunjucks';

nunjucks.configure('templates', { autoescape: false });

const html = nunjucks.render('index.njk');
fs.writeFileSync('index.html', html);
