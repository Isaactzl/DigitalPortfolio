// Runs before first paint so the page never flashes the wrong colours.
(function () {
  var saved;
  try {
    saved = localStorage.getItem('lamp');
  } catch {
    // Storage blocked: fall back to the system preference below.
  }
  var dark = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.lamp = saved || (dark ? 'on' : 'off');
})();
