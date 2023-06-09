import { z } from "zod";

const PageIssueSchema = z.object({
  $id: z.string(),
  pageId: z.string(),
  issue: z.string(),
  $createdAt: z.string(),
  createdByEmail: z.string(),
  createdBy: z.string(),
});

export function convertPageIssueModel(pageIssue: unknown) {
  const payload = PageIssueSchema.parse(pageIssue);

  return {
    id: payload.$id,
    pageId: payload.pageId,
    issue: payload.issue,
    createdAt: payload.$createdAt,
    createdBy: payload.createdBy,
    createdByEmail: payload.createdByEmail,
  };
}

export type IssueModel = ReturnType<typeof convertPageIssueModel>;

const PageAccessEmailSchema = z.object({
  $id: z.string(),
  pageId: z.string(),
  emails: z.array(z.string()),
});

export function convertPageAccessEmailModel(pageAccessEmail: unknown) {
  const payload = PageAccessEmailSchema.parse(pageAccessEmail);

  return {
    id: payload.$id,
    email: payload.emails,
    pageId: payload.pageId,
  };
}

export type PageAccessEmailModel = ReturnType<
  typeof convertPageAccessEmailModel
>;

const PageSchema = z.object({
  url: z.string(),
  name: z.string(),
  originalUrl: z.string(),
  createdBy: z.string(),
  screenName: z.string(),
  width: z.number(),
  height: z.number(),
  $id: z.string(),
});

export function convertPageModel(page: unknown) {
  const payload = PageSchema.parse(page);

  return {
    id: payload.$id,
    ...payload,
  };
}

export type PageModel = ReturnType<typeof convertPageModel>;
