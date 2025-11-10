import { $, $$ } from './state.js';
import { collectSummaryData, summaryTemplate } from './summary.js';
import { getActivePatient, addPatient } from './patients.js';
import { getPayload } from './storage.js';
import { renderAnalytics, track, flush } from './analytics.js';

export function setupNavigation(inputs) {
  const tabs = $$('nav .tab');
  const sections = $$('main > section');
  const navToggle = $('#navToggle');
  const mainNav = $('#mainNav');

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
    }
    // Initialize sub-tabs when neurologo section is shown
    if (id === 'neurologo') {
      setupSubTabs();
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

  // collapse navigation to icons on tablets
  if (window.innerWidth <= 1024) {
    document.body.classList.add('nav-collapsed');
    if (mainNav) {
      mainNav.addEventListener('click', (e) => {
        if (!document.body.classList.contains('nav-collapsed')) return;
        const clickedTab = e.target && e.target.closest
          ? e.target.closest('.tab')
          : null;
        // Always expand on first interaction when collapsed
        document.body.classList.remove('nav-collapsed');
        // If a tab was clicked, activate it immediately (single tap)
        if (clickedTab) {
          e.preventDefault();
          const id = clickedTab.dataset.section;
          if (id) {
            track('section_tab_click', { id });
            showSection(id);
            history.pushState(null, '', `#${id}`);
          }
          return;
        }
        // Non-tab click: just expand and prevent navigation
        e.preventDefault();
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

  // Setup sub-tab navigation for Neurologo dalis
  const setupSubTabs = () => {
    const subNav = $('#neurologoSubNav');
    if (!subNav) return;

    const subTabs = $$('#neurologoSubNav .sub-tab');
    const subSections = $$('#neurologo .sub-section');

    const showSubSection = (subsectionId) => {
      subSections.forEach((s) => {
        const active = s.id === subsectionId;
        s.classList.toggle('hidden', !active);
        s.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      subTabs.forEach((t) => {
        const selected = t.dataset.subsection === subsectionId;
        t.classList.toggle('active', selected);
        t.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
    };

    subTabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const subsectionId = tab.dataset.subsection;
        showSubSection(subsectionId);
        track('subsection_view', {
          section: 'neurologo',
          subsection: subsectionId,
        });
      });
    });

    // Show first sub-section by default
    if (subSections.length > 0) {
      showSubSection(subSections[0].id);
    }
  };

  window.addEventListener('hashchange', activateFromHash);
  window.addEventListener('popstate', activateFromHash);

  return { activateFromHash };
}
