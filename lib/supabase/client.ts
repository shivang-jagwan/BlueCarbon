import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return client;
}

// Lazy proxy — defers createBrowserClient() until first property access (safe for SSR imports)
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop) {
    const real = getSupabaseBrowserClient();
    const val = (real as Record<string | symbol, unknown>)[prop];
    if (typeof val === 'function') {
      return val.bind(real);
    }
    return val;
  },
});

