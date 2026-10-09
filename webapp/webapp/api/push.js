// Notificaciones push de CientiFitness (sin dependencias).
// Variables en Vercel: SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY y CRON_SECRET.
// GET  → clave pública (la app la usa para activar las notificaciones).
// POST {cron:true} (cabecera x-cron) → envía los recordatorios que tocan (lo llama Supabase cada 15 min).
// POST {type:'plan'|'msg'|'test', client_key, text} con sesión del entrenador → aviso inmediato a ese asesorado.
// POST {type:'test-me'} con sesión del asesorado → prueba en sus dispositivos.
const crypto = require('crypto');
const URL_SB = 'https://soxtkdakmpjxtvvtrvjs.supabase.co';
const ANON = 'sb_publishable_mGei9bBQytQo75nSAo2umw_c2bvY_gA';
const DEF = { water: true, waterL: 2, pre: true, preMin: 60, revBefore: true, revDay: true, revHour: '20:00', plan: true, weigh: true, weighDow: 0, weighHour: '08:30', msg: true };

const env = k => String(process.env[k] || '').replace(/\s+/g, '').replace(/^["']|["']$/g, '');
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const ub64 = s => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const hk = (salt, ikm, info, len) => { const prk = crypto.createHmac('sha256', salt).update(ikm).digest(); return crypto.createHmac('sha256', prk).update(Buffer.concat([info, Buffer.from([1])])).digest().subarray(0, len); };
const num = v => { const x = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isNaN(x) ? 0 : x; };
const hm = s => { const m = /^(\d{1,2}):(\d{2})/.exec(String(s || '')); return m ? (+m[1]) * 60 + (+m[2]) : null; };
const fmt = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const addDay = (d, n) => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

function jwt(aud, PUB, PRIV) {
  const h = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const p = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'mailto:elcientifitness@gmail.com' }));
  const pub = ub64(PUB);
  const key = crypto.createPrivateKey({ key: { kty: 'EC', crv: 'P-256', d: PRIV, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) }, format: 'jwk' });
  const sig = crypto.sign('sha256', Buffer.from(h + '.' + p), { key, dsaEncoding: 'ieee-p1363' });
  return h + '.' + p + '.' + b64u(sig);
}
function encrypt(sub, text) { // RFC 8291 (aes128gcm)
  const ua = ub64(sub.p256dh), au = ub64(sub.auth), e = crypto.createECDH('prime256v1'); e.generateKeys();
  const as = e.getPublicKey(), sh = e.computeSecret(ua), salt = crypto.randomBytes(16);
  const ikm = hk(au, sh, Buffer.concat([Buffer.from('WebPush: info\0'), ua, as]), 32);
  const cek = hk(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), nonce = hk(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const ct = Buffer.concat([c.update(Buffer.concat([Buffer.from(text), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([as.length]), as, ct]);
}
async function push(sub, data, PUB, PRIV) {
  const u = new URL(sub.endpoint);
  const r = await fetch(sub.endpoint, { method: 'POST', headers: { Authorization: 'vapid t=' + jwt(u.origin, PUB, PRIV) + ', k=' + PUB, 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '43200', Urgency: 'normal' }, body: encrypt(sub, JSON.stringify(data)) });
  return r.status;
}
function local(tz) {
  let p; try { p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' }).formatToParts(new Date()); } catch (e) { return tz === 'Europe/Madrid' ? null : local('Europe/Madrid'); }
  const g = t => (p.find(x => x.type === t) || {}).value, d = g('year') + '-' + g('month') + '-' + g('day');
  return { d, m: (+g('hour') % 24) * 60 + (+g('minute')), dow: { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[g('weekday')], tom: addDay(d, 1) };
}
const effOf = (cfg, ck) => Object.assign({}, DEF, (cfg && cfg.tpl) || {}, (cfg && cfg.ovr && cfg.ovr[ck]) || {});

function dueList(now, eff, pr, G, evs) {
  const out = [], off = pr.off || {}, days = (G && G.days) || pr.days || [0, 2, 4], tr = days.includes(now.dow), D = (G && G[tr ? 'train' : 'rest']) || {};
  const wake = hm(pr.wake) != null ? hm(pr.wake) : 480, sleep = hm(pr.sleep) != null ? hm(pr.sleep) : 1350;
  if (eff.water && !off.water) {
    const L = num(D.water) || num(eff.waterL);
    if (L > 0) {
      const k = Math.min(8, Math.max(3, Math.ceil(L / 0.5))), a = wake + 60, b = Math.max(a + 120, sleep - 60), ml = Math.max(100, Math.round(L * 1000 / k / 50) * 50);
      for (let i = 0; i < k; i++) out.push({ key: 'w' + i, kind: 'water', at: Math.round(a + (b - a) * i / (k - 1)), data: { title: 'Bebe agua', body: 'Unos ' + ml + ' ml ahora (' + (i + 1) + ' de ' + k + '). Objetivo de hoy: ' + String(L).replace('.', ',') + ' L.', tag: 'water', url: 'asesorado.html?tab=hoy' } });
    }
  }
  if (eff.pre && !off.pre && tr) { const t = hm(pr.train); if (t != null && t - num(eff.preMin) >= 0) out.push({ key: 'pre', at: t - num(eff.preMin), data: { title: 'Preentreno', body: 'Entrenas a las ' + fmt(t) + ': es el momento de tomar tu preentreno.', tag: 'pre', url: 'asesorado.html?tab=hoy' } }); }
  if (!off.rev) (evs || []).forEach(e => {
    const lb = e.ty === 'medicion' ? 'Medición corporal' : 'Revisión', t = e.all ? null : hm(e.t), at = t != null ? ' a las ' + fmt(t) : '';
    if (eff.revBefore && e.d === now.tom) out.push({ key: 'rb' + e.d + (e.t || ''), at: hm(eff.revHour) != null ? hm(eff.revHour) : 1200, data: { title: 'Mañana: ' + lb.toLowerCase(), body: lb + ' mañana' + at + '. Si puedes, pésate en ayunas antes.', tag: 'rev', url: 'asesorado.html?tab=prog' } });
    if (eff.revDay && e.d === now.d) out.push({ key: 'rd' + e.d + (e.t || ''), at: t != null ? Math.max(420, t - 120) : 540, data: { title: 'Hoy: ' + lb.toLowerCase(), body: lb + ' hoy' + at + '.', tag: 'rev', url: 'asesorado.html?tab=prog' } });
  });
  if (eff.weigh && !off.weigh && now.dow === num(eff.weighDow)) out.push({ key: 'wg', at: hm(eff.weighHour) != null ? hm(eff.weighHour) : 510, data: { title: 'Toca pesarse', body: 'Pésate en ayunas, después de ir al baño, y apúntalo en la app.', tag: 'weigh', url: 'asesorado.html?tab=prog' } });
  return out;
}

module.exports = async (req, res) => {
  const out = (c, o) => { res.statusCode = c; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
  const PUB = env('VAPID_PUBLIC_KEY'), PRIV = env('VAPID_PRIVATE_KEY'), SK = env('SUPABASE_SERVICE_ROLE_KEY');
  if (req.method === 'GET') return out(200, { pub: PUB || null, ready: !!(PUB && PRIV && SK) });
  if (req.method !== 'POST') return out(405, { error: 'Método no permitido' });
  if (!PUB || !PRIV || !SK) return out(500, { error: 'Faltan las claves de notificaciones en Vercel (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY).' });
  const H = { apikey: SK, Authorization: 'Bearer ' + SK, 'Content-Type': 'application/json' };
  const api = (p, o) => fetch(URL_SB + '/rest/v1/' + p, Object.assign({}, o || {}, { headers: Object.assign({}, H, (o && o.headers) || {}) }));
  const cfgOf = c => api('rpc/cf_push_cfg', { method: 'POST', body: JSON.stringify({ c }) }).then(r => r.ok ? r.json() : null).catch(() => null);
  const drop = ep => api('cf_push_subs?endpoint=eq.' + encodeURIComponent(ep), { method: 'DELETE' });
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } } body = body || {};
  try {
    if (body.cron) {
      const cs = env('CRON_SECRET'); if (cs && req.headers['x-cron'] !== cs) return out(403, { error: 'No autorizado' });
      const subs = await api('cf_push_subs?select=*').then(r => r.ok ? r.json() : []);
      if (!subs.length) return out(200, { subs: 0, sent: 0 });
      const links = await api('cf_links?select=coach_id,client_key,guide:plan->guide').then(r => r.ok ? r.json() : []);
      const LK = {}; links.forEach(l => { LK[l.coach_id + '|' + l.client_key] = l.guide || null; });
      const CF = {}; for (const c of [...new Set(subs.map(s => s.coach_id))]) CF[c] = await cfgOf(c);
      let sent = 0;
      for (const s of subs) {
        const now = local(s.tz || 'Europe/Madrid'); if (!now) continue;
        const cfg = CF[s.coach_id], eff = effOf(cfg, s.client_key);
        const list = dueList(now, eff, s.prefs || {}, LK[s.coach_id + '|' + s.client_key], ((cfg && cfg.ev) || []).filter(e => e.c === s.client_key));
        const st = s.sent && s.sent.d === now.d ? { d: now.d, k: (s.sent.k || []).slice() } : { d: now.d, k: [] };
        let go = list.filter(x => x.at <= now.m && now.m - x.at < 40 && !st.k.includes(x.key));
        const w = go.filter(x => x.kind === 'water'); if (w.length > 1) { w.slice(0, -1).forEach(x => st.k.push(x.key)); go = go.filter(x => x.kind !== 'water' || x === w[w.length - 1]); }
        if (!go.length) continue;
        let gone = false;
        for (const x of go) { const code = await push(s, x.data, PUB, PRIV).catch(() => 0); if (code === 404 || code === 410) { gone = true; break; } st.k.push(x.key); if (code >= 200 && code < 300) sent++; }
        if (gone) await drop(s.endpoint);
        else await api('cf_push_subs?endpoint=eq.' + encodeURIComponent(s.endpoint), { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ sent: st }) });
      }
      return out(200, { subs: subs.length, sent });
    }
    const tok = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const me = await fetch(URL_SB + '/auth/v1/user', { headers: { apikey: ANON, Authorization: 'Bearer ' + tok } }).then(r => r.ok ? r.json() : null);
    if (!me || !me.id) return out(403, { error: 'Sesión no válida. Vuelve a entrar.' });
    const type = String(body.type || '');
    if (!['plan', 'msg', 'test', 'test-me'].includes(type)) return out(400, { error: 'Tipo no válido' });
    let q;
    if (type === 'test-me') q = 'cf_push_subs?select=*&user_id=eq.' + me.id;
    else { const ck = String(body.client_key || ''); if (!ck) return out(400, { error: 'Falta el cliente' }); q = 'cf_push_subs?select=*&coach_id=eq.' + me.id + '&client_key=eq.' + encodeURIComponent(ck); }
    const subs = await api(q).then(r => r.ok ? r.json() : []);
    if (!subs.length) return out(200, { sent: 0, devices: 0 });
    if (type === 'plan' || type === 'msg') { const eff = effOf(await cfgOf(me.id), subs[0].client_key); if (!eff[type]) return out(200, { sent: 0, devices: subs.length, off: true }); }
    const txt = String(body.text || '').replace(/\s+/g, ' ').trim();
    const data = type === 'plan' ? { title: 'Plan actualizado', body: 'Tu entrenador ha actualizado tu plan. Échale un vistazo.', tag: 'plan', url: 'asesorado.html?tab=plan' }
      : type === 'msg' ? { title: 'Mensaje de tu entrenador', body: txt.length > 140 ? txt.slice(0, 137) + '…' : (txt || 'Tienes un mensaje nuevo.'), tag: 'msg', url: 'asesorado.html?tab=chat' }
      : { title: 'Notificaciones activadas', body: 'Así te llegarán los recordatorios de CientiFitness.', tag: 'test', url: 'asesorado.html?tab=hoy' };
    let sent = 0;
    for (const s of subs) {
      const off = (s.prefs && s.prefs.off) || {};
      if ((type === 'plan' || type === 'msg') && off[type]) continue;
      const code = await push(s, data, PUB, PRIV).catch(() => 0);
      if (code === 404 || code === 410) await drop(s.endpoint); else if (code >= 200 && code < 300) sent++;
    }
    return out(200, { sent, devices: subs.length });
  } catch (e) { return out(500, { error: String((e && e.message) || e) }); }
};
