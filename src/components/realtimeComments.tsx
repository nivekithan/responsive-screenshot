import { useSyncPageComments } from "@/lib/pageCommentStore";
import { useEffect } from "react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useFetcher } from "react-router-dom";
import { z } from "zod";

export type RealTimeComments = {
  pageId: string;
  scrollToBottom: () => void;
};

export const resolveIssueSchema = z.object({
  resolveIssue: z.string().nonempty(),
});

export function RealTimeComments({ pageId, scrollToBottom }: RealTimeComments) {
  const pageComments = useSyncPageComments(pageId);
  const resolveIssueFetcher = useFetcher();

  useEffect(() => {
    scrollToBottom();
  }, [pageComments]);

  return (
    <div className="flex flex-col gap-y-3">
      {pageComments.map((comment) => {
        return (
          <div
            key={comment.id}
            className="border rounded-md px-3 py-2 flex flex-col gap-y-3"
          >
            <h3 className="text-sm font-bold">{comment.createdByEmail}</h3>
            <p>{comment.comment}</p>
            <Separator />
            <resolveIssueFetcher.Form method="post">
              <Button
                variant="secondary"
                className="border hover:border-foreground/50 w-full"
                name="resolveIssue"
                value={comment.id}
              >
                Resolve
              </Button>
            </resolveIssueFetcher.Form>
          </div>
        );
      })}
    </div>
  );
}
