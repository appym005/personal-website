(() => {
  'use strict';

  const ROUND_MS = 60_000;
  const FRESH_MS = 10_000;
  const MAX_SETTLEMENT_DELAY_MS = 2_500;
  const SAVE_KEY = 'candle-clash-v1';
  const ASSETS = ['BTC', 'ETH', 'SOL'];
  const BINANCE_WS = 'wss://data-stream.binance.vision/stream?streams=btcusdt@trade/ethusdt@trade/solusdt@trade';
  const COINBASE_WS = 'wss://ws-feed.exchange.coinbase.com';
  const COINBASE_PAIRS = ['BTC-USD', 'ETH-USD', 'SOL-USD'];
  const $ = id => document.getElementById(id);
  const dom = {
    feed: $('feed-status'), feedLabel: $('feed-label'), provider: $('provider-badge'),
    price: $('live-price'), delta: $('price-delta'), currency: $('currency-label'),
    timer: $('round-timer'), progress: $('timer-progress'), chart: $('price-chart'),
    overlay: $('chart-offline'), overlayLabel: $('chart-offline-label'),
    chartMark: $('chart-mark'), lastTick: $('last-tick'),
    up: $('call-up'), down: $('call-down'), entry: $('entry-label'),
    challengeCopy: $('challenge-copy'), message: $('round-message'),
    result: $('round-result'), resultEmoji: $('result-emoji'), resultTitle: $('result-title'),
    resultDetail: $('result-detail'), resultPoints: $('result-points'), again: $('play-again'),
    score: $('score-value'), streak: $('streak-value'), best: $('best-streak'),
    wins: $('wins-value'), rate: $('rate-value'), share: $('share-score'), feedback: $('share-feedback')
  };
  const emptyStats = () => ({ score: 0, streak: 0, best: 0, wins: 0, losses: 0, draws: 0 });
  function readStats() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!saved || typeof saved !== 'object') return emptyStats();
      const stats = emptyStats();
      for (const key of Object.keys(stats)) {
        if (Number.isSafeInteger(saved[key]) && saved[key] >= 0) stats[key] = Math.min(saved[key], 100_000_000);
      }
      return stats;
    } catch (_) { return emptyStats(); }
  }
  const state = {
    asset: 'BTC', provider: null, status: 'connecting', socket: null,
    quote: 'USDT', prices: {}, history: Object.fromEntries(ASSETS.map(a => [a, []])),
    stats: readStats(), round: null, finished: false,
    fallbackAttempted: false, connectionEpoch: 0, reconnectTimer: null, connectionTimer: null,
    lastFeedAt: 0, chartPending: false
  };

  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state.stats)); } catch (_) {} }
  function asMoney(price) {
    if (!Number.isFinite(price)) return '—';
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: price >= 1000 ? 2 : 3, maximumFractionDigits: price >= 1000 ? 2 : 3 });
  }
  function fresh(asset = state.asset) { const q = state.prices[asset]; return !!q && Date.now() - q.at < FRESH_MS; }
  function roundTimeLeft() { return state.round ? Math.max(0, state.round.endsAt - Date.now()) : ROUND_MS; }
  function fmtTime(ms) {
    const seconds = Math.ceil(ms / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function announce(text, active = false) { dom.message.textContent = text; dom.message.classList.toggle('active', active); }
  function renderStats() {
    const s = state.stats;
    dom.score.textContent = s.score.toLocaleString('en-US');
    dom.streak.innerHTML = `${s.streak} <small aria-hidden="true">🔥</small>`;
    dom.best.textContent = String(s.best);
    dom.wins.textContent = String(s.wins);
    const decisive = s.wins + s.losses;
    dom.rate.textContent = decisive ? `${Math.round(100 * s.wins / decisive)}%` : '0%';
  }
  function renderControls() {
    const ready = fresh() && !state.round && !state.finished;
    dom.up.disabled = !ready;
    dom.down.disabled = !ready;
    document.querySelectorAll('.coin').forEach(el => {
      el.disabled = !!state.round;
      el.classList.toggle('active', el.dataset.asset === state.asset);
      el.setAttribute('aria-pressed', String(el.dataset.asset === state.asset));
    });
  }
  function renderStatus() {
    const ready = fresh();
    dom.feed.className = 'feed-status ' + (ready ? 'online' : state.status === 'connecting' ? '' : 'offline');
    dom.feedLabel.textContent = ready ? 'MARKET LIVE' : state.status === 'connecting' ? 'CONNECTING' : 'FEED UNAVAILABLE';
    dom.provider.textContent = ready ? `LIVE · ${state.provider.toUpperCase()} SPOT` : 'WAITING FOR LIVE DATA';
    dom.currency.textContent = `/ ${state.quote}`;
    dom.chartMark.textContent = `${state.asset} / ${state.quote}`;
    dom.overlay.classList.toggle('hidden', ready);
    dom.overlayLabel.textContent = state.status === 'connecting' ? 'Connecting to live market data…' : 'Live market feed unavailable. Reconnecting…';
    const q = state.prices[state.asset];
    dom.price.textContent = ready ? asMoney(q.value) : '—';
    const h = state.history[state.asset];
    const anchor = h.length ? h[0].price : null;
    const delta = ready && anchor && anchor > 0 ? 100 * (q.value - anchor) / anchor : null;
    dom.delta.textContent = delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(3)}%`;
    dom.delta.className = 'price-delta ' + (delta > 0 ? 'positive' : delta < 0 ? 'negative' : '');
    dom.lastTick.textContent = ready ? 'UPDATED JUST NOW' : 'AWAITING TICK';
    renderControls();
  }
  function takePrice(asset, value, eventTime) {
    if (!ASSETS.includes(asset) || !Number.isFinite(value) || value <= 0 || value > 1_000_000_000) return;
    const now = Date.now();
    if (Number.isFinite(eventTime) && Math.abs(now - eventTime) > 20_000) return; // reject stale/backfilled ticks
    if (state.prices[asset]?.at && now < state.prices[asset].at) return;
    state.prices[asset] = { value, at: now };
    const history = state.history[asset];
    history.push({ t: now, price: value });
    const oldest = now - 120_000;
    while (history.length > 2 && history[0].t < oldest) history.shift();
    state.lastFeedAt = now;
    if (asset === state.asset) {
      renderStatus(); scheduleChart();
      if (!state.round && !state.finished && dom.message.textContent.includes('Waiting for fresh market'))
        announce(`${asset} is live. Choose higher or lower to start.`);
    }
  }
  function clearConnectionTimers() {
    if (state.connectionTimer) clearTimeout(state.connectionTimer);
    if (state.reconnectTimer) clearTimeout(state.reconnectTimer);
    state.connectionTimer = state.reconnectTimer = null;
  }
  function connect(provider = 'binance') {
    clearConnectionTimers();
    state.connectionEpoch++;
    const epoch = state.connectionEpoch;
    if (state.socket) { try { state.socket.close(); } catch (_) {} }
    if (state.round) voidRound('Market feed changed. Round voided — no points deducted.');
    state.status = 'connecting';
    state.provider = provider;
    state.quote = provider === 'binance' ? 'USDT' : 'USD';
    state.prices = {};
    state.lastFeedAt = 0;
    state.history = Object.fromEntries(ASSETS.map(a => [a, []]));
    renderStatus(); scheduleChart();
    let gotTick = false;
    let socket;
    try { socket = new WebSocket(provider === 'binance' ? BINANCE_WS : COINBASE_WS); }
    catch (_) { connectionFailed(epoch, provider); return; }
    state.socket = socket;
    socket.onopen = () => {
      if (epoch !== state.connectionEpoch) return;
      if (provider === 'coinbase') socket.send(JSON.stringify({ type: 'subscribe', product_ids: COINBASE_PAIRS, channels: ['ticker'] }));
    };
    socket.onmessage = event => {
      if (epoch !== state.connectionEpoch) return;
      try {
        const msg = JSON.parse(event.data);
        if (provider === 'binance') {
          const tick = msg.data || msg;
          if (tick.e !== 'trade') return;
          const asset = String(tick.s || '').replace('USDT','');
          const value = Number(tick.p);
          if (ASSETS.includes(asset) && Number.isFinite(value)) { gotTick = true; takePrice(asset, value, Number(tick.T)); }
        } else if (msg.type === 'ticker' && msg.product_id) {
          const asset = String(msg.product_id).split('-')[0];
          const value = Number(msg.price);
          const ts = Date.parse(msg.time);
          if (ASSETS.includes(asset) && Number.isFinite(value)) { gotTick = true; takePrice(asset, value, Number.isFinite(ts) ? ts : undefined); }
        }
        if (gotTick) state.status = 'online';
      } catch (_) { /* malformed messages are ignored */ }
    };
    socket.onerror = () => { if (epoch === state.connectionEpoch) state.status = 'offline'; };
    socket.onclose = () => { if (epoch === state.connectionEpoch) connectionFailed(epoch, provider); };
    state.connectionTimer = setTimeout(() => {
      if (epoch !== state.connectionEpoch) return;
      if (!gotTick) connectionFailed(epoch, provider);
    }, 9000);
  }
  function connectionFailed(epoch, provider) {
    if (epoch !== state.connectionEpoch) return;
    state.status = 'offline';
    renderStatus();
    if (state.round) voidRound('Live prices were interrupted. Round voided — no points deducted.');
    state.reconnectTimer = setTimeout(() => {
      if (epoch !== state.connectionEpoch) return;
      if (provider === 'binance' && !state.fallbackAttempted) {
        state.fallbackAttempted = true;
        connect('coinbase');
      } else {
        state.fallbackAttempted = false;
        connect('binance');
      }
    }, 1800);
  }
  function selectAsset(asset) {
    if (!ASSETS.includes(asset) || state.round) return;
    state.asset = asset;
    state.finished = false;
    dom.result.classList.add('hidden');
    dom.entry.innerHTML = 'ENTRY <span>LOCKED WHEN YOU PLAY</span>';
    dom.challengeCopy.textContent = 'Predict where the market price will be in 60 seconds. Nothing to deposit. Everything to prove.';
    renderStatus(); scheduleChart();
    announce(fresh() ? `${asset} is live. Choose higher or lower to start.` : 'Waiting for fresh market prices…');
  }
  function startRound(direction) {
    if (state.round || state.finished || !fresh()) return;
    const price = state.prices[state.asset].value;
    const started = Date.now();
    state.round = { asset: state.asset, direction, entry: price, started, endsAt: started + ROUND_MS };
    dom.result.classList.add('hidden');
    dom.entry.innerHTML = `ENTRY <span>${asMoney(price)}</span>`;
    dom.challengeCopy.textContent = `You called ${direction === 1 ? 'HIGHER ↗' : 'LOWER ↘'} on ${state.asset}. Market price at the end of 60 seconds decides the result.`;
    announce('PREDICTION LOCKED · Stay on this page for settlement.', true);
    renderControls();
    scheduleChart();
  }
  function voidRound(reason) {
    if (!state.round) return;
    state.round = null;
    state.finished = false;
    dom.timer.textContent = '01:00';
    dom.timer.classList.remove('urgent');
    dom.progress.style.width = '0%';
    dom.entry.innerHTML = 'ENTRY <span>LOCKED WHEN YOU PLAY</span>';
    dom.challengeCopy.textContent = 'Round cancelled because a reliable 60-second price comparison was unavailable.';
    announce(reason);
    renderControls();
    scheduleChart();
  }
  function settleRound() {
    const round = state.round;
    if (!round) return;
    const now = Date.now();
    if (now - round.endsAt > MAX_SETTLEMENT_DELAY_MS || !fresh(round.asset) || document.hidden) {
      voidRound('Unable to verify a price at the 60-second mark. Round voided — no points deducted.');
      return;
    }
    const exit = state.prices[round.asset].value;
    const difference = exit - round.entry;
    const won = difference !== 0 && Math.sign(difference) === round.direction;
    const draw = difference === 0;
    let points = 0;
    if (won) {
      state.stats.streak++;
      state.stats.best = Math.max(state.stats.best, state.stats.streak);
      state.stats.wins++;
      points = Math.min(300, 100 + 25 * (state.stats.streak - 1));
    } else if (!draw) {
      state.stats.losses++;
      state.stats.streak = 0;
      points = -50;
    } else { state.stats.draws++; }
    state.stats.score = Math.max(0, state.stats.score + points);
    persist();
    state.round = null;
    state.finished = true;
    dom.timer.textContent = '00:00';
    dom.progress.style.width = '100%';
    dom.result.classList.remove('hidden');
    dom.resultEmoji.textContent = won ? '✦' : draw ? '◆' : '✕';
    dom.resultTitle.textContent = won ? 'YOU BEAT THE CANDLE!' : draw ? 'A PERFECTLY FLAT CANDLE' : 'THE CANDLE WON THIS ONE';
    dom.resultDetail.textContent = `${asMoney(round.entry)} → ${asMoney(exit)} · ${round.asset} / ${state.quote}`;
    dom.resultPoints.textContent = points > 0 ? `+${points}` : String(points);
    dom.resultPoints.classList.toggle('loss', points < 0);
    announce(won ? 'NICE CALL. Your streak is alive.' : draw ? 'No movement. No points changed.' : 'Next round is another chance.');
    renderStats(); renderControls(); scheduleChart();
  }
  function updateTimer() {
    if (!state.round) return;
    const left = roundTimeLeft();
    dom.timer.textContent = fmtTime(left);
    dom.timer.classList.toggle('urgent', left <= 10_000);
    dom.progress.style.width = `${100 * (1 - left / ROUND_MS)}%`;
    if (!fresh(state.round.asset)) { voidRound('Live data went stale. Round voided — no points deducted.'); return; }
    if (left === 0) settleRound();
  }
  function drawChart() {
    state.chartPending = false;
    const canvas = dom.chart;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const w=rect.width, h=rect.height, margin=27, top=50, bottom=h-36;
    ctx.strokeStyle='#223642';ctx.lineWidth=1;
    for(let i=0;i<=4;i++){const y=top+(bottom-top)*i/4;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    for(let i=0;i<=10;i++){const x=w*i/10;ctx.beginPath();ctx.moveTo(x,30);ctx.lineTo(x,h);ctx.stroke();}
    const points = state.history[state.asset];
    if (!points.length) return;
    const endT = Date.now(), startT = endT - 120_000;
    const visible = points.filter(p=>p.t>=startT);
    if (!visible.length) return;
    const values=visible.map(p=>p.price);
    if(state.round) values.push(state.round.entry);
    let low=Math.min(...values), high=Math.max(...values);
    const pad=Math.max((high-low)*.4, Math.abs(high)*.00008, 0.001);
    low-=pad;high+=pad;
    const X=t=>Math.max(10,Math.min(w-10,10+(w-20)*(t-startT)/120_000));
    const Y=p=>bottom-(p-low)/(high-low)*(bottom-top);
    if(state.round){
      const y=Y(state.round.entry);
      ctx.setLineDash([5,5]);ctx.strokeStyle='#b6c4c070';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='#cad2ce';ctx.font='10px monospace';ctx.textAlign='right';ctx.fillText('ENTRY',w-11,Math.max(43,y-8));
    }
    const gain = !state.round || visible[visible.length-1].price >= state.round.entry;
    const lineColor=gain?'#c6ff4c':'#ff7580';
    const gradient=ctx.createLinearGradient(0,top,0,bottom);
    gradient.addColorStop(0,gain?'#bcff3e33':'#ff657722');
    gradient.addColorStop(1,'#0d172000');
    ctx.beginPath();
    visible.forEach((p,i)=>i?ctx.lineTo(X(p.t),Y(p.price)):ctx.moveTo(X(p.t),Y(p.price)));
    ctx.lineTo(X(visible[visible.length-1].t),bottom);
    ctx.lineTo(X(visible[0].t),bottom);ctx.closePath();ctx.fillStyle=gradient;ctx.fill();
    ctx.beginPath();
    visible.forEach((p,i)=>i?ctx.lineTo(X(p.t),Y(p.price)):ctx.moveTo(X(p.t),Y(p.price)));
    ctx.strokeStyle=lineColor;ctx.lineWidth=2.6;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
    const last=visible[visible.length-1];
    ctx.fillStyle=lineColor;ctx.beginPath();ctx.arc(X(last.t),Y(last.price),4.6,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=lineColor+'77';ctx.lineWidth=2;ctx.beginPath();ctx.arc(X(last.t),Y(last.price),10,0,Math.PI*2);ctx.stroke();
  }
  function scheduleChart() {
    if (state.chartPending) return;
    state.chartPending = true;
    requestAnimationFrame(drawChart);
  }
  function share() {
    const s = state.stats;
    const message = `I scored ${s.score.toLocaleString('en-US')} points on Candle Clash 🕹️📈 (best streak: ${s.best}). Can you beat the candle?`;
    const url = new URL('./', location.href).href;
    const text = `${message}\n${url}`;
    if (navigator.share) {
      navigator.share({ title: 'Candle Clash', text: message, url }).then(() => {
        dom.feedback.textContent = 'Shared! Bring on the competition.';
      }).catch(() => { dom.feedback.textContent = 'Sharing cancelled. Your score is safe.'; });
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => { dom.feedback.textContent = 'Score and link copied to clipboard.'; }).catch(() => { dom.feedback.textContent = 'Copy unavailable. Share this page URL with a friend.'; });
    } else { dom.feedback.textContent = 'Share this page URL with a friend.'; }
  }
  function onKey(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|BUTTON|SELECT)$/.test(event.target.tagName)) return;
    if (event.key === 'ArrowUp') { event.preventDefault(); startRound(1); }
    if (event.key === 'ArrowDown') { event.preventDefault(); startRound(-1); }
  }
  document.querySelectorAll('.coin').forEach(btn => btn.addEventListener('click', () => selectAsset(btn.dataset.asset)));
  dom.up.addEventListener('click', () => startRound(1));
  dom.down.addEventListener('click', () => startRound(-1));
  dom.again.addEventListener('click', () => {
    state.finished = false;
    dom.result.classList.add('hidden');
    dom.timer.textContent='01:00';dom.timer.classList.remove('urgent');dom.progress.style.width='0%';
    dom.entry.innerHTML = 'ENTRY <span>LOCKED WHEN YOU PLAY</span>';
    dom.challengeCopy.textContent = 'Predict where the market price will be in 60 seconds. Nothing to deposit. Everything to prove.';
    announce(fresh() ? 'New round ready. Pick a direction.' : 'Waiting for fresh market prices…');
    renderControls();
  });
  dom.share.addEventListener('click', share);
  document.addEventListener('keydown', onKey);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleChart).observe(dom.chart);
  else window.addEventListener('resize', scheduleChart);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { updateTimer();renderStatus();scheduleChart(); } });
  $('year').textContent = String(new Date().getFullYear());
  renderStats();renderControls();renderStatus();scheduleChart();
  connect('binance');
  setInterval(() => {
    updateTimer();
    if (!fresh()) renderStatus();
    if (state.status === 'online' && state.lastFeedAt && Date.now() - state.lastFeedAt > 20_000) {
      state.status = 'offline';
      try { state.socket?.close(); } catch (_) {}
    }
    if (state.round) scheduleChart();
  }, 250);
})();
