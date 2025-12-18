import { registerFeature } from '../featureRegistry.js';
import { setupIntervals } from '../../intervals.js';
import { setupHeaderHeight } from '../../header.js';
import { setupToolbarNavigation } from '../../toolbar.js';
import { setupTimeButtons } from '../../timeControls.js';
import { setupNewsMonitoring } from '../../newsMonitoring.js';
import { setupSummaryHandlers } from '../../summaryHandlers.js';
import { setupPersonalCodeCopy } from '../../personalCode.js';

registerFeature({
  id: 'intervals',
  init: ({ inputs }) => {
    setupIntervals(inputs);
  },
});

registerFeature({
  id: 'header-height',
  init: () => {
    setupHeaderHeight();
  },
});

registerFeature({
  id: 'toolbar-navigation',
  init: () => {
    setupToolbarNavigation();
  },
});

registerFeature({
  id: 'time-buttons',
  init: () => {
    setupTimeButtons();
  },
});

registerFeature({
  id: 'news-monitoring',
  init: () => {
    setupNewsMonitoring();
  },
});

registerFeature({
  id: 'summary-handlers',
  init: ({ inputs }) => {
    setupSummaryHandlers(inputs);
  },
});

registerFeature({
  id: 'personal-code',
  init: ({ inputs }) => {
    setupPersonalCodeCopy(inputs);
  },
});
