// ─── Nichos populares ────────────────────────────────────────────────────────
const NICHOS = [
  { label: 'Empreendedorismo', query: 'empreendedorismo negócios' },
  { label: 'Marketing digital', query: 'marketing digital' },
  { label: 'Fitness',           query: 'fitness musculação academia' },
  { label: 'Culinária',         query: 'culinária receitas' },
  { label: 'Finanças',          query: 'investimentos finanças' },
  { label: 'Tecnologia',        query: 'tecnologia programação' },
  { label: 'Moda',              query: 'moda feminina estilo' },
  { label: 'Educação',          query: 'educação cursos online' },
  { label: 'Pets',              query: 'pets animais estimação' },
  { label: 'Viagens',           query: 'viagens turismo destinos' },
  { label: 'Dropshipping',      query: 'dropshipping ecommerce' },
  { label: 'Design',            query: 'design criativo arte' },
  { label: 'Saúde',             query: 'saúde bem-estar qualidade de vida' },
  { label: 'Fotografia',        query: 'fotografia foto edição' },
  { label: 'Jogos',             query: 'games jogos gamer' },
  { label: 'Imóveis',           query: 'imóveis mercado imobiliário' },
  { label: 'Artesanato',        query: 'artesanato handmade DIY' },
  { label: 'Espiritualidade',   query: 'espiritualidade autoconhecimento meditação' },
  { label: 'Jurídico',          query: 'direito jurídico advocacia' },
  { label: 'Música',            query: 'música instrumentos produção musical' },
];

// ─── Termos de busca por nicho ───────────────────────────────────────────────
function buildTerms(raw) {
  return [
    {
      label: 'Busca principal',
      query: `grupo ${raw}`,
      desc: `Busca direta por grupos sobre ${raw}. A mais ampla — boa pra começar.`,
      tipo: 'publico',
    },
    {
      label: 'Comunidade do nicho',
      query: `comunidade ${raw}`,
      desc: 'Muitos grupos se chamam "comunidade" — especialmente os mais engajados e ativos.',
      tipo: 'privado',
    },
    {
      label: 'Dicas e aprendizado',
      query: `${raw} dicas estratégias aprender`,
      desc: 'Grupos focados em troca de experiência, tutoriais e aprendizado coletivo.',
      tipo: 'publico',
    },
    {
      label: 'Compra, venda e mercado',
      query: `${raw} venda compra anúncio marketplace`,
      desc: `Grupos de negociação e marketplace específicos para ${raw}.`,
      tipo: 'privado',
    },
    {
      label: 'Networking e parceiros',
      query: `${raw} networking parceiros profissionais`,
      desc: 'Grupos para conectar profissionais, parceiros e entusiastas do nicho.',
      tipo: 'publico',
    },
    {
      label: 'Suporte e dúvidas',
      query: `${raw} ajuda suporte dúvidas iniciantes`,
      desc: 'Grupos de suporte mútuo — ótimos para quem está começando no nicho.',
      tipo: 'privado',
    },
    {
      label: 'Eventos e encontros',
      query: `${raw} evento encontro meetup`,
      desc: 'Grupos que organizam eventos, lives, meetups e encontros presenciais.',
      tipo: 'publico',
    },
    {
      label: 'Novidades e tendências',
      query: `${raw} novidades tendências lançamentos`,
      desc: 'Grupos focados em notícias, lançamentos e tendências do nicho.',
      tipo: 'privado',
    },
  ];
}

// ─── Mapeamento de ícones por categoria ──────────────────────────────────────
const ICON_MAP = [
  {
    pattern: /fitness|musculação|academia|treino/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5h11M6.5 17.5h11M4 12h16M2 9.5l2 2.5-2 2.5M22 9.5l-2 2.5 2 2.5"/></svg>`,
  },
  {
    pattern: /culinária|receita|comida|gastronomia|chef/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></svg>`,
  },
  {
    pattern: /invest|financ|cripto|bolsa|dinheiro/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  },
  {
    pattern: /tecnolog|programaç|developer|código|software/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  },
  {
    pattern: /moda|roupa|estilo|fashion/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>`,
  },
  {
    pattern: /pet|animal|cachorro|gato|veterinário/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5"/><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75z"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"/></svg>`,
  },
  {
    pattern: /viagem|turismo|viagens|destino/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2l-7 7-8-2-2 2L12 13l1.5 4.5L17.8 19.2z"/></svg>`,
  },
  {
    pattern: /empreend|negócio|startup|empresa/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  },
  {
    pattern: /marketing|tráfego|ads|social media/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  },
  {
    pattern: /educaç|curso|ensino|estudo|aprendizado/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  },
  {
    pattern: /design|arte|criativo|criação|ilustração/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
  },
  {
    pattern: /saúde|bem.estar|médico|nutrição|psicolog/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 3-4-6-3 3H2"/></svg>`,
  },
  {
    pattern: /foto|câmera|imagem|retrato|paisagem/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  },
  {
    pattern: /game|jogo|gamer|rpg|esport/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>`,
  },
  {
    pattern: /imóvel|imobiliário|aluguel|apartamento|casa/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  {
    pattern: /artesanato|handmade|costura|bordado|DIY/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10"/><path d="M13 2.05S15 8 15 12"/><path d="M11 2.05S9 8 9 12c0 2.5.5 5 1 7"/><path d="M2 10h11"/><path d="M2 14h8"/><path d="M20 16v6"/><path d="M17 19h6"/></svg>`,
  },
  {
    pattern: /espiritual|medita|autoconhecimento|mindful|yoga/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20A14.5 14.5 0 0 0 12 2"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`,
  },
  {
    pattern: /direito|jurídico|advocacia|lei|advogado/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
  },
  {
    pattern: /música|instrumento|banda|produção musical|cantor/i,
    svg: `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  },
];

// ─── Ícone padrão (fallback) ──────────────────────────────────────────────────
const ICON_DEFAULT = `<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;

function getIcon(raw) {
  const entry = ICON_MAP.find(({ pattern }) => pattern.test(raw));
  return entry ? entry.svg : ICON_DEFAULT;
}