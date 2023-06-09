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

export type AuthFormProps = {
  authAction: "login" | "signUp";

  emailName: string;
  emailError?: string;

  passwordName: string;
  passwordError?: string;

  formProps: FormProps;
};

export function AuthForm({
  emailName,
  formProps,
  passwordName,
  emailError,
  passwordError,
  authAction,
}: AuthFormProps) {
  return (
    <Card className="w-[400px]">
      {authAction === "login" ? (
        <LogInCardDescription />
      ) : (
        <SignUpCardDescription />
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

const SignUpCardDescription = () => {
  return (
    <CardHeader>
      <CardTitle>Sign up to Responsive Screenshot</CardTitle>
      <CardDescription>
        Already have an account ? Then{" "}
        <Link to="/login" className="hover:underline text-accent-foreground">
          Log In
        </Link>
      </CardDescription>
    </CardHeader>
  );
};

const LogInCardDescription = () => {
  return (
    <CardHeader>
      <CardTitle>Login to Responsive Screenshot</CardTitle>
      <CardDescription>
        Don't have an account ? Then create new one by{" "}
        <Link to="/signUp" className="hover:underline text-accent-foreground">
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
