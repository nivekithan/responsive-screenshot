import { logoutUser } from "@/lib/auth";
import { monitorActionFn } from "@/lib/utils";
import { redirect } from "react-router-dom";

export const action = monitorActionFn("logout", async () => {
  await logoutUser();
  return redirect("/login");
});
