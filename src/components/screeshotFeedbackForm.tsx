import { useEffect, useRef } from "react";
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
import { conform, useForm } from "@conform-to/react";
import { z } from "zod";
import { parse } from "@conform-to/zod";

export const updateApprovalStatusSchema = z.object({
  status: z.union([z.literal("APPROVED"), z.literal("DISAPPROVED")]),
});

export const addCommentSchema = z.object({
  comment: z.string(),
});

export type ScreenshotFeedbackFormProps = {
  defaultStatus?: z.infer<typeof updateApprovalStatusSchema>["status"];
};

export function ScreenshotFeedbackForm({
  defaultStatus,
}: ScreenshotFeedbackFormProps) {
  const commentFetcher = useFetcher();
  const commentFormRef = useRef<HTMLFormElement | null>();

  const approvalStatusFetcher = useFetcher();
  const approvalStatusFormRef = useRef<HTMLFormElement | null>(null);

  const [updateApporvalStatusForm, { status }] = useForm({
    lastSubmission: approvalStatusFetcher.data,
    onValidate({ formData }) {
      return parse(formData, { schema: updateApprovalStatusSchema });
    },
  });

  const [addCommentForm, { comment }] = useForm({
    lastSubmission: commentFetcher.data,
    onValidate({ formData }) {
      return parse(formData, { schema: addCommentSchema });
    },
  });

  const isAddingComment = commentFetcher.state === "submitting";

  useEffect(() => {
    if (!isAddingComment) {
      commentFormRef.current?.reset();
    }
  }, [isAddingComment]);

  const approvalStatusFormProps = updateApporvalStatusForm.props;
  const addCommentFormProps = addCommentForm.props;

  return (
    <div className="h-16 flex items-center justify-center gap-x-2">
      <commentFetcher.Form
        method="post"
        className="flex items-center justify-center gap-x-2 flex-1 "
        {...addCommentFormProps}
        ref={(e) => {
          commentFormRef.current = e;

          // @ts-ignore
          addCommentFormProps.ref.current = e;
        }}
      >
        <Input
          type="text"
          className="flex-grow"
          placeholder="Comment to send..."
          {...conform.input(comment)}
          defaultValue={undefined}
        />
        <Button type="submit" variant="secondary">
          Send
        </Button>
      </commentFetcher.Form>
      <approvalStatusFetcher.Form
        method="post"
        className="flex w-32"
        {...approvalStatusFormProps}
        ref={(ref) => {
          approvalStatusFormRef.current = ref;
          // @ts-expect-error
          approvalStatusFormProps.ref.current = ref;
        }}
      >
        <Select
          onValueChange={() => {
            approvalStatusFetcher.submit(approvalStatusFormRef.current);
          }}
          {...conform.select(status)}
          defaultValue={defaultStatus}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="APPROVED">Approve</SelectItem>
            <SelectItem value="DISAPPROVED">Disapprove</SelectItem>
          </SelectContent>
        </Select>
      </approvalStatusFetcher.Form>
    </div>
  );
}
