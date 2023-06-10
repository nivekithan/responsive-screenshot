import { test, expect } from "@playwright/test";

test("Redirects to login page", async ({ page }) => {
  await page.goto("/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveURL(/.*login/);
});

// test("get started link", async ({ page }) => {
//   await page.goto("http://example.com/");

//   // Click the get started link.
//   await page.getByRole("link", { name: "More information.." }).click();

//   // Expects the URL to contain intro.
//   await expect(page).toHaveURL(/.*reserved/);
// });
