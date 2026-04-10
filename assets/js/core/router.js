
const routes = new Map();

export function registerRoute(path, handler) { 
  routes.set(path, handler);
}

export function getCurrentHash() {
  return window.location.hash || '#dashboard';
}


export function parseHash(hash = getCurrentHash()) {
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const [pathPart, queryString = ''] = cleanHash.split('?');

  const normalizedPath = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  const segments = normalizedPath.split('/').filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(queryString).entries());

  return {
    raw: hash,
    fullPath: normalizedPath,
    segments,
    query,
  };
}

export function resolveRoute(hash = getCurrentHash()) {
  const parsed = parseHash(hash);

  if (routes.has(parsed.fullPath)) {
    return {
      handler: routes.get(parsed.fullPath),
      route: parsed.fullPath,
      params: parsed.query,
      segments: parsed.segments,
    };
  }

  return {
    handler: null,
    route: null,
    params: parsed.query,
    segments: parsed.segments,
  };
}

function updateSidebarActiveState(route) {
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
      return;
    }
  });
}
export async function runCurrentRoute() {
  const resolved = resolveRoute();
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
      params: resolved.params,
      segments: resolved.segments,
    });
  } catch (error) {
    console.error('Erro ao renderizar rota:', error);

    if (appRoot) {
      appRoot.innerHTML = `
        <section class="page-shell">
          <div class="card">
            <h2>Erro ao abrir a página</h2>
            <p>${error?.message || 'Ocorreu um erro inesperado ao renderizar a rota.'}</p>
          </div>
        </section>
      `;
    }
  }
}

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
