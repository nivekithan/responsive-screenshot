import { Form, useRevalidator } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useReducer, useRef, useState } from "react";
import { z } from "zod";
import { X } from "lucide-react";
import { PageAccessEmailModel } from "@/lib/convert";
import { createPageAccessEmails, updatePageAccessEmails } from "@/lib/storage";
import { toast } from "./ui/use-toast";

type EmailList = Set<string>;
type emailReducerAction =
  | {
      type: "addNewEmail";
      email: string;
    }
  | {
      type: "removeEmail";
      email: string;
    }
  | {
      type: "clear";
    };

function shareToEmailListReducer(state: EmailList, action: emailReducerAction) {
  console.log({ state, action });
  if (action.type === "addNewEmail") {
    const newState = new Set(state);
    newState.add(action.email);
    return newState;
  } else if (action.type === "removeEmail") {
    const newState = new Set(state);
    newState.delete(action.email);
    return newState;
  } else if (action.type === "clear") {
    return new Set<string>();
  }

  return state;
}

function initializePageAccessEmailState(
  pageAccessEmails?: PageAccessEmailModel
) {
  if (!pageAccessEmails) {
    return new Set<string>();
  }

  return new Set(pageAccessEmails.email);
}

export type ShareScreenShotLinkDialogProps = {
  pageAccessEmails?: PageAccessEmailModel;
  pageId: string;
};

export function ShareScreenShotLinkDialog({
  pageAccessEmails,
  pageId,
}: ShareScreenShotLinkDialogProps) {
  const [shareWithEmails, updateEmail] = useReducer(
    shareToEmailListReducer,
    pageAccessEmails,
    initializePageAccessEmailState
  );
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const revalidator = useRevalidator();
  const [error, setError] = useState<string>();
  const [open, setOpen] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Set Access
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Access to screenshot</DialogTitle>
          <DialogDescription>
            Set who you can access your screenshot
          </DialogDescription>
        </DialogHeader>
        <Form
          className="flex flex-col gap-y-2.5"
          onSubmit={(event) => {
            console.log("Submitting form");
            event.preventDefault();
            const emailToAdd = z
              .string()
              .email("Please enter valid email")
              .safeParse(emailInputRef.current?.value);

            if (emailToAdd.success) {
              setError("");
              updateEmail({ type: "addNewEmail", email: emailToAdd.data });
              event.currentTarget.reset();
              return;
            }

            const error = emailToAdd.error.errors[0].message;
            setError(error);
          }}
        >
          <Label htmlFor="share-screenshot">Team member email:</Label>

          <Input
            placeholder="team_member@company.com"
            type="email"
            id="share-screenshot"
            ref={emailInputRef}
          />
          <button type="submit" className="hidden">
            Submit
          </button>
          <p className="text-destructive text-sm font-medium">
            {error ? error : null}
          </p>
        </Form>
        <div className="flex flex-wrap gap-1.5 ">
          {new Array(...shareWithEmails).map((email) => {
            return (
              <Button
                key={email}
                variant="outline"
                size="sm"
                className="flex justify-center items-center gap-x-2"
                type="button"
                onClick={() => {
                  updateEmail({ type: "removeEmail", email });
                }}
              >
                <p>{email}</p>
                <div className="relative top-[1px]">
                  <X size="14px" />
                </div>
              </Button>
            );
          })}
        </div>
        <DialogFooter className="flex">
          <Button
            onClick={async () => {
              setIsFormSubmitting(true);
              if (pageAccessEmails) {
                await updatePageAccessEmails(
                  pageAccessEmails.id,
                  shareWithEmails
                );
              } else {
                await createPageAccessEmails(pageId, shareWithEmails);
              }
              revalidator.revalidate();
              setIsFormSubmitting(false);
              setOpen(false);
              navigator.clipboard.writeText(`${window.location.href}`);
              toast({ description: "Url is copied to your clipboard" });
            }}
            type="button"
            className="w-full"
            disabled={isFormSubmitting}
          >
            {isFormSubmitting ? "Sharing access..." : "Share Access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
