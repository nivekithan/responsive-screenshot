import { NewSiteForm } from "@/components/newSiteForm";
import { ScreenshotImageLink } from "@/components/screenshotImageLink";
import { Heading } from "@/components/ui/heading";
import { generateScreenshotFn } from "@/lib/appwrite";
import { getCurrentUser } from "@/lib/auth";
import { getPages, storePage } from "@/lib/storage";
import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { AppwriteException } from "appwrite";
import * as React from "react";
import {
  ActionFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
} from "react-router-dom";
import { z } from "zod";

export async function loader() {
  const user = await getCurrentUser();

  if (!user.valid) {
    throw redirect("/login");
  }

  const pages = await getPages();

  if (pages instanceof AppwriteException) {
    //TODO: Add proper error handling
    return null;
  }

  return pages;
}

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
    throw redirect("/login");
  }
  const user = userRes.user;

  const formdata = await request.formData();
  const submission = parse(formdata, { schema: NewSiteFormSchema });

  if (!submission.value || submission.intent !== "submit") {
    return { submission };
  }

  const url = submission.value.url;
  const name = submission.value.name;
  const screenshotUrl = await generateScreenshotFn(
    url,
    `${new Date().getTime()}`
  );

  const storePageRes = await storePage({
    name,
    url: screenshotUrl,
    originalUrl: url,
    userId: user.$id,
  });

  if (storePageRes instanceof AppwriteException) {
    submission.error.link = storePageRes.message;
    return { submission };
  }

  return { data: screenshotUrl, submission };
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

  const isPagesEmpty = loaderData === null || loaderData.length === 0;

  return isPagesEmpty ? (
    <CreateNewPage
      formComponent={
        <NewSiteForm formProps={form.props} nameConfig={name} urlConfig={url} />
      }
    />
  ) : (
    <main className="px-6 py-3">
      <Heading className="pb-8 text-xl">All Pages</Heading>
      <div className="flex gap-x-4 flex-wrap gap-y-4">
        {loaderData.map(({ url, id, name, originalUrl }) => {
          return (
            <ScreenshotImageLink
              url={url}
              key={id}
              name={name}
              originalUrl={originalUrl}
              id={id}
            />
          );
        })}
      </div>
    </main>
  );
}

type CreatePageProps = {
  formComponent: React.ReactNode;
};

function CreateNewPage({ formComponent }: CreatePageProps) {
  return <main className="grid place-items-center py-48">{formComponent}</main>;
}
