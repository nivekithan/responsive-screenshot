import { PathParams, RestRequest } from "msw";
import { ALL_DATA, ALL_USERS } from "./users";

export function login(email: string, password: string) {
  const matchedUser = ALL_USERS.find(
    (v) => v.email === email && v.password === password
  );

  return matchedUser || null;
}


export const AUTH_COOKIE_KEY = "msw-auth";

export function authorizeReq(
  req: RestRequest<never, PathParams<string>>
): { isAuthenticated: true; userId: string } | { isAuthenticated: false } {
  const authCookieValue = req.cookies[AUTH_COOKIE_KEY];
  const isAuthenticated =
    !!authCookieValue &&
    ALL_DATA.some((v) => v.account.$id === authCookieValue);

  return isAuthenticated
    ? { isAuthenticated: true, userId: authCookieValue }
    : { isAuthenticated: false };
}
