import { AppwriteException } from "appwrite";
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isUserInvalidCreditanilsException(
  exception: AppwriteException
) {
  const expectedType = "user_invalid_credentials";

  return exception.type === expectedType;
}

export function isUserAlreadyExistsException(exception: AppwriteException) {
  const expectedType = "user_already_exists";

  return exception.type === expectedType;
}

export function isDocumentNotFoundException(exception: AppwriteException) {
  const expectedType = "document_not_found";

  return exception.type === expectedType;
}

export function isUserNotAuthorizedException(exception: AppwriteException) {
  const expectedType = "general_unauthorized_scope";

  return exception.type === expectedType;
}

export const ErrorReasons = {
  incorrectEmailOrPassword: "Email or password is incorrect",
  emailAlreadyExists:
    "There is already a user with the same email. Please choose another one",
  pageNotFound: "There is no page with that id",
  userNotAuthorized: "You are not authorized to perform this action",
} as const;

export function getLoginUrl(currentUrl: string) {
  const url = new URL("/login", window.location.origin);

  url.searchParams.set("redirectTo", currentUrl);

  return url;
}

export function getSignUpUrl(currentUrl: string) {
  const url = new URL("/signup", window.location.origin);

  url.searchParams.set("redirectTo", currentUrl);

  return url;
}

export const ONE_MONTH_IN_MS = 1000 * 60 * 60 * 24 * 7 * 30;

export type APIResponse<
  Reasons extends (typeof ErrorReasons)[keyof typeof ErrorReasons],
  Data extends { valid: true }
> =
  | Data
  | { valid: false; reason: Reasons }
  | { valid: false; message: string };

export function getErrorMessage(
  error: { reason: string } | { message: string }
) {
  if ("reason" in error) {
    return error.reason;
  }

  return error.message;
}
