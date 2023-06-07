import { slackInstallApp } from "@/lib/appwrite";
import { getCurrentUser } from "@/lib/auth";
import { LoaderFunctionArgs, json, redirect } from "react-router-dom";

export async function loader({ request }: LoaderFunctionArgs) {
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
