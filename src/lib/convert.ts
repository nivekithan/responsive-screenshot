import { z } from "zod";

const PageCommentSchema = z.object({
  $id: z.string(),
  pageId: z.string(),
  comment: z.string(),
  $createdAt: z.string(),
  createdByEmail: z.string(),
  createdBy: z.string(),
});

export function convertPageCommentModel(pageComment: unknown) {
  const payload = PageCommentSchema.parse(pageComment);

  return {
    id: payload.$id,
    pageId: payload.pageId,
    comment: payload.comment,
    createdAt: payload.$createdAt,
    createdBy: payload.createdBy,
    createdByEmail: payload.createdByEmail,
  };
}

export type CommentModel = ReturnType<typeof convertPageCommentModel>;

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
