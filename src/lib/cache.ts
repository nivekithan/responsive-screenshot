import { CacheEntry } from "cachified";
import { LRUCache } from "lru-cache";

export const cache = new LRUCache<string, CacheEntry>({ max: 1000 });

const cachePrefix = {
  user: "user",
  pages: "pages",
  singlePage: "singlePage",
  pageName: "pageName",
  pageAccessEmails: "pageAccessEmails",
};

let userCacheKey: string | null = null;
export function getUserCacheKey() {
  if (!userCacheKey) {
    userCacheKey = `${new Date().getTime()}`;
  }
  return `${cachePrefix.user}-${userCacheKey}`;
}

export function invalidateUserCache() {
  console.log("Invalidating user cache");
  userCacheKey = `${new Date().getTime()}`;
}

let pagesCacheKey: string | null = null;

export function getPagesCacheKey() {
  if (!pagesCacheKey) {
    pagesCacheKey = `${new Date().getTime()}`;
  }
  return `${cachePrefix.pages}-${pagesCacheKey}`;
}

export function invalidatePagesCache() {
  console.log("Invalidating pages cache");
  pagesCacheKey = `${new Date().getTime()}`;
}

const globalSinglePagesCacheKey: Map<string, string> = new Map();

export function getSinglePageCacheKey(pageId: string) {
  const mayBepageKey = globalSinglePagesCacheKey.get(pageId);

  if (mayBepageKey === undefined) {
    globalSinglePagesCacheKey.set(pageId, `${new Date().getTime()}`);
  }

  const pageKey = globalSinglePagesCacheKey.get(pageId);

  if (pageKey === undefined) {
    throw new Error("Unreachable");
  }

  return `${cachePrefix.singlePage}-${pageId}-${pageKey}`;
}

export function invalidateSinglePageCache(pageId: string) {
  console.log(`Invalidating singlePage: ${pageId} cache`);
  globalSinglePagesCacheKey.set(pageId, `${new Date().getTime()}`);
}

const globalPageNameKey: Map<string, string> = new Map();

export function getSinglePageNameCacheKey(nameOfPage: string) {
  const mayBepageKey = globalPageNameKey.get(nameOfPage);

  if (mayBepageKey === undefined) {
    globalPageNameKey.set(nameOfPage, `${new Date().getTime()}`);
  }

  const pageKey = globalPageNameKey.get(nameOfPage);

  if (pageKey === undefined) {
    throw new Error("Unreachable");
  }

  return `${cachePrefix.pageName}-${nameOfPage}-${pageKey}`;
}

export function invalidateSinglePageNameKey(nameOfPage: string) {
  console.log(`Invalidating singlePageName: ${nameOfPage} cache`);
  globalPageNameKey.set(nameOfPage, `${new Date().getTime()}`);
}

const globalPageAccessEmailsKey: Map<string, string> = new Map();

export function getSinglePageAccessCacheKey(pageId: string) {
  const mayBepageKey = globalPageAccessEmailsKey.get(pageId);

  if (mayBepageKey === undefined) {
    globalPageAccessEmailsKey.set(pageId, `${new Date().getTime()}`);
  }

  const pageKey = globalPageAccessEmailsKey.get(pageId);

  if (pageKey === undefined) {
    throw new Error("Unreachable");
  }

  return `${cachePrefix.pageAccessEmails}-${pageId}-${pageKey}`;
}

export function invalidateSinglePageAccessCacheKey(pageId: string) {
  console.log(`Invalidating singlePageAccess: ${pageId} cache`);
  globalPageAccessEmailsKey.set(pageId, `${new Date().getTime()}`);
}
