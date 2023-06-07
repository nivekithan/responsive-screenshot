import { RealTimeComments } from "@/components/realtimeComments";
import {
  ScreenshotFloatingWidget,
  updateScreenshotVersionSchema,
} from "@/components/screenshotFloatingWidget";
import {
  ScreenshotFeedbackForm,
  addCommentSchema,
  updateApprovalStatusSchema,
} from "@/components/screeshotFeedbackForm";
import { generateScreenshotFn } from "@/lib/appwrite";
import { getCurrentUser } from "@/lib/auth";
import {
  getApprovalStatus,
  getPageAccessEmails,
  setApprovalStatus,
  storeComment,
  updatePageUrl,
} from "@/lib/storage";
import { getPage } from "@/lib/storage";
import { parse } from "@conform-to/zod";
import { useCallback, useRef } from "react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
  useLoaderData,
} from "react-router-dom";
import { z } from "zod";

const ParamsSchema = z.object({ pageId: z.string() });

export async function loader({ params }: LoaderFunctionArgs) {
  const user = await getCurrentUser();

  if (!user.valid) {
    throw redirect("/login", { status: 400 });
  }

  const parsedParams = ParamsSchema.parse(params);
  const pageId = parsedParams.pageId;

  const pagePromise = getPage({ id: pageId });
  const statusPromise = getApprovalStatus({ pageId });
  const pageAccessEmailsPromise = getPageAccessEmails(pageId);

  const [page, status, pageAccessEmails] = await Promise.all([
    pagePromise,
    statusPromise,
    pageAccessEmailsPromise,
  ]);

  if (!page.valid) {
    // TODO: DO Error handling
    throw redirect("/");
  }

  return { page: page.page, status: status, pageAccessEmails };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userRes = await getCurrentUser();
  const parsedParams = ParamsSchema.parse(params);

  if (!userRes.valid) {
    throw redirect("/login", { status: 400 });
  }

  const formData = await request.formData();

  const submission = parse(formData, {
    schema: z.union([
      updateApprovalStatusSchema,
      addCommentSchema,
      updateScreenshotVersionSchema,
    ]),
  });

  if (!submission.value || submission.intent !== "submit") {
    return submission;
  }

  if ("status" in submission.value) {
    await setApprovalStatus({
      pageId: parsedParams.pageId,
      approvalStatus: submission.value.status,
      userId: userRes.user.$id,
    });
    return submission;
  } else if ("comment" in submission.value) {
    await storeComment({
      pageId: parsedParams.pageId,
      comment: submission.value.comment,
      userId: userRes.user.$id,
    });
    return submission;
  } else if ("updateScreenshotVersion" in submission.value) {
    const pageRes = await getPage({ id: parsedParams.pageId });

    if (!pageRes.valid) {
      // TODO: Proper error handling
      return submission;
    }

    const page = pageRes.page;

    const url = await generateScreenshotFn(
      page.originalUrl,
      `${new Date().getTime()}`
    );

    await updatePageUrl({ pageId: parsedParams.pageId, url });

    return submission;
  }
}

function useTypedLoader() {
  const loaderData = useLoaderData();

  return loaderData as Awaited<ReturnType<typeof loader>>;
}

export function ScreenshotPage() {
  const { page, status, pageAccessEmails } = useTypedLoader();
  const pageCommentContainer = useRef<HTMLDivElement | null>(null);

  const scrollCommentToBottom = useCallback(() => {
    if (pageCommentContainer.current) {
      pageCommentContainer.current.scrollTo({
        top: pageCommentContainer.current.scrollHeight,
      });
    }
  }, []);

  return (
    <main className="flex bg-background">
      <div className="grid place-items-center max-h-screen-minus-nav overflow-y-auto flex-grow px-10 bg-gray-300 bg-opacity-20 ">
        <img alt={`${page.name} of ${page.url}`} src={page.url} />
        <div className="fixed bottom-5 ">
          <ScreenshotFloatingWidget
            page={page}
            pageAccessEmails={pageAccessEmails}
          />
        </div>
      </div>
      <div className="w-1/3 h-screen-minus-nav relative border-l px-2 overflow-y-auto">
        <div
          className="h-screen-minus-nav-2 overflow-y-auto"
          ref={pageCommentContainer}
        >
          <RealTimeComments
            pageId={page.id}
            scrollToBottom={scrollCommentToBottom}
          />
        </div>
        <ScreenshotFeedbackForm defaultStatus={status?.status} />
      </div>
    </main>
  );
}
