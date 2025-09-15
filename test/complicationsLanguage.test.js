import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

// Ensure complications are translated after language change

test('complications translate after language change', async () => {
  const origFetch = global.fetch;
  global.fetch = async (url) => {
    const match = url.toString().match(/locales\/(\w+)\.json$/);
    if (match) {
      const lang = match[1];
      const translations = {
        lt: {
          comp_bleeding: 'Kraujavimas',
          comp_allergy: 'Alergija',
        },
        en: {
          comp_bleeding: 'Bleeding',
          comp_allergy: 'Allergy',
        },
      };
      return { ok: true, json: async () => translations[lang] };
    }
    return origFetch(url);
  };

  const { setLanguage } = await import('../js/i18n.js');
  await setLanguage('lt');
  const { summaryTemplate } = await import('../js/summary.js');

  const data = {
    patient: {
      personal: null,
      name: null,
      dob: null,
      age: null,
      weight: null,
      bp: null,
      inr: null,
      nih0: null,
      independent: null,
    },
    times: {
      gmp: null,
      lkw: null,
      door: null,
      decision: null,
      thrombolysis: null,
    },
    drugs: {
      type: 'tnk',
      totalDose: null,
      totalVol: null,
      bolus: null,
      infusion: null,
    },
    decision: null,
    department: null,
    bpMeds: [],
    activation: {
      lkw: null,
      drugs: [],
      params: {},
      symptoms: [],
    },
    arrivalSymptoms: null,
    arrivalContra: null,
    arrivalMtContra: null,
    complications: 'bleeding; allergy',
    compTime: null,
  };

  const ltSummary = summaryTemplate(data);
  assert(ltSummary.includes('KOMPLIKACIJOS:\n- Kraujavimas; Alergija'));

  await setLanguage('en');
  const enSummary = summaryTemplate(data);
  assert(enSummary.includes('Bleeding; Allergy'));

  global.fetch = origFetch;
});
