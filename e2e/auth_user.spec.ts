import { expect, test } from "@playwright/test";
import { emptyUserTest } from "./fixtures";
import { EMPTY_USER } from "../src/mocks/users/emptyUser";

emptyUserTest("Visible Email", async ({ emptyUserPage }) => {
  await emptyUserPage.goto("/");

  const profileEmail = emptyUserPage.getByRole("heading", {
    name: EMPTY_USER.email,
  });

  await expect(profileEmail).toBeVisible();
});

emptyUserTest("Visible Install slack bot button", async ({ emptyUserPage }) => {
  await emptyUserPage.goto("/");

  await expect(
    emptyUserPage.getByRole("link", { name: "Install Slack Bot" })
  ).toBeVisible();
});

emptyUserTest("Visible New site form", async ({ emptyUserPage }) => {
  await emptyUserPage.goto("/");

  await expect(
    emptyUserPage.getByRole("textbox", { name: "Name:" })
  ).toBeVisible();

  await expect(
    emptyUserPage.getByRole("textbox", { name: "Url of page:" })
  ).toBeVisible();

  await expect(
    emptyUserPage.getByRole("button", { name: "Generate Screenshot" })
  ).toBeVisible();
});
