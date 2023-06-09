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
            <a href="https://slack.com/oauth/v2/authorize?client_id=4692604248164.5385506506290&scope=incoming-webhook&user_scope=">
              <img
                alt="Add to Slack"
                height="40"
                width="139"
                src="https://platform.slack-edge.com/img/add_to_slack.png"
                srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
              />
            </a>
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
