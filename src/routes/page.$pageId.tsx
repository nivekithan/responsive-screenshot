import {
  ScreenshotFeedbackForm,
  addCommentSchema,
  updateApprovalStatusSchema,
} from "@/components/screeshotFeedbackForm";
import { getCurrentUser } from "@/lib/auth";
import {
  getApprovalStatus,
  setApprovalStatus,
  storeComment,
} from "@/lib/storage";
import { getPage } from "@/lib/storage";
import { parse } from "@conform-to/zod";
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

  const [page, status] = await Promise.all([pagePromise, statusPromise]);

  if (!page.valid) {
    // TODO: DO Error handling
    throw redirect("/");
  }

  return { page: page.page, status: status };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await getCurrentUser();
  const parsedParams = ParamsSchema.parse(params);

  if (!user.valid) {
    throw redirect("/login", { status: 400 });
  }

  const formData = await request.formData();

  const submission = parse(formData, {
    schema: z.union([updateApprovalStatusSchema, addCommentSchema]),
  });

  if (!submission.value || submission.intent !== "submit") {
    return submission;
  }

  if ("status" in submission.value) {
    await setApprovalStatus({
      pageId: parsedParams.pageId,
      approvalStatus: submission.value.status,
    });
    return submission;
  } else {
    await storeComment({
      pageId: parsedParams.pageId,
      comment: submission.value.comment,
    });
    return submission;
  }
}

function useTypedLoader() {
  const loaderData = useLoaderData();

  return loaderData as Awaited<ReturnType<typeof loader>>;
}

export function ScreenshotPage() {
  const { page, status } = useTypedLoader();

  return (
    <main className="flex">
      <div className="grid place-items-center max-h-screen-minus-nav overflow-y-auto flex-grow px-6">
        {/* <img alt={`${page.name} of ${page.url}`} src={page.url} /> */}
      </div>
      <div className="w-1/3 h-screen-minus-nav relative border-l px-2 overflow-y-auto">
        <div className="h-screen-minus-nav-2 overflow-y-auto"></div>
        <ScreenshotFeedbackForm defaultStatus={status?.status} />
      </div>
    </main>
  );
}
