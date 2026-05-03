// Runtime-safe configuration for non-module scripts.
(function setAppConfig() {
  const { protocol } = window.location;
  const openedAsFile = protocol === 'file:';
  const hostedOnGithubPages = window.location.hostname.endsWith('.github.io');
  // REST backend base, for example: 'https://wizplanning-api.onrender.com'
  const deployedApiBase = '';
  // Google Apps Script backend base.
  const deployedAppsScriptApiBase = 'https://script.google.com/macros/s/AKfycbxwobTuDMafuitKSFXKzN6B95QRvdMRR00GrHMfC73C4n-8ks94atyTYbCeHdt7qGd3/exec';
  const configuredApiBase =
    window.WIZPLANNING_API_BASE ||
    localStorage.getItem('wizplanning:apiBase') ||
    deployedApiBase;
  const configuredAppsScriptApiBase =
    window.WIZPLANNING_APPS_SCRIPT_API_BASE ||
    localStorage.getItem('wizplanning:appsScriptApiBase') ||
    deployedAppsScriptApiBase;

  const apiBase = configuredApiBase
    ? configuredApiBase.replace(/\/$/, '').replace(/\/api$/, '') + '/api'
    : openedAsFile
      ? 'http://127.0.0.1:3000/api'
      : `${window.location.origin}/api`;

  window.APP_CONFIG = {
    API_BASE: apiBase,
    APPS_SCRIPT_API_BASE: configuredAppsScriptApiBase
      ? configuredAppsScriptApiBase.replace(/\/$/, '')
      : '',
    APPS_SCRIPT_MODE: Boolean(configuredAppsScriptApiBase) && !configuredApiBase,
    STATIC_MODE: hostedOnGithubPages && !configuredApiBase && !configuredAppsScriptApiBase
  };
})();
