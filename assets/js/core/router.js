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

function renderRouterError(error, parsed) {
  const app = document.querySelector('#app');
  if (!app) return;

  console.error('Router render error:', error);

  app.innerHTML = `
    <section class="page-shell">
      <div class="card">
        <div class="card-header">
          <h3>Erro ao abrir página</h3>
        </div>

        <div class="card-body" style="display:grid;gap:12px;">
          <div><strong>Rota:</strong> ${parsed?.fullPath || '—'}</div>
          <div><strong>Mensagem:</strong> ${error?.message || 'Erro desconhecido'}</div>

          <div>
            <a class="btn btn-secondary" href="#dashboard">Ir para dashboard</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function resolveRoute(hash = getCurrentHash()) {
  const parsed = parseHash(hash);
  const handler = routes.get(parsed.fullPath);

  return {
    parsed,
    handler,
  };
}

function setActiveSidebarLink() {
  const { fullPath } = parseHash();

  const links = document.querySelectorAll('.sidebar .nav-link, .sidebar a');

  links.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const linkPath = href.startsWith('#')
      ? parseHash(href).fullPath
      : null;

    const isActive = linkPath === fullPath;
    link.classList.toggle('active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

export function startRouter(options = {}) {
  const { notFound } = options;

  async function renderCurrentRoute() {
    if (!window.location.hash) {
      window.location.hash = '#dashboard';
      return;
    }

    const { parsed, handler } = resolveRoute();

    setActiveSidebarLink();

    if (!handler) {
      if (typeof notFound === 'function') {
        try {
          await notFound(parsed);
        } catch (error) {
          renderRouterError(error, parsed);
        }
      } else {
        renderRouterError(new Error('Rota não encontrada.'), parsed);
      }
      return;
    }

    try {
      await handler(parsed);
    } catch (error) {
      renderRouterError(error, parsed);
    }
  }

  window.addEventListener('hashchange', renderCurrentRoute);
  window.addEventListener('load', renderCurrentRoute);

  renderCurrentRoute();
}
