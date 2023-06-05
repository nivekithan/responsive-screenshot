import { useSyncPageComments } from "@/lib/pageCommentStore";
import { useEffect } from "react";

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
    <div>
      {pageComments.map((comment) => {
        return <p key={comment.id}>{comment.comment}</p>;
      })}
    </div>
  );
}
