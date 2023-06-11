import { AppwriteException, ID, Models } from "appwrite";
import { account } from "./appwrite";
import {
  APIResponse,
  ErrorReasons,
  ONE_MONTH_IN_MS,
  isUserAlreadyExistsException,
  isUserInvalidCreditanilsException,
  isUserNotAuthorizedException,
} from "./utils";
import { cachified } from "cachified";
import { cache, getUserCacheKey, invalidateUserCache } from "./cache";
import { captureException } from "@sentry/react";
import { Mode } from "fs";

export type LoginUserRes = APIResponse<
  (typeof ErrorReasons)["incorrectEmailOrPassword"],
  { valid: true; session: Models.Session }
>;

export async function loginUser(
  email: string,
  password: string
): Promise<LoginUserRes> {
  const emailSession = await account
    .createEmailSession(email, password)
    .catch((err: AppwriteException) => err);

  if (
    emailSession instanceof AppwriteException &&
    isUserInvalidCreditanilsException(emailSession)
  ) {
    return { valid: false, reason: ErrorReasons.incorrectEmailOrPassword };
  }

  if (emailSession instanceof AppwriteException) {
    captureException(emailSession);
    return { valid: false, message: emailSession.message };
  }

  return { valid: true, session: emailSession };
}

export type SignUpUserRes = APIResponse<
  typeof ErrorReasons.emailAlreadyExists,
  { valid: true; user: Models.User<Models.Preferences> }
>;

export async function signUpUser(
  email: string,
  password: string
): Promise<SignUpUserRes> {
  const user = await account
    .create(ID.unique(), email, password)
    .catch((err: AppwriteException) => err);

  if (user instanceof AppwriteException && isUserAlreadyExistsException(user)) {
    return { valid: false, reason: ErrorReasons.emailAlreadyExists };
  }

  if (user instanceof AppwriteException) {
    captureException(user);
    return { valid: false, message: user.message };
  }

  return { valid: true, user };
}

export type GetCurrentUserRes = APIResponse<
  typeof ErrorReasons.userNotAuthorized,
  { valid: true; user: Models.User<Models.Preferences> }
>;

async function getCurrentUserImpl(): Promise<GetCurrentUserRes> {
  const user = await account.get().catch((err: AppwriteException) => err);

  if (user instanceof AppwriteException && isUserNotAuthorizedException(user)) {
    return { valid: false, reason: ErrorReasons.userNotAuthorized };
  }

  if (user instanceof AppwriteException) {
    captureException(user);
    return { valid: false, message: user.message };
  }

  return { valid: true, user };
}

export async function getCurrentUser() {
  const userRes = await cachified({
    key: getUserCacheKey(),
    cache,
    async getFreshValue() {
      console.log("Getting fresh value for getCurrentUser");
      return getCurrentUserImpl();
    },
    ttl: ONE_MONTH_IN_MS,
  });

  if (!userRes.valid) {
    invalidateUserCache();
  }

  return userRes;
}

export type LogoutUserRes = APIResponse<never, { valid: true }>;

export async function logoutUser(): Promise<LogoutUserRes> {
  const res = await account
    .deleteSessions()
    .catch((err: AppwriteException) => err);

  invalidateUserCache();

  if (res instanceof AppwriteException) {
    captureException(res);
    return { valid: false, message: res.message };
  }

  return { valid: true };
}
