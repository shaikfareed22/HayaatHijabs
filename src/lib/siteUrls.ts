// Addresses of the two sites, used for links between them.
// Set VITE_STORE_URL and VITE_ADMIN_URL in each Cloudflare Pages project
// (e.g. https://hayaathijabs.com and https://admin.hayaathijabs.com). Links are hidden when unset.
const trimSlash = (url: string | undefined) => (url ?? '').trim().replace(/\/+$/, '');

export const STORE_URL = trimSlash(import.meta.env.VITE_STORE_URL);
export const ADMIN_URL = trimSlash(import.meta.env.VITE_ADMIN_URL);

// Where Supabase sends people back to after email links and Google sign-in: always the site they are on.
export const siteUrl = (path = '/') => `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
