import { useEffect, useRef } from "react";
import { useFetcher } from "react-router-dom";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { conform, useForm } from "@conform-to/react";
import { z } from "zod";
import { parse } from "@conform-to/zod";

export const addCommentSchema = z.object({
  comment: z.string(),
});

export function ScreenshotFeedbackForm() {
  const commentFetcher = useFetcher();
  const commentFormRef = useRef<HTMLFormElement | null>();

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
          placeholder="Issue to send..."
          {...conform.input(comment)}
          defaultValue={undefined}
        />
        <Button
          type="submit"
          variant="default"
          className="w-24"
          disabled={isAddingComment}
        >
          {isAddingComment ? "Sending..." : "Send"}
        </Button>
      </commentFetcher.Form>
    </div>
  );
}
