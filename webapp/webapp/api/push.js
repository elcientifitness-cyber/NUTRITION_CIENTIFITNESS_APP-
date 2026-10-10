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

function dueList(now, eff, pr, G, evs, C) {
  const out = [], off = pr.off || {}, days = (G && G.days) || pr.days || [0, 2, 4], tr = days.includes(now.dow), D = (G && G[tr ? 'train' : 'rest']) || {};
  const wake = hm(pr.wake) != null ? hm(pr.wake) : 480, sleep = hm(pr.sleep) != null ? hm(pr.sleep) : 1350, trn = hm(pr.train);
  const MX = Math.max(1, Math.min(20, Math.round(num(eff.max)) || 6));
  if (eff.pre && !off.pre && tr && trn != null && trn - num(eff.preMin) >= 0) out.push({ key: 'pre', at: trn - num(eff.preMin), data: { title: 'Preentreno', body: 'Entrenas a las ' + fmt(trn) + ': es el momento de tomar tu preentreno.', tag: 'pre', url: 'asesorado.html?tab=hoy' } });
  if (!off.rev) (evs || []).forEach(e => {
    const lb = e.ty === 'medicion' ? 'Medición corporal' : 'Revisión', t = e.all ? null : hm(e.t), at = t != null ? ' a las ' + fmt(t) : '';
    if (eff.revBefore && e.d === now.tom) out.push({ key: 'rb' + e.d + (e.t || ''), at: hm(eff.revHour) != null ? hm(eff.revHour) : 1200, data: { title: 'Mañana: ' + lb.toLowerCase(), body: lb + ' mañana' + at + '. Si puedes, pésate en ayunas antes.', tag: 'rev', url: 'asesorado.html?tab=prog' } });
    if (eff.revDay && e.d === now.d) out.push({ key: 'rd' + e.d + (e.t || ''), at: t != null ? Math.max(420, t - 120) : 540, data: { title: 'Hoy: ' + lb.toLowerCase(), body: lb + ' hoy' + at + '.', tag: 'rev', url: 'asesorado.html?tab=prog' } });
  });
  if (eff.weigh && !off.weigh && now.dow === num(eff.weighDow)) out.push({ key: 'wg', at: hm(eff.weighHour) != null ? hm(eff.weighHour) : 510, data: { title: 'Toca pesarse', body: 'Pésate en ayunas, después de ir al baño, y apúntalo en la app.', tag: 'weigh', url: 'asesorado.html?tab=prog' } });
  (C || []).forEach(x => {
    const o = (eff.cxo || {})[x.id] || {}, cc = (eff.cxc || {})[x.id], on = cc != null ? !!cc : (o.on != null ? !!o.on : x.on !== false);
    if (!on || off['c:' + x.id]) return;
    const T = hm(o.time || x.time) != null ? hm(o.time || x.time) : 540, d = { title: x.title || 'CientiFitness', body: x.body || '', tag: 'c' + x.id, url: 'asesorado.html?tab=hoy' };
    const add = (k, at) => { if (at >= 0 && at < 1440) out.push({ key: 'c' + x.id + k, at, data: d }); };
    switch (x.kind) {
      case 'week': if ((x.days || []).includes(now.dow)) add('', T); break;
      case 'train': if (tr) add('', T); break;
      case 'rest': if (!tr) add('', T); break;
      case 'pre': if (tr && trn != null) add('', trn + Math.round(num(x.offset))); break;
      case 'rev': { const db = Math.max(0, Math.round(num(x.dbefore))); (evs || []).forEach(e => { if (e.d === addDay(now.d, db)) add(e.d, T); }); break; }
      case 'once': if (x.date === now.d) add(x.date, T); break;
      case 'every': { const a = hm(x.from) != null ? hm(x.from) : 540, b = hm(x.to) != null ? hm(x.to) : 1260, st = Math.max(30, Math.round(num(x.every) * 60) || 120); for (let m = a, i = 0; m <= b && i < 24; m += st, i++) add('e' + i, m); break; }
      default: add('', T);
    }
  });
  out.splice(MX);
  if (eff.water && !off.water) {
    const L = num(D.water) || num(eff.waterL), room = MX - out.length;
    if (L > 0 && room > 0) {
      const k = Math.min(room, 8, Math.max(3, Math.ceil(L / 0.5))), a = wake + 60, b = Math.max(a + 120, sleep - 60), ml = Math.max(100, Math.round(L * 1000 / k / 50) * 50);
      for (let i = 0; i < k; i++) out.push({ key: 'w' + i, kind: 'water', at: k === 1 ? Math.round((a + b) / 2) : Math.round(a + (b - a) * i / (k - 1)), data: { title: 'Bebe agua', body: 'Unos ' + ml + ' ml ahora (' + (i + 1) + ' de ' + k + '). Objetivo de hoy: ' + String(L).replace('.', ',') + ' L.', tag: 'water', url: 'asesorado.html?tab=hoy' } });
    }
  }
  return out;
}
const customOf = cfg => { if (!cfg) return []; const own = cfg.own || [], com = cfg.common || []; if (cfg.owner) return own; const mine = cfg.prem ? own : [], ids = new Set(mine.map(x => x.id)); return mine.concat(com.filter(x => x && !ids.has(x.id))); };

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
      // Cuestionarios automáticos: crea el cuestionario, avisa y recuerda a las 24 h
      for (const c of Object.keys(CF)) {
        const cfg = CF[c]; if (!cfg || !Array.isArray(cfg.fauto) || !cfg.fauto.length) continue;
        const nowM = local('Europe/Madrid'); if (!nowM) continue;
        for (const it of cfg.fauto) {
          if (it.on === false) continue;
          const T = hm(it.time); if (T == null || nowM.dow !== Number(it.dow) || nowM.m < T || nowM.m - T >= 40) continue;
          const frm = ((cfg.forms || []).find(f => f.id === it.formId)) || ((cfg.cforms || []).find(f => f.id === it.formId)) || it.form; if (!frm || !frm.qs) continue;
          for (const ck of Object.keys(cfg.fa || {})) {
            if (!(cfg.fa[ck] || []).includes(it.id)) continue;
            const ex = await api('cf_forms?select=id&coach_id=eq.' + c + '&client_key=eq.' + encodeURIComponent(ck) + '&form->>auto=eq.' + encodeURIComponent(it.id) + '&created_at=gte.' + encodeURIComponent(new Date(Date.now() - 20 * 3600e3).toISOString())).then(r => r.ok ? r.json() : [{}]);
            if (ex.length) continue;
            const ins = await api('cf_forms', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ coach_id: c, client_key: ck, title: frm.name || 'Cuestionario', form: { name: frm.name, kind: frm.kind || 'otro', intro: frm.intro || '', qs: frm.qs, auto: it.id, tpl: it.formId } }) }).then(r => r.ok ? r.json() : null);
            const row = ins && ins[0]; if (!row) continue;
            for (const s of subs.filter(x => x.coach_id === c && x.client_key === ck && !((x.prefs && x.prefs.off) || {}).form)) { const code = await push(s, { title: frm.name || 'Cuestionario', body: 'Tu entrenador te ha enviado un cuestionario. Te llevará un par de minutos.', tag: 'form', url: 'cuestionario.html?t=' + row.token }, PUB, PRIV).catch(() => 0); if (code === 404 || code === 410) await drop(s.endpoint); else if (code >= 200 && code < 300) sent++; }
          }
        }
        if (cfg.fauto.some(i => i.remind !== false)) {
          const pend = await api('cf_forms?select=id,client_key,token,title,form&coach_id=eq.' + c + '&status=eq.sent&form->>auto=not.is.null&form->>reminded=is.null&created_at=lt.' + encodeURIComponent(new Date(Date.now() - 24 * 3600e3).toISOString()) + '&created_at=gt.' + encodeURIComponent(new Date(Date.now() - 48 * 3600e3).toISOString())).then(r => r.ok ? r.json() : []);
          for (const f of pend) {
            const it = cfg.fauto.find(i => i.id === f.form.auto); if (!it || it.remind === false) continue;
            await api('cf_forms?id=eq.' + f.id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ form: Object.assign({}, f.form, { reminded: true }) }) });
            for (const s of subs.filter(x => x.coach_id === c && x.client_key === f.client_key && !((x.prefs && x.prefs.off) || {}).form)) { const code = await push(s, { title: 'Te falta el cuestionario', body: (f.title || 'Cuestionario') + ': todavía no lo has respondido.', tag: 'form', url: 'cuestionario.html?t=' + f.token }, PUB, PRIV).catch(() => 0); if (code === 404 || code === 410) await drop(s.endpoint); else if (code >= 200 && code < 300) sent++; }
          }
        }
      }
      for (const s of subs) {
        const now = local(s.tz || 'Europe/Madrid'); if (!now) continue;
        const cfg = CF[s.coach_id], eff = effOf(cfg, s.client_key);
        const list = dueList(now, eff, s.prefs || {}, LK[s.coach_id + '|' + s.client_key], ((cfg && cfg.ev) || []).filter(e => e.c === s.client_key), customOf(cfg));
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
