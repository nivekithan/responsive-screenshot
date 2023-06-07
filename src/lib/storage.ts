import { AppwriteException, ID, Permission, Query, Role } from "appwrite";
import { databases, secureGetPage } from "./appwrite";
import { ErrorReasons, isDocumentNotFoundException } from "./utils";
import {
  convertPageAccessEmailModel,
  convertPageCommentModel,
} from "./convert";

export const DATABASE_ID = "dev";
export const collections = {
  PAGES: "647b0d9310b4ac4f8256",
  PAGE_APPROVAL_STATUS: "647c71d2cac511ce8e9b",
  PAGE_COMMENTS: "647f630632a9fb64e6ef",
  PAGE_ACCESS_EMAILS: "647f3355ed75a176dba9",
};

export type PageModel = {
  url: string;
  name: string;
  originalUrl: string;
  id: string;
};

export async function getPages() {
  const pages = await databases
    .listDocuments(DATABASE_ID, collections.PAGES, [Query.limit(10)])
    .catch((err: AppwriteException) => err);

  if (pages instanceof AppwriteException) {
    return pages;
  }
  return pages.documents.map((document): PageModel => {
    return {
      url: document.url as string,
      name: document.name as string,
      originalUrl: document.originalUrl as string,
      id: document.$id,
    };
  });
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
  const page = await databases
    .getDocument(DATABASE_ID, collections.PAGES, id)
    .catch((err: AppwriteException) => {
      return secureGetPage(id).then((res) => {
        console.log(res);
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
    return { valid: false, message: page.message };
  }

  return {
    valid: true,
    page: {
      id: page.$id,
      name: page.name,
      originalUrl: page.originalUrl,
      url: page.url,
    }
  };
}

export type StorePageProps = {
  url: string;
  name: string;
  originalUrl: string;
  userId: string;
};
export async function storePage({
  name,
  url,
  originalUrl,
  userId,
}: StorePageProps) {
  const insertedPage = await databases

    .createDocument(
      DATABASE_ID,
      collections.PAGES,
      ID.unique(),
      {
        url,
        name,
        originalUrl,
      },
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]
    )
    .catch((err: AppwriteException) => err);

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

  return updatedPage;
}

export type ApprovalStatusModel = {
  pageId: string;
  status: "APPROVED" | "DISAPPROVED";
  id: string;
};

export type GetApprovalStatusArgs = {
  pageId: string;
};

export async function getApprovalStatus({
  pageId,
}: GetApprovalStatusArgs): Promise<ApprovalStatusModel | null> {
  const statusList = await databases.listDocuments(
    DATABASE_ID,
    collections.PAGE_APPROVAL_STATUS,
    [Query.equal("pageId", pageId)]
  );

  if (statusList.documents.length === 0) {
    return null;
  }

  const doc = statusList.documents[0];

  return { pageId: doc.pageId, id: doc.$id, status: doc.status };
}

export type StoreApprovalStatusArgs = {
  pageId: string;
  approvalStatus: ApprovalStatusModel["status"];
};

export async function setApprovalStatus({
  pageId,
  approvalStatus,
}: StoreApprovalStatusArgs) {
  // TODO: Proper error handling
  const status = await getApprovalStatus({ pageId });
  const isStatusPresent = status === null;

  if (isStatusPresent) {
    const createdStatus = await databases.createDocument(
      DATABASE_ID,
      collections.PAGE_APPROVAL_STATUS,
      ID.unique(),
      { pageId, status: approvalStatus }
    );
    return createdStatus;
  } else {
    const id = status.id;

    const updatedStatus = await databases.updateDocument(
      DATABASE_ID,
      collections.PAGE_APPROVAL_STATUS,
      id,
      { status: approvalStatus }
    );

    return updatedStatus;
  }
}

export type StoreCommentArgs = {
  comment: string;
  pageId: string;
};

export async function storeComment({ comment, pageId }: StoreCommentArgs) {
  const insertedDocument = await databases
    .createDocument(DATABASE_ID, collections.PAGE_COMMENTS, ID.unique(), {
      pageId,
      comment,
    })
    .catch((err: AppwriteException) => err);

  if (insertedDocument instanceof AppwriteException) {
    return insertedDocument;
  }

  return convertPageCommentModel(insertedDocument);
}

export type GetPageCommentsArgs = {
  pageId: string;
};

export async function getPageComments({ pageId }: GetPageCommentsArgs) {
  const pageCommentsList = await databases.listDocuments(
    DATABASE_ID,
    collections.PAGE_COMMENTS,
    [
      Query.equal("pageId", pageId),
      Query.orderDesc("$createdAt"),
      Query.limit(50),
    ]
  );

  const commentModelList = pageCommentsList.documents
    .map(convertPageCommentModel)
    .reverse();

  return commentModelList;
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
