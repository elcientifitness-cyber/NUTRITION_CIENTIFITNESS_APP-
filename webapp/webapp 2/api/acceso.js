// Crea o renueva accesos: asesorados (cualquier entrenador) y entrenadores (solo el CEO, kind: 'coach').
// Necesita en Vercel la variable SUPABASE_SERVICE_ROLE_KEY (Settings → Environment Variables).
const URL_SB = 'https://soxtkdakmpjxtvvtrvjs.supabase.co';
const ANON = 'sb_publishable_mGei9bBQytQo75nSAo2umw_c2bvY_gA';
const OWNERS = ['elcientifitness@gmail.com'];

module.exports = async (req, res) => {
  const out = (code, obj) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); };
  if (req.method !== 'POST') return out(405, { error: 'Método no permitido' });
  const SK = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s+/g, '').replace(/^["']|["']$/g, '');
  if (!SK) return out(500, { error: 'Falta configurar la clave secreta en Vercel (SUPABASE_SERVICE_ROLE_KEY).' });
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'prueba-de-app-movil.vercel.app';
    const APP = (/^localhost|^127\./.test(host) ? 'http://' : 'https://') + host + '/asesorado.html';
    const H = { apikey: SK, Authorization: 'Bearer ' + SK, 'Content-Type': 'application/json' };
    const enc = encodeURIComponent;

    const tok = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const me = await fetch(URL_SB + '/auth/v1/user', { headers: { apikey: ANON, Authorization: 'Bearer ' + tok } }).then(r => r.ok ? r.json() : null);
    const myEmail = String((me && me.email) || '').toLowerCase();
    if (!myEmail) return out(403, { error: 'Sesión no válida. Vuelve a entrar.' });

    // Rol de quien llama (tabla cf_coaches; si aún no existe, solo el CEO)
    let role = null;
    const cr = await fetch(URL_SB + '/rest/v1/cf_coaches?select=role,active&email=eq.' + enc(myEmail), { headers: H });
    if (cr.ok) { const rows = await cr.json(); const r0 = rows[0]; if (r0 && r0.active) role = r0.role || 'coach'; else if (!r0 && OWNERS.includes(myEmail)) role = 'owner'; }
    else if (OWNERS.includes(myEmail)) role = 'owner';
    if (!role) return out(403, { error: 'Solo los entrenadores pueden crear accesos.' });

    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};
    const email = String(body.email || '').trim().toLowerCase(), mode = body.mode, forCoach = body.kind === 'coach';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return out(400, { error: 'Email no válido.' });
    if (email === myEmail) return out(400, { error: 'Ese es tu propio email.' });
    if (forCoach && role !== 'owner') return out(403, { error: 'Solo el CEO puede invitar entrenadores.' });

    const tr = await fetch(URL_SB + '/rest/v1/cf_coaches?select=email&email=eq.' + enc(email), { headers: H });
    const isCoach = OWNERS.includes(email) || (tr.ok && (await tr.json()).length > 0);
    if (!forCoach && isCoach) return out(400, { error: 'Ese email es de un entrenador.' });

    if (forCoach) {
      const lr = await fetch(URL_SB + '/rest/v1/cf_links?select=client_key&limit=1&email=ilike.' + enc(email), { headers: H });
      if (lr.ok && (await lr.json()).length) return out(400, { error: 'Ese email ya es de un asesorado. Usa otro para el entrenador.' });
      const row = { email };
      if (body.name) row.name = String(body.name).slice(0, 80);
      if (body.phone) row.phone = String(body.phone).slice(0, 30);
      const ur = await fetch(URL_SB + '/rest/v1/cf_coaches?on_conflict=email', { method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row) });
      if (!ur.ok) { const t = await ur.text(); return out(400, { error: /cf_coaches|relation|exist/i.test(t) ? 'Falta ejecutar equipo.sql en Supabase.' : 'No se pudo guardar el entrenador.' }); }
    }

    if (mode === 'invite') {
      const r = await fetch(URL_SB + '/auth/v1/invite?redirect_to=' + enc(APP), { method: 'POST', headers: H, body: JSON.stringify({ email }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        const m = j.msg || j.message || j.error_description || '';
        if (/rate limit/i.test(m)) return out(429, { error: 'Supabase solo deja enviar unos pocos emails por hora. Usa «Crear acceso» o prueba más tarde.' });
        if (/already|registered|exists/i.test(m)) return out(409, { error: 'Ese email ya tiene cuenta. Usa «Crear acceso» para darle una contraseña nueva.' });
        return out(400, { error: m || 'No se pudo enviar la invitación.' });
      }
      return out(200, { ok: true, mode: 'invite' });
    }

    const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
    const pass = Array.from({ length: 10 }, () => abc[Math.floor(Math.random() * abc.length)]).join('');
    let r = await fetch(URL_SB + '/auth/v1/admin/users', { method: 'POST', headers: H, body: JSON.stringify({ email, password: pass, email_confirm: true }) });
    if (r.ok) return out(200, { ok: true, mode: 'created', email, password: pass });
    const j = await r.json().catch(() => ({}));
    const m = j.msg || j.message || '';
    if (!/already|registered|exists/i.test(m)) return out(400, { error: m || 'No se pudo crear el acceso.' });
    let id = null;
    for (let page = 1; page <= 20 && !id; page++) {
      const l = await fetch(URL_SB + '/auth/v1/admin/users?per_page=200&page=' + page, { headers: H }).then(x => x.json());
      const us = l.users || [];
      const u = us.find(x => String(x.email || '').toLowerCase() === email); if (u) id = u.id;
      if (us.length < 200) break;
    }
    if (!id) return out(400, { error: 'El email ya existe pero no se encontró la cuenta.' });
    r = await fetch(URL_SB + '/auth/v1/admin/users/' + id, { method: 'PUT', headers: H, body: JSON.stringify({ password: pass, email_confirm: true }) });
    if (!r.ok) return out(400, { error: 'No se pudo renovar la contraseña.' });
    return out(200, { ok: true, mode: 'reset', email, password: pass });
  } catch (e) { return out(500, { error: 'Error del servidor. Revisa la clave secreta en Vercel.' }); }
};
