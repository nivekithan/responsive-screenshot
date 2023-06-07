import { Form } from "react-router-dom";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export type NavigationProps = {
  showSlackInstallButton: boolean;
};

export function Navigation({ showSlackInstallButton }: NavigationProps) {
  return (
    <div>
      <nav className="flex justify-between px-6 py-3 items-center">
        <h1 className="text-lg font-semibold leading-none tracking-tight">
          Responsive Screenshots
        </h1>
        <div className="flex gap-x-3">
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
