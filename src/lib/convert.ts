import { z } from "zod";

const PageCommentSchema = z.object({
  $id: z.string(),
  pageId: z.string(),
  comment: z.string(),
  $createdAt: z.string(),
});

export function convertPageCommentModel(pageComment: unknown) {
  const payload = PageCommentSchema.parse(pageComment);

  return {
    id: payload.$id,
    pageId: payload.pageId,
    comment: payload.comment,
    createdAt: payload.$createdAt,
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
