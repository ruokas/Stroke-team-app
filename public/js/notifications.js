const LS_KEY = 'notifications';

export function requestPermission() {
  if (typeof Notification === 'undefined') return Promise.resolve('denied');
  if (Notification.permission === 'default') {
    return Notification.requestPermission();
  }
  return Promise.resolve(Notification.permission);
}

function isEnabled() {
  return (
    typeof localStorage !== 'undefined' &&
    localStorage.getItem(LS_KEY) !== 'off'
  );
}

export function notify(message) {
  if (typeof Notification === 'undefined') return;
  if (!isEnabled()) return;
  if (Notification.permission === 'granted') {
    new Notification(message);
  } else if (Notification.permission === 'default') {
    requestPermission().then((perm) => {
      if (perm === 'granted') new Notification(message);
    });
  }
}

export function setupNotificationToggle() {
  if (typeof document === 'undefined') return;
  const select = document.getElementById('notifications');
  if (!select) return;
  const saved = localStorage.getItem(LS_KEY) || 'off';
  select.value = saved;
  select.addEventListener('change', () => {
    localStorage.setItem(LS_KEY, select.value);
    if (select.value === 'on') requestPermission();
  });
  if (saved === 'on') requestPermission();
}
