// ============================================================
// AI DEBATE ARENA — Frontend Application
// ============================================================
(function () {
  'use strict';

  // ═══ STATE ═══
  const state = {
    debateId: null,
    topic: '',
    language: 'en',
    rounds: 5,
    currentRound: 0,
    status: 'idle', // idle, active, completed
    proTotalScore: 0,
    conTotalScore: 0,
    ws: null,
    isRunning: false,
  };

  // ═══ DOM REFS ═══
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    // Screens
    setupScreen: $('#screen-setup'),
    debateScreen: $('#screen-debate'),
    verdictScreen: $('#screen-verdict'),
    // Setup
    topicInput: $('#topic-input'),
    charCount: $('#char-count'),
    btnStart: $('#btn-start-debate'),
    btnRandom: $('#btn-random-topic'),
    topicsGrid: $('#topics-grid'),
    // Debate
    liveBadge: $('#live-badge'),
    roundNumber: $('#round-number'),
    roundTotal: $('#round-total'),
    debateTopicText: $('#debate-topic-text'),
    // PRO
    proText: $('#pro-text'),
    proThinking: $('#pro-thinking'),
    proScoreBadge: $('#pro-score-badge'),
    proLogicBar: $('#pro-logic-bar'),
    proEvidenceBar: $('#pro-evidence-bar'),
    proRhetoricBar: $('#pro-rhetoric-bar'),
    proLogicVal: $('#pro-logic-val'),
    proEvidenceVal: $('#pro-evidence-val'),
    proRhetoricVal: $('#pro-rhetoric-val'),
    proFallacies: $('#pro-fallacies'),
    // CON
    conText: $('#con-text'),
    conThinking: $('#con-thinking'),
    conScoreBadge: $('#con-score-badge'),
    conLogicBar: $('#con-logic-bar'),
    conEvidenceBar: $('#con-evidence-bar'),
    conRhetoricBar: $('#con-rhetoric-bar'),
    conLogicVal: $('#con-logic-val'),
    conEvidenceVal: $('#con-evidence-val'),
    conRhetoricVal: $('#con-rhetoric-val'),
    conFallacies: $('#con-fallacies'),
    // Voting
    voteFillPro: $('#vote-fill-pro'),
    voteFillCon: $('#vote-fill-con'),
    votePctPro: $('#vote-pct-pro'),
    votePctCon: $('#vote-pct-con'),
    voteCount: $('#vote-count'),
    btnVotePro: $('#btn-vote-pro'),
    btnVoteCon: $('#btn-vote-con'),
    // Totals
    totalFillPro: $('#total-fill-pro'),
    totalFillCon: $('#total-fill-con'),
    // Controls
    btnNextRound: $('#btn-next-round'),
    btnNewDebate: $('#btn-new-debate'),
    scoringExplanation: $('#scoring-explanation'),
    explanationText: $('#explanation-text'),
    // Verdict
    winnerEmoji: $('#winner-emoji'),
    winnerName: $('#winner-name'),
    finalProScore: $('#final-pro-score'),
    finalConScore: $('#final-con-score'),
    summaryText: $('#summary-text'),
    keyMoments: $('#key-moments'),
    btnNewDebate2: $('#btn-new-debate-2'),
    btnShare: $('#btn-share'),
    // History
    historyModal: $('#history-modal'),
    historyList: $('#history-list'),
    btnHistory: $('#btn-history'),
    btnCloseHistory: $('#btn-close-history'),
    // Theme/Lang
    btnTheme: $('#btn-theme'),
    btnLang: $('#btn-lang'),
    langLabel: $('#lang-label'),
  };

  // ═══ API HELPERS ═══
  const API = {
    async post(url, body) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Request failed');
      }
      return res.json();
    },
    async get(url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Request failed');
      return res.json();
    },
  };

  // ═══ WEBSOCKET ═══
  function connectWS(debateId) {
    if (state.ws) state.ws.close();
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    state.ws = new WebSocket(`${protocol}//${location.host}/ws?debateId=${debateId}`);

    state.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWSMessage(data);
    };

    state.ws.onclose = () => {
      console.log('WS disconnected');
    };
  }

  function handleWSMessage(data) {
    switch (data.type) {
      case 'round_start':
        onRoundStart(data);
        break;
      case 'agent_thinking':
        onAgentThinking(data.side);
        break;
      case 'argument_chunk':
        onArgumentChunk(data.side, data.chunk, data.full);
        break;
      case 'argument_complete':
        onArgumentComplete(data.side, data.argument);
        break;
      case 'scoring_start':
        onScoringStart();
        break;
      case 'round_complete':
        onRoundComplete(data);
        break;
      case 'debate_complete':
        onDebateComplete(data);
        break;
      case 'vote_update':
        onVoteUpdate(data);
        break;
    }
  }

  // ═══ WS EVENT HANDLERS ═══
  function onRoundStart(data) {
    els.roundNumber.textContent = data.round;
    els.roundTotal.textContent = data.totalRounds;
    els.liveBadge.style.display = 'inline-flex';
    // Clear previous round
    els.proText.textContent = '';
    els.conText.textContent = '';
    els.proFallacies.innerHTML = '';
    els.conFallacies.innerHTML = '';
    els.scoringExplanation.style.display = 'none';
    // Reset score bars
    ['pro', 'con'].forEach(side => {
      ['logic', 'evidence', 'rhetoric'].forEach(cat => {
        $(`#${side}-${cat}-bar`).style.width = '0%';
        $(`#${side}-${cat}-val`).textContent = '—';
      });
    });
    // Animate round banner
    els.roundNumber.parentElement.classList.remove('slideDown');
    void els.roundNumber.parentElement.offsetWidth;
    els.roundNumber.parentElement.classList.add('slideDown');
    // Scroll to top of debate
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onAgentThinking(side) {
    const thinkEl = side === 'pro' ? els.proThinking : els.conThinking;
    const textEl = side === 'pro' ? els.proText : els.conText;
    thinkEl.style.display = 'flex';
    textEl.textContent = '';
    // Pulse the panel
    const panel = side === 'pro' ? $('#panel-pro') : $('#panel-con');
    panel.style.boxShadow = side === 'pro' ? 'var(--pro-glow)' : 'var(--con-glow)';
  }

  function onArgumentChunk(side, chunk, full) {
    const thinkEl = side === 'pro' ? els.proThinking : els.conThinking;
    const textEl = side === 'pro' ? els.proText : els.conText;
    thinkEl.style.display = 'none';
    textEl.textContent = full;
    // Auto-scroll argument box
    const box = textEl.parentElement;
    box.scrollTop = box.scrollHeight;
  }

  function onArgumentComplete(side, argument) {
    const thinkEl = side === 'pro' ? els.proThinking : els.conThinking;
    const textEl = side === 'pro' ? els.proText : els.conText;
    thinkEl.style.display = 'none';
    textEl.textContent = argument;
    // Remove panel glow
    const panel = side === 'pro' ? $('#panel-pro') : $('#panel-con');
    panel.style.boxShadow = '';
  }

  function onScoringStart() {
    els.scoringExplanation.style.display = 'flex';
    els.explanationText.textContent = '🧠 AI Judge is scoring both arguments...';
  }

  function onRoundComplete(data) {
    state.isRunning = false;
    setBtnLoading(els.btnNextRound, false);

    // Update score bars with animation
    animateScore('pro', 'logic', data.pro.scores.logic);
    animateScore('pro', 'evidence', data.pro.scores.evidence);
    animateScore('pro', 'rhetoric', data.pro.scores.rhetoric);
    animateScore('con', 'logic', data.con.scores.logic);
    animateScore('con', 'evidence', data.con.scores.evidence);
    animateScore('con', 'rhetoric', data.con.scores.rhetoric);

    // Update score badges
    state.proTotalScore += data.pro.total;
    state.conTotalScore += data.con.total;
    els.proScoreBadge.textContent = state.proTotalScore;
    els.conScoreBadge.textContent = state.conTotalScore;

    // Update total comparison bar
    const total = state.proTotalScore + state.conTotalScore || 1;
    els.totalFillPro.style.width = `${(state.proTotalScore / total) * 100}%`;
    els.totalFillCon.style.width = `${(state.conTotalScore / total) * 100}%`;

    // Scoring explanation
    if (data.explanation) {
      els.scoringExplanation.style.display = 'flex';
      els.explanationText.textContent = data.explanation;
    }

    // Show fallacies
    renderFallacies('pro', data.pro.fallacies);
    renderFallacies('con', data.con.fallacies);

    // Update round tracking
    state.currentRound = data.round;

    // Update button text
    if (state.currentRound >= state.rounds) {
      els.btnNextRound.querySelector('.btn-text').textContent = '🏆 See Verdict';
    } else {
      els.btnNextRound.querySelector('.btn-text').textContent = `⚡ Next Round (${state.currentRound + 1}/${state.rounds})`;
    }

    els.liveBadge.style.display = 'none';
  }

  function onDebateComplete(data) {
    state.status = 'completed';
    showScreen('verdict');

    // Winner display
    const isProWin = data.winner === 'pro';
    const isDraw = data.winner === 'draw';
    els.winnerEmoji.textContent = isDraw ? '🤝' : '🏆';
    els.winnerName.textContent = isDraw ? "It's a Draw!" : isProWin ? 'Agent PRO Wins!' : 'Agent CON Wins!';
    els.winnerName.style.color = isDraw ? 'var(--accent)' : isProWin ? 'var(--pro-light)' : 'var(--con-light)';
    els.finalProScore.textContent = data.proTotal;
    els.finalConScore.textContent = data.conTotal;

    // Summary
    if (data.summary) {
      els.summaryText.textContent = data.summary.summary || '';
      els.keyMoments.innerHTML = '';
      (data.summary.key_moments || []).forEach(m => {
        const div = document.createElement('div');
        div.className = 'moment-card';
        div.innerHTML = `<strong>Round ${m.round}:</strong> ${m.description}`;
        els.keyMoments.appendChild(div);
      });
    }
  }

  function onVoteUpdate(data) {
    const total = (data.proVotes + data.conVotes) || 1;
    const proPct = Math.round((data.proVotes / total) * 100);
    const conPct = 100 - proPct;
    els.voteFillPro.style.width = `${proPct}%`;
    els.voteFillCon.style.width = `${conPct}%`;
    els.votePctPro.textContent = `${proPct}%`;
    els.votePctCon.textContent = `${conPct}%`;
    els.voteCount.textContent = `${data.proVotes + data.conVotes} votes`;
  }

  // ═══ UI HELPERS ═══
  function animateScore(side, cat, value) {
    const bar = $(`#${side}-${cat}-bar`);
    const val = $(`#${side}-${cat}-val`);
    setTimeout(() => {
      bar.style.width = `${value}%`;
      val.textContent = value;
    }, 100);
  }

  function renderFallacies(side, fallacies) {
    const container = side === 'pro' ? els.proFallacies : els.conFallacies;
    container.innerHTML = '';
    if (!fallacies || fallacies.length === 0) return;
    fallacies.forEach((f, i) => {
      setTimeout(() => {
        const tag = document.createElement('div');
        tag.className = 'fallacy-tag';
        tag.innerHTML = `⚠️ <strong>${f.name}</strong>: ${f.explanation || ''}`;
        container.appendChild(tag);
      }, i * 300);
    });
  }

  function showScreen(name) {
    els.setupScreen.style.display = name === 'setup' ? 'flex' : 'none';
    els.debateScreen.style.display = name === 'debate' ? 'block' : 'none';
    els.verdictScreen.style.display = name === 'verdict' ? 'flex' : 'none';
  }

  function setBtnLoading(btn, loading) {
    btn.querySelector('.btn-text').style.display = loading ? 'none' : 'inline-flex';
    btn.querySelector('.btn-loading').style.display = loading ? 'inline-flex' : 'none';
    btn.disabled = loading;
  }

  function showError(msg) {
    alert(msg); // Simple for now — could be a toast
  }

  // ═══ ACTIONS ═══
  async function startDebate() {
    const topic = els.topicInput.value.trim();
    if (!topic || topic.length < 5) return showError('Please enter a topic (at least 5 characters).');

    setBtnLoading(els.btnStart, true);
    try {
      const data = await API.post('/api/debates', {
        topic,
        language: state.language,
        rounds: state.rounds,
      });

      state.debateId = data.id;
      state.topic = topic;
      state.currentRound = 0;
      state.proTotalScore = 0;
      state.conTotalScore = 0;
      state.status = 'active';

      // Connect WebSocket
      connectWS(data.id);

      // Setup debate UI
      els.debateTopicText.textContent = topic;
      els.roundTotal.textContent = state.rounds;
      els.proScoreBadge.textContent = '0';
      els.conScoreBadge.textContent = '0';
      els.proText.textContent = '';
      els.conText.textContent = '';
      els.btnNextRound.querySelector('.btn-text').textContent = '⚡ Start Round 1';

      if (state.language === 'ar') {
        document.body.classList.add('rtl');
      } else {
        document.body.classList.remove('rtl');
      }

      showScreen('debate');

      // Auto-start first round after a beat
      setTimeout(() => runNextRound(), 800);
    } catch (err) {
      showError(err.message);
    } finally {
      setBtnLoading(els.btnStart, false);
    }
  }

  async function runNextRound() {
    if (state.isRunning) return;
    if (state.currentRound >= state.rounds) return;

    state.isRunning = true;
    setBtnLoading(els.btnNextRound, true);

    try {
      await API.post(`/api/debates/${state.debateId}/round`);
      // Results come via WebSocket
    } catch (err) {
      state.isRunning = false;
      setBtnLoading(els.btnNextRound, false);
      showError(err.message);
    }
  }

  async function vote(side) {
    try {
      await API.post(`/api/debates/${state.debateId}/vote`, { side });
    } catch (err) {
      console.warn('Vote failed:', err);
    }
  }

  function resetToSetup() {
    state.debateId = null;
    state.status = 'idle';
    state.proTotalScore = 0;
    state.conTotalScore = 0;
    state.currentRound = 0;
    if (state.ws) state.ws.close();
    showScreen('setup');
    els.topicInput.value = '';
    els.charCount.textContent = '0';
  }

  // ═══ TOPICS ═══
  async function loadTopics() {
    try {
      const data = await API.get('/api/debates/topics');
      els.topicsGrid.innerHTML = '';
      data.topics.forEach(topic => {
        const card = document.createElement('button');
        card.className = 'topic-card';
        card.textContent = topic;
        card.addEventListener('click', () => {
          els.topicInput.value = topic;
          els.charCount.textContent = topic.length;
          els.topicInput.focus();
        });
        els.topicsGrid.appendChild(card);
      });
    } catch (err) {
      console.warn('Could not load topics');
    }
  }

  // ═══ HISTORY ═══
  async function loadHistory() {
    try {
      const data = await API.get('/api/debates');
      els.historyList.innerHTML = '';
      if (!data.debates || data.debates.length === 0) {
        els.historyList.innerHTML = '<div class="empty-state">No debates yet. Start your first one!</div>';
        return;
      }
      data.debates.forEach(d => {
        const item = document.createElement('div');
        item.className = 'history-item';
        const winner = d.winner === 'pro' ? '⚡ PRO Won' : d.winner === 'con' ? '🔥 CON Won' : d.winner === 'draw' ? '🤝 Draw' : '⏳ In Progress';
        item.innerHTML = `
          <div class="history-topic">${d.topic}</div>
          <div class="history-meta">${winner} · ${d.total_rounds} rounds · ${d.language === 'ar' ? 'العربية' : 'English'}</div>
        `;
        els.historyList.appendChild(item);
      });
    } catch (err) {
      console.warn('Could not load history');
    }
  }

  // ═══ PARTICLES BACKGROUND ═══
  function initParticles() {
    const canvas = $('#particles-canvas');
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function createParticles() {
      particles = [];
      const count = Math.min(80, Math.floor((w * h) / 15000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 2 + 0.5,
          color: Math.random() > 0.5 ? 'rgba(99,102,241,0.4)' : 'rgba(239,68,68,0.3)',
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - p.x;
          const dy = particles[j].y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(168,85,247,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();
    window.addEventListener('resize', () => { resize(); createParticles(); });
  }

  // ═══ THEME ═══
  function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
    localStorage.setItem('theme', current === 'dark' ? 'light' : 'dark');
  }

  // ═══ EVENT LISTENERS ═══
  function init() {
    // Load saved theme
    const saved = localStorage.getItem('theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);

    // Setup
    els.topicInput.addEventListener('input', () => {
      els.charCount.textContent = els.topicInput.value.length;
    });

    els.btnStart.addEventListener('click', startDebate);
    els.topicInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') startDebate();
    });

    els.btnRandom.addEventListener('click', () => {
      const cards = $$('.topic-card');
      if (cards.length > 0) {
        const idx = Math.floor(Math.random() * cards.length);
        cards[idx].click();
      }
    });

    // Round buttons
    $$('.round-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.round-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.rounds = parseInt(btn.dataset.rounds);
      });
    });

    // Language buttons
    $$('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.language = btn.dataset.lang;
        els.langLabel.textContent = state.language === 'ar' ? 'AR' : 'EN';
      });
    });

    // Debate controls
    els.btnNextRound.addEventListener('click', runNextRound);
    els.btnNewDebate.addEventListener('click', resetToSetup);
    els.btnNewDebate2.addEventListener('click', resetToSetup);

    // Voting
    els.btnVotePro.addEventListener('click', () => vote('pro'));
    els.btnVoteCon.addEventListener('click', () => vote('con'));

    // Share
    els.btnShare.addEventListener('click', () => {
      const text = `⚔️ AI Debate Arena\nTopic: ${state.topic}\nResult: ${els.winnerName.textContent}\nPRO: ${els.finalProScore.textContent} vs CON: ${els.finalConScore.textContent}`;
      if (navigator.share) {
        navigator.share({ title: 'AI Debate Arena', text });
      } else {
        navigator.clipboard.writeText(text).then(() => alert('Result copied to clipboard!'));
      }
    });

    // History
    els.btnHistory.addEventListener('click', () => {
      loadHistory();
      els.historyModal.style.display = 'flex';
    });
    els.btnCloseHistory.addEventListener('click', () => {
      els.historyModal.style.display = 'none';
    });
    els.historyModal.addEventListener('click', (e) => {
      if (e.target === els.historyModal) els.historyModal.style.display = 'none';
    });

    // Theme
    els.btnTheme.addEventListener('click', toggleTheme);

    // Language toggle in header
    els.btnLang.addEventListener('click', () => {
      state.language = state.language === 'en' ? 'ar' : 'en';
      els.langLabel.textContent = state.language === 'ar' ? 'AR' : 'EN';
      $$('.lang-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.lang === state.language);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'n' || e.key === 'N') els.btnNextRound.click();
      if (e.key === 'p') vote('pro');
      if (e.key === 'c') vote('con');
    });

    // Init
    initParticles();
    loadTopics();
  }

  // ═══ BOOT ═══
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
