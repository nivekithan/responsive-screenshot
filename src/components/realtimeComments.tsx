import { useSyncPageComments } from "@/lib/pageCommentStore";
import { useEffect } from "react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export type RealTimeComments = {
  pageId: string;
  scrollToBottom: () => void;
};

export function RealTimeComments({ pageId, scrollToBottom }: RealTimeComments) {
  const pageComments = useSyncPageComments(pageId);

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
            <Button
              variant="secondary"
              className="border hover:border-foreground/50"
            >
              Resolve
            </Button>
          </div>
        );
      })}
    </div>
  );
}
