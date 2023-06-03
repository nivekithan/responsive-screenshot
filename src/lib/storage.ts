import { AppwriteException, ID, Query } from "appwrite";
import { databases } from "./appwrite";

const DATABASE_ID = "dev";
const collections = {
  PAGES: "647b0d9310b4ac4f8256",
};

export async function getPages() {
  const pages = await databases
    .listDocuments(DATABASE_ID, collections.PAGES, [Query.limit(10)])
    .catch((err: AppwriteException) => err);

  if (pages instanceof AppwriteException) {
    return pages;
  }
  return pages.documents.map((document) => {
    return {
      url: document.url as string,
      name: document.name as string,
      originalUrl: document.originalUrl as string,
      id: document.$id,
    };
  });
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
