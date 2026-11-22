// Keeps the free Supabase project awake: Supabase pauses free projects after about a week
// without requests. Cloudflare runs `scheduled` once a day (see the cron in wrangler.toml).
//
// Needs two settings on the Worker:
//   SUPABASE_URL  e.g. https://xxxx.supabase.co
//   SUPABASE_KEY  the publishable (anon) key, the same one the website uses

async function pingSupabase(env) {
  const url = `${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/products?select=id&limit=1`;
  const res = await fetch(url, { headers: { apikey: env.SUPABASE_KEY } });
  console.log(`Supabase keep-alive: HTTP ${res.status}`);
  if (!res.ok) throw new Error(`Supabase answered HTTP ${res.status}: ${await res.text()}`);
  return res.status;
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(pingSupabase(env));
  },

  // Opening the Worker's address runs the same check, so you can test it in a browser.
  async fetch(request, env) {
    try {
      const status = await pingSupabase(env);
      return new Response(`Supabase is awake (HTTP ${status}).\n`);
    } catch (err) {
      return new Response(`Supabase check failed: ${err.message}\n`, { status: 502 });
    }
  },
};
