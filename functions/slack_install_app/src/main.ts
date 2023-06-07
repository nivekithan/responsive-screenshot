import { z } from "zod";
import { WebClient } from "@slack/web-api";
import { Client, Databases, ID, Permission, Query, Role } from "node-appwrite";

const DATABASE_ID = "dev";
const collections = {
  USER_WEBHOOK_URL: "648046bd24a66d4b1503",
};

const ReqSchema = z.object({
  payload: z.string(),
  variables: z.object({
    APPWRITE_FUNCTION_USER_ID: z.string(),
    SLACK_CLIENT_SECRET: z.string(),
    SLACK_CLIENT_ID: z.string(),
    ACCESS_KEY: z.string(),
  }),
});

const PayloadSchema = z.object({ code: z.string() });

export async function installSlackBot(
  req: unknown,
  res: { json: (obj: unknown, code: number) => void }
) {
  try {
    const { payload, variables } = ReqSchema.parse(req);
    const { code } = PayloadSchema.parse(JSON.parse(payload));

    const webhookUrl = await exchangeOAuthGrant({
      clientId: variables.SLACK_CLIENT_ID,
      clientSecret: variables.SLACK_CLIENT_SECRET,
      code,
    });

    if (!webhookUrl) {
      return res.json({ success: false }, 400);
    }
    const client = new Client()
      .setEndpoint("https://cloud.appwrite.io/v1")
      .setProject("pdf")
      .setKey(variables.ACCESS_KEY);

    const database = new Databases(client);

    await setWebhookUrl({
      database,
      url: webhookUrl,
      userId: variables.APPWRITE_FUNCTION_USER_ID,
    });

    return res.json({ success: true }, 200);
  } catch (err) {
    console.log(err);
    return res.json({ success: false }, 500);
  }
}

type ExchangeOAuthGrantArgs = {
  code: string;
  clientSecret: string;
  clientId: string;
};

async function exchangeOAuthGrant({
  clientId,
  clientSecret,
  code,
}: ExchangeOAuthGrantArgs) {
  const webclient = new WebClient();

  const res = await webclient.oauth.v2.access({
    client_id: clientId,
    client_secret: clientSecret,
    code,
  });

  const webhookUrl = res.incoming_webhook;

  if (!webhookUrl) {
    return null;
  }

  const url = webhookUrl.url;

  if (!url) {
    return null;
  }

  return url;
}

type SetWebhookUrlProps = {
  url: string;
  userId: string;
  database: Databases;
};

async function setWebhookUrl({ database, url, userId }: SetWebhookUrlProps) {
  const alreadyPresentDoc = await database.listDocuments(
    DATABASE_ID,
    collections.USER_WEBHOOK_URL,
    [Query.equal("userId", userId)]
  );

  if (alreadyPresentDoc.total !== 0) {
    const documentId = alreadyPresentDoc.documents[0].$id;
    return database.updateDocument(
      DATABASE_ID,
      collections.USER_WEBHOOK_URL,
      documentId,
      { url }
    );
  }

  return database.createDocument(
    DATABASE_ID,
    collections.USER_WEBHOOK_URL,
    ID.unique(),
    { url, userId },
    [Permission.read(Role.user(userId))]
  );
}
