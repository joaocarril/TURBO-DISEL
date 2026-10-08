/* =============================================================================
   TURBO DISEL — script.js
   -----------------------------------------------------------------------------
   Índice
    1.  CONFIGURAÇÃO — dados editáveis (nomes, números, preços, horário)
    2.  Utilitários
    3.  Preencher os dados nas páginas
    4.  Menu hamburger
    5.  Cabeçalho ao fazer scroll
    6.  Scroll suave
    7.  Animações ao fazer scroll (secções e cartões)
    8.  Contadores animados
    9.  Conta-rotações (gráfico do Plano por Nota)
    10. Calculadoras do Plano por Nota (estudante e explicador)
    11. Formulário de contacto
    12. Horário (aberto / fechado)
    13. Arranque
   ============================================================================= */

(function () {
  'use strict';

  /* ===========================================================================
     1. CONFIGURAÇÃO — DADOS EDITÁVEIS
     Tudo o que está neste bloco aparece automaticamente em todas as páginas.
     Altera apenas o texto entre aspas ou os números.
     =========================================================================== */
  const CONFIG = {

    /* ---------- Central TURBO DISEL (WhatsApp) ---------- */
    central: {
      telefone: '932639201'                 // <- número da central (9 dígitos, sem espaços)
    },

    // Indicativo do país usado nos links do WhatsApp (Portugal = 351)
    indicativoPais: '351',

    /* ---------- Explicadores ---------- */
    // Quando o número de um explicador ainda não estiver preenchido,
    // o botão "WhatsApp" desse explicador abre a conversa com a central.
    explicadores: [
      {
        nome: '[NOME DO EXPLICADOR 1]',      // <- nome
        telefone: '[NÚMERO DO EXPLICADOR 1]',// <- número (ex.: '912345678')
        materias: ['[MATÉRIAS]'],            // <- ex.: ['Matemática', 'Economia']
        qualidades: ['Paciente', 'Comunicativo', 'Organizado', 'Focado nos resultados'],
        biografia: 'Explica com calma e sem pressas, até a matéria fazer sentido. Prepara cada aula com objetivos claros e acompanha de perto a evolução do aluno, sempre com os resultados em vista.',
        avaliacao: 5                         // <- de 0 a 5 (aceita decimais, ex.: 4.8)
      },
      {
        nome: '[NOME DO EXPLICADOR 2]',
        telefone: '[NÚMERO DO EXPLICADOR 2]',
        materias: ['[MATÉRIAS]'],
        qualidades: ['Dinâmico', 'Motivador', 'Boa capacidade de comunicação', 'Experiente'],
        biografia: 'Aulas dinâmicas e cheias de energia, que tornam a matéria mais fácil de perceber. A experiência e a forma clara de comunicar ajudam cada aluno a ganhar motivação e confiança.',
        avaliacao: 5
      },
      {
        nome: '[NOME DO EXPLICADOR 3]',
        telefone: '[NÚMERO DO EXPLICADOR 3]',
        materias: ['[MATÉRIAS]'],
        qualidades: ['Experiente', 'Organizado', 'Motivador', 'Orientado para resultados'],
        biografia: 'Junta experiência e organização num plano de estudo bem definido. Motiva o aluno a dar o melhor em cada sessão e mantém o foco no objetivo: melhorar a nota.',
        avaliacao: 5
      }
    ],

    /* ---------- Preços para estudantes (€/hora) ---------- */
    precosEstudante: {
      secundarioGrupo: 10,                   // <- Secundário — Grupo
      secundarioIndividual: 20,              // <- Secundário — Individual
      faculdadeGrupo: 15,                    // <- Faculdade — Grupo
      faculdadeIndividual: 25                // <- Faculdade — Individual
    },

    /* ---------- Valores pagos aos explicadores (€/hora) ---------- */
    valoresExplicador: {
      secundarioGrupo: 10,
      secundarioIndividual: 20,
      faculdadeGrupo: 15,
      faculdadeIndividual: 25
    },

    /* ---------- Plano por Nota ---------- */
    // Regra: valorHora = Math.max(nota, 5)  ->  o valor por hora é a nota (0 a 20),
    // com um mínimo de 5 €/hora. A nota NÃO é uma percentagem.
    planoPorNota: {
      valorMinimo: 5,                        // <- valor mínimo por hora (€)
      notaMaxima: 20
    },

    /* ---------- Estatísticas (página Sobre Nós) ---------- */
    estatisticas: {
      alunos: 100,                           // aparece como "100+"
      explicadores: 3,
      materias: 3,
      satisfacao: 95                         // aparece como "95%"
    },

    /* ---------- Horário de atendimento ---------- */
    // Para um dia encerrado, usa abre: null e fecha: null.
    horario: {
      semana: { abre: '09:00', fecha: '20:00' },   // segunda a sexta
      sabado: { abre: '10:00', fecha: '18:00' },
      domingo: { abre: null, fecha: null }         // encerrado
    }
  };


  /* ===========================================================================
     2. UTILITÁRIOS
     =========================================================================== */
  const $ = (seletor, contexto = document) => contexto.querySelector(seletor);
  const $$ = (seletor, contexto = document) => Array.from(contexto.querySelectorAll(seletor));

  const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const temObservador = 'IntersectionObserver' in window;

  const limitar = (valor, min, max) => Math.min(max, Math.max(min, valor));
  const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);
  const easeOutBack = (p) => {
    const c1 = 1.25;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
  };

  /** Formata números à portuguesa (ex.: 14,5). */
  function formatarNumero(valor, minDecimais = 0, maxDecimais = 2) {
    return new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: minDecimais,
      maximumFractionDigits: maxDecimais
    }).format(valor);
  }

  /**
   * REGRA DO PLANO POR NOTA
   * O valor por hora (em euros) é igual à nota do exame nacional (escala 0–20),
   * com um valor mínimo de 5 €/hora:  valorHora = Math.max(nota, 5)
   */
  function calcularValorHora(nota) {
    return Math.max(nota, CONFIG.planoPorNota.valorMinimo);
  }

  /** "932639201" -> "932 639 201". Texto que não seja um número fica igual. */
  function formatarTelefone(numero) {
    const texto = String(numero).trim();
    const digitos = texto.replace(/\D/g, '');
    const grupos = (d) => d.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    if (/^\d{9}$/.test(digitos) && /^[\d\s+]+$/.test(texto)) return grupos(digitos);
    if (digitos.length === 12 && digitos.startsWith('351') && /^[\d\s+]+$/.test(texto)) {
      return `+351 ${grupos(digitos.slice(3))}`;
    }
    return texto;
  }

  /** Devolve o número no formato do WhatsApp (ex.: 351932639201) ou null se for inválido. */
  function numeroWhatsApp(numero) {
    let digitos = String(numero).replace(/\D/g, '');
    if (digitos.startsWith('00')) digitos = digitos.slice(2);
    if (digitos.length === 9) digitos = CONFIG.indicativoPais + digitos;
    return /^[1-9]\d{9,14}$/.test(digitos) ? digitos : null;
  }

  /** Cria o link https://wa.me/... (com mensagem opcional). */
  function linkWhatsApp(numero, mensagem) {
    const n = numeroWhatsApp(numero);
    if (!n) return null;
    return `https://wa.me/${n}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''}`;
  }

  /** Link do WhatsApp de um explicador (ou da central, se o número ainda não existir). */
  function linkExplicador(explicador) {
    const direto = linkWhatsApp(
      explicador.telefone,
      'Olá! Vi o teu perfil no site da TURBO DISEL e gostaria de saber mais sobre as tuas explicações.'
    );
    return direto || linkWhatsApp(
      CONFIG.central.telefone,
      `Olá! Gostaria de marcar explicações com ${explicador.nome}.`
    );
  }


  /* ===========================================================================
     3. PREENCHER OS DADOS NAS PÁGINAS
     Os elementos com atributos data-* recebem os valores do CONFIG.
     =========================================================================== */
  function preencherLista(lista, itens, classeItem) {
    const valores = Array.isArray(itens) ? itens : String(itens).split(',');
    if (lista.tagName !== 'UL' && lista.tagName !== 'OL') {
      lista.textContent = valores.map((v) => String(v).trim()).join(', ');
      return;
    }
    lista.textContent = '';
    valores.forEach((valor) => {
      const li = document.createElement('li');
      if (classeItem) li.className = classeItem;
      li.textContent = String(valor).trim();
      lista.appendChild(li);
    });
  }

  function preencherDados() {
    // Explicadores
    $$('[data-explicador]').forEach((bloco) => {
      const explicador = CONFIG.explicadores[Number(bloco.dataset.explicador) - 1];
      if (!explicador) return;

      $$('[data-campo]', bloco).forEach((el) => {
        switch (el.dataset.campo) {
          case 'nome':
            el.textContent = explicador.nome;
            break;
          case 'telefone':
            el.textContent = formatarTelefone(explicador.telefone);
            break;
          case 'materias':
            preencherLista(el, explicador.materias, el.dataset.classeItem || '');
            break;
          case 'qualidades':
            preencherLista(el, explicador.qualidades);
            break;
          case 'biografia':
            el.textContent = explicador.biografia;
            break;
          case 'avaliacao': {
            const nota = limitar(Number(explicador.avaliacao) || 0, 0, 5);
            el.style.setProperty('--avaliacao', nota);
            el.setAttribute('aria-label', `Avaliação: ${formatarNumero(nota, 1, 1)} em 5`);
            break;
          }
          case 'avaliacao-texto':
            el.textContent = formatarNumero(limitar(Number(explicador.avaliacao) || 0, 0, 5), 1, 1);
            break;
          case 'foto':
            el.alt = `Fotografia de ${explicador.nome}`;
            break;
          case 'whatsapp': {
            const link = linkExplicador(explicador);
            if (link) el.href = link;
            break;
          }
          default:
            break;
        }
      });
    });

    // Preços dos estudantes e valores dos explicadores
    $$('[data-preco]').forEach((el) => {
      const valor = CONFIG.precosEstudante[el.dataset.preco];
      if (valor != null) el.textContent = formatarNumero(valor);
    });
    $$('[data-valor-explicador]').forEach((el) => {
      const valor = CONFIG.valoresExplicador[el.dataset.valorExplicador];
      if (valor != null) el.textContent = formatarNumero(valor);
    });
    $$('[data-preco-desde]').forEach((el) => {
      el.textContent = formatarNumero(Math.min(...Object.values(CONFIG.precosEstudante)));
    });

    // Plano por Nota
    $$('[data-valor-minimo]').forEach((el) => {
      el.textContent = formatarNumero(CONFIG.planoPorNota.valorMinimo);
    });

    // Central (número e botões do WhatsApp)
    $$('[data-central-telefone]').forEach((el) => {
      el.textContent = formatarTelefone(CONFIG.central.telefone);
    });
    $$('[data-whatsapp="central"]').forEach((el) => {
      const link = linkWhatsApp(CONFIG.central.telefone, el.dataset.mensagem);
      if (link) el.href = link;
    });

    // Estatísticas em texto (ex.: barra de confiança da página inicial)
    $$('[data-estatistica]').forEach((el) => {
      const valor = CONFIG.estatisticas[el.dataset.estatistica];
      if (valor != null) el.textContent = formatarNumero(valor) + (el.dataset.sufixo || '');
    });

    // Horário
    $$('[data-horario]').forEach((el) => {
      const h = CONFIG.horario[el.dataset.horario];
      if (!h) return;
      el.textContent = h.abre && h.fecha ? `${h.abre} — ${h.fecha}` : 'Encerrado';
    });

    // Ano atual no rodapé
    $$('[data-ano]').forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  /** Gera a tabela "Nota | Valor/hora" a partir da regra do Plano por Nota. */
  function gerarTabelaNotas() {
    const { notaMaxima, valorMinimo } = CONFIG.planoPorNota;
    $$('[data-tabela-notas]').forEach((tbody) => {
      const linhas = [];
      for (let nota = notaMaxima; nota >= 0; nota -= 1) {
        const valor = calcularValorHora(nota);
        const abaixoDoMinimo = nota < valorMinimo;
        const largura = ((valor / notaMaxima) * 100).toFixed(1);
        linhas.push(
          `<tr data-nota="${nota}"${abaixoDoMinimo ? ' class="is-min"' : ''}>` +
            `<td>${nota}</td>` +
            '<td><div class="grade-cell">' +
              `<span class="grade-cell__valor">${formatarNumero(valor)} €/hora` +
              `${abaixoDoMinimo ? '<small>valor mínimo</small>' : ''}</span>` +
              `<span class="grade-bar" aria-hidden="true"><span style="--w:${largura}%"></span></span>` +
            '</div></td>' +
          '</tr>'
        );
      }
      tbody.innerHTML = linhas.join('');
    });
  }

  /** Atualiza os botões de exemplo com o valor calculado pela regra. */
  function prepararExemplos() {
    $$('[data-exemplo]').forEach((botao) => {
      const nota = Number(botao.dataset.exemplo);
      const valor = calcularValorHora(nota);
      const saida = $('.example__valor', botao);
      if (saida) saida.textContent = `${formatarNumero(valor)} €`;
      botao.classList.toggle('example--min', nota < CONFIG.planoPorNota.valorMinimo);
    });
  }


  /* ===========================================================================
     4. MENU HAMBURGER
     =========================================================================== */
  function iniciarMenu() {
    const botao = $('.nav-toggle');
    const menu = $('#menu-principal');
    if (!botao || !menu) return;

    const ecraPequeno = window.matchMedia('(max-width: 1199.98px)');

    const abrir = () => {
      menu.classList.add('is-open');
      botao.setAttribute('aria-expanded', 'true');
      botao.setAttribute('aria-label', 'Fechar menu');
      document.body.classList.add('menu-aberto');
    };

    const fechar = () => {
      menu.classList.remove('is-open');
      botao.setAttribute('aria-expanded', 'false');
      botao.setAttribute('aria-label', 'Abrir menu');
      document.body.classList.remove('menu-aberto');
    };

    botao.addEventListener('click', () => {
      if (menu.classList.contains('is-open')) fechar();
      else abrir();
    });

    // Fecha o menu ao clicar num link
    menu.addEventListener('click', (evento) => {
      if (evento.target.closest('a')) fechar();
    });

    // Fecha com a tecla Escape
    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape' && menu.classList.contains('is-open')) {
        fechar();
        botao.focus();
      }
    });

    // Fecha ao passar para o ecrã grande
    const aoMudarEcra = (evento) => {
      if (!evento.matches) fechar();
    };
    if (ecraPequeno.addEventListener) ecraPequeno.addEventListener('change', aoMudarEcra);
    else if (ecraPequeno.addListener) ecraPequeno.addListener(aoMudarEcra);
  }


  /* ===========================================================================
     5. CABEÇALHO AO FAZER SCROLL
     =========================================================================== */
  function iniciarCabecalho() {
    const cabecalho = $('.site-header');
    if (!cabecalho) return;
    const atualizar = () => cabecalho.classList.toggle('is-scrolled', window.scrollY > 8);
    atualizar();
    window.addEventListener('scroll', atualizar, { passive: true });
  }


  /* ===========================================================================
     6. SCROLL SUAVE (links para secções da mesma página)
     =========================================================================== */
  function iniciarScrollSuave() {
    document.addEventListener('click', (evento) => {
      const link = evento.target.closest('a[href*="#"]');
      if (!link || evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey) return;

      const destino = new URL(link.getAttribute('href'), window.location.href);
      const mesmaPagina = destino.pathname === window.location.pathname && destino.search === window.location.search;
      if (!mesmaPagina || !destino.hash || destino.hash === '#') return;

      const alvo = document.getElementById(decodeURIComponent(destino.hash.slice(1)));
      if (!alvo) return;

      evento.preventDefault();
      alvo.scrollIntoView({ behavior: reduzMovimento ? 'auto' : 'smooth', block: 'start' });
      if (window.history && window.history.pushState) window.history.pushState(null, '', destino.hash);

      // Acessibilidade: leva o foco do teclado para a secção
      if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1');
      alvo.focus({ preventScroll: true });
    });
  }


  /* ===========================================================================
     7. ANIMAÇÕES AO FAZER SCROLL
     data-reveal        -> o elemento aparece ao entrar no ecrã
     data-reveal-grupo  -> os cartões dentro do elemento aparecem um a um
     Só os elementos que ainda não estão visíveis são animados.
     =========================================================================== */
  function iniciarRevelacao() {
    if (reduzMovimento || !temObservador) return;

    const limite = window.innerHeight * 0.92;

    const terminar = (el, atraso) => {
      window.setTimeout(() => {
        el.classList.remove('reveal', 'is-visible');
        el.style.removeProperty('--reveal-delay');
      }, atraso + 800);
    };

    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        observador.unobserve(entrada.target);
        const grupo = entrada.target.hasAttribute('data-reveal-grupo');
        const alvos = grupo ? Array.from(entrada.target.children) : [entrada.target];
        alvos.forEach((el, i) => {
          el.classList.add('is-visible');
          terminar(el, grupo ? i * 90 : 0);
        });
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    $$('[data-reveal]').forEach((el) => {
      if (el.getBoundingClientRect().top < limite) return;
      el.classList.add('reveal');
      observador.observe(el);
    });

    $$('[data-reveal-grupo]').forEach((grupo) => {
      if (grupo.getBoundingClientRect().top < limite) return;
      Array.from(grupo.children).forEach((filho, i) => {
        filho.classList.add('reveal');
        filho.style.setProperty('--reveal-delay', `${i * 90}ms`);
      });
      observador.observe(grupo);
    });
  }


  /* ===========================================================================
     8. CONTADORES ANIMADOS
     <span data-contador="alunos" data-sufixo="+">100+</span>
     =========================================================================== */
  function iniciarContadores() {
    const contadores = $$('[data-contador]');
    if (!contadores.length) return;

    const texto = (valor, el) => formatarNumero(valor) + (el.dataset.sufixo || '');

    contadores.forEach((el) => {
      const valor = CONFIG.estatisticas[el.dataset.contador];
      if (valor != null) el.dataset.alvo = valor;
      el.textContent = texto(Number(el.dataset.alvo) || 0, el);
    });

    // Texto para leitores de ecrã (o número animado está escondido para eles)
    $$('[data-contador-texto]').forEach((el) => {
      const valor = CONFIG.estatisticas[el.dataset.contadorTexto];
      if (valor != null) el.textContent = texto(valor, el);
    });

    if (reduzMovimento || !temObservador) return;

    const animar = (el) => {
      const alvo = Number(el.dataset.alvo) || 0;
      const inicio = performance.now();
      const duracao = 1800;
      const passo = (agora) => {
        const p = Math.min(1, (agora - inicio) / duracao);
        el.textContent = texto(Math.round(alvo * easeOutCubic(p)), el);
        if (p < 1) window.requestAnimationFrame(passo);
      };
      window.requestAnimationFrame(passo);
    };

    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        observador.unobserve(entrada.target);
        animar(entrada.target);
      });
    }, { threshold: 0.6 });

    contadores.forEach((el) => {
      el.textContent = texto(0, el);
      observador.observe(el);
    });
  }


  /* ===========================================================================
     9. CONTA-ROTAÇÕES (GRÁFICO DO PLANO POR NOTA)
     Escala de 0 a 20 (como num conta-rotações). O ponteiro mostra a nota e o
     visor mostra o valor por hora. A zona tracejada dourada é a do valor mínimo.
     =========================================================================== */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const GAUGE = { cx: 160, cy: 150, raio: 118, inicio: 210, fim: -30 };
  const COMPRIMENTO_ARCO = GAUGE.raio * ((GAUGE.inicio - GAUGE.fim) * Math.PI / 180);
  const gauges = new WeakMap();
  let contadorGauges = 0;

  function anguloDaNota(nota) {
    const max = CONFIG.planoPorNota.notaMaxima;
    return GAUGE.inicio - (limitar(nota, 0, max) / max) * (GAUGE.inicio - GAUGE.fim);
  }

  function pontoNoArco(angulo, raio) {
    const rad = (angulo * Math.PI) / 180;
    return [GAUGE.cx + raio * Math.cos(rad), GAUGE.cy - raio * Math.sin(rad)];
  }

  function caminhoArco(anguloA, anguloB, raio) {
    const [x1, y1] = pontoNoArco(anguloA, raio);
    const [x2, y2] = pontoNoArco(anguloB, raio);
    const arcoGrande = Math.abs(anguloA - anguloB) > 180 ? 1 : 0;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${raio} ${raio} 0 ${arcoGrande} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }

  function elementoSvg(nome, atributos) {
    const el = document.createElementNS(SVG_NS, nome);
    Object.entries(atributos).forEach(([chave, valor]) => el.setAttribute(chave, valor));
    return el;
  }

  function criarGauge(contentor) {
    const id = `gauge-grad-${++contadorGauges}`;
    const mini = contentor.dataset.gaugeTamanho === 'mini';
    const claro = contentor.dataset.gauge === 'claro';
    const { cx, cy, raio } = GAUGE;
    const espessura = mini ? 24 : 16;
    const max = CONFIG.planoPorNota.notaMaxima;

    const svg = elementoSvg('svg', {
      viewBox: mini ? '0 0 320 226' : '0 0 320 252',
      class: `gauge${claro ? ' gauge--claro' : ''}`,
      'aria-hidden': 'true'
    });

    const defs = elementoSvg('defs', {});
    const gradiente = elementoSvg('linearGradient', { id, gradientUnits: 'userSpaceOnUse', x1: 40, y1: 0, x2: 280, y2: 0 });
    [['0', '#3D7DFF'], ['0.62', '#7FA6FF'], ['1', '#FFB800']].forEach(([offset, cor]) => {
      gradiente.appendChild(elementoSvg('stop', { offset, 'stop-color': cor }));
    });
    defs.appendChild(gradiente);
    svg.appendChild(defs);

    const arcoCompleto = caminhoArco(GAUGE.inicio, GAUGE.fim, raio);
    svg.appendChild(elementoSvg('path', { d: arcoCompleto, class: 'gauge__track', 'stroke-width': espessura }));

    if (!mini) {
      // Zona do valor mínimo (tracejado dourado, por fora do arco)
      svg.appendChild(elementoSvg('path', {
        d: caminhoArco(GAUGE.inicio, anguloDaNota(CONFIG.planoPorNota.valorMinimo), raio + 16),
        class: 'gauge__min',
        'stroke-width': 4
      }));

      // Marcas da escala
      for (let n = 0; n <= max; n += 1) {
        const principal = n % 5 === 0;
        const [x1, y1] = pontoNoArco(anguloDaNota(n), raio - 15);
        const [x2, y2] = pontoNoArco(anguloDaNota(n), raio - (principal ? 30 : 23));
        svg.appendChild(elementoSvg('line', {
          x1: x1.toFixed(2), y1: y1.toFixed(2), x2: x2.toFixed(2), y2: y2.toFixed(2),
          class: `gauge__tick${principal ? ' gauge__tick--major' : ''}`
        }));
        if (principal) {
          const [lx, ly] = pontoNoArco(anguloDaNota(n), raio - 46);
          const rotulo = elementoSvg('text', {
            x: lx.toFixed(2), y: ly.toFixed(2), class: 'gauge__label',
            'text-anchor': 'middle', 'dominant-baseline': 'central'
          });
          rotulo.textContent = n;
          svg.appendChild(rotulo);
        }
      }
    }

    const progresso = elementoSvg('path', {
      d: arcoCompleto,
      class: 'gauge__progress',
      stroke: `url(#${id})`,
      'stroke-width': espessura,
      'stroke-dasharray': COMPRIMENTO_ARCO.toFixed(2),
      'stroke-dashoffset': COMPRIMENTO_ARCO.toFixed(2)
    });
    svg.appendChild(progresso);

    const largura = mini ? 8 : 5.5;
    const comprimento = raio - (mini ? 20 : 34);
    const agulha = elementoSvg('g', { transform: `rotate(-120 ${cx} ${cy})` });
    agulha.appendChild(elementoSvg('path', {
      d: `M ${cx - largura} ${cy} L ${cx} ${cy - comprimento} L ${cx + largura} ${cy} Z`,
      class: 'gauge__needle'
    }));
    svg.appendChild(agulha);
    svg.appendChild(elementoSvg('circle', { cx, cy, r: mini ? 17 : 12, class: 'gauge__hub' }));

    let leitura = null;
    if (!mini) {
      leitura = elementoSvg('text', { x: cx, y: 216, class: 'gauge__readout', 'text-anchor': 'middle' });
      leitura.textContent = '—';
      const unidade = elementoSvg('text', { x: cx, y: 240, class: 'gauge__unit', 'text-anchor': 'middle' });
      unidade.textContent = 'por hora';
      svg.appendChild(leitura);
      svg.appendChild(unidade);
    }

    contentor.appendChild(svg);
    return { agulha, progresso, leitura, nota: 0, valor: null, animacao: null };
  }

  /** Desenha o ponteiro, o arco e o visor para uma nota (pode passar ligeiramente dos limites durante a animação). */
  function desenharGauge(g, nota, valor) {
    const { cx, cy } = GAUGE;
    const max = CONFIG.planoPorNota.notaMaxima;
    // O ponteiro aponta para cima (nota 10); roda -120° (nota 0) até +120° (nota 20)
    const rotacao = (nota / max) * (GAUGE.inicio - GAUGE.fim) - (GAUGE.inicio - 90);
    g.agulha.setAttribute('transform', `rotate(${rotacao.toFixed(2)} ${cx} ${cy})`);
    const fracao = limitar(nota, 0, max) / max;
    g.progresso.setAttribute('stroke-dashoffset', (COMPRIMENTO_ARCO * (1 - fracao)).toFixed(2));
    if (g.leitura) g.leitura.textContent = valor == null ? '—' : `${formatarNumero(valor)} €`;
    g.nota = nota;
    g.valor = valor;
  }

  /** Move o ponteiro até à nota e mostra o valor por hora no visor. */
  function definirNotaGauge(g, nota, valor) {
    if (!g) return;
    if (g.animacao) window.cancelAnimationFrame(g.animacao);

    // Parte sempre da posição que está visível (mesmo a meio de outra animação)
    const notaInicial = g.nota;
    const valorInicial = g.valor == null ? 0 : g.valor;

    if (reduzMovimento) {
      desenharGauge(g, nota, valor);
      return;
    }

    const inicio = performance.now();
    const duracao = 1000;
    const passo = (agora) => {
      const p = Math.min(1, (agora - inicio) / duracao);
      const notaAtual = notaInicial + (nota - notaInicial) * easeOutBack(p);
      let valorAtual = null;
      if (valor != null) {
        valorAtual = p < 1 ? Math.round(valorInicial + (valor - valorInicial) * easeOutCubic(p)) : valor;
      }
      if (p < 1) {
        desenharGauge(g, notaAtual, valorAtual);
        g.animacao = window.requestAnimationFrame(passo);
      } else {
        desenharGauge(g, nota, valor);
        g.animacao = null;
      }
    };
    g.animacao = window.requestAnimationFrame(passo);
  }

  function iniciarGauges() {
    $$('[data-gauge]').forEach((el) => gauges.set(el, criarGauge(el)));

    // Gráficos de demonstração (ex.: página inicial) animam quando aparecem no ecrã
    const demonstracoes = $$('[data-gauge-nota]');
    const animar = (el) => {
      const nota = Number(el.dataset.gaugeNota);
      const atraso = reduzMovimento ? 0 : (Number(el.dataset.gaugeAtraso) || 150);
      window.setTimeout(() => {
        definirNotaGauge(gauges.get(el), nota, calcularValorHora(nota));
      }, atraso);
    };

    if (!temObservador) {
      demonstracoes.forEach(animar);
      return;
    }
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        observador.unobserve(entrada.target);
        animar(entrada.target);
      });
    }, { threshold: 0.4 });
    demonstracoes.forEach((el) => observador.observe(el));
  }


  /* ===========================================================================
     10. CALCULADORAS DO PLANO POR NOTA
     Validação: só aceita notas de 0 a 20 (com ou sem casas decimais).
     Fórmula: valorHora = Math.max(nota, 5)
     =========================================================================== */
  function lerNota(texto) {
    const limpo = String(texto).trim().replace(',', '.');
    if (limpo === '') return { estado: 'vazio' };
    if (!/^\d+(\.\d*)?$/.test(limpo)) return { estado: 'invalido' };
    const nota = parseFloat(limpo);
    if (!Number.isFinite(nota)) return { estado: 'invalido' };
    if (nota < 0 || nota > CONFIG.planoPorNota.notaMaxima) return { estado: 'fora', nota };
    return { estado: 'ok', nota: Math.round(nota * 100) / 100 };
  }

  function mensagemErroNota(leitura) {
    if (leitura.estado === 'invalido') return 'Escreve apenas números, por exemplo 15 ou 14,5.';
    let texto = 'A nota tem de estar entre 0 e 20.';
    if (leitura.nota > 20 && leitura.nota <= 200) {
      texto += ' Se tens a nota em pontos (0 a 200), divide por 10: 175 pontos = 17,5 valores.';
    }
    return texto;
  }

  function iniciarCalculadoras() {
    $$('[data-calculadora]').forEach((form) => {
      const campo = $('[data-calc-input]', form);
      const deslizador = $('[data-calc-range]', form);
      const resultado = $('[data-calc-resultado]', form);
      const erro = $('[data-calc-erro]', form);
      if (!campo || !resultado) return;
      const contentorGauge = $('[data-gauge]', form);
      const tabela = form.dataset.tabela ? $(form.dataset.tabela) : null;
      const exemplos = form.id ? $$(`[data-exemplo][data-alvo="${form.id}"]`) : [];
      const rotulo = form.dataset.rotulo || 'Valor por hora:';
      const unidade = form.dataset.unidade || '€/hora';
      const textoInicial = resultado.textContent.trim();
      const minimo = CONFIG.planoPorNota.valorMinimo;

      const gauge = () => (contentorGauge ? gauges.get(contentorGauge) : null);

      const atualizarDeslizador = (nota) => {
        if (!deslizador) return;
        deslizador.value = Math.round(nota);
        deslizador.style.setProperty('--pct', `${(Math.round(nota) / CONFIG.planoPorNota.notaMaxima) * 100}%`);
      };

      const destacar = (nota) => {
        exemplos.forEach((b) => b.classList.toggle('is-active', nota !== null && Number(b.dataset.exemplo) === nota));
        if (tabela) {
          $$('tr[data-nota]', tabela).forEach((linha) => {
            linha.classList.toggle('is-active', nota !== null && Number(linha.dataset.nota) === nota);
          });
        }
      };

      const mostrarErro = (mensagem) => {
        if (erro) {
          erro.textContent = mensagem;
          erro.hidden = !mensagem;
        }
        campo.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
      };

      const repor = (texto) => {
        resultado.textContent = texto;
        definirNotaGauge(gauge(), 0, null);
        atualizarDeslizador(0);
        destacar(null);
      };

      const atualizar = () => {
        const leitura = lerNota(campo.value);

        if (leitura.estado === 'vazio') {
          mostrarErro('');
          repor(textoInicial);
          return;
        }

        if (leitura.estado !== 'ok') {
          mostrarErro(mensagemErroNota(leitura));
          repor('Corrige a nota para veres o valor.');
          return;
        }

        mostrarErro('');
        const nota = leitura.nota;
        const valor = calcularValorHora(nota);   // valorHora = Math.max(nota, 5)

        resultado.textContent = `${rotulo} `;
        const destaque = document.createElement('strong');
        destaque.textContent = `${formatarNumero(valor)} ${unidade}`;
        resultado.appendChild(destaque);
        if (nota < minimo) {
          const aviso = document.createElement('span');
          aviso.className = 'calc__min';
          aviso.textContent = ' — aplica-se o valor mínimo.';
          resultado.appendChild(aviso);
        }

        atualizarDeslizador(nota);
        definirNotaGauge(gauge(), nota, valor);
        destacar(nota);
      };

      // Só deixa escrever números e um separador decimal (vírgula ou ponto)
      campo.addEventListener('input', () => {
        const original = campo.value;
        let limpo = original.replace(/[^\d.,]/g, '');
        const separador = limpo.search(/[.,]/);
        if (separador !== -1) {
          limpo = limpo.slice(0, separador + 1) + limpo.slice(separador + 1).replace(/[.,]/g, '');
        }
        if (limpo !== original) campo.value = limpo;
        atualizar();
      });

      if (deslizador) {
        deslizador.addEventListener('input', () => {
          campo.value = deslizador.value;
          atualizar();
        });
      }

      form.addEventListener('submit', (evento) => {
        evento.preventDefault();
        atualizar();
      });

      exemplos.forEach((botao) => {
        botao.addEventListener('click', () => {
          campo.value = formatarNumero(Number(botao.dataset.exemplo));
          atualizar();
          const posicao = form.getBoundingClientRect();
          if (posicao.top < 0 || posicao.bottom > window.innerHeight) {
            form.scrollIntoView({ behavior: reduzMovimento ? 'auto' : 'smooth', block: 'center' });
          }
        });
      });

      atualizarDeslizador(0);
    });
  }


  /* ===========================================================================
     11. FORMULÁRIO DE CONTACTO
     Sem servidor: valida os dados, prepara a mensagem e permite enviá-la
     para a central pelo WhatsApp.
     =========================================================================== */
  const REGRAS_FORMULARIO = {
    nome(valor) {
      const v = valor.trim();
      if (!v) return 'Indica o teu nome.';
      if (v.length < 2) return 'O nome deve ter pelo menos 2 letras.';
      if (!/^[\p{L}\p{M}' .-]+$/u.test(v)) return 'Usa apenas letras no nome.';
      return '';
    },
    email(valor) {
      const v = valor.trim();
      if (!v) return 'Indica o teu email.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Escreve um email válido, por exemplo nome@exemplo.pt.';
      return '';
    },
    telefone(valor) {
      const v = valor.replace(/[\s().-]/g, '');
      if (!v) return 'Indica o teu número de telefone.';
      const portugues = /^(\+351|00351)?[239]\d{8}$/.test(v);
      const internacional = /^(\+|00)[1-9]\d{7,14}$/.test(v);
      if (!portugues && !internacional) return 'Escreve um número válido, por exemplo 912 345 678.';
      return '';
    },
    mensagem(valor) {
      const v = valor.trim();
      if (!v) return 'Escreve a tua mensagem.';
      if (v.length < 10) return 'A mensagem deve ter pelo menos 10 caracteres.';
      return '';
    }
  };

  function preencherFormularioPeloEndereco(form) {
    const parametros = new URLSearchParams(window.location.search);
    const escolher = (nome, valor) => {
      const select = form.elements[nome];
      if (!select || !valor) return;
      if (Array.from(select.options).some((opcao) => opcao.value === valor)) select.value = valor;
    };

    const tipo = parametros.get('tipo');
    escolher('materia', parametros.get('materia'));
    escolher('tipo', tipo);
    if (tipo && tipo.startsWith('secundario')) escolher('nivel', 'secundario');
    if (tipo && tipo.startsWith('faculdade')) escolher('nivel', 'faculdade');
    escolher('nivel', parametros.get('nivel'));

    if (parametros.get('interesse') === 'explicador' && form.elements.mensagem && !form.elements.mensagem.value) {
      form.elements.mensagem.value = 'Olá! Tenho interesse em ser explicador na TURBO DISEL e gostava de saber mais sobre os planos para explicadores.';
    }
  }

  function iniciarFormulario() {
    const form = $('[data-formulario]');
    if (!form) return;

    const sucesso = $('[data-formulario-sucesso]');
    const estado = $('[data-formulario-estado]', form);
    const botao = $('button[type="submit"]', form);
    const textoBotao = botao ? $('span', botao) : null;
    const campos = Object.keys(REGRAS_FORMULARIO).map((nome) => form.elements[nome]).filter(Boolean);

    preencherFormularioPeloEndereco(form);

    const validarCampo = (campo) => {
      const mensagem = REGRAS_FORMULARIO[campo.name](campo.value);
      const grupo = campo.closest('.form__group');
      const erro = grupo ? $('[data-erro]', grupo) : null;
      if (grupo) {
        grupo.classList.toggle('is-invalid', Boolean(mensagem));
        grupo.classList.toggle('is-valid', !mensagem && campo.value.trim() !== '');
      }
      if (erro) erro.textContent = mensagem;
      campo.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
      return !mensagem;
    };

    campos.forEach((campo) => {
      campo.addEventListener('blur', () => {
        if (campo.value.trim() !== '') validarCampo(campo);
      });
      campo.addEventListener('input', () => {
        if (campo.getAttribute('aria-invalid') === 'true') validarCampo(campo);
      });
    });

    const textoOpcao = (select) => (select && select.value ? select.options[select.selectedIndex].text : 'Não indicado');

    const criarMensagem = () => {
      const f = form.elements;
      return [
        'Olá, TURBO DISEL!',
        '',
        `Nome: ${f.nome.value.trim()}`,
        `Email: ${f.email.value.trim()}`,
        `Telefone: ${f.telefone.value.trim()}`,
        `Nível de ensino: ${textoOpcao(f.nivel)}`,
        `Matéria: ${textoOpcao(f.materia)}`,
        `Tipo de aula: ${textoOpcao(f.tipo)}`,
        '',
        `Mensagem: ${f.mensagem.value.trim()}`
      ].join('\n');
    };

    form.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const invalidos = campos.filter((campo) => !validarCampo(campo));

      if (invalidos.length) {
        if (estado) {
          $('span', estado).textContent = invalidos.length === 1
            ? 'Há um campo por corrigir. Revê a mensagem assinalada a vermelho.'
            : `Há ${invalidos.length} campos por corrigir. Revê as mensagens assinaladas a vermelho.`;
          estado.hidden = false;
        }
        invalidos[0].focus();
        return;
      }

      if (estado) estado.hidden = true;
      const mensagem = criarMensagem();

      // Envio simulado (não existe servidor)
      if (botao) {
        botao.disabled = true;
        botao.classList.add('is-loading');
        if (textoBotao) textoBotao.textContent = 'A preparar a mensagem…';
      }

      window.setTimeout(() => {
        if (botao) {
          botao.disabled = false;
          botao.classList.remove('is-loading');
          if (textoBotao) textoBotao.textContent = 'Enviar mensagem';
        }
        if (!sucesso) return;
        $('[data-formulario-previa]', sucesso).textContent = mensagem;
        const enviar = $('[data-formulario-whatsapp]', sucesso);
        const link = linkWhatsApp(CONFIG.central.telefone, mensagem);
        if (enviar && link) enviar.href = link;
        form.hidden = true;
        sucesso.hidden = false;
        const titulo = $('h2', sucesso);
        if (titulo) titulo.focus();
      }, 700);
    });

    const nova = sucesso ? $('[data-formulario-novo]', sucesso) : null;
    if (nova) {
      nova.addEventListener('click', () => {
        form.reset();
        campos.forEach((campo) => {
          campo.removeAttribute('aria-invalid');
          const grupo = campo.closest('.form__group');
          if (grupo) grupo.classList.remove('is-invalid', 'is-valid');
        });
        sucesso.hidden = true;
        form.hidden = false;
        if (campos[0]) campos[0].focus();
      });
    }
  }


  /* ===========================================================================
     12. HORÁRIO — mostra se a central está aberta agora (hora de Lisboa)
     =========================================================================== */
  function agoraEmLisboa() {
    try {
      const partes = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Lisbon', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date());
      const parte = (tipo) => partes.find((p) => p.type === tipo).value;
      const dias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { dia: dias[parte('weekday')], minutos: Number(parte('hour')) * 60 + Number(parte('minute')) };
    } catch (erro) {
      const d = new Date();
      return { dia: d.getDay(), minutos: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function iniciarHorario() {
    const estados = $$('[data-estado-horario]');
    const linhas = $$('[data-dia]');
    if (!estados.length && !linhas.length) return;

    const { dia, minutos } = agoraEmLisboa();
    const chave = dia === 0 ? 'domingo' : dia === 6 ? 'sabado' : 'semana';
    const horario = CONFIG.horario[chave];
    const emMinutos = (hora) => {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m;
    };
    const aberto = Boolean(horario && horario.abre && horario.fecha &&
      minutos >= emMinutos(horario.abre) && minutos < emMinutos(horario.fecha));

    estados.forEach((el) => {
      el.textContent = aberto ? 'Aberto agora' : 'Fechado neste momento';
      el.classList.toggle('is-closed', !aberto);
      el.hidden = false;
    });
    linhas.forEach((el) => el.classList.toggle('is-today', el.dataset.dia === chave));
  }


  /* ===========================================================================
     13. ARRANQUE
     =========================================================================== */
  function iniciar() {
    document.documentElement.classList.add('js');
    preencherDados();
    gerarTabelaNotas();
    prepararExemplos();
    iniciarMenu();
    iniciarCabecalho();
    iniciarScrollSuave();
    iniciarGauges();
    iniciarCalculadoras();
    iniciarContadores();
    iniciarRevelacao();
    iniciarFormulario();
    iniciarHorario();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
