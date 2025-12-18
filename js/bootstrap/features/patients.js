import { registerFeature } from '../featureRegistry.js';
import { setupDrugControls } from '../../drugControls.js';
import { updateDrugDefaults } from '../../drugs.js';
import { setupAgeListener } from '../../ageSetup.js';
import { updateAge } from '../../age.js';
import { setupBpHandlers } from '../../bpEntries.js';
import { setupPillState } from '../../pill.js';
import { setupLkw } from '../../lkw.js';
import { setupAutosave } from '../../autosave.js';
import { setupNavigation } from '../../navigation.js';
import { initNIHSS } from '../../nihss.js';
import { initNeurologoArrival } from '../../neurologoArrival.js';
import { initActivation } from '../../activation.js';
import { initArrival } from '../../arrival.js';
import { initImaging } from '../../imaging.js';
import { force24HourFormat } from '../../time.js';

registerFeature({
  id: 'drug-controls',
  init: ({ inputs }) => {
    setupDrugControls(inputs);
    updateDrugDefaults();
  },
});

registerFeature({
  id: 'age-setup',
  init: ({ inputs }) => {
    setupAgeListener(inputs);
    updateAge();
  },
});

registerFeature({
  id: 'bp-handlers',
  init: () => {
    setupBpHandlers();
  },
});

registerFeature({
  id: 'pill-state',
  init: () => {
    setupPillState();
  },
});

registerFeature({
  id: 'lkw',
  init: ({ inputs }) => {
    setupLkw(inputs);
  },
});

registerFeature({
  id: 'autosave',
  init: ({ inputs, scheduleSave, flushSave }) => {
    const { updateSaveStatus } = setupAutosave(inputs, {
      scheduleSave,
      flushSave,
    });
    updateSaveStatus();
  },
});

registerFeature({
  id: 'navigation',
  deps: ['autosave'],
  init: ({ inputs }) => {
    const { activateFromHash } = setupNavigation(inputs);
    activateFromHash();
  },
});

registerFeature({
  id: 'settings-form',
  deps: ['drug-controls'],
  init: ({ saveSettings }) => {
    const settingsForm = document.getElementById('settingsForm');
    settingsForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      saveSettings();
      updateDrugDefaults();
    });
  },
});

registerFeature({
  id: 'clinical-initialization',
  init: () => {
    initNIHSS();
    initNeurologoArrival();
    initActivation();
    initArrival();
    initImaging();
  },
});

registerFeature({
  id: 'force-24-hour',
  deps: ['navigation'],
  init: () => {
    force24HourFormat();
  },
});
