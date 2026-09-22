(() => {
  const stylesheet = document.getElementById('site-font-stylesheet');
  if (!(stylesheet instanceof HTMLLinkElement)) return;

  // Keep Google Fonts out of the render-blocking path while preserving the
  // existing Noto Sans / Noto Sans Bengali typography once the app is ready.
  stylesheet.rel = 'stylesheet';
})();
