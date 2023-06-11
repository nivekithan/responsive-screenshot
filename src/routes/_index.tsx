import { NewSiteForm } from "@/components/newSiteForm";
import { ScreenshotImageLink } from "@/components/screenshotImageLink";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { generateScreenshotFn } from "@/lib/appwrite";
import { getCurrentUser } from "@/lib/auth";
import { PageModel } from "@/lib/convert";
import { getPages, isPageNameUnique, storePage } from "@/lib/storage";
import { getErrorMessage, getLoginUrl, monitorLoaderFn } from "@/lib/utils";
import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import * as React from "react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
} from "react-router-dom";
import { z } from "zod";

export const loader = monitorLoaderFn(
  "root_index",
  async ({ request }: LoaderFunctionArgs) => {
    const user = await getCurrentUser();

    if (!user.valid) {
      const redirectUrl = getLoginUrl(request.url);
      throw redirect(redirectUrl.toString());
    }

    const pages = await getPages();

    if (!pages.valid) {
      //TODO: Add proper error handling
      return null;
    }
    return pages.pages;
  }
);

const NewSiteFormSchema = z.object({
  url: z
    .string()
    .nonempty("It is required to provide a url")
    .url("Provide valid url"),
  name: z
    .string()
    .nonempty("It is required to provide a name")
    .max(250, "Maximum length of name can be only 250"),
});

export async function action({ request }: ActionFunctionArgs) {
  const userRes = await getCurrentUser();

  if (!userRes.valid) {
    const redirectUrl = getLoginUrl(request.url);
    throw redirect(redirectUrl.toString());
  }
  const user = userRes.user;

  const formdata = await request.formData();
  const submission = parse(formdata, { schema: NewSiteFormSchema });

  if (!submission.value || submission.intent !== "submit") {
    return { submission };
  }

  const url = submission.value.url;
  const name = submission.value.name;

  const isNameUnique = await isPageNameUnique(name);

  if (!isNameUnique) {
    submission.error.name =
      "Name should be unique. Please Provide another name";
    return { submission };
  }

  const screenshotUrls = await generateScreenshotFn(
    url,
    `${new Date().getTime()}`
  );

  const storePageRes = await Promise.all(
    screenshotUrls.map((screenshots) => {
      return storePage({
        name,
        url: screenshots.url,
        originalUrl: url,
        userId: user.$id,
        height: screenshots.height,
        screenName: screenshots.name,
        width: screenshots.width,
      });
    })
  );

  const firstError = storePageRes.find((v) => !v.valid);

  if (firstError && !firstError.valid) {
    submission.error.link = getErrorMessage(firstError);
    return { submission };
  }

  return { data: screenshotUrls, submission };
}

function useTypedLoaderData() {
  const loaderData = useLoaderData();

  return loaderData as Awaited<ReturnType<typeof loader>>;
}

function useTypedActionData() {
  const actionData = useActionData();

  return actionData as Awaited<ReturnType<typeof action>> | undefined;
}

export function RootIndexPage() {
  const loaderData = useTypedLoaderData();
  const actionData = useTypedActionData();

  const [form, { url, name }] = useForm({
    lastSubmission: actionData?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: NewSiteFormSchema });
    },
  });

  const groupedPages = React.useMemo(() => {
    if (!loaderData) {
      return null;
    }

    const groups: Array<{ name: string; pages: Array<PageModel> }> = [];

    loaderData.forEach((page) => {
      const groupItem = groups.find((v) => v.name === page.name);

      if (groupItem) {
        groupItem.pages.push(page);
      } else {
        groups.push({ name: page.name, pages: [page] });
      }
    });

    return groups;
  }, [loaderData]);

  return (
    <div>
      <CreateNewPage
        formComponent={
          <NewSiteForm
            formProps={form.props}
            nameConfig={name}
            urlConfig={url}
          />
        }
      />
      <Separator />
      {groupedPages
        ? groupedPages.map(({ name, pages }) => {
            return (
              <section className="px-6 py-3" key={pages[0].id}>
                <Heading className="pb-8 text-xl">{name}</Heading>
                <div className="flex gap-x-4 flex-wrap gap-y-4">
                  {pages.map((page) => {
                    return (
                      <ScreenshotImageLink
                        screenshotPage={page}
                        key={page.id}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })
        : null}
    </div>
  );
}

type CreatePageProps = {
  formComponent: React.ReactNode;
};

function CreateNewPage({ formComponent }: CreatePageProps) {
  return <main className="py-12 grid place-items-center">{formComponent}</main>;
}
