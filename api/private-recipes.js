// Confidential recipes are separate from the public Menu Library endpoint.
// Activation and viewer enrollment require an approved access policy.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Vary', 'Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET','POST'].includes(req.method)) return res.status(405).json({ ok:false, message:'Method not allowed' });
  const viewers = String(process.env.PRIVATE_RECIPE_VIEWER_IDS || '').split(',').map(v => v.trim()).filter(Boolean);
  if (process.env.PRIVATE_RECIPES_ENABLED !== 'true' || !viewers.length) return res.status(503).json({ ok:false, message:'Private recipe access is not enabled.' });
  const url = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (req.method === 'POST') {
    if (!url.startsWith('https://') || !key) return res.status(503).json({ ok:false, message:'Private recipe service is unavailable.' });
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (typeof body?.email !== 'string' || typeof body?.password !== 'string' || body.email.length > 320 || !body.password || body.password.length > 1024) return res.status(400).json({ok:false,message:'Enter your private recipe email and password.'});
      const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email:body.email,password:body.password}),signal:AbortSignal.timeout(8000)});
      if (!response.ok) return res.status(401).json({ok:false,message:'Private sign-in failed.'});
      const session = await response.json();
      if (!viewers.includes(session.user?.id) || !session.access_token) return res.status(403).json({ok:false,message:'Private recipe access is not permitted.'});
      return res.status(200).json({ok:true,accessToken:session.access_token,expiresIn:Math.max(1,Math.min(900,Number(session.expires_in)||900))});
    } catch { return res.status(503).json({ok:false,message:'Private sign-in is unavailable.'}); }
  }
  const bearer = String(req.headers?.authorization || '');
  if (!/^Bearer [A-Za-z0-9._-]+$/.test(bearer)) return res.status(401).json({ ok:false, message:'Verified sign-in required.' });
  if (!url.startsWith('https://') || !key) return res.status(503).json({ ok:false, message:'Private recipe service is unavailable.' });
  try {
    const identity = await fetch(`${url}/auth/v1/user`, { headers:{ apikey:key, Authorization:bearer }, signal:AbortSignal.timeout(8000) });
    if (!identity.ok) return res.status(401).json({ ok:false, message:'Verified sign-in required.' });
    const user = await identity.json();
    if (!user.id || !viewers.includes(user.id)) return res.status(403).json({ ok:false, message:'Private recipe access is not permitted.' });
    // Fixed RPC exposes only the approved Andes batch; no caller-selected schema/table.
    const response = await fetch(`${url}/rest/v1/rpc/read_andes_private_recipes`, { method:'POST', headers:{ apikey:key, Authorization:`Bearer ${key}`, 'Content-Type':'application/json' }, body:'{}', signal:AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Private storage unavailable');
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.variants) || !Array.isArray(payload.components) || !Array.isArray(payload.links)) throw new Error('Invalid private data');
    return res.status(200).json({ ok:true, ...payload });
  } catch {
    return res.status(503).json({ ok:false, message:'Private recipes could not be loaded. Retry after service recovery.' });
  }
}
