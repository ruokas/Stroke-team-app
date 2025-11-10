import { $, $$ } from './state.js';
import { timeSince } from './arrival.js';
import { setupPillState } from './pill.js';

const MS_PER_HOUR = 36e5;
const IVT_WINDOW_HOURS = 4.5;
const CONTRA_SOURCE_MAP = [
  {
    source: '#arrival_tpa_contra_list',
    target: '#neurologo_tpa_contra_list',
    name: 'neurologo_arrival_contra',
  },
  {
    source: '#arrival_mt_contra_list',
    target: '#neurologo_mt_contra_list',
    name: 'neurologo_arrival_mt_contra',
  },
];

function populateContraindications() {
  CONTRA_SOURCE_MAP.forEach(({ source, target, name }) => {
    const sourceList = $(source);
    const targetList = $(target);

    if (!sourceList || !targetList) return;

    targetList.innerHTML = '';

    sourceList.querySelectorAll('li').forEach((item) => {
      const clone = item.cloneNode(true);
      const sourceCheckbox = item.querySelector('input[type="checkbox"]');
      const cloneCheckbox = clone.querySelector('input[type="checkbox"]');

      if (cloneCheckbox) {
        cloneCheckbox.name = name;
        cloneCheckbox.checked = sourceCheckbox?.checked ?? false;
      }

      targetList.appendChild(clone);
    });
  });
}

// Atnaujinti pill styling
function updatePillStyling() {
  // Atnaujinti neurologo pills
  $$('input[name="neurologo_lkw_type"]').forEach(radio => {
    const pill = radio.closest('.pill');
    if (pill) {
      pill.classList.toggle('checked', radio.checked);
    }
  });
  
  // Atnaujinti bendros dalies pills
  $$('input[name="lkw_type"]').forEach(radio => {
    const pill = radio.closest('.pill');
    if (pill) {
      pill.classList.toggle('checked', radio.checked);
    }
  });
}

// Laikmačių atnaujinimas neurologo dalyje
let neurologoTimerId;
function updateNeurologoTimers() {
  const onsetEl = $('#neurologo_onset_timer');
  const doorEl = $('#neurologo_door_timer');
  const thrombolysisEl = $('#neurologo_thrombolysis_timer');
  
  // Tikriname ar elementai egzistuoja
  if (!onsetEl || !doorEl || !thrombolysisEl) {
    return; // Jei elementai neegzistuoja, nieko nedarome
  }
  
  const lkwType = $$('input[name="neurologo_lkw_type"]').find((r) => r.checked)?.value;
  const lkwValue = $('#neurologo_t_lkw')?.value;
  const doorValue = $('#neurologo_t_door')?.value || $('#t_door')?.value; // Naudojame neurologo arba bendrą atvykimo laiką

  // Atvykimo laikmatis
  if (doorValue) {
    doorEl.textContent = timeSince(doorValue);
  } else {
    doorEl.textContent = 'Nėra atvykimo laiko';
  }

  // Simptomų pradžios laikmatis
  if (lkwValue && lkwType !== 'unknown') {
    onsetEl.textContent = timeSince(lkwValue);
  } else {
    onsetEl.textContent = 'Nėra simptomų laiko';
  }

  // Trombolizės laikmatis
  if (lkwValue && lkwType !== 'unknown') {
    const onsetTime = new Date(lkwValue).getTime();
    const now = Date.now();
    const diffHours = (now - onsetTime) / MS_PER_HOUR;
    
    if (diffHours < 0) {
      thrombolysisEl.textContent = 'Neteisingas laikas';
    } else if (diffHours >= IVT_WINDOW_HOURS) {
      thrombolysisEl.textContent = 'Trombolizės langas praėjo';
    } else {
      const remainingHours = IVT_WINDOW_HOURS - diffHours;
      const remainingMinutes = Math.floor(remainingHours * 60);
      thrombolysisEl.textContent = `${remainingMinutes} min`;
    }
  } else {
    thrombolysisEl.textContent = 'Nėra simptomų laiko';
  }
}

// Duomenų sinchronizacija tarp bendros ir neurologo dalies
function syncDataFromMainToNeurologo() {
  // Atvykimo laikas
  const mainDoorValue = $('#t_door')?.value || '';
  const neurologoDoorInput = $('#neurologo_t_door');
  if (neurologoDoorInput) {
    neurologoDoorInput.value = mainDoorValue;
  }

  // LKW duomenys
  const mainLkwType = $$('input[name="lkw_type"]').find((r) => r.checked)?.value;
  const mainLkwValue = $('#t_lkw')?.value;
  const mainSleepStart = $('#t_sleep_start')?.value;
  const mainSleepEnd = $('#t_sleep_end')?.value;
  
  if (mainLkwType) {
    const neurologoLkwRadio = $(`input[name="neurologo_lkw_type"][value="${mainLkwType}"]`);
    if (neurologoLkwRadio) {
      neurologoLkwRadio.checked = true;
      updatePillStyling();
    }
  }
  
  const neurologoLkwInput = $('#neurologo_t_lkw');
  if (neurologoLkwInput) {
    neurologoLkwInput.value = mainLkwValue || '';
  }

  const neurologoSleepStartInput = $('#neurologo_t_sleep_start');
  if (neurologoSleepStartInput) {
    neurologoSleepStartInput.value = mainSleepStart || '';
  }

  const neurologoSleepEndInput = $('#neurologo_t_sleep_end');
  if (neurologoSleepEndInput) {
    neurologoSleepEndInput.value = mainSleepEnd || '';
  }

  // Simptomai
  const mainSymptoms = $('#arrival_symptoms')?.value;
  const neurologoSymptomsInput = $('#neurologo_arrival_symptoms');
  if (neurologoSymptomsInput) {
    neurologoSymptomsInput.value = mainSymptoms || '';
  }

  // Kontraindikacijos trombolizei
  const neurologoContraInputs = $$('input[name="neurologo_arrival_contra"]');
  neurologoContraInputs.forEach((checkbox) => {
    checkbox.checked = false;
  });
  const mainContra = $$('input[name="arrival_contra"]:checked');
  mainContra.forEach(checkbox => {
    const neurologoContra = $(`input[name="neurologo_arrival_contra"][value="${checkbox.value}"]`);
    if (neurologoContra) neurologoContra.checked = true;
  });

  // Kontraindikacijos trombektomijai
  const neurologoMtContraInputs = $$('input[name="neurologo_arrival_mt_contra"]');
  neurologoMtContraInputs.forEach((checkbox) => {
    checkbox.checked = false;
  });
  const mainMtContra = $$('input[name="arrival_mt_contra"]:checked');
  mainMtContra.forEach(checkbox => {
    const neurologoMtContra = $(`input[name="neurologo_arrival_mt_contra"][value="${checkbox.value}"]`);
    if (neurologoMtContra) neurologoMtContra.checked = true;
  });
}

function syncDataFromNeurologoToMain() {
  const neurologoDoorInput = $('#neurologo_t_door');
  if (neurologoDoorInput) {
    const doorInput = $('#t_door');
    if (doorInput) {
      doorInput.value = neurologoDoorInput.value || '';
    }
  }

  // LKW duomenys
  const neurologoLkwType = $$('input[name="neurologo_lkw_type"]').find((r) => r.checked)?.value;
  const neurologoLkwValue = $('#neurologo_t_lkw')?.value;
  const neurologoSleepStart = $('#neurologo_t_sleep_start')?.value;
  const neurologoSleepEnd = $('#neurologo_t_sleep_end')?.value;
  
  if (neurologoLkwType) {
    const mainLkwRadio = $(`input[name="lkw_type"][value="${neurologoLkwType}"]`);
    if (mainLkwRadio) {
      mainLkwRadio.checked = true;
      updatePillStyling();
    }
  }
  
  const mainLkwInput = $('#t_lkw');
  if (mainLkwInput) {
    mainLkwInput.value = neurologoLkwValue || '';
  }

  const mainSleepStartInput = $('#t_sleep_start');
  if (mainSleepStartInput) {
    mainSleepStartInput.value = neurologoSleepStart || '';
  }

  const mainSleepEndInput = $('#t_sleep_end');
  if (mainSleepEndInput) {
    mainSleepEndInput.value = neurologoSleepEnd || '';
  }

  // Simptomai
  const neurologoSymptoms = $('#neurologo_arrival_symptoms')?.value;
  const mainSymptomsInput = $('#arrival_symptoms');
  if (mainSymptomsInput) {
    mainSymptomsInput.value = neurologoSymptoms || '';
  }

  // Kontraindikacijos trombolizei
  const mainContraInputs = $$('input[name="arrival_contra"]');
  mainContraInputs.forEach((checkbox) => {
    checkbox.checked = false;
  });
  const neurologoContra = $$('input[name="neurologo_arrival_contra"]:checked');
  neurologoContra.forEach(checkbox => {
    const mainContra = $(`input[name="arrival_contra"][value="${checkbox.value}"]`);
    if (mainContra) mainContra.checked = true;
  });

  // Kontraindikacijos trombektomijai
  const mainMtContraInputs = $$('input[name="arrival_mt_contra"]');
  mainMtContraInputs.forEach((checkbox) => {
    checkbox.checked = false;
  });
  const neurologoMtContra = $$('input[name="neurologo_arrival_mt_contra"]:checked');
  neurologoMtContra.forEach(checkbox => {
    const mainMtContra = $(`input[name="arrival_mt_contra"][value="${checkbox.value}"]`);
    if (mainMtContra) mainMtContra.checked = true;
  });
}

// Miego vidurio laiko skaičiavimas
function calculateSleepMidpoint(startTime, endTime) {
  if (!startTime || !endTime) return null;
  
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  
  if (!isFinite(start) || !isFinite(end) || start >= end) return null;
  
  const midpoint = (start + end) / 2;
  return new Date(midpoint).toISOString().slice(0, 16);
}

// LKW tipo keitimo logika
function setupLkwTypeHandlers() {
  const neurologoLkwRadios = $$('input[name="neurologo_lkw_type"]');
  
  if (neurologoLkwRadios.length === 0) {
    return;
  }
  
  const lkwTimeRow = $('#neurologoLkwTimeRow');
  const sleepTimeRow = $('#neurologoSleepTimeRow');
  
  function toggleLkwRows(selectedValue) {
    if (selectedValue === 'sleep') {
      if (lkwTimeRow) lkwTimeRow.classList.add('hidden');
      if (sleepTimeRow) sleepTimeRow.classList.remove('hidden');
    } else {
      if (lkwTimeRow) lkwTimeRow.classList.remove('hidden');
      if (sleepTimeRow) sleepTimeRow.classList.add('hidden');
    }
  }
  
  neurologoLkwRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      toggleLkwRows(radio.value);
      
      // Sinchronizuojame su bendra dalimi ir atnaujiname stiliu
      syncDataFromNeurologoToMain();
      updatePillStyling();
    });
  });
  
  const checkedValue = neurologoLkwRadios.find((radio) => radio.checked)?.value;
  if (checkedValue) {
    toggleLkwRows(checkedValue);
  }
  
  // Miego laiko skaiciavimas
  const sleepStartInput = $('#neurologo_t_sleep_start');
  const sleepEndInput = $('#neurologo_t_sleep_end');
  const lkwInput = $('#neurologo_t_lkw');

  function updateSleepMidpoint() {
    const startTime = sleepStartInput?.value;
    const endTime = sleepEndInput?.value;
    
    if (startTime && endTime) {
      const midpoint = calculateSleepMidpoint(startTime, endTime);
      
      if (midpoint && lkwInput) {
        lkwInput.value = midpoint;
        // Sinchronizuojame su bendra dalimi
        syncDataFromNeurologoToMain();
      }
    }
  }

  if (sleepStartInput) {
    sleepStartInput.addEventListener('change', updateSleepMidpoint);
  }
  
  if (sleepEndInput) {
    sleepEndInput.addEventListener('change', updateSleepMidpoint);
  }
}

// Event listener'iai duomenų sinchronizacijai
function setupDataSync() {
  // Neurologo dalies laukai -> bendra dalis
  const neurologoFields = [
    '#neurologo_t_door',
    '#neurologo_t_lkw',
    '#neurologo_t_sleep_start', 
    '#neurologo_t_sleep_end',
    '#neurologo_arrival_symptoms'
  ];
  
  neurologoFields.forEach(selector => {
    const element = $(selector);
    if (element) {
      element.addEventListener('input', syncDataFromNeurologoToMain);
      element.addEventListener('change', syncDataFromNeurologoToMain);
    }
  });

  // Kontraindikacijos
  const neurologoContraCheckboxes = $$('input[name="neurologo_arrival_contra"], input[name="neurologo_arrival_mt_contra"]');
  neurologoContraCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', syncDataFromNeurologoToMain);
  });

  // Neurologo radio mygtukai
  const neurologoRadios = $$('input[name="neurologo_lkw_type"]');
  neurologoRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      syncDataFromNeurologoToMain();
      updatePillStyling();
    });
  });

  // Bendros dalies laukai -> neurologo dalis
  const mainFields = [
    '#t_door',
    '#t_lkw',
    '#t_sleep_start',
    '#t_sleep_end', 
    '#arrival_symptoms'
  ];
  
  mainFields.forEach(selector => {
    const element = $(selector);
    if (element) {
      element.addEventListener('input', syncDataFromMainToNeurologo);
      element.addEventListener('change', syncDataFromMainToNeurologo);
    }
  });

  // Bendros dalies kontraindikacijos
  const mainContraCheckboxes = $$('input[name="arrival_contra"], input[name="arrival_mt_contra"]');
  mainContraCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', syncDataFromMainToNeurologo);
  });

  // Bendros dalies LKW tipo keitimas
  const mainLkwRadios = $$('input[name="lkw_type"]');
  mainLkwRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      syncDataFromMainToNeurologo();
      updatePillStyling();
    });
  });
}

export function initNeurologoArrival() {
  // Palaukiame kol DOM bus paruoštas
  setTimeout(() => {
    populateContraindications();

    // Pradinis duomenų sinchronizavimas
    syncDataFromMainToNeurologo();
    
    // Nustatome LKW tipo logiką
    setupLkwTypeHandlers();
    
    // Nustatome duomenų sinchronizaciją
    setupDataSync();
    
    // Nustatome pill stilių neurologo radio mygtukams
    setupPillState();
    
    // Pradinis pill stiliaus atnaujinimas
    updatePillStyling();
    
    // Pradinis laikmačių atnaujinimas
    updateNeurologoTimers();
    
    // Paleidžiame laikmačių atnaujinimą kas sekundę
    if (neurologoTimerId) clearInterval(neurologoTimerId);
    neurologoTimerId = setInterval(updateNeurologoTimers, 1000);
  }, 100);
}
