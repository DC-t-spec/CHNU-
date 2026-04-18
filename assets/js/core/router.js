// assets/js/core/router.js

const routes = new Map();

export function registerRoute(path, handler) {
  routes.set(path, handler);
}

export function getCurrentHash() {
  return window.location.hash || '#dashboard';
}

export function parseHash(hash = getCurrentHash()) {
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const [pathPart = '', queryString = ''] = cleanHash.split('?');

  const normalizedPath = pathPart
    ? (pathPart.startsWith('/') ? pathPart : `/${pathPart}`)
    : '/';

  const segments = normalizedPath.split('/').filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(queryString).entries());

  return {
    raw: hash,
    fullPath: normalizedPath,
    segments,
    query,
  };
}

/* ===============================
   MATCH ROUTE
=============================== */

function matchRoute(hash = getCurrentHash()) {
  const parsed = parseHash(hash);

  for (const [routePath, handler] of routes.entries()) {
    const routeSegments = routePath.split('/').filter(Boolean);
    const urlSegments = parsed.segments;

    if (routeSegments.length !== urlSegments.length) continue;

    const pathParams = {};
    let isMatch = true;

    for (let i = 0; i < routeSegments.length; i += 1) {
      const routeSegment = routeSegments[i];
      const urlSegment = urlSegments[i];

      if (routeSegment.startsWith(':')) {
        pathParams[routeSegment.slice(1)] = urlSegment;
        continue;
      }

      if (routeSegment !== urlSegment) {
        isMatch = false;
        break;
      }
    }

    if (isMatch) {
      return {
        handler,
        route: routePath,
        params: {
          ...parsed.query,
          ...pathParams,
        },
        pathParams,
        query: parsed.query,
        segments: parsed.segments,
        fullPath: parsed.fullPath,
      };
    }
  }

  return {
    handler: null,
    route: null,
    params: parsed.query,
    pathParams: {},
    query: parsed.query,
    segments: parsed.segments,
    fullPath: parsed.fullPath,
  };
}

/* ===============================
   SIDEBAR ACTIVE
=============================== */

function updateSidebarActiveState(route = '') {
  const sidebarLinks = document.querySelectorAll('.sidebar__link');
  if (!sidebarLinks.length) return;

  sidebarLinks.forEach((link) => {
    link.classList.remove('active');

    const target = link.getAttribute('href');
    if (!target) return;

    if (target === '#dashboard' && route === '/dashboard') {
      link.classList.add('active');
      return;
    }

    if (target === '#documents' && route.startsWith('/documents') && route !== '/documents/new') {
      link.classList.add('active');
      return;
    }

    if (target === '#documents/new' && route === '/documents/new') {
      link.classList.add('active');
      return;
    }

    if (target === '#inventory' && (route === '/inventory' || route === '/inventory-balances')) {
      link.classList.add('active');
      return;
    }

    if (target === '#inventory-balances' && route === '/inventory-balances') {
      link.classList.add('active');
      return;
    }

    if (target === '#inventory-ledger' && route === '/inventory-ledger') {
      link.classList.add('active');
    }
  });
}

/* ===============================
   RUN ROUTE
=============================== */

export async function runCurrentRoute() {
  const resolved = matchRoute();
  const appRoot = document.querySelector('#app');

  updateSidebarActiveState(resolved.route || '');

  if (!resolved.handler) {
    if (appRoot) {
      appRoot.innerHTML = `
        <section class="page-shell">
          <div class="card">
            <h2>Página não encontrada</h2>
            <p>A rota solicitada não existe.</p>
          </div>
        </section>
      `;
    }
    return;
  }

  try {
    await resolved.handler({
      route: resolved.route,
      fullPath: resolved.fullPath,
      params: resolved.params,
      pathParams: resolved.pathParams,
      query: resolved.query,
      segments: resolved.segments,
    });
  } catch (error) {
    console.error('Erro ao renderizar rota:', error);

    if (appRoot) {
      appRoot.innerHTML = `
        <section class="page-shell">
          <div class="card">
            <h2>Erro ao abrir a página</h2>
            <p>${error?.message || 'Erro inesperado.'}</p>
          </div>
        </section>
      `;
    }
  }
}

/* ===============================
   NAVIGATION
=============================== */

export async function navigateTo(hash) {
  if (window.location.hash === hash) {
    await runCurrentRoute();
    return;
  }

  window.location.hash = hash;
}

export function startRouter() {
  window.addEventListener('hashchange', runCurrentRoute);
  runCurrentRoute();
}
