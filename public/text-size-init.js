(function () {
  try {
    var stored = localStorage.getItem('sobaike-janao-text-size');
    var preference =
      stored === 'smaller' || stored === 'larger' || stored === 'default'
        ? stored
        : 'default';
    document.documentElement.setAttribute('data-text-size', preference);
  } catch (e) {
    document.documentElement.setAttribute('data-text-size', 'default');
  }
})();
