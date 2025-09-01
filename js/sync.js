const LS_KEY = 'insultoKomandaPatients_v1';

export async function syncPatients() {
  try {
    const data = localStorage.getItem(LS_KEY) || '{}';
    await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data,
    });
  } catch (e) {
    console.error('Failed to sync patients', e);
  }
}

export async function restorePatients() {
  try {
    const res = await fetch('/api/patients');
    if (!res.ok) return;
    const data = await res.json();
    if (data && typeof data === 'object') {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    }
  } catch (e) {
    console.error('Failed to restore patients', e);
  }
}

if (typeof document !== 'undefined') {
  document.getElementById('syncBtn')?.addEventListener('click', () => {
    syncPatients();
  });
}
