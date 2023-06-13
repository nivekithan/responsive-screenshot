import {
  AppwriteException,
  ID,
  Permission,
  Query,
  Role,
} from "appwrite";
import { avatars, databases, secureGetPage } from "./appwrite";
import {
  APIResponse,
  ErrorReasons,
  ONE_MONTH_IN_MS,
  isDocumentNotFoundException,
  isUserNotAuthorizedException,
} from "./utils";
import {
  IssueModel,
  PageAccessEmailModel,
  PageModel,
  convertPageAccessEmailModel,
  convertPageIssueModel,
  convertPageModel,
} from "./convert";
import pRetry from "p-retry";
import { cachified } from "cachified";
import {
  cache,
  getPagesCacheKey,
  getSinglePageAccessCacheKey,
  getSinglePageCacheKey,
  getSinglePageNameCacheKey,
  invalidatePagesCache,
  invalidateSinglePageAccessCacheKey,
  invalidateSinglePageCache,
  invalidateSinglePageNameKey,
} from "./cache";
import { captureException } from "@sentry/react";

export const DATABASE_ID = "dev";
export const collections = {
  PAGES: "647b0d9310b4ac4f8256",
  PAGE_ISSUES: "647f630632a9fb64e6ef",
  PAGE_ACCESS_EMAILS: "647f3355ed75a176dba9",
  USER_WEBHOOK_URL: "648046bd24a66d4b1503",
};

export type GetPagesRes = APIResponse<
  typeof ErrorReasons.userNotAuthorized,
  { valid: true; pages: Array<PageModel> }
>;

async function getPagesImpl(): Promise<GetPagesRes> {
  const pages = await databases
    .listDocuments(DATABASE_ID, collections.PAGES, [
      Query.limit(100),
      Query.orderDesc("$createdAt"),
    ])
    .catch((err: AppwriteException) => err);

  if (
    pages instanceof AppwriteException &&
    isUserNotAuthorizedException(pages)
  ) {
    return { valid: false, reason: ErrorReasons.userNotAuthorized };
  }

  if (pages instanceof AppwriteException) {
    captureException(pages);
    return { valid: false, message: pages.message };
  }

  return { valid: true, pages: pages.documents.map(convertPageModel) };
}

export async function getPages() {
  const pagesRes = await cachified({
    cache,
    key: getPagesCacheKey(),
    async getFreshValue() {
      return getPagesImpl();
    },
    ttl: ONE_MONTH_IN_MS,
  });

  if (!pagesRes.valid) {
    invalidatePagesCache();
  }

  return pagesRes;
}

async function getPageFromAppwriteImpl(id: string) {
  return databases
    .getDocument(DATABASE_ID, collections.PAGES, id)
    .catch((err: AppwriteException) => err);
}

async function getPageFromAppwrite(id: string) {
  const value = await cachified({
    key: getSinglePageCacheKey(id),
    cache,
    async getFreshValue() {
      return getPageFromAppwriteImpl(id);
    },
    ttl: ONE_MONTH_IN_MS,
  });

  if (value instanceof AppwriteException) {
    invalidateSinglePageCache(id);
    return value;
  }

  return value;
}

export type GetPageProps = {
  id: string;
};

export type GetPageRes = APIResponse<
  typeof ErrorReasons.pageNotFound,
  { valid: true; page: PageModel }
>;

export async function getPage({ id }: GetPageProps): Promise<GetPageRes> {
  const page = await getPageFromAppwrite(id).catch((err: AppwriteException) => {
    return secureGetPage(id).then((res) => {
      if (res === null) {
        return err;
      } else {
        return res;
      }
    });
  });

  if (page instanceof AppwriteException && isDocumentNotFoundException(page)) {
    return { valid: false, reason: ErrorReasons.pageNotFound };
  }

  if (page instanceof AppwriteException) {
    captureException(page);
    return { valid: false, message: page.message };
  }

  return {
    valid: true,
    page: convertPageModel(page),
  };
}

export type StorePageProps = {
  url: string;
  name: string;
  originalUrl: string;
  userId: string;
  screenName: string;
  width: number;
  height: number;
};

export type StorePageRes = APIResponse<
  typeof ErrorReasons.userNotAuthorized,
  { valid: true; page: PageModel }
>;

export async function storePage({
  name,
  url,
  originalUrl,
  userId,
  height,
  screenName,
  width,
}: StorePageProps): Promise<StorePageRes> {
  const insertedPage = await pRetry(
    () => {
      return databases.createDocument(
        DATABASE_ID,
        collections.PAGES,
        ID.unique(),
        {
          url,
          originalUrl,
          name,
          height,
          screenName,
          width,
          createdBy: userId,
        },
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );
    },
    { retries: 3 }
  ).catch((err: AppwriteException) => err);

  invalidatePagesCache();
  invalidateSinglePageNameKey(name);

  if (
    insertedPage instanceof AppwriteException &&
    isUserNotAuthorizedException(insertedPage)
  ) {
    return { valid: false, reason: ErrorReasons.userNotAuthorized };
  }

  if (insertedPage instanceof AppwriteException) {
    captureException(insertedPage);
    return { valid: false, message: insertedPage.message };
  }

  return { valid: true, page: convertPageModel(insertedPage) };
}

export type UpdatePageUrlArgs = {
  url: string;
  pageId: string;
};

export type UpdatePageUrlRes = APIResponse<
  typeof ErrorReasons.userNotAuthorized,
  { valid: true; page: PageModel }
>;

export async function updatePageUrl({
  url,
  pageId,
}: UpdatePageUrlArgs): Promise<UpdatePageUrlRes> {
  const updatedPage = await databases
    .updateDocument(DATABASE_ID, collections.PAGES, pageId, { url })
    .catch((err: AppwriteException) => err);

  invalidateSinglePageCache(pageId);

  if (
    updatedPage instanceof AppwriteException &&
    isUserNotAuthorizedException(updatedPage)
  ) {
    return { valid: false, reason: ErrorReasons.userNotAuthorized };
  }

  if (updatedPage instanceof AppwriteException) {
    captureException(updatedPage);
    return { valid: false, message: updatedPage.message };
  }

  return { valid: true, page: convertPageModel(updatedPage) };
}

export type IsPageNameUniqueRes = APIResponse<
  typeof ErrorReasons.userNotAuthorized,
  { valid: true; isUnique: boolean }
>;

async function isPageNameUniqueImpl(
  name: string
): Promise<IsPageNameUniqueRes> {
  const docList = await databases
    .listDocuments(DATABASE_ID, collections.PAGES, [Query.equal("name", name)])
    .catch((err: AppwriteException) => err);

  if (
    docList instanceof AppwriteException &&
    isUserNotAuthorizedException(docList)
  ) {
    return { valid: false, reason: ErrorReasons.userNotAuthorized };
  }

  if (docList instanceof AppwriteException) {
    captureException(docList);
    return { valid: false, message: docList.message };
  }

  return { valid: true, isUnique: docList.total === 0 };
}

export async function isPageNameUnique(name: string) {
  const isUnique = await cachified({
    key: getSinglePageNameCacheKey(name),
    ttl: ONE_MONTH_IN_MS,
    cache,

    async getFreshValue() {
      return isPageNameUniqueImpl(name);
    },
  });

  if (!isUnique.valid) {
    invalidateSinglePageNameKey(name);
  }

  return isUnique;
}

export type StoreIssueArgs = {
  issue: string;
  pageId: string;
  userId: string;
  userEmail: string;
};

export type StoreIssueRes = APIResponse<
  typeof ErrorReasons.userNotAuthorized,
  { valid: true; pageIssue: IssueModel }
>;

export async function storeIssue({
  issue,
  pageId,
  userId,
  userEmail,
}: StoreIssueArgs): Promise<StoreIssueRes> {
  const insertedDocument = await databases
    .createDocument(
      DATABASE_ID,
      collections.PAGE_ISSUES,
      ID.unique(),
      {
        pageId,
        issue,
        createdBy: userId,
        createdByEmail: userEmail,
      },
      [Permission.delete(Role.user(userId))]
    )
    .catch((err: AppwriteException) => err);

  if (
    insertedDocument instanceof AppwriteException &&
    isUserNotAuthorizedException(insertedDocument)
  ) {
    return { valid: false, reason: ErrorReasons.userNotAuthorized };
  }

  if (insertedDocument instanceof AppwriteException) {
    captureException(insertedDocument);
    return { valid: false, message: insertedDocument.message };
  }

  return { valid: true, pageIssue: convertPageIssueModel(insertedDocument) };
}

export type GetPageIssueArgs = {
  pageId: string;
};

export type GetPageIssuesRes = APIResponse<
  typeof ErrorReasons.userNotAuthorized,
  { valid: true; pageIssueList: Array<IssueModel> }
>;

export async function getPageIssues({
  pageId,
}: GetPageIssueArgs): Promise<GetPageIssuesRes> {
  const pageIssueList = await databases
    .listDocuments(DATABASE_ID, collections.PAGE_ISSUES, [
      Query.equal("pageId", pageId),
      Query.orderDesc("$createdAt"),
      Query.limit(50),
    ])
    .catch((err: AppwriteException) => err);

  if (
    pageIssueList instanceof AppwriteException &&
    isUserNotAuthorizedException(pageIssueList)
  ) {
    return { valid: false, reason: ErrorReasons.userNotAuthorized };
  }

  if (pageIssueList instanceof AppwriteException) {
    captureException(pageIssueList);
    return { valid: false, message: pageIssueList.message };
  }

  const issueModelList = pageIssueList.documents
    .map(convertPageIssueModel)
    .reverse();

  return { valid: true, pageIssueList: issueModelList };
}

export type DeleteIssueArgs = {
  issueId: string;
};

export type DeleteIssueRes = APIResponse<
  typeof ErrorReasons.userNotAuthorized,
  { valid: true }
>;

export async function deleteIssue({
  issueId,
}: DeleteIssueArgs): Promise<DeleteIssueRes> {
  const deletedDoc = await databases
    .deleteDocument(DATABASE_ID, collections.PAGE_ISSUES, issueId)
    .catch((err: AppwriteException) => err);

  if (
    deletedDoc instanceof AppwriteException &&
    isUserNotAuthorizedException(deletedDoc)
  ) {
    return { valid: false, reason: ErrorReasons.userNotAuthorized };
  }

  if (deletedDoc instanceof AppwriteException) {
    captureException(deletedDoc);
    return { valid: false, message: deletedDoc.message };
  }

  return { valid: true };
}

export type GetPageAccessEmailsRes = APIResponse<
  typeof ErrorReasons.userNotAuthorized,
  { valid: true; pageEmailAccess: PageAccessEmailModel | undefined }
>;

async function getPageAccessEmailsImpl(
  pageId: string
): Promise<GetPageAccessEmailsRes> {
  const documents = await databases
    .listDocuments(DATABASE_ID, collections.PAGE_ACCESS_EMAILS, [
      Query.equal("pageId", pageId),
    ])
    .catch((err: AppwriteException) => err);

  if (
    documents instanceof AppwriteException &&
    isUserNotAuthorizedException(documents)
  ) {
    return { valid: false, reason: ErrorReasons.userNotAuthorized };
  }

  if (documents instanceof AppwriteException) {
    captureException(documents);
    return { valid: false, message: documents.message };
  }

  return {
    valid: true,
    pageEmailAccess: documents.documents.map(convertPageAccessEmailModel)[0],
  };
}

export async function getPageAccessEmails(pageId: string) {
  const value = await cachified({
    cache,
    ttl: ONE_MONTH_IN_MS,
    key: getSinglePageAccessCacheKey(pageId),
    async getFreshValue() {
      return getPageAccessEmailsImpl(pageId);
    },
  });

  if (!value.valid) {
    invalidateSinglePageAccessCacheKey(pageId);
  }

  return value;
}

export type CreatePageAccessEmailRes = APIResponse<
  typeof ErrorReasons.userNotAuthorized,
  { valid: true; pageEmailAccess: PageAccessEmailModel }
>;

export async function createPageAccessEmails(
  pageId: string,
  emailList: Set<string>
): Promise<CreatePageAccessEmailRes> {
  const emailListArr = new Array(...emailList);

  const createdDoc = await databases
    .createDocument(DATABASE_ID, collections.PAGE_ACCESS_EMAILS, ID.unique(), {
      pageId,
      emails: emailListArr,
    })
    .catch((err: AppwriteException) => err);

  if (
    createdDoc instanceof AppwriteException &&
    isUserNotAuthorizedException(createdDoc)
  ) {
    return { valid: false, reason: ErrorReasons.userNotAuthorized };
  }

  if (createdDoc instanceof AppwriteException) {
    captureException(createdDoc);
    return { valid: false, message: createdDoc.message };
  }

  return {
    valid: true,
    pageEmailAccess: convertPageAccessEmailModel(createdDoc),
  };
}

export type UpdatePageEmailAccessEmailsRes = APIResponse<
  typeof ErrorReasons.userNotAuthorized,
  { valid: true; pageEmailAccess: PageAccessEmailModel }
>;

export async function updatePageAccessEmails(
  pageAccessEmailDocId: string,
  emailList: Set<string>
): Promise<UpdatePageEmailAccessEmailsRes> {
  const emailListArr = new Array(...emailList);

  const updatedDoc = await databases
    .updateDocument(
      DATABASE_ID,
      collections.PAGE_ACCESS_EMAILS,
      pageAccessEmailDocId,
      { emails: emailListArr }
    )
    .catch((err: AppwriteException) => err);

  if (
    updatedDoc instanceof AppwriteException &&
    isUserNotAuthorizedException(updatedDoc)
  ) {
    return { valid: false, reason: ErrorReasons.userNotAuthorized };
  }

  if (updatedDoc instanceof AppwriteException) {
    return { valid: false, message: updatedDoc.message };
  }

  return {
    valid: true,
    pageEmailAccess: convertPageAccessEmailModel(updatedDoc),
  };
}

export type IsSlackAppInstalledArgs = {
  userId: string;
};

export type IsSlackAppInstalledRes = APIResponse<
  typeof ErrorReasons.userNotAuthorized,
  { valid: true; isSlackAppInstalled: boolean }
>;

export async function isSlackAppInstalled({
  userId,
}: IsSlackAppInstalledArgs): Promise<IsSlackAppInstalledRes> {
  const docList = await databases
    .listDocuments(DATABASE_ID, collections.USER_WEBHOOK_URL, [
      Query.equal("userId", userId),
    ])
    .catch((err: AppwriteException) => err);

  if (
    docList instanceof AppwriteException &&
    isUserNotAuthorizedException(docList)
  ) {
    return { valid: false, reason: ErrorReasons.userNotAuthorized };
  }

  if (docList instanceof AppwriteException) {
    captureException(docList);
    return { valid: false, message: docList.message };
  }

  return { valid: true, isSlackAppInstalled: docList.total !== 0 };
}

export type GetAvatarForUserArgs = {
  email: string;
};

export function getAvatarForUser({ email }: GetAvatarForUserArgs) {
  const url = avatars.getInitials(email, 60, 60);

  return url.toString();
}
