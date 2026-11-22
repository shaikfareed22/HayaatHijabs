import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Clear stale sessions from old projects. Saved logins are stored as sb-<project-ref>-auth-token;
// keep only the ones for the project in .env (this used to be hard-coded to an old project ref).
const PROJECT_REF = (() => {
  try {
    return new URL(SUPABASE_URL).hostname.split('.')[0];
  } catch {
    return '';
  }
})();
try {
  if (PROJECT_REF) {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') && !key.includes(PROJECT_REF)) {
        localStorage.removeItem(key);
      }
    });
  }
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
