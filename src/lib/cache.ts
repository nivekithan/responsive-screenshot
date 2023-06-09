import { CacheEntry } from "cachified";
import { LRUCache } from "lru-cache";

export const cache = new LRUCache<string, CacheEntry>({ max: 1000 });

const cachePrefix = {
  user: "user",
  pages: "pages",
  singlePage: "singlePage",
  pageName: "pageName",
};

let userCacheKey: string | null = null;
export function getUserCacheKey() {
  if (!userCacheKey) {
    userCacheKey = `${new Date().getTime()}`;
  }
  return `${cachePrefix.user}-${userCacheKey}`;
}

export function invalidateUserCache() {
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
  globalPageNameKey.set(nameOfPage, `${new Date().getTime()}`);
}
