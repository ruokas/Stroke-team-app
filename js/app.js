    // ------------------------------
    // Pagalbinės funkcijos
    // ------------------------------
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));

    const TIME_FIELDS = ['t_lkw','t_onset','t_door','t_ct','t_needle','t_groin','t_reperf'];

    const state = {
      goals: { d2ct: 20, d2n: 60, d2g: 90 },
      autosave: 'on'
    };

    const inputs = {
      name:  $('#p_name'),        id: $('#p_id'),          dob: $('#p_dob'),     sex: $('#p_sex'),
      weight:$('#p_weight'),      bp: $('#p_bp'),
      nih0:  $('#p_nihss0'),      nih24: $('#p_nihss24'),
      lkw:   $('#t_lkw'),         onset: $('#t_onset'),    door: $('#t_door'),   ct: $('#t_ct'),
      needle:$('#t_needle'),      groin: $('#t_groin'),    reperf: $('#t_reperf'),
      drugType: $('#drug_type'),  drugConc: $('#drug_conc'),
      calcWeight: $('#calc_weight'), doseTotal: $('#dose_total'), doseVol: $('#dose_volume'),
      tpaBolus: $('#tpa_bolus'),  tpaInf: $('#tpa_infusion'),
      i_ct: $('#i_ct'), i_cta: $('#i_cta'), i_tl: $('#i_thrombolysis'), i_mt: $('#i_thrombectomy'),
      i_tici: $('#i_tici'), i_decision: $('#i_decision'), notes: $('#notes'),
      goal_ct: $('#goal_ct'), goal_n: $('#goal_n'), goal_g: $('#goal_g'),
      def_tnk: $('#def_tnk'), def_tpa: $('#def_tpa'), autosave: $('#autosave'),
      summary: $('#summary')
    };

    function toDate(val){ if(!val) return null; const d = new Date(val); return isNaN(d) ? null : d; }
    function minsBetween(a, b){ if(!a || !b) return null; return Math.round((b - a) / 60000); }
    function fmtMins(m){ if(m == null) return '—'; const sign = m < 0 ? '-' : ''; m = Math.abs(m); const h = Math.floor(m/60); const r = m%60; return h ? `${sign}${h} h ${r} min` : `${sign}${r} min`; }
    function setNow(id){ const el = document.getElementById(id); if(!el) return; const now = new Date(); el.value = toLocalInputValue(now); triggerChange(el); }
    function toLocalInputValue(d){ // format YYYY-MM-DDThh:mm:ss for datetime-local (without seconds is fine)
      const pad = (n)=> String(n).padStart(2,'0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    function classify(value, goal){
      if(value == null) return '';
      if(value <= goal) return 'good';
      if(value <= goal + 15) return 'warn';
      return 'bad';
    }

    function readGoals(){
      state.goals.d2ct = Number(inputs.goal_ct.value||20);
      state.goals.d2n  = Number(inputs.goal_n.value||60);
      state.goals.d2g  = Number(inputs.goal_g.value||90);
      $('#g_ct_goal').textContent = state.goals.d2ct;
      $('#g_n_goal').textContent  = state.goals.d2n;
      $('#g_g_goal').textContent  = state.goals.d2g;
    }

    // ------------------------------
    // KPI skaičiavimas
    // ------------------------------
    function updateKPIs(){
      readGoals();
      const tDoor = toDate(inputs.door.value);
      const tCT   = toDate(inputs.ct.value);
      const tN    = toDate(inputs.needle.value);
      const tG    = toDate(inputs.groin.value);

      const d2ct = minsBetween(tDoor, tCT);
      const d2n  = minsBetween(tDoor, tN);
      const d2g  = minsBetween(tDoor, tG);

      const kpis = [
        { id: 'kpi_d2ct', val: d2ct, goal: state.goals.d2ct, label: 'D2CT' },
        { id: 'kpi_d2n',  val: d2n,  goal: state.goals.d2n,  label: 'D2N' },
        { id: 'kpi_d2g',  val: d2g,  goal: state.goals.d2g,  label: 'D2G' },
      ];

      kpis.forEach(k => {
        const el = document.getElementById(k.id);
        el.classList.remove('good','warn','bad');
        const clazz = classify(k.val, k.goal);
        if(clazz) el.classList.add(clazz);
        el.querySelector('[data-val]').textContent = `${k.label}: ${fmtMins(k.val)}`;
      });

      // Live helper tiles
      updateLiveTiles();
    }

    function updateLiveTiles(){
      const now = new Date();
      const tDoor = toDate(inputs.door.value);
      const tOnset= toDate(inputs.onset.value) || toDate(inputs.lkw.value);
      const d2nGoal = state.goals.d2n;

      const sinceDoor = minsBetween(tDoor, now);
      const sinceOnset= minsBetween(tOnset, now);
      const toNeedle  = tDoor ? (inputs.needle.value ? null : d2nGoal - minsBetween(tDoor, now)) : null;

      const elSD = $('#t_since_door'); elSD.textContent = fmtMins(sinceDoor);
      const elSO = $('#t_since_onset'); elSO.textContent = fmtMins(sinceOnset);
      const elTN = $('#t_to_needle'); elTN.textContent = toNeedle==null ? '—' : (toNeedle>=0? fmtMins(toNeedle) + ' liko' : 'Tikslas viršytas ' + fmtMins(Math.abs(toNeedle)));

      $('#t_since_door_dot').style.background = tDoor ? 'var(--good)' : 'var(--muted)';
      $('#t_since_onset_dot').style.background= tOnset? 'var(--good)' : 'var(--muted)';
      $('#t_to_needle_dot').style.background = toNeedle==null? 'var(--muted)' : (toNeedle>=0? 'var(--warn)' : 'var(--bad)');
    }

    // ------------------------------
    // Vaistų skaičiuoklė
    // ------------------------------
    function updateDrugDefaults(){
      const type = inputs.drugType.value;
      const conc = (type==='tnk') ? Number(inputs.def_tnk.value||5) : Number(inputs.def_tpa.value||1);
      inputs.drugConc.value = String(conc);
      document.getElementById('tpaBreakdown').style.display = (type==='tpa') ? 'grid' : 'none';
    }

    function calcDrugs(){
      const type = inputs.drugType.value;
      const w = Number((inputs.calcWeight.value || inputs.weight.value || '').replace(',','.'));
      const conc = Number((inputs.drugConc.value||'').replace(',','.'));
      if(!w || !conc){ alert('Įveskite svorį ir koncentraciją.'); return; }

      let totalMg = 0;
      if(type==='tnk'){
        totalMg = Math.min(25, round1(0.25 * w));
        inputs.doseTotal.value = totalMg;
        inputs.doseVol.value = round1(totalMg / conc);
        inputs.tpaBolus.value = '';
        inputs.tpaInf.value = '';
      } else {
        totalMg = Math.min(90, round1(0.9 * w));
        const bolusMg = round1(totalMg * 0.10);
        const infMg   = round1(totalMg - bolusMg);
        const bolusMl = round1(bolusMg / conc);
        const infMl   = round1(infMg / conc);
        const rateMlH = round1(infMl / 1); // per 60 min
        inputs.doseTotal.value = totalMg;
        inputs.doseVol.value = round1(totalMg / conc);
        inputs.tpaBolus.value = `${bolusMg} mg (${bolusMl} ml)`;
        inputs.tpaInf.value   = `${infMg} mg (${infMl} ml) · ~${rateMlH} ml/val`;
      }
    }

    function round1(n){ return Math.round(n*10)/10; }

    // ------------------------------
    // Santraukos generavimas (LT)
    // ------------------------------
    function genSummary(){
      const get = (el) => (el && el.value ? el.value : null);
      const name = get(inputs.name) || 'Pacientas';
      const dob = get(inputs.dob) || '—';
      const sex = get(inputs.sex) || '—';
      const id  = get(inputs.id)  || '—';
      const w   = get(inputs.weight) || '—';
      const bp  = get(inputs.bp) || '—';
      const nih0= get(inputs.nih0) || '—';
      const nih24 = get(inputs.nih24) || '—';

      const tLKW = get(inputs.lkw), tOnset=get(inputs.onset), tDoor=get(inputs.door), tCT=get(inputs.ct), tN=get(inputs.needle), tG=get(inputs.groin), tR=get(inputs.reperf);

      const dLKW = toDate(tLKW), dOnset=toDate(tOnset), dDoor=toDate(tDoor), dCT=toDate(tCT), dN=toDate(tN), dG=toDate(tG), dR=toDate(tR);

      const d2ct = minsBetween(dDoor, dCT);
      const d2n  = minsBetween(dDoor, dN);
      const d2g  = minsBetween(dDoor, dG);
      const o2n  = minsBetween(dOnset || dLKW, dN);

      // Drugs
      const drugType = inputs.drugType.value === 'tnk' ? 'Tenekteplazė' : 'Alteplazė';
      const conc = inputs.drugConc.value ? `${inputs.drugConc.value} mg/ml` : '—';
      const totalDose = inputs.doseTotal.value ? `${inputs.doseTotal.value} mg` : '—';
      const totalVol  = inputs.doseVol.value ? `${inputs.doseVol.value} ml` : '—';
      const tpaBolus  = inputs.tpaBolus.value; const tpaInf = inputs.tpaInf.value;

      const parts = [];
      parts.push(`PACIENTAS: ${name}, ID: ${id}, gim. data: ${dob}, lytis: ${sex}, svoris: ${w} kg, AKS atvykus: ${bp}. NIHSS pradinis: ${nih0}, po 24 h: ${nih24}.`);
      parts.push(`LAIKAI: LKW: ${tLKW||'—'}, Onset: ${tOnset||'—'}, Door: ${tDoor||'—'}, KT: ${tCT||'—'}, Needle: ${tN||'—'}, Groin: ${tG||'—'}, Reperfuzija: ${tR||'—'}.`);
      parts.push(`RODIKLIAI: D2CT ${fmtMins(d2ct)}, D2N ${fmtMins(d2n)}, D2G ${fmtMins(d2g)}${o2n!=null?`, O2N ${fmtMins(o2n)}`:''}. Tikslai: D2CT ≤ ${state.goals.d2ct} min, D2N ≤ ${state.goals.d2n} min, D2G ≤ ${state.goals.d2g} min.`);

      if(inputs.i_ct.checked || inputs.i_cta.checked || inputs.i_tl.checked || inputs.i_mt.checked){
        const ivs = [];
        if(inputs.i_ct.checked) ivs.push('KT galvos');
        if(inputs.i_cta.checked) ivs.push('CTA/CTP');
        if(inputs.i_tl.checked) ivs.push('IV trombolizė');
        if(inputs.i_mt.checked) ivs.push('Mechaninė trombektomija');
        parts.push(`TYRIMAI/INTERVENCIJOS: ${ivs.join(', ')}${inputs.i_tici.value?`, TICI: ${inputs.i_tici.value}`:''}.`);
      }

      parts.push(`VAISTAI: ${drugType}. Koncentracija: ${conc}. Bendra dozė: ${totalDose} (${totalVol}). ${tpaBolus?`Bolius: ${tpaBolus}. `:''}${tpaInf?`Infuzija: ${tpaInf}.`:''}`);

      if(inputs.i_decision.value){ parts.push(`SPRENDIMAS: ${inputs.i_decision.value}.`); }
      if(inputs.notes.value){ parts.push(`PASTABOS: ${inputs.notes.value}`); }

      inputs.summary.value = parts.join('\n');
    }

      function copySummary(){
        if(window.isSecureContext && navigator.clipboard){
          navigator.clipboard.writeText(inputs.summary.value).catch(err => {
            alert('Nepavyko nukopijuoti: ' + err);
          });
        } else {
          inputs.summary.select();
          const ok = document.execCommand('copy');
          if(!ok) alert('Nepavyko nukopijuoti');
        }
      }

    // ------------------------------
    // Išsaugojimas / atkūrimas
    // ------------------------------
    const LS_KEY = 'strokeTeamDraft_v1';

    function getPayload(){
      return {
        p_name: inputs.name.value, p_id: inputs.id.value, p_dob: inputs.dob.value, p_sex: inputs.sex.value,
        p_weight: inputs.weight.value, p_bp: inputs.bp.value, p_nihss0: inputs.nih0.value, p_nihss24: inputs.nih24.value,
        t_lkw: inputs.lkw.value, t_onset: inputs.onset.value, t_door: inputs.door.value, t_ct: inputs.ct.value,
        t_needle: inputs.needle.value, t_groin: inputs.groin.value, t_reperf: inputs.reperf.value,
        drug_type: inputs.drugType.value, drug_conc: inputs.drugConc.value, calc_weight: inputs.calcWeight.value,
        dose_total: inputs.doseTotal.value, dose_volume: inputs.doseVol.value, tpa_bolus: inputs.tpaBolus.value, tpa_infusion: inputs.tpaInf.value,
        i_ct: inputs.i_ct.checked, i_cta: inputs.i_cta.checked, i_tl: inputs.i_tl.checked, i_mt: inputs.i_mt.checked,
        i_tici: inputs.i_tici.value, i_decision: inputs.i_decision.value, notes: inputs.notes.value,
        goals: state.goals, def_tnk: inputs.def_tnk.value, def_tpa: inputs.def_tpa.value, autosave: inputs.autosave.value
      };
    }

    function setPayload(p){
      if(!p) return;
      inputs.name.value = p.p_name||''; inputs.id.value=p.p_id||''; inputs.dob.value=p.p_dob||''; inputs.sex.value=p.p_sex||'';
      inputs.weight.value=p.p_weight||''; inputs.bp.value=p.p_bp||''; inputs.nih0.value=p.p_nihss0||''; inputs.nih24.value=p.p_nihss24||'';
      inputs.lkw.value=p.t_lkw||''; inputs.onset.value=p.t_onset||''; inputs.door.value=p.t_door||''; inputs.ct.value=p.t_ct||'';
      inputs.needle.value=p.t_needle||''; inputs.groin.value=p.t_groin||''; inputs.reperf.value=p.t_reperf||'';
      inputs.drugType.value=p.drug_type||'tnk'; inputs.drugConc.value=p.drug_conc||''; inputs.calcWeight.value=p.calc_weight||'';
      inputs.doseTotal.value=p.dose_total||''; inputs.doseVol.value=p.dose_volume||''; inputs.tpaBolus.value=p.tpa_bolus||''; inputs.tpaInf.value=p.tpa_infusion||'';
      inputs.i_ct.checked=!!p.i_ct; inputs.i_cta.checked=!!p.i_cta; inputs.i_tl.checked=!!p.i_tl; inputs.i_mt.checked=!!p.i_mt;
      inputs.i_tici.value=p.i_tici||''; inputs.i_decision.value=p.i_decision||''; inputs.notes.value=p.notes||'';
      if(p.goals){ inputs.goal_ct.value=p.goals.d2ct; inputs.goal_n.value=p.goals.d2n; inputs.goal_g.value=p.goals.d2g; }
      inputs.def_tnk.value=p.def_tnk||5; inputs.def_tpa.value=p.def_tpa||1; inputs.autosave.value=p.autosave||'on';
      updateDrugDefaults(); updateKPIs();
    }

    function saveLS(){ localStorage.setItem(LS_KEY, JSON.stringify(getPayload())); }
    function loadLS(){ const raw = localStorage.getItem(LS_KEY); if(!raw) return null; try{ return JSON.parse(raw); }catch(e){ return null; } }

    function triggerChange(el){ el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); }

    // ------------------------------
    // Įvykiai
    // ------------------------------
    function bind(){
      // Now buttons
      $$('button[data-now]').forEach(b=> b.addEventListener('click', ()=> setNow(b.getAttribute('data-now'))));

      // KPI update on any time change
      TIME_FIELDS.forEach(id=>{
        const el = document.getElementById(id);
        el.addEventListener('input', updateKPIs);
      });

      // Goals / defaults
      [inputs.goal_ct, inputs.goal_n, inputs.goal_g].forEach(el=> el.addEventListener('input', updateKPIs));
      [inputs.def_tnk, inputs.def_tpa].forEach(el=> el.addEventListener('input', updateDrugDefaults));
      inputs.drugType.addEventListener('change', updateDrugDefaults);

      // Calculators
      $('#calcBtn').addEventListener('click', calcDrugs);

      // Summary
      $('#genSummaryBtn').addEventListener('click', genSummary);
      $('#copySummaryBtn').addEventListener('click', copySummary);

      // Save/Load/Export/Import
      $('#saveBtn').addEventListener('click', ()=>{ saveLS(); alert('Išsaugota naršyklėje.'); });
      $('#loadBtn').addEventListener('click', ()=>{ const p = loadLS(); if(p){ setPayload(p); alert('Atkurta iš naršyklės.'); } else alert('Nėra išsaugoto įrašo.'); });
      $('#exportBtn').addEventListener('click', ()=>{
        const data = JSON.stringify(getPayload(), null, 2);
        const blob = new Blob([data], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `stroke_patient_${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
      });
      $('#importBtn').addEventListener('click', ()=> $('#importFile').click());
      $('#importFile').addEventListener('change', (e)=>{
        const file = e.target.files[0]; if(!file) return;
        const reader = new FileReader(); reader.onload = ()=>{
          try{ const p = JSON.parse(reader.result); setPayload(p); alert('Importuota.'); } catch(err){ alert('Klaida skaitant JSON.'); }
        }; reader.readAsText(file);
      });

      // Clear times
      $('#clearTimes').addEventListener('click', ()=>{
        TIME_FIELDS.forEach(id=>{ const el=document.getElementById(id); el.value=''; }); updateKPIs();
      });

      // New patient
      $('#newPatientBtn').addEventListener('click', ()=>{
        if(confirm('Išvalyti visus laukus naujam pacientui?')){ document.querySelectorAll('input, textarea, select').forEach(el=>{
          if(el.type==='checkbox') el.checked = false; else if(el.id!=='def_tnk' && el.id!=='def_tpa' && !el.matches('#goal_ct,#goal_n,#goal_g,#autosave')) el.value='';
        }); updateKPIs(); updateDrugDefaults(); $('#summary').value=''; }
      });

      // Autosave
      inputs.autosave.addEventListener('change', ()=>{ state.autosave = inputs.autosave.value; });
      document.addEventListener('input', ()=>{ if((inputs.autosave.value||'on')==='on') saveLS(); });

      // Initial
      updateDrugDefaults(); updateKPIs();
      // Timer: 1s
      setInterval(()=>{ updateLiveTiles(); }, 1000);
    }

    // Init when ready
    document.addEventListener('DOMContentLoaded', bind);
