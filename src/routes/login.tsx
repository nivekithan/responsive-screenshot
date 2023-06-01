import { ActionFunctionArgs, redirect, useActionData } from "react-router-dom";
import { z } from "zod";
import { parse } from "@conform-to/zod";
import { useForm } from "@conform-to/react";
import { getCurrentUser, loginUser } from "@/lib/auth";
import { AuthForm } from "@/components/authForm";

export async function loader() {
  const user = await getCurrentUser();

  if (user.valid) {
    throw redirect("/");
  }

  return null;
}

const LoginActionSchema = z.object({
  email: z.string().nonempty("Email is Required").email("Email is invalid"),
  password: z
    .string()
    .nonempty("Password is Required")
    .min(8, "Password must be atleast 8 letters"),
});

export async function action({ request }: ActionFunctionArgs) {
  const formdata = await request.formData();
  const submission = parse(formdata, { schema: LoginActionSchema });

  if (!submission.value || submission.intent !== "submit") {
    return submission;
  }

  const session = await loginUser(
    submission.value.email,
    submission.value.password
  );

  if (session.valid) {
    throw redirect("/");
  }

  const invalidSession = session;

  if ("reason" in invalidSession) {
    submission.error.password = invalidSession.reason;
    return submission;
  }

  submission.error.password = invalidSession.message;

  return submission;
}

export function useTypedActionData() {
  const submission = useActionData();

  return submission as Awaited<ReturnType<typeof action>>;
}

export function LoginPage() {
  const lastSubmission = useTypedActionData();
  const [form, { email, password }] = useForm({
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema: LoginActionSchema });
    },
  });

  const formProps = form.props;

  return (
    <main className="grid min-h-screen place-items-center">
      <AuthForm
        authAction="login"
        emailName={email.name}
        passwordError={password.error}
        formProps={formProps}
        passwordName={password.name}
        emailError={email.error}
      />
    </main>
  );
}
