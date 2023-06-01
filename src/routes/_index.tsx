import { NewSiteForm } from "@/components/newSiteForm";
import { getCurrentUser } from "@/lib/auth";
import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { ActionFunctionArgs, redirect, useActionData } from "react-router-dom";
import { z } from "zod";

export async function loader() {
  const user = await getCurrentUser();

  if (!user.valid) {
    throw redirect("/login");
  }

  return null;
}

const NewSiteFormSchema = z.object({
  link: z
    .string()
    .nonempty("It is required to provide a url")
    .url("Provide valid url"),
});

export async function action({ request }: ActionFunctionArgs) {
  const formdata = await request.formData();
  const submission = parse(formdata, { schema: NewSiteFormSchema });

  if (!submission.value || submission.intent !== "submit") {
    return submission;
  }

  const url = submission.value.link;

  return submission;
}

function useTypedActionData() {
  const actionData = useActionData();

  return actionData as Awaited<ReturnType<typeof action>>;
}
export function RootIndexPage() {
  const lastSubmission = useTypedActionData();
  const [form, { link }] = useForm({
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema: NewSiteFormSchema });
    },
  });

  return (
    <main className="grid place-items-center py-56">
      <NewSiteForm
        id="new-site"
        label="Url of site:"
        name={link.name}
        error={link.error}
        formProps={form.props}
      />
    </main>
  );
}
