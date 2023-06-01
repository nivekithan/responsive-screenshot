import { Account, Client, Functions } from "appwrite";
import { z } from "zod";

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1") // Your API Endpoint
  .setProject("pdf"); // Your project ID

export const account = new Account(client);

const functions = new Functions(client);

export async function generateScreenshotFn(url: string) {
  const res = await functions.createExecution(
    "647895cd6af709744cbe",
    JSON.stringify({ url })
  );

  const response = z
    .object({ screenshotUrl: z.string() })
    .parse(JSON.parse(res.response));

  return response.screenshotUrl;
}
