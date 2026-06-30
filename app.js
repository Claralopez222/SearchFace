// ─── Estado ──────────────────────────────────────────────────────────────────
let activeFilters = ['publico', 'privado'];
let debounceTimer  = null;

// ─── Ícone externo reutilizado nos cards ──────────────────────────────────────
const ICON_EXTERNAL = `<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

const ICON_COPY = `<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

const ICON_CHECK = `<svg viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

// ─── Inicialização ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderNiches();
  bindSearchInput();
});

// ─── Renderiza tags de nicho a partir de data.js ──────────────────────────────
function renderNiches() {
  const container = document.getElementById('niches-container');
  container.innerHTML = NICHOS.map(({ label, query }) =>
    `<button class="niche-tag" onclick="setNiche('${escapeAttr(query)}')">${escapeHtml(label)}</button>`
  ).join('');
}

// ─── Bind: Enter dispara geração, input limpa resultado vazio ─────────────────
function bindSearchInput() {
  const input = document.getElementById('query');

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(debounceTimer);
      generate();
    }
  });

  // Enquanto digita, atualiza com pequeno debounce
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (input.value.trim().length > 1) generate();
    }, 400);
  });
}

// ─── Seta nicho pelo clique na tag ───────────────────────────────────────────
function setNiche(val) {
  const input = document.getElementById('query');
  input.value = val;
  input.focus();
  generate();
}

// ─── Alterna filtros de tipo de grupo ────────────────────────────────────────
function toggleFilter(el, val) {
  el.classList.toggle('active');
  activeFilters = activeFilters.includes(val)
    ? activeFilters.filter(f => f !== val)
    : [...activeFilters, val];

  // Re-renderiza se já há resultados visíveis
  const query = document.getElementById('query').value.trim();
  if (query) generate();
}

// ─── Geração e renderização dos cards ────────────────────────────────────────
function generate() {
  const raw       = sanitize(document.getElementById('query').value);
  const section   = document.getElementById('results-section');
  const container = document.getElementById('results');
  const emptyEl   = document.getElementById('empty-state');
  const countEl   = document.getElementById('results-count');

  if (!raw || activeFilters.length === 0) {
    section.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';
  section.style.display = 'block';

  const terms = buildTerms(raw);
  const icon  = getIcon(raw);

  // Fade-out rápido antes de trocar o conteúdo
  container.style.opacity = '0';
  container.style.transform = 'translateY(6px)';

  setTimeout(() => {
    container.innerHTML = terms.map((t, i) => buildCard(t, i, icon)).join('');
    countEl.textContent = `${terms.length} buscas geradas para "${raw}"`;

    // Anima entrada dos cards com stagger
    container.style.opacity = '1';
    container.style.transform = 'translateY(0)';

    container.querySelectorAll('.result-card').forEach((card, i) => {
      card.style.animationDelay = `${i * 40}ms`;
      card.classList.add('card-enter');
    });
  }, 120);
}

// ─── Monta HTML de um card ────────────────────────────────────────────────────
function buildCard(term, index, icon) {
  const preferred  = index % 2 === 0 ? 'publico' : 'privado';
  const tipoKey    = activeFilters.includes(preferred) ? preferred : activeFilters[0];
  const isPublic   = tipoKey === 'publico';
  const tipoLabel  = isPublic ? 'Público' : 'Privado';
  const badgeClass = isPublic ? 'badge-pub' : 'badge-pri';
  const url = `https://www.facebook.com/groups/search/groups_home?q=${encodeURIComponent(term.query)}`;const FACEBOOK_FILTER = 'eyJncm91cHNfZmlsdGVyIjoie1wibmFtZVwiOlwiZ3JvdXBzXCJ9In0%3D';
const url = `https://www.facebook.com/groups/search/?q=${encodeURIComponent(term.query)}&filters=${FACEBOOK_FILTER}`;
  const queryId    = `query-${index}`;

  return `
    <div class="result-card">
      <div class="result-icon" aria-hidden="true">${icon}</div>
      <div class="result-body">
        <div class="result-head">
          <span class="result-title">${escapeHtml(term.label)}</span>
          <span class="badge ${badgeClass}">${tipoLabel}</span>
        </div>
        <div class="result-query-row">
          <code class="result-query" id="${queryId}">"${escapeHtml(term.query)}"</code>
          <button class="copy-btn" onclick="copyQuery('${escapeAttr(term.query)}', this)" aria-label="Copiar termo de busca" title="Copiar">
            ${ICON_COPY}
          </button>
        </div>
        <div class="result-desc">${escapeHtml(term.desc)}</div>
        <a class="result-link" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="Abrir busca no Facebook para ${escapeAttr(term.label)}">
          ${ICON_EXTERNAL} Abrir no Facebook
        </a>
      </div>
    </div>`;
}

// ─── Copia o termo de busca para o clipboard ──────────────────────────────────
function copyQuery(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    btn.classList.add('copied');
    btn.innerHTML = ICON_CHECK;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = ICON_COPY;
    }, 1800);
  }).catch(() => {
    // Fallback para browsers sem clipboard API
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

// ─── Utilitários ─────────────────────────────────────────────────────────────
function sanitize(str) {
  return str.trim().replace(/[<>"'&]/g, '').slice(0, 120);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return str.replace(/'/g, "\\'");
}