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

export async function runCurrentRoute() {
  const resolved = resolveRoute();
  const appRoot = document.querySelector('#app');

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

  await resolved.handler({
    route: resolved.route,
    params: resolved.params,
    segments: resolved.segments,
  });
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
