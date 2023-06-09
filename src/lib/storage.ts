import {
  AppwriteException,
  ID,
  Models,
  Permission,
  Query,
  Role,
} from "appwrite";
import { avatars, databases, secureGetPage } from "./appwrite";
import {
  ErrorReasons,
  ONE_MONTH_IN_MS,
  isDocumentNotFoundException,
} from "./utils";
import {
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
  getSinglePageCacheKey,
  invalidatePagesCache,
  invalidateSinglePageCache,
} from "./cache";

export const DATABASE_ID = "dev";
export const collections = {
  PAGES: "647b0d9310b4ac4f8256",
  PAGE_ISSUES: "647f630632a9fb64e6ef",
  PAGE_ACCESS_EMAILS: "647f3355ed75a176dba9",
  USER_WEBHOOK_URL: "648046bd24a66d4b1503",
};

async function getPagesImpl() {
  const pages = await databases
    .listDocuments(DATABASE_ID, collections.PAGES, [
      Query.limit(100),
      Query.orderDesc("$createdAt"),
    ])
    .catch((err: AppwriteException) => err);

  if (pages instanceof AppwriteException) {
    return pages;
  }
  return pages.documents.map(convertPageModel);
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

  if (pagesRes instanceof AppwriteException) {
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
    throw value;
  }

  console.log({ value });
  return value;
}

export type GetPageProps = {
  id: string;
};

export type GetPageRes =
  | {
      valid: true;
      page: PageModel;
    }
  | { valid: false; reason: (typeof ErrorReasons)["pageNotFound"] }
  | { valid: false; message: string };

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

  console.log({ page });

  if (page instanceof AppwriteException && isDocumentNotFoundException(page)) {
    return { valid: false, reason: ErrorReasons.pageNotFound };
  }

  if (page instanceof AppwriteException) {
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

export async function storePage({
  name,
  url,
  originalUrl,
  userId,
  height,
  screenName,
  width,
}: StorePageProps) {
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

  return insertedPage;
}

export type UpdatePageUrlArgs = {
  url: string;
  pageId: string;
};

export async function updatePageUrl({ url, pageId }: UpdatePageUrlArgs) {
  const updatedPage = await databases.updateDocument(
    DATABASE_ID,
    collections.PAGES,
    pageId,
    { url }
  );

  invalidateSinglePageCache(pageId);

  return updatedPage;
}

export async function isPageNameUnique(name: string) {
  const docList = await databases.listDocuments(
    DATABASE_ID,
    collections.PAGES,
    [Query.equal("name", name)]
  );

  return docList.total === 0;
}

export type StoreIssueArgs = {
  issue: string;
  pageId: string;
  userId: string;
  userEmail: string;
};

export async function storeIssue({
  issue,
  pageId,
  userId,
  userEmail,
}: StoreIssueArgs) {
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

  if (insertedDocument instanceof AppwriteException) {
    return insertedDocument;
  }

  return convertPageIssueModel(insertedDocument);
}

export type GetPageIssueArgs = {
  pageId: string;
};

export async function getPageIssues({ pageId }: GetPageIssueArgs) {
  const pageIssueList = await databases.listDocuments(
    DATABASE_ID,
    collections.PAGE_ISSUES,
    [
      Query.equal("pageId", pageId),
      Query.orderDesc("$createdAt"),
      Query.limit(50),
    ]
  );

  const issueModelList = pageIssueList.documents
    .map(convertPageIssueModel)
    .reverse();

  return issueModelList;
}

export type DeleteIssueArgs = {
  issueId: string;
};

export async function deleteIssue({ issueId }: DeleteIssueArgs) {
  const deletedDoc = await databases.deleteDocument(
    DATABASE_ID,
    collections.PAGE_ISSUES,
    issueId
  );

  return deletedDoc;
}

export async function getPageAccessEmails(pageId: string) {
  const documents = await databases.listDocuments(
    DATABASE_ID,
    collections.PAGE_ACCESS_EMAILS,
    [Query.equal("pageId", pageId)]
  );

  return documents.documents.map(convertPageAccessEmailModel)[0];
}

export async function createPageAccessEmails(
  pageId: string,
  emailList: Set<string>
) {
  const emailListArr = new Array(...emailList);

  const createdDoc = await databases.createDocument(
    DATABASE_ID,
    collections.PAGE_ACCESS_EMAILS,
    ID.unique(),
    { pageId, emails: emailListArr }
  );

  return convertPageAccessEmailModel(createdDoc);
}

export async function updatePageAccessEmails(
  pageAccessEmailDocId: string,
  emailList: Set<string>
) {
  const emailListArr = new Array(...emailList);

  const createdDoc = await databases.updateDocument(
    DATABASE_ID,
    collections.PAGE_ACCESS_EMAILS,
    pageAccessEmailDocId,
    { emails: emailListArr }
  );

  return convertPageAccessEmailModel(createdDoc);
}

export type IsSlackAppInstalledArgs = {
  userId: string;
};

export async function isSlackAppInstalled({ userId }: IsSlackAppInstalledArgs) {
  const docList = await databases.listDocuments(
    DATABASE_ID,
    collections.USER_WEBHOOK_URL,
    [Query.equal("userId", userId)]
  );

  return docList.total !== 0;
}

export type GetAvatarForUserArgs = {
  user: Models.User<Models.Preferences>;
};
export function getAvatarForUser({ user }: GetAvatarForUserArgs) {
  const url = avatars.getInitials(user.email, 60, 60);

  return url.toString();
}
