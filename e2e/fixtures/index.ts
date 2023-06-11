import { Page, test as base } from "@playwright/test";
import { EMPTY_USER } from "../../src/mocks/users/emptyUser";

export const emptyUserTest = base.extend<{ emptyUserPage: Page }>({
  async emptyUserPage({ page }, use) {
    await page.goto("/login");

    await page.getByRole("textbox", { name: "Email:" }).fill(EMPTY_USER.email);
    await page
      .getByRole("textbox", { name: "Password:" })
      .fill(EMPTY_USER.password);
    await page.getByRole("button", { name: "Login" }).click();

    await use(page);
  },
});
