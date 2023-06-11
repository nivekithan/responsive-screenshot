import { slackInstallApp } from "@/lib/appwrite";
import { getCurrentUser } from "@/lib/auth";
import { monitorLoaderFn } from "@/lib/utils";
import { LoaderFunctionArgs, json, redirect } from "react-router-dom";

export const loader = monitorLoaderFn(
  "slack.oauth.redirect",
  async ({ request }: LoaderFunctionArgs) => {
    const userRes = await getCurrentUser();

    if (!userRes.valid) {
      throw redirect("/login");
    }

    const url = new URL(request.url);

    const queryParams = url.searchParams;
    const code = queryParams.get("code");

    if (!code) {
      throw redirect("/");
    }

    const { success } = await slackInstallApp({ code });

    if (success) {
      throw redirect("/");
    }

    return json("ok");
  }
);
