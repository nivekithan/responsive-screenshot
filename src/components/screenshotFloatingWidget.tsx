import { Button } from "./ui/button";
import { Form, useNavigation } from "react-router-dom";
import { z } from "zod";
import { ShareScreenShotLinkDialog } from "./shareScreenShotLinkDialog";
import { PageAccessEmailModel, PageModel } from "@/lib/convert";

export const updateScreenshotVersionSchema = z.object({
  updateScreenshotVersion: z.literal("true"),
});

export type ScreenshotFloatingWidgetProps = {
  page: PageModel;
  pageAccessEmails: PageAccessEmailModel;
};

export function ScreenshotFloatingWidget({
  page,
  pageAccessEmails,
}: ScreenshotFloatingWidgetProps) {
  const navigation = useNavigation();
  const isNewScreenshotGenerating = navigation.state === "submitting";
  return (
    <div className="flex border px-3 py-1.5 rounded-md gap-x-3 text-accent-foreground items-center bg-background ">
      <h3 className="text-md font-semibold leading-none tracking-light ">
        {page.name}
      </h3>
      <h3 className="text-md leading-none font-semibold tracking-extralight ">
        {page.screenName}
      </h3>
      <Button variant="link" size="sm" asChild>
        <a href={page.originalUrl} target="blank">
          Go to screenshot page
        </a>
      </Button>
      <Form method="post">
        <Button
          size="sm"
          variant="outline"
          type="submit"
          name="updateScreenshotVersion"
          value="true"
          disabled={isNewScreenshotGenerating}
        >
          {isNewScreenshotGenerating
            ? "Generating new screenshot..."
            : "Generate new screenshot"}
        </Button>
      </Form>
      <ShareScreenShotLinkDialog
        pageAccessEmails={pageAccessEmails}
        pageId={page.id}
      />
    </div>
  );
}
