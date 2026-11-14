/* Shared transport. Student and teacher credentials travel only in HTTPS request bodies. */
(() => {
  const config = window.CLASSROOM_CONFIG || {};
  const ready = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url || '') && /^sb_publishable_/.test(config.publishableKey || '');
  async function rpc(name, data, options = {}) {
    if (!ready) throw new Error('진행 기록 저장소를 연결하는 중입니다.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(config.url + '/rest/v1/rpc/' + name, {
        method: 'POST', headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(data), signal: controller.signal, cache: 'no-store', keepalive: !!options.keepalive
      });
      if (!res.ok) {
        const error = new Error(res.status === 401 || res.status === 403 ? '접속 정보를 확인해 주세요.' : '저장소에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
        error.status = res.status;
        throw error;
      }
      return res.status === 204 ? null : await res.json();
    } finally { clearTimeout(timer); }
  }
  const secret = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('');
  window.ClassroomAPI = Object.freeze({ ready, rpc, secret });
})();
