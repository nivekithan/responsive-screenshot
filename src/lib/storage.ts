import { AppwriteException, ID, Models, Query } from "appwrite";
import { databases } from "./appwrite";
import { ErrorReasons, isDocumentNotFoundException } from "./utils";

const DATABASE_ID = "dev";
const collections = {
  PAGES: "647b0d9310b4ac4f8256",
  PAGE_APPROVAL_STATUS: "647c71d2cac511ce8e9b",
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
  status: "APPROVED" | "DISAPPROVED" | "WAITING";
};

export type GetApprovalStatusListArgs = {
  pageId: string;
};

export async function getApprovalStatusList({
  pageId,
}: GetApprovalStatusListArgs) {
  const statusList = await databases.listDocuments(
    DATABASE_ID,
    collections.PAGE_APPROVAL_STATUS,
    [Query.equal("pageId", pageId)]
  );

  console.log(statusList);

  return statusList;
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
  const statusList = await getApprovalStatusList({ pageId });
  const isDocsEmpty = statusList.documents.length === 0;

  if (isDocsEmpty) {
    const createdStatus = await databases.createDocument(
      DATABASE_ID,
      collections.PAGE_APPROVAL_STATUS,
      ID.unique(),
      { pageId, status: approvalStatus }
    );
    return createdStatus;
  } else {
    const id = statusList.documents[0].$id;

    const updatedStatus = await databases.updateDocument(
      DATABASE_ID,
      collections.PAGE_APPROVAL_STATUS,
      id,
      { status: approvalStatus }
    );

    return updatedStatus;
  }
}
