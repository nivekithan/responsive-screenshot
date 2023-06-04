import {
  ScreenshotFeedbackForm,
  updateApprovalStatusSchema,
} from "@/components/screeshotFeedbackForm";
import { getCurrentUser } from "@/lib/auth";
import { setApprovalStatus } from "@/lib/storage";
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

  const page = await getPage({ id: pageId });

  if (!page.valid) {
    // TODO: DO Error handling
    throw redirect("/");
  }

  return page.page;
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await getCurrentUser();
  const parsedParams = ParamsSchema.parse(params);

  if (!user.valid) {
    throw redirect("/login", { status: 400 });
  }

  const formData = await request.formData();

  const submission = parse(formData, { schema: updateApprovalStatusSchema });

  if (!submission.value || submission.intent !== "submit") {
    return submission;
  }

  await setApprovalStatus({
    pageId: parsedParams.pageId,
    approvalStatus: submission.value.status,
  });

  return null;
}

function useTypedLoader() {
  const loaderData = useLoaderData();

  return loaderData as Awaited<ReturnType<typeof loader>>;
}

export function ScreenshotPage() {
  const page = useTypedLoader();

  return (
    <main className="flex">
      <div className="grid place-items-center max-h-screen-minus-nav overflow-y-auto flex-grow px-6">
        {/* <img alt={`${page.name} of ${page.url}`} src={page.url} /> */}
      </div>
      <div className="w-1/3 h-screen-minus-nav relative border-l px-2 overflow-y-auto">
        <div className="h-screen-minus-nav-2 overflow-y-auto"></div>
        <ScreenshotFeedbackForm />
      </div>
    </main>
  );
}
