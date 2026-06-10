// ── API ────────────────────────────────────────────
async function api(url, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  const token = localStorage.getItem('token');
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body)  opts.body = JSON.stringify(body);
  try {
    const r = await fetch(url, opts);
    return await r.json();
  } catch {
    return { error: 'Error de conexión' };
  }
}

// ── Auth helpers ───────────────────────────────────
function estaLogueado() { return !!localStorage.getItem('token'); }

function actualizarNavbar() {
  const username = localStorage.getItem('username');
  const navAuth = document.getElementById('nav-auth');
  const navUser = document.getElementById('nav-user');
  if (!navAuth || !navUser) return;
  if (username) {
    navAuth.classList.add('d-none');
    navUser.classList.remove('d-none');
    navUser.classList.add('d-flex');
    const el = document.getElementById('nav-username');
    if (el) el.textContent = localStorage.getItem('nombre') || username;
  }
}

function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('nombre');
  location.href = '/';
}

// ── Tarjeta de receta ──────────────────────────────
function tarjetaReceta(r) {
  const dif = r.dificultad || 'Fácil';
  const difClass = dif === 'Fácil' ? 'facil' : dif === 'Media' ? 'media' : 'dificil';
  const estrellas = r.calificacion_promedio
    ? '★'.repeat(Math.round(r.calificacion_promedio)) + '☆'.repeat(5 - Math.round(r.calificacion_promedio))
    : '';
  return `
    <div class="col-sm-6 col-lg-4">
      <a href="/receta.html?id=${r.id}" class="text-decoration-none">
        <div class="receta-card card h-100">
          <img src="${r.imagen_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'}"
               alt="${r.titulo}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'">
          <div class="card-body d-flex flex-column gap-2">
            <div class="d-flex justify-content-between align-items-start">
              <span class="chip chip-cat">${r.categoria_icono || '🍽️'} ${r.categoria_nombre || 'Sin categoría'}</span>
              <span class="chip chip-${difClass}">${dif}</span>
            </div>
            <div class="titulo">${r.titulo}</div>
            <div class="autor">por ${r.autor || r.username}</div>
            <div class="d-flex gap-3 meta-icon mt-auto pt-1">
              ${r.tiempo_prep || r.tiempo_coccion ? `<span>${(r.tiempo_prep||0)+(r.tiempo_coccion||0)} min</span>` : ''}
              ${r.porciones ? `<span>${r.porciones} porciones</span>` : ''}
              ${r.total_favoritos ? `<span>${r.total_favoritos} guardados</span>` : ''}
            </div>
            ${estrellas ? `<div class="estrellas" style="font-size:.85rem">${estrellas} <small style="color:var(--muted)">(${r.calificacion_promedio})</small></div>` : ''}
          </div>
        </div>
      </a>
    </div>`;
}

// ── Toast ──────────────────────────────────────────
function toast(msg, tipo = 'success') {
  let cont = document.getElementById('toast-cont');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'toast-cont';
    cont.className = 'toast-container';
    document.body.appendChild(cont);
  }
  const el = document.createElement('div');
  el.className = `mi-toast ${tipo}`;
  el.textContent = msg;
  cont.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Estrellas interactivas ─────────────────────────
function initEstrellas(containerId, inputId) {
  const cont = document.getElementById(containerId);
  const inp  = document.getElementById(inputId);
  if (!cont || !inp) return;
  let val = 0;
  for (let i = 1; i <= 5; i++) {
    const s = document.createElement('span');
    s.textContent = '☆';
    s.style.cssText = 'font-size:1.6rem;cursor:pointer;color:#fbbf24;';
    s.dataset.val = i;
    s.addEventListener('click', () => { val = i; inp.value = i; pintarEstrellas(cont, i); });
    s.addEventListener('mouseenter', () => pintarEstrellas(cont, i));
    s.addEventListener('mouseleave', () => pintarEstrellas(cont, val));
    cont.appendChild(s);
  }
}
function pintarEstrellas(cont, n) {
  cont.querySelectorAll('span').forEach((s, i) => { s.textContent = i < n ? '★' : '☆'; });
}
