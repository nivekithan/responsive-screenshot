import { useSyncPageIssue } from "@/lib/pageCommentStore";
import { useEffect } from "react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useFetcher } from "react-router-dom";
import { z } from "zod";
import { IssueModel } from "@/lib/convert";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getAvatarForUser } from "@/lib/storage";

export type RealTimeIssueProps = {
  pageId: string;
  scrollToBottom: () => void;
};

export const resolveIssueSchema = z.object({
  resolveIssue: z.string().nonempty(),
});

export function RealTimeIssue({ pageId, scrollToBottom }: RealTimeIssueProps) {
  const pageIssues = useSyncPageIssue(pageId);

  useEffect(() => {
    scrollToBottom();
  }, [pageIssues, scrollToBottom]);

  return (
    <div className="flex flex-col gap-y-3">
      {pageIssues.map((issue) => {
        return <SingleIsue issue={issue} key={issue.id} />;
      })}
    </div>
  );
}

function SingleIsue({ issue }: { issue: IssueModel }) {
  const resolveIssueFetcher = useFetcher();
  const isResolvingIssue = resolveIssueFetcher.state === "submitting";
  const userEmail = issue.createdByEmail;
  const avatarUrl = getAvatarForUser({ email: userEmail });

  return (
    <div className="border rounded-md px-3 py-2 flex flex-col gap-y-3">
      <div className="flex gap-x-2 items-center">
        <Avatar className="w-8 h-8">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{userEmail.at(0)}</AvatarFallback>
        </Avatar>
        <h3 className="text-sm font-bold">{issue.createdByEmail}</h3>
      </div>
      <p>{issue.issue}</p>
      <Separator />
      <resolveIssueFetcher.Form method="post">
        <Button
          variant="secondary"
          className="border hover:border-foreground/50 w-full"
          name="resolveIssue"
          value={issue.id}
          disabled={isResolvingIssue}
        >
          {isResolvingIssue ? "Resolving..." : "Resolve"}
        </Button>
      </resolveIssueFetcher.Form>
    </div>
  );
}
