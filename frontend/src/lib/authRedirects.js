import { getPublicSiteUrl } from "../config/env";

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
