export function setupDecision(inputs) {
  if (!inputs) return;
  const nextCare = inputs.d_next_care;
  if (!Array.isArray(nextCare) || nextCare.length === 0) return;
  const stationaryRow = document.getElementById('d_stationary_options');
  const transferRow = document.getElementById('d_transfer_info_row');
  const departments = Array.isArray(inputs.d_department)
    ? inputs.d_department
    : [];
  const transferInput = inputs.d_transfer_info || null;

  const getSelected = () => nextCare.find((o) => o.checked)?.value || '';
  const setNextCare = (value) => {
    const option = nextCare.find((o) => o.value === value);
    if (option) {
      option.checked = true;
      option.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };
  const clearDepartments = () => {
    departments.forEach((o) => {
      if (o.checked) {
        o.checked = false;
        o.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  };
  const clearTransfer = () => {
    if (!transferInput) return;
    if (transferInput.value) {
      transferInput.value = '';
      transferInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const update = () => {
    const val = getSelected();
    if (val === 'stationary') {
      stationaryRow?.classList.remove('hidden');
      transferRow?.classList.add('hidden');
      clearTransfer();
    } else if (val === 'transfer') {
      stationaryRow?.classList.add('hidden');
      transferRow?.classList.remove('hidden');
      clearDepartments();
    } else {
      stationaryRow?.classList.add('hidden');
      transferRow?.classList.add('hidden');
    }
  };

  if (!getSelected()) {
    if (departments.some((o) => o.checked)) {
      setNextCare('stationary');
    } else if (transferInput && transferInput.value.trim()) {
      setNextCare('transfer');
    }
  }

  nextCare.forEach((o) => o.addEventListener('change', update));
  departments.forEach((o) =>
    o.addEventListener('change', () => {
      if (!getSelected() && departments.some((d) => d.checked)) {
        setNextCare('stationary');
      }
    }),
  );
  if (transferInput) {
    transferInput.addEventListener('input', () => {
      if (!getSelected() && transferInput.value.trim()) {
        setNextCare('transfer');
      }
    });
  }
  update();
}
