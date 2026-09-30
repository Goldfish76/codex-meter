(function () {
  "use strict";

  const CONFIG = {
    USD_PER_CREDIT: 40 / 1000,
    LOOKBACK_DAYS: 45,
    MAX_SNAPSHOTS: 180,
    STORAGE_LATEST: "codexQuotaCompassLatest",
    STORAGE_SNAPSHOTS: "codexQuotaCompassSnapshots",
    STORAGE_SETTINGS: "codexMeterSettings",
    // Credits per 1M input / cached input / output tokens, from the Codex rate card
    // (learn.chatgpt.com/docs/pricing, 2026-09-30). Included usage bills Fast at 2.5x.
    CREDIT_RATES: {
      "gpt-6-astra": [250, 25, 1250],
      "gpt-6.1-sol": [50, 2.5, 250],
      "gpt-6-sol": [50, 5, 250],
      "gpt-6-luna": [2.5, 0.25, 12.5],
      "gpt-5.6-sol": [100, 10, 500],
      "gpt-5.6-terra": [50, 5, 300],
      "gpt-5.6-luna": [5, 0.5, 30],
      "gpt-5.5": [125, 12.5, 750],
    },
    INCLUDED_SPEED_MULTIPLIERS: { standard: 1, fast: 2.5, ultrafast: 8 },
  };

  const DEFAULT_SETTINGS = {
    showPageButton: true,
    showChartControls: true,
    defaultChartMode: "source",
  };

  const IDS = {
    button: "codex-quota-compass-button",
    overlay: "codex-meter-dialog-overlay",
    panel: "codex-quota-compass-panel",
  };

  const ROUTES = {
    analyticsOrigin: "https://chatgpt.com",
    analyticsPath: "/codex/cloud/settings/analytics",
    analyticsUrl: "https://chatgpt.com/codex/cloud/settings/analytics",
  };

  const isAnalyticsRoute = (currentLocation = window.location) =>
    currentLocation.origin === ROUTES.analyticsOrigin &&
    currentLocation.pathname === ROUTES.analyticsPath;

  window.CodexMeterConfig = {
    CONFIG,
    DEFAULT_SETTINGS,
    IDS,
    ROUTES,
    isAnalyticsRoute,
  };
})();
