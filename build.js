import fs from 'fs';
import path from 'path';

function actionButton(id, title, icon, label, classes = '') {
  const cls = classes ? `btn ${classes}` : 'btn';
  return `<button id="${id}"${title ? ` title="${title}"` : ''} class="${cls}">${icon} <span class="btn-label">${label}</span></button>`;
}

function timeInput(id, wrapperId = '', wrapperClass = 'row') {
  return `<div class="${wrapperClass}"${wrapperId ? ` id="${wrapperId}"` : ''}>
  <div class="input-group">
    <input
      id="${id}"
      type="datetime-local"
      placeholder="YYYY-MM-DD HH:MM"
      step="60"
    />
    <button type="button" class="btn ghost" data-picker="${id}" aria-label="Pasirinkti datą ir laiką">📅</button>
    <button type="button" class="btn ghost" data-now="${id}" aria-label="Dabar">🕒</button>
    <button type="button" class="btn ghost" data-stepdown="${id}" aria-label="−5 min">−5</button>
    <button type="button" class="btn ghost" data-stepup="${id}" aria-label="+5 min">+5</button>
  </div>
</div>`;
}

const macros = { actionButton, timeInput };

function render(template) {
  // includes
  template = template.replace(/\{% include \"(.+?)\" %\}/g, (_, file) => {
    const partial = fs.readFileSync(path.join('templates', file), 'utf8');
    return render(partial);
  });
  // macros
  template = template.replace(
    /\{\{\s*macros\.actionButton\((.*?)\)\s*\}\}/g,
    (_, args) => {
      const parsed = eval(`[${args}]`);
      return macros.actionButton(...parsed);
    },
  );
  template = template.replace(
    /\{\{\s*macros\.timeInput\((.*?)\)\s*\}\}/g,
    (_, args) => {
      const parsed = eval(`[${args}]`);
      return macros.timeInput(...parsed);
    },
  );
  return template;
}

let index = fs.readFileSync('templates/index.njk', 'utf8');
index = index
  .replace(/\{% extends \"layout.njk\" %\}/, '')
  .replace(/\{% import \"macros.njk\" as macros %\}/, '')
  .replace(/\{% block content %\}/, '')
  .replace(/\{% endblock %\}/, '');

const content = render(index);
const layout = fs.readFileSync('templates/layout.njk', 'utf8');
const html = layout.replace('{% block content %}{% endblock %}', content);
fs.writeFileSync('index.html', html);
