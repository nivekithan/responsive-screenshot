import { useRef } from "react";
import { useFetcher } from "react-router-dom";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function ScreenshotFeedbackForm() {
  const commentFetcher = useFetcher();
  const approvalStatusFetcher = useFetcher();
  const approvalStatusFormRef = useRef<HTMLFormElement | null>(null);

  return (
    <div className="h-16 flex items-center justify-center gap-x-2">
      <commentFetcher.Form
        method="post"
        replace
        className="flex items-center justify-center gap-x-2 flex-1 "
      >
        <Input
          type="text"
          className="flex-grow"
          name="comment"
          placeholder="Comment to send..."
        />
        <Button type="submit" variant="secondary">
          Send
        </Button>
      </commentFetcher.Form>
      <approvalStatusFetcher.Form
        method="post"
        className="flex w-32"
        ref={approvalStatusFormRef}
      >
        <Select
          name="apporval-status"
          onValueChange={() => {
            approvalStatusFetcher.submit(approvalStatusFormRef.current);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="approve">Approve</SelectItem>
            <SelectItem value="disapprove">Disapprove</SelectItem>
          </SelectContent>
        </Select>
      </approvalStatusFetcher.Form>
    </div>
  );
}
