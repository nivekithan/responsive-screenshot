import { expect, test } from "@playwright/test";
import { EMPTY_USER } from "../src/mocks/users/emptyUser";

test("Login in and Logout", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("textbox", { name: "Email:" }).fill(EMPTY_USER.email);
  await page
    .getByRole("textbox", { name: "Password:" })
    .fill(EMPTY_USER.password);
  await page.getByRole("button", { name: "Login" }).click();

  const logoutButton = page.getByRole("button", { name: "Logout" });
  await expect(logoutButton).toBeVisible();

  // Testing Logout
  await logoutButton.click();

  await expect(page).toHaveURL("http://localhost:5173/login");
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
});
