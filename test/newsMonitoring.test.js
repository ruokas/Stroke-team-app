import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

test('NEWS2 monitoring entries persist via storage snapshot', async () => {
  const {
    setupNewsMonitoring,
    addStoredNewsEntry,
    clearNewsEntries,
    getNewsEntriesPayload,
    stopNewsMonitoring,
  } = await import('../js/newsMonitoring.js');
  const { getPayload, setPayload } = await import('../js/storage.js');

  setupNewsMonitoring();
  try {
    clearNewsEntries();

    const sample = {
      time: '2024-01-01T08:10',
      resp: 22,
      spo2: 94,
      oxygen: false,
      temp: 37.2,
      systolic: 130,
      heartRate: 92,
      consciousness: 'alert',
      notes: 'Testinis įrašas',
      score: 3,
      flags: ['RR 22 - 2 taškai'],
    };
    addStoredNewsEntry(sample);

    const payload = getPayload();
    assert.ok(Array.isArray(payload.news_entries));
    assert.equal(payload.news_entries.length, 1);
    assert.equal(payload.news_entries[0].time, sample.time);
    assert.equal(payload.news_entries[0].resp, String(sample.resp));
    assert.equal(payload.news_entries[0].notes, sample.notes);

    clearNewsEntries();
    setPayload({ news_entries: payload.news_entries });

    const restored = getNewsEntriesPayload();
    assert.equal(restored.length, 1);
    const entry = restored[0];
    assert.equal(entry.time, sample.time);
    assert.equal(entry.notes, sample.notes);
    assert.equal(entry.score, sample.score);

    const rendered = document.querySelector('#newsEntries .news-entry');
    assert.ok(rendered);
    assert.equal(rendered.dataset.score, String(sample.score));
  } finally {
    stopNewsMonitoring();
  }
});
