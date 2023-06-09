import { Link, Form, FormProps, useNavigation } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { LabeledInput } from "./ui/labeledInput";
import { getLoginUrl, getSignUpUrl } from "@/lib/utils";

export type AuthFormProps = {
  authAction: "login" | "signUp";

  emailName: string;
  emailError?: string;

  passwordName: string;
  passwordError?: string;

  formProps: FormProps;

  redirectTo?: string;
};

export function AuthForm({
  emailName,
  formProps,
  passwordName,
  emailError,
  passwordError,
  authAction,
  redirectTo,
}: AuthFormProps) {
  return (
    <Card className="w-[400px]">
      {authAction === "login" ? (
        <LogInCardDescription redirectTo={redirectTo} />
      ) : (
        <SignUpCardDescription redirectTo={redirectTo} />
      )}
      <Form method="post" {...formProps}>
        <CardContent>
          <LabeledInput
            id="auth-email"
            label="Email:"
            name={emailName}
            placeholder="Your email id"
            type="email"
            error={emailError}
          />
          <LabeledInput
            id="auth-password"
            label="Password:"
            name={passwordName}
            placeholder="Enter your password"
            type="password"
            error={passwordError}
          />
        </CardContent>
        <CardFooter>
          {authAction === "login" ? <LoginButton /> : <SignUpButton />}
        </CardFooter>
      </Form>
    </Card>
  );
}

const SignUpCardDescription = ({ redirectTo }: { redirectTo?: string }) => {
  const loginUrl = redirectTo ? getLoginUrl(redirectTo).toString() : "/login";
  return (
    <CardHeader>
      <CardTitle>Sign up to Responsive Screenshot</CardTitle>
      <CardDescription>
        Already have an account ? Then{" "}
        <Link to={loginUrl} className="hover:underline text-accent-foreground">
          Log In
        </Link>
      </CardDescription>
    </CardHeader>
  );
};

const LogInCardDescription = ({ redirectTo }: { redirectTo?: string }) => {
  const signUpUrl = redirectTo
    ? getSignUpUrl(redirectTo).toString()
    : "/signup";
  return (
    <CardHeader>
      <CardTitle>Login to Responsive Screenshot</CardTitle>
      <CardDescription>
        Don't have an account ? Then create new one by{" "}
        <Link to={signUpUrl} className="hover:underline text-accent-foreground">
          Sign Up
        </Link>
      </CardDescription>
    </CardHeader>
  );
};

function LoginButton() {
  const navigation = useNavigation();
  const isLoggingIn = navigation.state === "submitting";

  return (
    <Button type="submit" className="w-full" disabled={isLoggingIn}>
      {isLoggingIn ? "Logging in..." : "Login"}
    </Button>
  );
}

function SignUpButton() {
  const navigation = useNavigation();
  const isSigingUp = navigation.state === "submitting";

  return (
    <Button type="submit" className="w-full" disabled={isSigingUp}>
      {isSigingUp ? "Signing up..." : "Sign up"}
    </Button>
  );
}
