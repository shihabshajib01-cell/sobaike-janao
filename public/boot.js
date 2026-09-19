document.documentElement.classList.add('js');

(function applyInitialTheme() {
  try {
    var stored = localStorage.getItem('sobaike-janao-theme') || localStorage.getItem('theme');
    var theme = 'light';
    if (stored === 'dark') {
      theme = 'dark';
    } else if (stored === 'system') {
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (_) {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.colorScheme = 'light';
    document.documentElement.classList.remove('dark');
  }
})();