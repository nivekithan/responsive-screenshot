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
import { useReducer, useRef } from "react";
import { z } from "zod";
import { X } from "lucide-react";
import { useState } from "react";
import { useToast } from "./ui/use-toast";
import { PageAccessEmailModel } from "@/lib/convert";
import { createPageAccessEmails, updatePageAccessEmails } from "@/lib/storage";

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

function getLinkForSharing() {
  const url = new URL(window.location.href);

  url.searchParams.set("share", `true`);

  return url.toString();
}

export type ShareScreenShotLinkDialogProps = {
  pageAccessEmails?: PageAccessEmailModel;
  pageId: string;
};

export function ShareScreenShotLinkDialog({
  pageAccessEmails,
  pageId,
}: ShareScreenShotLinkDialogProps) {
  const { toast } = useToast();
  const [shareWithEmails, updateEmail] = useReducer(
    shareToEmailListReducer,
    pageAccessEmails,
    initializePageAccessEmailState
  );
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const [linkToShare, setLinkToShare] = useState("");
  const revalidator = useRevalidator();

  const isLinkAvaliableToShare = !!linkToShare;

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="outline" size="sm">
          Share Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share screenshot</DialogTitle>
          <DialogDescription>Get feedback from your team</DialogDescription>
        </DialogHeader>
        <Form
          className="flex flex-col gap-y-2.5"
          onSubmit={(event) => {
            console.log("Submitting form");
            event.preventDefault();
            const emailToAdd = z
              .string()
              .email("Please enter valid email")
              .parse(emailInputRef.current?.value);
            updateEmail({ type: "addNewEmail", email: emailToAdd });
            setLinkToShare("");
            event.currentTarget.reset();
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
          {/* <p className="text-destructive text-sm font-medium">
              {error ? error : null}
            </p> */}
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
                  setLinkToShare("");
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
        <DialogFooter className="flex sm:justify-between">
          <Button
            variant="secondary"
            disabled={!isLinkAvaliableToShare}
            onClick={async () => {
              await navigator.clipboard.writeText(linkToShare);
              toast({ description: "Link has been copied" });
            }}
            type="button"
          >
            Copy Link
          </Button>
          <Button
            onClick={async () => {
              if (pageAccessEmails) {
                await updatePageAccessEmails(
                  pageAccessEmails.id,
                  shareWithEmails
                );
              } else {
                await createPageAccessEmails(pageId, shareWithEmails);
              }
              revalidator.revalidate();
              toast({ description: "Link has been generated" });
              const link = getLinkForSharing();
              setLinkToShare(link);
            }}
            type="button"
          >
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
