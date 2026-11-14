(() => {
  const api = window.ClassroomAPI, $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let key = '', rows = [], polling, generation = 0, loading = false;
  const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const time = s => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(s));
  const score = r => Math.round((r.clues.length + r.stories.length + Number(r.finished)) / 13 * 100);
  const visibleRows = () => rows.filter(r => r.student_name.includes($('search').value.trim()) && ($('filter').value === 'all' || r.finished === ($('filter').value === 'done')));
  function render() {
    $('stats').innerHTML = [['입장한 탐정', rows.length + '명'], ['탐험 완료', rows.filter(r => r.finished).length + '명'], ['평균 진행률', (rows.length ? Math.round(rows.reduce((s, r) => s + score(r), 0) / rows.length) : 0) + '%']].map(([label, value]) => `<div class="stat"><small>${label}</small><strong>${value}</strong></div>`).join('');
    const list = visibleRows();
    $('students').innerHTML = list.map(r => `<tr><td><b>${esc(r.student_name)}</b><small>${time(r.started_at)} 입장 · ${esc(r.id.slice(0, 6))}</small></td><td class="progress-cell"><progress value="${score(r)}" max="100" aria-label="${esc(r.student_name)} 진행률"></progress>${score(r)}%</td><td>${r.clues.length} / 9</td><td>${r.stories.length} / 3</td><td class="${r.finished ? 'done' : ''}">${r.finished ? '✓ 완료' : '탐험 중'}</td><td>${time(r.updated_at)}</td></tr>`).join('');
    $('empty').hidden = list.length > 0;
    $('empty').textContent = rows.length ? '조건에 맞는 탐정이 없어요.' : '이 날짜에 입장한 탐정이 아직 없어요.';
    $('export').disabled = !list.length;
  }
  async function refresh() {
    if (!key || loading || !$('day').value) return;
    const current = generation, date = $('day').value;
    loading = true; $('refresh').disabled = true;
    try {
      const data = await api.rpc('milky_teacher', { p_key: key, p_day: date });
      if (current !== generation || date !== $('day').value) return;
      rows = data; render(); $('load-error').textContent = '';
      $('updated').textContent = `${time(new Date())}에 확인 · 10초마다 새로 확인합니다. (한국 시간)`;
    } catch (e) {
      if (current === generation) $('load-error').textContent = '새 기록을 불러오지 못했습니다. 표시된 내용은 마지막으로 확인한 기록입니다. ' + e.message;
    } finally {
      loading = false; $('refresh').disabled = false;
      if (key && (current !== generation || date !== $('day').value)) refresh();
    }
  }
  $('day').value = today();
  $('login-form').onsubmit = async e => {
    e.preventDefault(); const candidate = $('teacher-key').value.trim(), button = e.currentTarget.querySelector('button');
    if (!/^[a-f0-9]{64}$/.test(candidate)) { $('login-error').textContent = '설정할 때 받은 교사 접속 키를 확인해 주세요.'; return; }
    button.disabled = true; $('login-error').textContent = '접속 확인 중…';
    try {
      rows = await api.rpc('milky_teacher', { p_key: candidate, p_day: $('day').value });
      key = candidate; generation++; $('teacher-key').value = ''; $('login-error').textContent = '';
      $('login').hidden = true; $('dashboard').hidden = false; render();
      $('updated').textContent = `${time(new Date())}에 확인 · 10초마다 새로 확인합니다. (한국 시간)`;
      polling = setInterval(() => { if (!document.hidden) refresh(); }, 10000);
    } catch (err) { $('login-error').textContent = err.message; }
    finally { button.disabled = false; }
  };
  $('logout').onclick = () => {
    key = ''; rows = []; generation++; clearInterval(polling);
    $('students').innerHTML = ''; $('stats').innerHTML = ''; $('load-error').textContent = '';
    $('dashboard').hidden = true; $('login').hidden = false; $('teacher-key').focus();
  };
  $('search').oninput = render; $('filter').onchange = render;
  $('day').onchange = () => { generation++; rows = []; render(); $('updated').textContent = $('day').value ? '날짜의 기록을 불러오는 중…' : '확인할 입장 날짜를 선택해 주세요.'; refresh(); };
  $('refresh').onclick = refresh;
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  $('export').onclick = () => {
    const cell = value => '"' + String(value).replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""') + '"';
    const lines = [['입장 날짜', '이름', '기록 ID', '진행률', '단서', '이야기', '수첩 완료', '입장 시간', '마지막 저장'], ...visibleRows().map(r => [$('day').value, r.student_name, r.id, score(r) + '%', r.clues.length, r.stories.length, r.finished ? '완료' : '진행 중', time(r.started_at), time(r.updated_at)])];
    const url = URL.createObjectURL(new Blob(['\ufeff' + lines.map(line => line.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `마음탐정단-진행률-${$('day').value}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (!api.ready) { $('login-error').textContent = '진행 기록 저장소를 연결하는 중입니다. 연결 후 사용할 수 있어요.'; $('login-form').querySelector('button').disabled = true; }
})();
