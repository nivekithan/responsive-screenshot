import { RealTimeIssue, resolveIssueSchema } from "@/components/realtimeIssues";
import {
  ScreenshotFloatingWidget,
  updateScreenshotVersionSchema,
} from "@/components/screenshotFloatingWidget";
import {
  ScreenshotFeedbackForm,
  addIssueSchema,
} from "@/components/screeshotFeedbackForm";
import { generateScreenshotFn } from "@/lib/appwrite";
import { getCurrentUser } from "@/lib/auth";
import {
  deleteIssue,
  getPageAccessEmails,
  storeIssue,
  updatePageUrl,
} from "@/lib/storage";
import { getPage } from "@/lib/storage";
import { getLoginUrl } from "@/lib/utils";
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

export async function loader({ params, request }: LoaderFunctionArgs) {
  const userRes = await getCurrentUser();

  if (!userRes.valid) {
    const redirectUrl = getLoginUrl(request.url);
    throw redirect(redirectUrl.toString());
  }

  const parsedParams = ParamsSchema.parse(params);
  const pageId = parsedParams.pageId;

  const pagePromise = getPage({ id: pageId });
  const pageAccessEmailsPromise = getPageAccessEmails(pageId);

  const [pageRes, pageAccessEmails] = await Promise.all([
    pagePromise,
    pageAccessEmailsPromise,
  ]);

  if (!pageRes.valid) {
    // TODO: DO Error handling
    throw redirect("/");
  }

  if (!pageAccessEmails.valid) {
    // TODO: Do Error handling
    throw redirect("/");
  }

  const isPageOwner = pageRes.page.createdBy === userRes.user.$id;

  return {
    page: pageRes.page,
    pageAccessEmails: pageAccessEmails.pageEmailAccess,
    isPageOwner,
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userRes = await getCurrentUser();
  const parsedParams = ParamsSchema.parse(params);

  if (!userRes.valid) {
    const redirectUrl = getLoginUrl(request.url);
    throw redirect(redirectUrl.toString());
  }

  const formData = await request.formData();

  const submission = parse(formData, {
    schema: z.union([
      addIssueSchema,
      updateScreenshotVersionSchema,
      resolveIssueSchema,
    ]),
  });

  if (!submission.value || submission.intent !== "submit") {
    return submission;
  }

  if ("issue" in submission.value) {
    await storeIssue({
      pageId: parsedParams.pageId,
      issue: submission.value.issue,
      userId: userRes.user.$id,
      userEmail: userRes.user.email,
    });
    return submission;
  } else if ("updateScreenshotVersion" in submission.value) {
    const pageRes = await getPage({ id: parsedParams.pageId });

    if (!pageRes.valid) {
      // TODO: Proper error handling
      return submission;
    }

    const page = pageRes.page;

    const screenshots = await generateScreenshotFn(
      page.originalUrl,
      `${new Date().getTime()}`
    );

    const currentPageScreenshot = screenshots.find(
      (v) => v.name === page.screenName
    );

    if (!currentPageScreenshot) {
      throw new Error("unreachable");
    }

    await updatePageUrl({ pageId: page.id, url: currentPageScreenshot?.url });

    return submission;
  } else if ("resolveIssue" in submission.value) {
    const resolveIssueId = submission.value.resolveIssue;
    await deleteIssue({ issueId: resolveIssueId });

    return submission;
  }
}

function useTypedLoader() {
  const loaderData = useLoaderData();

  return loaderData as Awaited<ReturnType<typeof loader>>;
}

export function ScreenshotPage() {
  const { page, pageAccessEmails, isPageOwner } = useTypedLoader();
  const pageIssueContainer = useRef<HTMLDivElement | null>(null);

  const scrollToBottomIssue = useCallback(() => {
    if (pageIssueContainer.current) {
      pageIssueContainer.current.scrollTo({
        top: pageIssueContainer.current.scrollHeight,
      });
    }
  }, []);

  return (
    <main className="flex bg-background">
      <div className="grid place-items-center max-h-screen-minus-nav overflow-y-auto flex-grow px-10 bg-gray-300 bg-opacity-20 ">
        <img
          alt={`${page.name} of ${page.url}`}
          src={page.url}
          key={page.url}
        />
        <div className="fixed bottom-5 ">
          <ScreenshotFloatingWidget
            page={page}
            pageAccessEmails={pageAccessEmails}
            isOwner={isPageOwner}
          />
        </div>
      </div>
      <div className="flex-grow-0 flex-shrink-0 basis-1/4 h-screen-minus-nav relative border-l px-2 overflow-y-auto">
        <div
          className="h-screen-minus-nav-2 overflow-y-auto"
          ref={pageIssueContainer}
        >
          <RealTimeIssue
            pageId={page.id}
            scrollToBottom={scrollToBottomIssue}
          />
        </div>
        <ScreenshotFeedbackForm />
      </div>
    </main>
  );
}
