(() => {
  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const staticRoutes = new Set([
    '/issues',
    '/harassment',
    '/extortion',
    '/public-safety',
    '/road-transport',
    '/load-shedding',
    '/illegal-occupation',
    '/rickshaw',
    '/explore',
    '/search',
    '/more',
    '/report',
    '/en',
    '/en/issues',
    '/en/harassment',
    '/en/extortion',
    '/en/public-safety',
    '/en/road-transport',
    '/en/load-shedding',
    '/en/illegal-occupation',
    '/en/rickshaw',
    '/en/explore',
    '/en/search',
    '/en/more',
    '/en/report',
  ]);
  const dynamicRoute =
    /^\/(?:en\/)?(?:report-detail|location|subject|category|topic)\/[^/]+$/;

  if (!staticRoutes.has(normalizedPath) && !dynamicRoute.test(normalizedPath)) {
    return;
  }

  try {
    window.sessionStorage.setItem('sobaike_spa_redirect_v1', window.location.href);
  } catch {
    // The root app still handles its default route if storage is unavailable.
  }

  window.location.replace('/');
})();
