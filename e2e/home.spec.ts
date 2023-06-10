import { test, expect } from "@playwright/test";

test("Redirects to login page", async ({ page }) => {
  await page.goto("/");

  const expectedUrl = new URL(`http://localhost:5173/login`);

  expectedUrl.searchParams.set("redirectTo", "http://localhost:5173/");

  await expect(page).toHaveURL(expectedUrl.toString());
});

test("Login page contains links to signup page", async ({ page }) => {
  await page.goto("/login");

  const signUpLinkLocator = page.getByRole("link", { name: "Sign up" });

  await expect(signUpLinkLocator).toBeVisible();

  await signUpLinkLocator.click();

  await expect(page).toHaveURL(/http:\/\/localhost:5173\/signup/);
});

test("RedirectTo searchparam should be persisted when going from login page to signup page", async ({
  page,
}) => {
  await page.goto("/");

  const signUpLinkLocator = page.getByRole("link", { name: "Sign up" });

  await signUpLinkLocator.click();

  const expectedUrl = new URL(`http://localhost:5173/signup`);
  expectedUrl.searchParams.set("redirectTo", "http://localhost:5173/");

  await expect(page).toHaveURL(expectedUrl.toString());
});

test("Signup page contains links to login page", async ({ page }) => {
  await page.goto("/signup");

  const loginLinkLocator = page.getByRole("link", { name: "Log In" });

  await expect(loginLinkLocator).toBeVisible();

  await loginLinkLocator.click();

  await expect(page).toHaveURL(/http:\/\/localhost:5173\/login/);
});

test("RedirectTo searchparam should be persisted when going from signup page to login page", async ({
  page,
}) => {
  await page.goto("/");

  const signUpLinkLocator = page.getByRole("link", { name: "Sign up" });

  await signUpLinkLocator.click();

  const loginLinkLocator = page.getByRole("link", { name: "Log In" });

  await loginLinkLocator.click();

  const expectedUrl = new URL(`http://localhost:5173/login`);
  expectedUrl.searchParams.set("redirectTo", "http://localhost:5173/");

  await expect(page).toHaveURL(expectedUrl.toString());
});
