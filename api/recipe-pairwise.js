import { projectRecipePresence } from '../src/features/menu-cross-utilization/recipePairwiseModel.js';

export default async function handler(req,res) {
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,message:'Method not allowed'});}
  const url=String(process.env.SUPABASE_URL||'https://pzilyzqhatthctgsjwtt.supabase.co').replace(/\/+$/,'');
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
  if(!url.startsWith('https://')||!key)return res.status(503).json({ok:false,message:'Recipe comparison source is unavailable.'});
  try {
    // Fixed service-only RPC; no caller-selected schema, release, document, or raw manifest.
    const upstream=await fetch(`${url}/rest/v1/rpc/read_recipe_pairwise_presence`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(15000)});
    if(!upstream.ok)throw Error('Source unavailable');
    const data=projectRecipePresence(await upstream.json());
    return res.status(200).json({ok:true,readAt:new Date().toISOString(),data});
  } catch { return res.status(503).json({ok:false,message:'Recipe comparisons are unavailable. Historical shopping-list comparisons remain available separately.'}); }
}
