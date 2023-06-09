import {
  Account,
  Avatars,
  Client,
  Databases,
  Functions,
  Models,
} from "appwrite";
import { z } from "zod";
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1") // Your API Endpoint
  .setProject("pdf"); // Your project ID

export const account = new Account(client);

export const databases = new Databases(client);

export const avatars = new Avatars(client);

const functions = new Functions(client);

export async function generateScreenshotFn(url: string, version: string) {
  const res = await functions.createExecution(
    "647895cd6af709744cbe",
    JSON.stringify({ url, version })
  );

  const response = z
    .object({
      screenshotUrls: z.array(
        z.object({
          name: z.string(),
          url: z.string(),
          width: z.number(),
          height: z.number(),
        })
      ),
    })
    .parse(JSON.parse(res.response));

  return response.screenshotUrls;
}

export async function secureGetPage(pageId: string) {
  const res = await functions.createExecution(
    "647f57bdf1bb2d3157b6",
    JSON.stringify({
      pageId,
    })
  );

  const response = JSON.parse(res.response || `null`);

  if (response === null) {
    return null;
  }

  return response as Models.Document;
}

export type SlackInstallAppArgs = {
  code: string;
};

export async function slackInstallApp({ code }: SlackInstallAppArgs) {
  const res = await functions.createExecution(
    "64802d9ee57927d8feb2",
    JSON.stringify({ code })
  );

  const response = z
    .object({ success: z.boolean() })
    .parse(JSON.parse(res.response));

  return response;
}

export const subscribe = client.subscribe.bind(client);
