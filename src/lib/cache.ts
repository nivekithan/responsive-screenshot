import { CacheEntry } from "cachified";
import { LRUCache } from "lru-cache";

export const cache = new LRUCache<string, CacheEntry>({ max: 1000 });

const cachePrefix = {
  user: "user",
  pages: "pages",
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
