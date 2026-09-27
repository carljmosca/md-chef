/**
 * Resolves the base URL for generating shareable recipe links
 * Priority:
 * 1. User configured customDomain in Settings (e.g. "https://recipes.mydomain.com" or "recipes.mydomain.com")
 * 2. Build-time environment variable VITE_APP_URL
 * 3. window.location.origin + window.location.pathname
 */
export function getAppBaseUrl(customDomain?: string): string {
  if (customDomain && customDomain.trim().length > 0) {
    let domain = customDomain.trim();
    if (!/^https?:\/\//i.test(domain)) {
      domain = `https://${domain}`;
    }
    return domain.replace(/\/+$/, '');
  }

  const envUrl =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_APP_URL
      : undefined;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    let domain = envUrl.trim();
    if (!/^https?:\/\//i.test(domain)) {
      domain = `https://${domain}`;
    }
    return domain.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location) {
    const origin = (window.location.origin || '').replace(/\/+$/, '');
    const pathname = (window.location.pathname || '').replace(/\/+$/, '');
    return `${origin}${pathname}`;
  }

  return '';
}

export function buildRecipeShareUrl(recipePath: string, customDomain?: string): string {
  const base = getAppBaseUrl(customDomain);
  const cleanPath = encodeURIComponent(recipePath);
  return `${base}/#/recipe/${cleanPath}`;
}
