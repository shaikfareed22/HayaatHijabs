import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Clear stale sessions from old projects
try {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') && !key.includes('bcgcxflakiyhqbmcixgv')) {
      localStorage.removeItem(key);
    }
  });
} catch (e) {}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    lock: async (name, acquireTimeout, fn) => {
      return fn();
    },
  }
});
