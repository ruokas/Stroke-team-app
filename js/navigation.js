import { $, $$ } from './state.js';
import { collectSummaryData, summaryTemplate } from './summary.js';
import { getActivePatient } from './patients.js';
import { renderAnalytics, track, flush } from './analytics.js';

export function setupNavigation(inputs) {
  const tabs = $$('nav .tab');
  const sections = $$('main > section');
  const navToggle = $('#navToggle');

  const showSection = (id) => {
    sections.forEach((s) => {
      const active = s.id === id;
      s.classList.toggle('hidden', !active);
      s.setAttribute('tabindex', active ? '0' : '-1');
      s.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    tabs.forEach((t) => {
      const selected = t.dataset.section === id;
      t.classList.toggle('active', selected);
      t.setAttribute('aria-selected', selected ? 'true' : 'false');
      t.setAttribute('tabindex', selected ? '0' : '-1');
    });
    if (id === 'summarySec') {
      const patient = getActivePatient();
      if (patient) {
        const data = collectSummaryData(patient);
        const text = summaryTemplate(data);
        inputs.summary.value = text;
        patient.summary = text;
      }
    }
    // Removed automatic setting of decision time; now handled via buttons with data-now="d_time"
    if (id === 'analytics') renderAnalytics();
    track('section_view', { id });
    flush().catch(() => {
      /* log or ignore analytics errors */
    });
    document.body.classList.remove('nav-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
  };

  const activateFromHash = () => {
    const hash = location.hash.slice(1);
    const first = tabs[0]?.dataset.section;
    const id = tabs.some((t) => t.dataset.section === hash) ? hash : first;
    if (id) {
      if (hash !== id) history.replaceState(null, '', `#${id}`);
      showSection(id);
    }
  };

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      if (navToggle)
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const id = tab.dataset.section;
      track('section_tab_click', { id });
      showSection(id);
      if (id) history.pushState(null, '', `#${id}`);
    });
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const next = (index + dir + tabs.length) % tabs.length;
        const nextTab = tabs[next];
        const id = nextTab.dataset.section;
        track('section_tab_click', { id });
        nextTab.focus();
        showSection(id);
        if (id) history.pushState(null, '', `#${id}`);
      }
    });
  });

  window.addEventListener('hashchange', activateFromHash);
  window.addEventListener('popstate', activateFromHash);

  return { activateFromHash };
}
