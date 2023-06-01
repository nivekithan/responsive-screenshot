import { Outlet, ScrollRestoration, redirect } from "react-router-dom";
import { getCurrentUser } from "./lib/auth";
import { Navigation } from "./components/navigation";

export async function loader() {
  const user = await getCurrentUser();

  if (!user.valid) {
    throw redirect("/login");
  }

  return null;
}

export function RouteLayout() {
  return (
    <>
      <div>
        <Navigation />
        <Outlet />
      </div>
      <ScrollRestoration />
    </>
  );
}
