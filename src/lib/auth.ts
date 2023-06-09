import { AppwriteException, ID, Models } from "appwrite";
import { account } from "./appwrite";
import {
  ErrorReasons,
  ONE_MONTH_IN_MS,
  isUserAlreadyExistsException,
  isUserInvalidCreditanilsException,
} from "./utils";
import { cachified } from "cachified";
import { cache, getUserCacheKey, invalidateUserCache } from "./cache";

export type LoginUserRes =
  | {
      valid: true;
      session: Models.Session;
    }
  | { valid: false; reason: typeof ErrorReasons.incorrectEmailOrPassword }
  | { valid: false; message: string };

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
    return { valid: false, message: emailSession.message };
  }

  return { valid: true, session: emailSession };
}

export type SignUpUserRes =
  | {
      valid: true;
      user: Models.User<Models.Preferences>;
    }
  | { valid: false; reason: typeof ErrorReasons.emailAlreadyExists }
  | { valid: false; message: string };

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
    return { valid: false, message: user.message };
  }

  return { valid: true, user };
}

export type GetCurrentUserRes =
  | {
      valid: true;
      user: Models.User<Models.Preferences>;
    }
  | { valid: false; message: string };

async function getCurrentUserImpl(): Promise<GetCurrentUserRes> {
  const user = await account.get().catch((err: AppwriteException) => err);

  if (user instanceof AppwriteException) {
    return { valid: false, message: user.message };
  }

  return { valid: true, user };
}

export async function getCurrentUser() {
  const userRes = await cachified({
    key: getUserCacheKey(),
    cache,
    async getFreshValue() {
      return getCurrentUserImpl();
    },
    ttl: ONE_MONTH_IN_MS,
  });

  if (!userRes.valid) {
    invalidateUserCache();
  }

  return userRes;
}

export type LogoutUserRes =
  | {
      valid: true;
    }
  | { valid: false; message: string };

export async function logoutUser(): Promise<LogoutUserRes> {
  const res = await account
    .deleteSessions()
    .catch((err: AppwriteException) => err);

  if (res instanceof AppwriteException) {
    return { valid: false, message: res.message };
  }

  invalidateUserCache();

  return { valid: true };
}
