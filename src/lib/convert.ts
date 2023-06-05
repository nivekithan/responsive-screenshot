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
