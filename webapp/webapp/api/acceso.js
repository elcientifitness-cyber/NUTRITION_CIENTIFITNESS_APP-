// Crea o renueva el acceso de un asesorado a la app (solo lo puede usar el entrenador).
// Necesita en Vercel la variable SUPABASE_SERVICE_ROLE_KEY (Settings → Environment Variables).
const URL_SB = 'https://soxtkdakmpjxtvvtrvjs.supabase.co';
const ANON = 'sb_publishable_mGei9bBQytQo75nSAo2umw_c2bvY_gA';
const COACHES = ['elcientifitness@gmail.com'];
const APP = 'https://prueba-de-app-movil.vercel.app/asesorado.html';

module.exports = async (req, res) => {
  const out = (code, obj) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); };
  if (req.method !== 'POST') return out(405, { error: 'Método no permitido' });
  const SK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SK) return out(500, { error: 'Falta configurar la clave secreta en Vercel (SUPABASE_SERVICE_ROLE_KEY).' });
  try {
    const tok = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const me = await fetch(URL_SB + '/auth/v1/user', { headers: { apikey: ANON, Authorization: 'Bearer ' + tok } }).then(r => r.ok ? r.json() : null);
    if (!me || !COACHES.includes(String(me.email || '').toLowerCase())) return out(403, { error: 'Solo el entrenador puede crear accesos.' });
    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    const email = String((body && body.email) || '').trim().toLowerCase(), mode = body && body.mode;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return out(400, { error: 'Email no válido.' });
    if (COACHES.includes(email)) return out(400, { error: 'Ese es el email del entrenador.' });
    const H = { apikey: SK, Authorization: 'Bearer ' + SK, 'Content-Type': 'application/json' };

    if (mode === 'invite') {
      const r = await fetch(URL_SB + '/auth/v1/invite?redirect_to=' + encodeURIComponent(APP), { method: 'POST', headers: H, body: JSON.stringify({ email }) });
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
  } catch (e) { return out(500, { error: 'Error del servidor: ' + (e.message || e) }); }
};
