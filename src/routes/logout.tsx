import { logoutUser } from "@/lib/auth";
import { redirect } from "react-router-dom";

export async function action() {
  await logoutUser();
  return redirect("/login");
}
