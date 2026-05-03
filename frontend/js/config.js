// Runtime-safe configuration for non-module scripts.
(function setAppConfig() {
  const { protocol } = window.location;
  const openedAsFile = protocol === 'file:';

  // Same-origin `/api` when the UI is served by the backend (any host/port: localhost,
  // LAN IP, or custom PORT in .env). Only file:// lacks an origin — default backend URL.
  const apiBase = openedAsFile ? 'http://127.0.0.1:3000/api' : `${window.location.origin}/api`;

  window.APP_CONFIG = {
    API_BASE: apiBase
  };
})();
