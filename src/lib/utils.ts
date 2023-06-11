import { SpanStatusType, startTransaction } from "@sentry/react";
import { AppwriteException } from "appwrite";
import { ClassValue, clsx } from "clsx";
import { ActionFunctionArgs, LoaderFunctionArgs } from "react-router-dom";
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

export const SpanStatus = {
  Ok: "ok",
  UnknownError: "unknown_error",
} satisfies Record<string, SpanStatusType>;

export function monitorLoaderFn<LoaderData>(
  nameOfRoute: string,
  fn: (args: LoaderFunctionArgs) => Promise<LoaderData>
): (args: LoaderFunctionArgs) => Promise<LoaderData> {
  return async (loaderArgs) => {
    const transaction = startTransaction({ name: `loader ${nameOfRoute}` });

    const spanChild = transaction.startChild({ op: "loading" });

    try {
      spanChild.setStatus(SpanStatus.Ok);
      return await fn(loaderArgs);
    } catch (err) {
      spanChild.setStatus(SpanStatus.UnknownError);
      throw err;
    } finally {
      spanChild.finish();
      transaction.finish();
    }
  };
}

export function monitorActionFn<ActionData>(
  nameOfRoute: string,
  fn: (args: ActionFunctionArgs) => Promise<ActionData>
): (args: ActionFunctionArgs) => Promise<ActionData> {
  return async (actionArgs) => {
    const transaction = startTransaction({ name: `action ${nameOfRoute}` });

    const spanChild = transaction.startChild({ op: "loading" });

    try {
      spanChild.setStatus(SpanStatus.Ok);
      return await fn(actionArgs);
    } catch (err) {
      spanChild.setStatus(SpanStatus.UnknownError);
      throw err;
    } finally {
      spanChild.finish();
      transaction.finish();
    }
  };
}
