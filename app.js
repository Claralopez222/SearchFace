// ─── Estado ──────────────────────────────────────────────────────────────────
let activeFilters  = ['publico', 'privado'];
let debounceTimer  = null;
let currentTerms   = [];
let currentQuery   = '';
let openedCount    = 0;
let searchCount    = 0;
let generateToken  = 0; // evita que uma chamada antiga de generate() sobrescreva uma mais recente

// ─── Storage namespace + versionamento de schema ─────────────────────────────
// Todas as chaves do localStorage usam este prefixo para evitar colisão com
// outros scripts/projetos rodando no mesmo domínio.
const STORAGE_PREFIX = 'buscadorGrupos:';
const SCHEMA_VERSION  = 1;
const MAX_SAVED_PRODUTOS = 50;

const KEYS = {
  theme:        STORAGE_PREFIX + 'theme',
  history:      STORAGE_PREFIX + 'history',
  searchCount:  STORAGE_PREFIX + 'searchCount',
  openedCount:  STORAGE_PREFIX + 'openedCount',
  produtos:     STORAGE_PREFIX + 'produtos',
  schemaVer:    STORAGE_PREFIX + 'schemaVersion',
};

// Chaves antigas (sem namespace) usadas em versões anteriores — migradas uma vez.
const LEGACY_KEYS = {
  theme:       'theme',
  history:     'fb_search_history',
  searchCount: 'fb_search_count',
  openedCount: 'fb_opened_count',
  produtos:    'fb_produtos',
};

// Migra dados de chaves antigas para o novo namespace, uma única vez,
// e marca a versão do schema. Roda no início do DOMContentLoaded.
function migrateStorage() {
  const alreadyMigrated = localStorage.getItem(KEYS.schemaVer);
  if (alreadyMigrated) return;

  Object.keys(LEGACY_KEYS).forEach(name => {
    const oldVal = localStorage.getItem(LEGACY_KEYS[name]);
    if (oldVal !== null && localStorage.getItem(KEYS[name]) === null) {
      localStorage.setItem(KEYS[name], oldVal);
      localStorage.removeItem(LEGACY_KEYS[name]);
    }
  });

  localStorage.setItem(KEYS.schemaVer, String(SCHEMA_VERSION));
}

// Lê e valida um array de JSON do localStorage, retornando [] em caso de
// dado ausente, corrompido ou com formato inesperado (não confia apenas no try/catch de parse).
function readJsonArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Garante que um produto salvo tenha todos os campos esperados, no formato
// esperado, preenchendo valores ausentes com defaults seguros. Protege contra
// dados antigos/corrompidos quebrarem a renderização (ex: nichos não-array).
function normalizeProduto(p) {
  if (!p || typeof p !== 'object') return null;
  const name = typeof p.name === 'string' ? p.name.trim() : '';
  const link = typeof p.link === 'string' ? p.link.trim() : '';
  if (!name || !link) return null; // produto inválido, descarta

  let nichos = p.nichos;
  if (typeof nichos === 'string') nichos = nichos.split(',');
  if (!Array.isArray(nichos)) nichos = [];
  nichos = nichos.map(n => String(n).trim().toLowerCase()).filter(Boolean);

  return {
    name,
    link,
    price:      typeof p.price === 'string' && p.price ? p.price : '—',
    commission: typeof p.commission === 'string' && p.commission ? p.commission : '—',
    desc:       typeof p.desc === 'string' ? p.desc : '',
    nichos,
  };
}

// ─── Ícones ───────────────────────────────────────────────────────────────────
const ICON_EXTERNAL = `<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
const ICON_COPY     = `<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const ICON_CHECK    = `<svg viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const ICON_TAG      = `<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41L12 2Z"/><path d="M7 7h.01"/></svg>`;
const ICON_TRASH    = `<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;const ICON_TRASH    = `<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
const ICON_EDIT      = `<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>`;

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  migrateStorage(); // precisa rodar antes de qualquer leitura de localStorage
  applyTheme(getInitialTheme());
  renderNiches();
  bindSearchInput();
  renderHistory();
  renderProdutosSalvos();
  loadStats();
  checkShareParam();
});

// Prioridade: preferência salva pelo usuário > preferência do sistema operacional > 'light'
function getInitialTheme() {
  const saved = localStorage.getItem(KEYS.theme);
  if (saved === 'light' || saved === 'dark') return saved;

  const prefersDark = window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

// ─── Tema ─────────────────────────────────────────────────────────────────────
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(KEYS.theme, next);
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
let autocompleteActiveIndex = -1; // índice da opção atualmente destacada via teclado

function bindSearchInput() {
  const input = document.getElementById('query');
  const list  = document.getElementById('autocomplete-list');

  input.addEventListener('keydown', (e) => {
    const isOpen = list.style.display === 'block';
    const items  = list.querySelectorAll('li');

    if (isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      if (items.length === 0) return;
      autocompleteActiveIndex = e.key === 'ArrowDown'
        ? (autocompleteActiveIndex + 1) % items.length
        : (autocompleteActiveIndex - 1 + items.length) % items.length;
      updateAutocompleteHighlight(items);
      return;
    }

    if (e.key === 'Enter') {
      clearTimeout(debounceTimer);
      // Se uma opção estiver destacada via teclado, seleciona ela em vez de buscar o texto digitado
      if (isOpen && autocompleteActiveIndex >= 0 && items[autocompleteActiveIndex]) {
        items[autocompleteActiveIndex].click();
        return;
      }
      closeAutocomplete();
      generate();
      return;
    }

    if (e.key === 'Escape') closeAutocomplete();
  });

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const val = input.value.trim();

    toggleClearButton(val.length > 0);

    // Autocomplete
    if (val.length >= 1) {
      const suggestions = NICHOS
        .filter(n => n.label.toLowerCase().includes(val.toLowerCase()) || n.query.toLowerCase().includes(val.toLowerCase()))
        .slice(0, 6);

      if (suggestions.length > 0) {
        autocompleteActiveIndex = -1;
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

function updateAutocompleteHighlight(items) {
  items.forEach((li, i) => {
    li.classList.toggle('active', i === autocompleteActiveIndex);
    li.setAttribute('aria-selected', i === autocompleteActiveIndex ? 'true' : 'false');
  });
  if (items[autocompleteActiveIndex]) {
    items[autocompleteActiveIndex].scrollIntoView({ block: 'nearest' });
  }
}

function closeAutocomplete() {
  document.getElementById('autocomplete-list').style.display = 'none';
  autocompleteActiveIndex = -1;
}

function setNiche(val) {
  const input = document.getElementById('query');
  input.value = val;
  input.focus();
  closeAutocomplete();
  toggleClearButton(true);
  generate();
}

function toggleClearButton(show) {
  const btn = document.getElementById('btn-clear-search');
  if (btn) btn.style.display = show ? 'inline-flex' : 'none';
}

// Limpa o campo de busca e volta ao estado inicial (sem resultados).
function clearSearch() {
  const input = document.getElementById('query');
  input.value = '';
  input.focus();
  closeAutocomplete();
  toggleClearButton(false);

  document.getElementById('results-section').style.display = 'none';
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('results').innerHTML = '';
  document.getElementById('produtos-section').innerHTML = '';

  currentQuery = '';
  currentTerms = [];
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

  // Token desta chamada específica — se outra generate() rodar antes do
  // setTimeout disparar, o token muda e esta execução antiga é descartada.
  const myToken = ++generateToken;

  setTimeout(() => {
    if (myToken !== generateToken) return; // resultado obsoleto, ignora

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
  // Usa o tipo real definido em buildTerms() ao invés de alternar por índice.
  // Se o tipo do termo não estiver entre os filtros ativos, cai no primeiro filtro ativo disponível.
  const tipoKey    = activeFilters.includes(term.tipo) ? term.tipo : activeFilters[0];
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
    const origemBadge = p.oficial
      ? '<span class="badge badge-oficial">⭐ Oficial</span>'
      : '<span class="badge badge-custom">📌 Seu produto</span>';
    return `
      <div class="produto-card card-enter">
        <div class="produto-header">
          <div class="produto-icon" aria-hidden="true">${ICON_TAG}</div>
          <div class="produto-meta">
            <span class="produto-nome">${escapeHtml(p.name)}</span>
            <div class="produto-badges">
              ${origemBadge}
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
          <button class="copy-btn" onclick="copyQuery('${escapeAttr(p.link)}', this)" aria-label="Copiar link de afiliado" title="Copiar link de afiliado">
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

  const groupLines = currentTerms.map(t =>
    `${t.label}\nhttps://www.facebook.com/search/groups/?q=${encodeURIComponent(t.query)}`
  ).join('\n\n');

  const produtos = getProdutosAfiliados(currentQuery);
  const produtoLines = produtos.length
    ? '\n\n--- Produto sugerido ---\n' + produtos.map(p => `${p.name}\n${p.link}`).join('\n\n')
    : '';

  const lines = groupLines + produtoLines;

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

  const produtos = getProdutosAfiliados(currentQuery);
  const produtoBlock = produtos.length
    ? ['--- Produto sugerido para esse nicho ---', ...produtos.map(p => `${p.name}\n${p.link}`)]
    : [];

  const lines = [
    `Buscador de Grupos — Nicho: ${currentQuery}`,
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    '',
    ...currentTerms.map(t =>
      `${t.label}\nhttps://www.facebook.com/search/groups/?q=${encodeURIComponent(t.query)}`
    ),
    ...(produtoBlock.length ? ['', ...produtoBlock] : []),
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

// checkShareParam roda dentro do DOMContentLoaded, então o DOM já está pronto —
// não precisamos mais de um setTimeout artificial para "esperar" os elementos existirem.
function checkShareParam() {
  const params = new URLSearchParams(location.search);
  const q = params.get('q');
  if (q) {
    document.getElementById('query').value = q;
    toggleClearButton(true);
    generate();
  }
}

// ─── Histórico ────────────────────────────────────────────────────────────────
function saveToHistory(query) {
  let history = getHistory();
  history = [query, ...history.filter(h => h !== query)].slice(0, 8);
  localStorage.setItem(KEYS.history, JSON.stringify(history));
  renderHistory();
}

function getHistory() {
  // Filtra qualquer entrada que não seja string (proteção contra dado corrompido)
  return readJsonArray(KEYS.history).filter(h => typeof h === 'string');
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
  localStorage.removeItem(KEYS.history);
  renderHistory();
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function loadStats() {
  searchCount = parseInt(localStorage.getItem(KEYS.searchCount) || '0', 10) || 0;
  openedCount = parseInt(localStorage.getItem(KEYS.openedCount) || '0', 10) || 0;
  updateStatsUI();
}

function saveStats() {
  localStorage.setItem(KEYS.searchCount, String(searchCount));
  localStorage.setItem(KEYS.openedCount, String(openedCount));
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

let editingIndex = null; // null = modo "adicionar", número = modo "editando"

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

  if (!isValidHttpUrl(link)) {
    feedback.textContent = '⚠️ Link inválido. Use uma URL completa (ex: https://...).';
    feedback.className   = 'form-feedback error';
    return;
  }

  const produto = normalizeProduto({
    name: nome,
    price: preco,
    commission: comissao,
    nichos,
    desc,
    link,
  });

  const saved = getSavedProdutos();

  // Limite de produtos salvos para evitar degradar a performance do filtro
  // de busca (getProdutosAfiliados roda a cada generate()).
  if (editingIndex === null && saved.length >= MAX_SAVED_PRODUTOS) {
    feedback.textContent = `⚠️ Limite de ${MAX_SAVED_PRODUTOS} produtos atingido. Remova algum antes de adicionar outro.`;
    feedback.className   = 'form-feedback error';
    return;
  }

  if (editingIndex !== null) {
    saved[editingIndex] = produto;
    feedback.textContent = '✅ Produto atualizado!';
  } else {
    saved.push(produto);
    feedback.textContent = '✅ Produto salvo!';
  }

  localStorage.setItem(KEYS.produtos, JSON.stringify(saved));
  feedback.className = 'form-feedback success';

  resetProdutoForm();
  setTimeout(() => { feedback.textContent = ''; }, 3000);
  renderProdutosSalvos();
}

// Preenche o formulário com os dados do produto para edição.
function editProduto(index) {
  const saved   = getSavedProdutos();
  const produto = saved[index];
  if (!produto) return;

  editingIndex = index;

  document.getElementById('f-nome').value     = produto.name || '';
  document.getElementById('f-preco').value    = produto.price === '—' ? '' : (produto.price || '');
  document.getElementById('f-comissao').value = produto.commission === '—' ? '' : (produto.commission || '');
  document.getElementById('f-nichos').value   = (produto.nichos || []).join(', ');
  document.getElementById('f-desc').value     = produto.desc || '';
  document.getElementById('f-link').value     = produto.link || '';

  // Garante que o formulário esteja visível e com o botão indicando "atualizar"
  document.getElementById('add-produto-form').style.display = 'block';
  document.getElementById('btn-toggle-add').textContent = 'Recolher';
  document.getElementById('btn-salvar-produto').textContent = 'Atualizar produto';
  document.getElementById('btn-cancelar-edicao').style.display = 'inline-flex';

  document.getElementById('add-produto-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Limpa o formulário e volta ao modo "adicionar".
function resetProdutoForm() {
  editingIndex = null;
  ['f-nome','f-preco','f-comissao','f-nichos','f-desc','f-link'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('btn-salvar-produto').textContent = 'Salvar produto';
  document.getElementById('btn-cancelar-edicao').style.display = 'none';
}

// Lê produtos salvos, descartando silenciosamente qualquer entrada corrompida
// ou em formato inválido (ex: editada manualmente no DevTools).
function getSavedProdutos() {
  return readJsonArray(KEYS.produtos)
    .map(normalizeProduto)
    .filter(Boolean);
}

function deleteProduto(index) {
  const saved = getSavedProdutos();
  saved.splice(index, 1);
  localStorage.setItem(KEYS.produtos, JSON.stringify(saved));

  // Se o item deletado era o que estava sendo editado, sai do modo edição.
  if (editingIndex === index) resetProdutoForm();

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
          <div style="display:flex;gap:6px;flex-shrink:0">
            <button class="copy-btn" onclick="editProduto(${i})" title="Editar">
              ${ICON_EDIT}
            </button>
            <button class="copy-btn" onclick="deleteProduto(${i})" title="Remover">
              ${ICON_TRASH}
            </button>
          </div>
        </div>
      `).join('')}
    </div>`;
}

// ─── getProdutosAfiliados — ÚNICA definição (combina fixos + salvos) ────────
// Atenção: não duplicar esta função em data.js. Esta é a fonte de verdade.
function getProdutosAfiliados(raw) {
  const query = raw.toLowerCase();
  const todos = [...PRODUTOS_AFILIADOS, ...getSavedProdutos()];
  return todos.filter(({ nichos }) =>
    nichos.some(n => query.includes(n) || n.includes(query))
  );
}

// ─── Copiar query ─────────────────────────────────────────────────────────────
function copyQuery(text, btn) {
  const originalLabel = btn.getAttribute('aria-label') || btn.getAttribute('title') || 'Copiar';

  const markCopied = () => {
    btn.classList.add('copied');
    btn.innerHTML = ICON_CHECK;
    btn.setAttribute('aria-label', 'Copiado!');
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = ICON_COPY;
      btn.setAttribute('aria-label', originalLabel);
    }, 1800);
  };

  navigator.clipboard.writeText(text).then(markCopied).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    markCopied();
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ─── Utilitários ──────────────────────────────────────────────────────────────
function isValidHttpUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitize(str) {
  return str.trim().replace(/\s+/g, ' ').slice(0, 120);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// Usado dentro de onclick="fn('...')" — precisa escapar backslash ANTES das aspas
// (senão um valor terminando em \ quebra o escape da aspa seguinte), além de
// aspas simples, quebras de linha e a sequência </script> por segurança extra.
function escapeAttr(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, '\\n')
    .replace(/<\/script/gi, '<\\/script');
}