import { $, $$ } from './state.js';
import { collectSummaryData, summaryTemplate } from './summary.js';
import { updateSummaryIndicators } from './summaryHandlers.js';
import { getActivePatient, addPatient } from './patients.js';
import { getPayload } from './storage.js';
import { renderAnalytics, track, flush } from './analytics.js';

export function setupNavigation(inputs) {
  const tabs = $$('nav .tab');
  const sections = $$('main > section');
  const main = document.querySelector('main');
  const navToggle = $('#navToggle');
  const mainNav = $('#mainNav');

  const ensureStatusDots = () => {
    tabs.forEach((tab) => {
      if (!tab.querySelector('.status-dot')) {
        const dot = document.createElement('span');
        dot.className = 'status-dot';
        dot.setAttribute('aria-hidden', 'true');
        tab.appendChild(dot);
      }
    });
  };

  const computeSectionStatus = (section) => {
    const inputs = Array.from(
      section.querySelectorAll('input, select, textarea'),
    ).filter((el) => el.type !== 'hidden' && !el.disabled);
    let hasValue = false;
    let hasInvalid = false;
    inputs.forEach((el) => {
      if (el.classList.contains('invalid')) hasInvalid = true;
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (el.checked) hasValue = true;
        return;
      }
      if (el.tagName === 'SELECT') {
        if (el.value !== '') hasValue = true;
        return;
      }
      if (el.value !== '') hasValue = true;
    });
    if (hasInvalid) return 'error';
    if (hasValue) return 'complete';
    return 'incomplete';
  };

  const updateTabStatus = (section) => {
    const tab = tabs.find((t) => t.dataset.section === section.id);
    if (!tab) return;
    const disabled =
      tab.classList.contains('disabled') || tab.hasAttribute('disabled');
    tab.dataset.status = disabled ? 'disabled' : computeSectionStatus(section);
  };

  const updateAllTabStatuses = () => {
    sections.forEach((section) => updateTabStatus(section));
  };

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
      let patient = getActivePatient();
      if (!patient) {
        addPatient();
        patient = getActivePatient();
      }
      const data = collectSummaryData(patient || getPayload());
      const text = summaryTemplate(data);
      inputs.summary.value = text;
      if (patient) patient.summary = text;
      updateSummaryIndicators(data);
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
    const first = tabs[0].dataset.section;
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

  // collapse navigation to icons on tablets
  if (window.innerWidth <= 1024) {
    document.body.classList.add('nav-collapsed');
    if (mainNav) {
      mainNav.addEventListener('click', (e) => {
        if (document.body.classList.contains('nav-collapsed')) {
          e.preventDefault();
          document.body.classList.remove('nav-collapsed');
        }
      });

      document.addEventListener('click', (e) => {
        if (!mainNav.contains(e.target) && window.innerWidth <= 1024) {
          document.body.classList.add('nav-collapsed');
        }
      });
    }
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

  ensureStatusDots();
  updateAllTabStatuses();

  main.addEventListener('input', (e) => {
    const section = e.target.closest('section');
    if (section) updateTabStatus(section);
  });
  main.addEventListener('change', (e) => {
    const section = e.target.closest('section');
    if (section) updateTabStatus(section);
  });
  document.addEventListener('tab-status-update', updateAllTabStatuses);

  window.addEventListener('hashchange', activateFromHash);
  window.addEventListener('popstate', activateFromHash);

  return { activateFromHash, updateAllTabStatuses };
}
