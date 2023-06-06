import { Button } from "./ui/button";
import { Form } from "react-router-dom";
import { z } from "zod";
import { PageModel } from "@/lib/storage";
import { ShareScreenShotLinkDialog } from "./shareScreenShotLinkDialog";

export const updateScreenshotVersionSchema = z.object({
  updateScreenshotVersion: z.literal("true"),
});

export type ScreenshotFloatingWidgetProps = { page: PageModel };

export function ScreenshotFloatingWidget({
  page,
}: ScreenshotFloatingWidgetProps) {
  return (
    <div className="flex border px-3 py-1.5 rounded-md gap-x-3 text-accent-foreground items-center bg-background ">
      <h3 className="text-md font-semibold leading-none tracking-light ">
        {page.name}
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
        >
          Take screenshot again
        </Button>
      </Form>
      <ShareScreenShotLinkDialog />
    </div>
  );
}
