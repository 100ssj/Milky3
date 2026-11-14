/* Optional classroom progress: name-only entry, private per-run capability, retry queue. */
(() => {
  const api = window.ClassroomAPI;
  if (!api?.ready) return;
  const storageKey = 'milky3-session-v1';
  let session = null, saved = null, completed = false, revision = 0, sent = -1, busy = false, timer, status = '';
  try { saved = JSON.parse(sessionStorage.getItem(storageKey)); } catch {}
  if (!saved || !/^[a-f0-9]{64}$/.test(saved.token) || typeof saved.name !== 'string' || !saved.id) saved = null;
  function progress() {
    const clues = new Set();
    Object.keys(records).forEach(c => [0, 1, 2].forEach(i => clues.add(+c * 3 + i)));
    Object.entries(journals).forEach(([c, j]) => j.opened.forEach(i => clues.add(+c * 3 + i)));
    return {
      p_clues: [...clues], p_stories: Object.keys(records).map(Number), p_finished: completed
    };
  }
  function snapshot() {
    return { journals: Object.fromEntries(Object.entries(journals).map(([k, j]) => [k, { choice: j.choice, opened: [...j.opened] }])),
      records, reflection, activeCase, completed, player: { x: player.x, y: player.y } };
  }
  function remember() {
    if (!session) return;
    session.snapshot = snapshot(); saved = session;
    try { sessionStorage.setItem(storageKey, JSON.stringify(session)); } catch { status = '이 기기에서 새로고침 복원 불가'; }
  }
  function restore(s) {
    Object.keys(journals).forEach(k => delete journals[k]);
    records = {}; reflection = {}; activeCase = null; completed = false;
    player.x = 500; player.y = 510;
    if (!s) return;
    for (const [k, j] of Object.entries(s.journals || {})) if (/^[0-2]$/.test(k) && cases[+k].options.includes(j.choice)) {
      journals[k] = { choice: j.choice, opened: new Set((j.opened || []).filter(i => [0, 1, 2].includes(i))) };
    }
    for (const [k, r] of Object.entries(s.records || {})) if (/^[0-2]$/.test(k) && typeof r.before === 'string' && typeof r.after === 'string') records[k] = r;
    for (const key of ['scene', 'thought', 'possibility', 'action']) if (typeof s.reflection?.[key] === 'string') reflection[key] = s.reflection[key].slice(0, 1000);
    activeCase = journals[s.activeCase] ? s.activeCase : null;
    completed = s.completed === true && Object.keys(records).length === 3;
    if (s.player && canStand(s.player.x, s.player.y)) { player.x = s.player.x; player.y = s.player.y; }
  }
  function paintStatus() {
    const tag = document.getElementById('sync-status');
    if (tag) tag.textContent = status;
  }
  async function flush(keepalive = false) {
    if (!session || busy || sent === revision) return;
    const version = revision, run = session;
    busy = true; status = '진행 저장 중…'; paintStatus();
    try {
      await api.rpc('milky_update', { p_id: run.id, p_token: run.token, ...progress() }, { keepalive });
      if (session === run) { sent = version; status = '선생님께 진행 저장됨'; }
    } catch { if (session === run) status = '연결 대기 · 자동으로 다시 저장해요'; }
    finally {
      busy = false; paintStatus();
      if (session && sent !== revision) { clearTimeout(timer); timer = setTimeout(flush, 15000); }
    }
  }
  function changed() {
    if (!session) return;
    revision++; remember(); clearTimeout(timer); timer = setTimeout(flush, 400);
  }
  const baseHud = updateHud;
  updateHud = function() {
    baseHud();
    if (session && started) {
      const badge = document.createElement('div'); badge.className = 'student-badge';
      badge.innerHTML = `<b>${esc(session.name)} 탐정</b><span id="sync-status" role="status">${esc(status)}</span>`;
      hud.appendChild(badge);
    }
  };
  for (const key of ['home', 'game', 'discovery', 'revealClue']) {
    const original = window[key];
    window[key] = function(...args) { const result = original(...args); changed(); return result; };
  }
  const baseFinish = finish;
  finish = function() { completed = Object.keys(records).length === 3; baseFinish(); changed(); };
  const baseReflect = reflect;
  reflect = function() {
    baseReflect();
    const note = document.querySelector('.reflection .empty');
    if (note) note.textContent = '쓴 글은 선생님께 전송되지 않아요. 완료 여부만 알려 드려요. 수첩은 마지막에 파일로 저장할 수 있어요.';
    for (const key of ['scene', 'thought', 'possibility', 'action']) document.getElementById(key)?.addEventListener('input', remember);
  };
  const basePause = pauseMenu;
  pauseMenu = function() {
    if (!started) return;
    basePause();
    dialog.querySelector('.quiet').textContent = '같은 탭에서는 새로고침해도 이어 할 수 있어요. 탭을 닫으면 다음 입장은 새 기록으로 시작해요.';
    const leave = document.createElement('button'); leave.textContent = '입장 화면으로';
    leave.onclick = () => { remember(); flush(); dialog.close(); started = false; titleScreen(); };
    dialog.appendChild(leave);
  };
  const baseTitle = titleScreen;
  titleScreen = function() {
    baseTitle();
    const begin = document.getElementById('begin');
    begin.insertAdjacentHTML('beforebegin', `<label class="name-label" for="student-name">탐정의 이름을 알려 줘!</label><input id="student-name" class="name-input" maxlength="24" autocomplete="off" placeholder="선생님이 알아볼 수 있는 이름" value="${esc(saved?.name || '')}"><p class="entry-note">이름과 진행률이 선생님께 전달돼요.</p><p id="entry-error" role="alert"></p>`);
    begin.insertAdjacentHTML('afterend', '<a class="teacher-entry" href="teacher.html">교사 관찰실 ↗</a>');
    begin.textContent = saved ? '▶ 이어서 탐험' : '▶ 모험 시작';
    const input = document.getElementById('student-name');
    input.addEventListener('input', () => begin.textContent = saved && input.value.trim() === saved.name ? '▶ 이어서 탐험' : '▶ 모험 시작');
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) begin.click(); });
    begin.onclick = async () => {
      const name = input.value.trim(), error = document.getElementById('entry-error');
      if (!name || name.length > 24 || /[\u0000-\u001f\u007f]/.test(name)) { error.textContent = '이름을 1~24글자로 입력해 줘.'; input.focus(); return; }
      const next = saved?.name === name ? saved : { id: crypto.randomUUID(), token: api.secret(), name };
      begin.disabled = true; input.disabled = true; error.textContent = '탐정 이름을 등록하는 중…';
      try {
        await api.rpc('milky_start', { p_id: next.id, p_token: next.token, p_name: name });
        session = next; restore(next.snapshot); revision = 0; sent = -1; status = '선생님께 입장 알림 완료';
        started = true; beep(); home(); flush();
      } catch (e) { error.textContent = e.message; begin.disabled = false; input.disabled = false; }
    };
  };
  document.getElementById('guide').querySelectorAll('p')[2].textContent = '입장할 때 적은 이름과 진행률은 선생님께 전달돼요. 수첩에 쓴 개인 경험 글은 전송되지 않아요. 마지막에 수첩을 파일로 저장하세요.';
  window.addEventListener('online', () => flush());
  window.addEventListener('pagehide', () => { remember(); flush(true); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { remember(); flush(true); } });
  titleScreen();
})();
