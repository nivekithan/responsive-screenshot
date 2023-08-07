import { Form, Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Avatar, AvatarImage } from "./ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";

export type NavigationProps = {
  showSlackInstallButton: boolean;
  userEmail: string;
  avatarUrl: string;
};

export function Navigation({
  showSlackInstallButton,
  userEmail,
  avatarUrl,
}: NavigationProps) {
  console.log({ showSlackInstallButton });
  return (
    <div>
      <nav className="flex justify-between px-6 py-3 items-center">
        <Link
          to="/"
          className="text-lg font-semibold leading-none tracking-tight"
        >
          Responsive Screenshots
        </Link>
        <div className="flex gap-x-3 items-center">
          <div className="flex items-center gap-x-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{userEmail.at(0)}</AvatarFallback>
            </Avatar>
            <h3>{userEmail}</h3>
          </div>
          {showSlackInstallButton ? (
            <Button asChild variant="secondary">
              <Link to="https://slack.com/oauth/v2/authorize?client_id=4692604248164.5385506506290&scope=incoming-webhook&user_scope=">
                Install Slack Bot
              </Link>
            </Button>
          ) : null}

          <Form action="/logout" method="post">
            <Button variant="outline" type="submit">
              Logout
            </Button>
          </Form>
        </div>
      </nav>
      <Separator />
    </div>
  );
}
