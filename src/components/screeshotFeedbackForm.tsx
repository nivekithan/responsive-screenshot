import { useEffect, useRef } from "react";
import { useFetcher } from "react-router-dom";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { conform, useForm } from "@conform-to/react";
import { z } from "zod";
import { parse } from "@conform-to/zod";

export const addIssueSchema = z.object({
  issue: z.string(),
});

export function ScreenshotFeedbackForm() {
  const issueFetcher = useFetcher();
  const issueFormRef = useRef<HTMLFormElement | null>();

  const [addIssueForm, { issue }] = useForm({
    lastSubmission: issueFetcher.data,
    onValidate({ formData }) {
      return parse(formData, { schema: addIssueSchema });
    },
  });

  const isAddingIssue = issueFetcher.state === "submitting";

  useEffect(() => {
    if (!isAddingIssue) {
      issueFormRef.current?.reset();
    }
  }, [isAddingIssue]);

  const addIssueFormProps = addIssueForm.props;

  return (
    <div className="h-16 flex items-center justify-center gap-x-2">
      <issueFetcher.Form
        method="post"
        className="flex items-center justify-center gap-x-2 flex-1 "
        {...addIssueFormProps}
        ref={(e) => {
          issueFormRef.current = e;

          // @ts-ignore
          addIssueFormProps.ref.current = e;
        }}
      >
        <Input
          type="text"
          className="flex-grow"
          placeholder="Issue to send..."
          {...conform.input(issue)}
          defaultValue={undefined}
        />
        <Button
          type="submit"
          variant="default"
          className="w-24"
          disabled={isAddingIssue}
        >
          {isAddingIssue ? "Sending..." : "Send"}
        </Button>
      </issueFetcher.Form>
    </div>
  );
}
