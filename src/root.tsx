import {
  LoaderFunctionArgs,
  Outlet,
  ScrollRestoration,
  redirect,
  useLoaderData,
} from "react-router-dom";
import { getCurrentUser } from "./lib/auth";
import { Navigation } from "./components/navigation";
import { Toaster } from "./components/ui/toaster";
import { isSlackAppInstalled } from "./lib/storage";
import { getLoginUrl } from "./lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  const userRes = await getCurrentUser();

  if (!userRes.valid) {
    const redirectUrl = getLoginUrl(request.url);
    throw redirect(redirectUrl.toString());
  }

  const hasSlackAppInstalled = await isSlackAppInstalled({
    userId: userRes.user.$id,
  });

  return { isSlackAppInstalled: hasSlackAppInstalled };
}

function useTypedLoaderData() {
  const loaderData = useLoaderData();

  return loaderData as Awaited<ReturnType<typeof loader>>;
}

export function RouteLayout() {
  const { isSlackAppInstalled } = useTypedLoaderData();
  return (
    <>
      <div>
        <Navigation showSlackInstallButton={!isSlackAppInstalled} />
        <Outlet />
      </div>
      <Toaster />
      <ScrollRestoration />
    </>
  );
}
