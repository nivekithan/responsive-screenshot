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
import { getAvatarForUser, isSlackAppInstalled } from "./lib/storage";
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

  return {
    isSlackAppInstalled: hasSlackAppInstalled,
    userEmail: userRes.user.email,
    avatarUrl: getAvatarForUser({ user: userRes.user }),
  };
}

function useTypedLoaderData() {
  const loaderData = useLoaderData();

  return loaderData as Awaited<ReturnType<typeof loader>>;
}

export function RouteLayout() {
  const { isSlackAppInstalled, userEmail, avatarUrl } = useTypedLoaderData();
  return (
    <>
      <div>
        <Navigation
          showSlackInstallButton={!isSlackAppInstalled}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
        />
        <Outlet />
      </div>
      <Toaster />
      <ScrollRestoration />
    </>
  );
}
