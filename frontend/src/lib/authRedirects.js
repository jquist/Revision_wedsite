export function getPublicSiteUrl() {
  const viteUrl =
    typeof import.meta !== "undefined"
      ? import.meta.env?.VITE_PUBLIC_SITE_URL
      : "";

  const craUrl =
    typeof process !== "undefined"
      ? process.env?.REACT_APP_PUBLIC_SITE_URL
      : "";

  const configured = viteUrl || craUrl;

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

export function getAuthRedirectUrl(path = "/") {
  const base = getPublicSiteUrl();
  const normalisedPath = path.startsWith("/") ? path : `/${path}`;

  return `${base}${normalisedPath}`;
}

export const AUTH_REDIRECTS = {
  emailConfirmed: () => getAuthRedirectUrl("/auth/confirmed"),
  resetPassword: () => getAuthRedirectUrl("/reset-password"),
  afterLogin: () => getAuthRedirectUrl("/")
};
