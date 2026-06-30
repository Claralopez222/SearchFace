// ─── Estado ──────────────────────────────────────────────────────────────────
let activeFilters  = ['publico', 'privado'];
let debounceTimer  = null;
let currentTerms   = [];
let currentQuery   = '';
let openedCount    = 0;
let searchCount    = 0;

// ─── Ícones ───────────────────────────────────────────────────────────────────
const ICON_EXTERNAL = `<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
const ICON_COPY     = `<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const ICON_CHECK    = `<svg viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const ICON_TAG      = `<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41L12 2Z"/><path d="M7 7h.01"/></svg>`;
const ICON_TRASH    = `<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(localStorage.getItem('theme') || 'light');
  renderNiches();
  bindSearchInput();
  renderHistory();
  renderProdutosSalvos();
  loadStats();
  checkShareParam();
});

// ─── Tema ─────────────────────────────────────────────────────────────────────
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

// ─── Nichos ───────────────────────────────────────────────────────────────────
function renderNiches() {
  const container = document.getElementById('niches-container');
  container.innerHTML = NICHOS.map(({ label, query }) =>
    `<button class="niche-tag" onclick="setNiche('${escapeAttr(query)}')">${escapeHtml(label)}</button>`
  ).join('');
}

// ─── Autocomplete ─────────────────────────────────────────────────────────────
function bindSearchInput() {
  const input = document.getElementById('query');
  const list  = document.getElementById('autocomplete-list');

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { clearTimeout(debounceTimer); closeAutocomplete(); generate(); }
    if (e.key === 'Escape') closeAutocomplete();
  });

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const val = input.value.trim();

    // Autocomplete
    if (val.length >= 1) {
      const suggestions = NICHOS
        .filter(n => n.label.toLowerCase().includes(val.toLowerCase()) || n.query.toLowerCase().includes(val.toLowerCase()))
        .slice(0, 6);

      if (suggestions.length > 0) {
        list.innerHTML = suggestions.map(s =>
          `<li role="option" onclick="setNiche('${escapeAttr(s.query)}')">${escapeHtml(s.label)}</li>`
        ).join('');
        list.style.display = 'block';
      } else {
        closeAutocomplete();
      }
    } else {
      closeAutocomplete();
    }

    // Debounce generate
    debounceTimer = setTimeout(() => {
      if (val.length > 1) generate();
    }, 400);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.input-wrapper')) closeAutocomplete();
  });
}

function closeAutocomplete() {
  document.getElementById('autocomplete-list').style.display = 'none';
}

function setNiche(val) {
  const input = document.getElementById('query');
  input.value = val;
  input.focus();
  closeAutocomplete();
  generate();
}

// ─── Filtros ──────────────────────────────────────────────────────────────────
function toggleFilter(el, val) {
  el.classList.toggle('active');
  el.setAttribute('aria-pressed', el.classList.contains('active'));
  activeFilters = activeFilters.includes(val)
    ? activeFilters.filter(f => f !== val)
    : [...activeFilters, val];
  const query = document.getElementById('query').value.trim();
  if (query) generate();
}

// ─── Gerar resultados ─────────────────────────────────────────────────────────
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

  currentQuery = raw;
  currentTerms = buildTerms(raw);

  const icon     = getIcon(raw);
  const produtos = getProdutosAfiliados(raw);

  container.style.opacity   = '0';
  container.style.transform = 'translateY(6px)';

  setTimeout(() => {
    container.innerHTML = currentTerms.map((t, i) => buildCard(t, i, icon)).join('');

    const prodSection = document.getElementById('produtos-section');
    if (produtos.length > 0) {
      prodSection.style.display = 'block';
      prodSection.innerHTML = buildProdutosSection(produtos);
    } else {
      prodSection.style.display = 'none';
      prodSection.innerHTML = '';
    }

    countEl.textContent = `${currentTerms.length} buscas geradas para "${raw}"`;

    container.style.opacity   = '1';
    container.style.transform = 'translateY(0)';

    container.querySelectorAll('.result-card').forEach((card, i) => {
      card.style.animationDelay = `${i * 40}ms`;
      card.classList.add('card-enter');
    });

    // Salvar histórico e stats
    saveToHistory(raw);
    searchCount++;
    saveStats();
    updateStatsUI();
  }, 120);
}

// ─── Card de grupo ────────────────────────────────────────────────────────────
function buildCard(term, index, icon) {
  const preferred  = index % 2 === 0 ? 'publico' : 'privado';
  const tipoKey    = activeFilters.includes(preferred) ? preferred : activeFilters[0];
  const isPublic   = tipoKey === 'publico';
  const tipoLabel  = isPublic ? 'Público' : 'Privado';
  const badgeClass = isPublic ? 'badge-pub' : 'badge-pri';
  const url        = `https://www.facebook.com/search/groups/?q=${encodeURIComponent(term.query)}`;

  return `
    <div class="result-card">
      <div class="result-icon" aria-hidden="true">${icon}</div>
      <div class="result-body">
        <div class="result-head">
          <span class="result-title">${escapeHtml(term.label)}</span>
          <span class="badge ${badgeClass}">${tipoLabel}</span>
        </div>
        <div class="result-query-row">
          <code class="result-query">"${escapeHtml(term.query)}"</code>
          <button class="copy-btn" onclick="copyQuery('${escapeAttr(term.query)}', this)" aria-label="Copiar termo" title="Copiar">
            ${ICON_COPY}
          </button>
        </div>
        <div class="result-desc">${escapeHtml(term.desc)}</div>
        <a class="result-link" href="${url}" target="_blank" rel="noopener noreferrer"
           onclick="trackOpen()" aria-label="Abrir busca no Facebook para ${escapeAttr(term.label)}">
          ${ICON_EXTERNAL} Abrir no Facebook
        </a>
        <p class="result-hint">💡 Se aparecer resultado geral, clique em <strong>Grupos</strong> no menu lateral</p>
      </div>
    </div>`;
}

// ─── Seção de produtos afiliados ──────────────────────────────────────────────
function buildProdutosSection(produtos) {
  const cards = produtos.map(p => {
    const isHot = parseFloat(String(p.commission).replace('%','')) >= 50;
    return `
      <div class="produto-card card-enter">
        <div class="produto-header">
          <div class="produto-icon" aria-hidden="true">${ICON_TAG}</div>
          <div class="produto-meta">
            <span class="produto-nome">${escapeHtml(p.name)}</span>
            <div class="produto-badges">
              <span class="badge badge-price">${escapeHtml(p.price)}</span>
              <span class="badge badge-commission">💰 ${escapeHtml(p.commission)} comissão</span>
              ${isHot ? '<span class="badge badge-hot">🔥 Em alta</span>' : ''}
            </div>
          </div>
        </div>
        <p class="produto-desc">${escapeHtml(p.desc)}</p>
        <div class="produto-actions">
          <a class="result-link produto-link" href="${escapeAttr(p.link)}" target="_blank" rel="noopener noreferrer">
            ${ICON_EXTERNAL} Abrir link de afiliado
          </a>
          <button class="copy-btn" onclick="copyQuery('${escapeAttr(p.link)}', this)" title="Copiar link de afiliado">
            ${ICON_COPY}
          </button>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="produtos-header">
      <span class="label">🎯 Produto para promover nesses grupos</span>
    </div>
    ${cards}`;
}

// ─── Copiar todos os links ────────────────────────────────────────────────────
function copyAllLinks() {
  if (!currentTerms.length) return;
  const lines = currentTerms.map(t =>
    `${t.label}\nhttps://www.facebook.com/search/groups/?q=${encodeURIComponent(t.query)}`
  ).join('\n\n');

  const btn = document.getElementById('btn-copy-all');
  navigator.clipboard.writeText(lines).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copiado!`;
    setTimeout(() => { btn.innerHTML = orig; }, 2000);
  });
}

// ─── Exportar .txt ────────────────────────────────────────────────────────────
function exportLinks() {
  if (!currentTerms.length) return;
  const lines = [
    `Buscador de Grupos — Nicho: ${currentQuery}`,
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    '',
    ...currentTerms.map(t =>
      `${t.label}\nhttps://www.facebook.com/search/groups/?q=${encodeURIComponent(t.query)}`
    )
  ].join('\n\n');

  const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `grupos-${currentQuery.replace(/\s+/g,'-')}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─── Compartilhar busca ───────────────────────────────────────────────────────
function shareSearch() {
  if (!currentQuery) return;
  const url = `${location.origin}${location.pathname}?q=${encodeURIComponent(currentQuery)}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Link copiado! Cole e compartilhe 🔗');
  });
}

function checkShareParam() {
  const params = new URLSearchParams(location.search);
  const q = params.get('q');
  if (q) {
    document.getElementById('query').value = q;
    setTimeout(generate, 300);
  }
}

// ─── Histórico ────────────────────────────────────────────────────────────────
function saveToHistory(query) {
  let history = getHistory();
  history = [query, ...history.filter(h => h !== query)].slice(0, 8);
  localStorage.setItem('fb_search_history', JSON.stringify(history));
  renderHistory();
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem('fb_search_history') || '[]'); }
  catch { return []; }
}

function renderHistory() {
  const section = document.getElementById('history-section');
  const tags    = document.getElementById('history-tags');
  const history = getHistory();

  if (history.length === 0) { section.style.display = 'none'; return; }

  section.style.display = 'block';
  tags.innerHTML = history.map(h =>
    `<button class="history-tag" onclick="setNiche('${escapeAttr(h)}')">${escapeHtml(h)}</button>`
  ).join('');
}

function clearHistory() {
  localStorage.removeItem('fb_search_history');
  renderHistory();
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function loadStats() {
  searchCount = parseInt(localStorage.getItem('fb_search_count') || '0');
  openedCount = parseInt(localStorage.getItem('fb_opened_count') || '0');
  updateStatsUI();
}

function saveStats() {
  localStorage.setItem('fb_search_count', searchCount);
  localStorage.setItem('fb_opened_count', openedCount);
}

function trackOpen() {
  openedCount++;
  saveStats();
  updateStatsUI();
}

function updateStatsUI() {
  const el = document.getElementById('hero-stats');
  if (searchCount === 0 && openedCount === 0) { el.style.display = 'none'; return; }
  el.style.display = 'flex';
  document.getElementById('stat-searches').textContent = `${searchCount} busca${searchCount !== 1 ? 's' : ''} realizada${searchCount !== 1 ? 's' : ''}`;
  document.getElementById('stat-opened').textContent   = `${openedCount} grupo${openedCount !== 1 ? 's' : ''} aberto${openedCount !== 1 ? 's' : ''}`;
}

// ─── Cadastro de produtos ─────────────────────────────────────────────────────
function toggleAddProduto() {
  const form = document.getElementById('add-produto-form');
  const btn  = document.getElementById('btn-toggle-add');
  const open = form.style.display === 'none';
  form.style.display = open ? 'block' : 'none';
  btn.textContent    = open ? 'Recolher' : 'Expandir';
}

function addProduto() {
  const nome     = document.getElementById('f-nome').value.trim();
  const preco    = document.getElementById('f-preco').value.trim();
  const comissao = document.getElementById('f-comissao').value.trim();
  const nichos   = document.getElementById('f-nichos').value.trim();
  const desc     = document.getElementById('f-desc').value.trim();
  const link     = document.getElementById('f-link').value.trim();
  const feedback = document.getElementById('form-feedback');

  if (!nome || !link || !nichos) {
    feedback.textContent = '⚠️ Nome, link e nichos são obrigatórios.';
    feedback.className   = 'form-feedback error';
    return;
  }

  const produto = {
    name: nome,
    price: preco || '—',
    commission: comissao || '—',
    nichos: nichos.split(',').map(n => n.trim().toLowerCase()).filter(Boolean),
    desc: desc || '',
    link,
  };

  const saved = getSavedProdutos();
  saved.push(produto);
  localStorage.setItem('fb_produtos', JSON.stringify(saved));

  feedback.textContent = '✅ Produto salvo!';
  feedback.className   = 'form-feedback success';

  ['f-nome','f-preco','f-comissao','f-nichos','f-desc','f-link'].forEach(id => {
    document.getElementById(id).value = '';
  });

  setTimeout(() => { feedback.textContent = ''; }, 3000);
  renderProdutosSalvos();
}

function getSavedProdutos() {
  try { return JSON.parse(localStorage.getItem('fb_produtos') || '[]'); }
  catch { return []; }
}

function deleteProduto(index) {
  const saved = getSavedProdutos();
  saved.splice(index, 1);
  localStorage.setItem('fb_produtos', JSON.stringify(saved));
  renderProdutosSalvos();
}

function renderProdutosSalvos() {
  const list = document.getElementById('produtos-salvos-lista');
  if (!list) return;
  const saved = getSavedProdutos();
  if (saved.length === 0) { list.innerHTML = ''; return; }

  list.innerHTML = `
    <div class="divider" style="margin:1rem 0"></div>
    <span class="label">Produtos cadastrados</span>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
      ${saved.map((p, i) => `
        <div class="saved-produto-row">
          <div class="saved-produto-info">
            <span class="saved-produto-nome">${escapeHtml(p.name)}</span>
            <span class="saved-produto-nichos">${escapeHtml(p.nichos.join(', '))}</span>
          </div>
          <button class="copy-btn" onclick="deleteProduto(${i})" title="Remover">
            ${ICON_TRASH}
          </button>
        </div>
      `).join('')}
    </div>`;
}

// ─── getProdutosAfiliados — combina fixos + salvos ───────────────────────────
function getProdutosAfiliados(raw) {
  const query = raw.toLowerCase();
  const todos = [...PRODUTOS_AFILIADOS, ...getSavedProdutos()];
  return todos.filter(({ nichos }) =>
    nichos.some(n => query.includes(n) || n.includes(query))
  );
}

// ─── Copiar query ─────────────────────────────────────────────────────────────
function copyQuery(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    btn.classList.add('copied');
    btn.innerHTML = ICON_CHECK;
    setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = ICON_COPY; }, 1800);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ─── Utilitários ──────────────────────────────────────────────────────────────
function sanitize(str) {
  return str.trim().replace(/[<>"'&]/g, '').slice(0, 120);
}
function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeAttr(str) {
  return String(str).replace(/'/g,"\\'");
}