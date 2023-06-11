import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
  useActionData,
  useLoaderData,
} from "react-router-dom";
import { z } from "zod";
import { parse } from "@conform-to/zod";
import { useForm } from "@conform-to/react";
import { getCurrentUser, loginUser, signUpUser } from "@/lib/auth";
import { AuthForm } from "@/components/authForm";
import { monitorLoaderFn } from "@/lib/utils";

export const loader = monitorLoaderFn(
  "signup",
  async ({ request }: LoaderFunctionArgs) => {
    const user = await getCurrentUser();
    const redirectTo = new URL(request.url).searchParams.get("redirectTo");

    if (user.valid) {
      throw redirect("/");
    }

    return redirectTo;
  }
);

const SignUpActionSchema = z.object({
  email: z.string().nonempty("Email is Required").email("Email is invalid"),
  password: z
    .string()
    .nonempty("Password is Required")
    .min(8, "Password must be atleast 8 letters"),
});

export async function action({ request }: ActionFunctionArgs) {
  const formdata = await request.formData();
  const submission = parse(formdata, { schema: SignUpActionSchema });

  if (!submission.value || submission.intent !== "submit") {
    return submission;
  }

  const user = await signUpUser(
    submission.value.email,
    submission.value.password
  );

  if (user.valid) {
    const session = await loginUser(
      submission.value.email,
      submission.value.password
    );

    if (session.valid) {
      throw redirect("/");
    }

    const invalidSession = session;

    submission.error.password =
      "reason" in invalidSession
        ? invalidSession.reason
        : invalidSession.message;

    return submission;
  }

  const invalidUser = user;

  submission.error.password =
    "reason" in invalidUser ? invalidUser.reason : invalidUser.message;

  return submission;
}

function useTypedActionData() {
  const submission = useActionData();

  return submission as Awaited<ReturnType<typeof action>> | undefined;
}

function useTypedLoaderData() {
  const loadertData = useLoaderData();

  return loadertData as Awaited<ReturnType<typeof loader>>;
}

export function SignUpPage() {
  const redirectTo = useTypedLoaderData();
  const lastSubmission = useTypedActionData();
  const [form, { email, password }] = useForm({
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema: SignUpActionSchema });
    },
  });

  const formProps = form.props;

  return (
    <main className="grid min-h-screen place-items-center">
      <AuthForm
        authAction="signUp"
        emailName={email.name}
        passwordError={password.error}
        formProps={formProps}
        passwordName={password.name}
        emailError={email.error}
        redirectTo={redirectTo || undefined}
      />
    </main>
  );
}
