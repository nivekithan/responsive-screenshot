import { AppwriteException, ID, Query } from "appwrite";
import { databases } from "./appwrite";
import { ErrorReasons, isDocumentNotFoundException } from "./utils";
import { convertPageCommentModel } from "./convert";

export const DATABASE_ID = "dev";
export const collections = {
  PAGES: "647b0d9310b4ac4f8256",
  PAGE_APPROVAL_STATUS: "647c71d2cac511ce8e9b",
  PAGE_COMMENTS: "647cbdc2c63d3a217083",
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
    .catch((err: AppwriteException) => err);

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
    },
  };
}

export type StorePageProps = {
  url: string;
  name: string;
  originalUrl: string;
};
export async function storePage({ name, url, originalUrl }: StorePageProps) {
  const insertedPage = await databases
    .createDocument(DATABASE_ID, collections.PAGES, ID.unique(), {
      url,
      name,
      originalUrl,
    })
    .catch((err: AppwriteException) => err);

  return insertedPage;
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
