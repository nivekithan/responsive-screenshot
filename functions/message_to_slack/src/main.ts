import { z } from "zod";
import { Client, Databases, Query, Users } from "node-appwrite";
import fetch from "node-fetch";

const DATABASE_ID = "dev";

const collections = {
  PAGES: "647b0d9310b4ac4f8256",
  PAGE_APPROVAL_STATUS: "647c71d2cac511ce8e9b",
  PAGE_COMMENTS: "647f630632a9fb64e6ef",
  PAGE_ACCESS_EMAILS: "647f3355ed75a176dba9",
  USER_WEBHOOK_URL: "648046bd24a66d4b1503",
};

const WEBSITE_HOST = "niveth.loca.lt";

const ReqSchema = z.object({
  variables: z.object({
    APPWRITE_FUNCTION_EVENT: z
      .string()
      .startsWith(
        `databases.${DATABASE_ID}.collections.${collections.PAGE_APPROVAL_STATUS}.documents`
      ),
    APPWRITE_FUNCTION_EVENT_DATA: z.string(),
    ACCESS_KEY: z.string(),
  }),
});

const EventDataSchema = z.object({
  $id: z.string(),
  status: z.union([z.literal("APPROVED"), z.literal("DISAPPROVED")]),
  createdBy: z.string(),
  pageId: z.string(),
});

export async function handleEvent(
  req: unknown,
  res: { json(obj: unknown, code?: number): void }
) {
  try {
    console.log("Hello there");
    const { variables } = ReqSchema.parse(req);
    const eventData = EventDataSchema.parse(
      JSON.parse(variables.APPWRITE_FUNCTION_EVENT_DATA)
    );

    console.log("2");
    const client = new Client()
      .setEndpoint("https://cloud.appwrite.io/v1")
      .setProject("pdf")
      .setKey(variables.ACCESS_KEY);

    const database = new Databases(client);
    const users = new Users(client);

    const createdBy = eventData.createdBy;
    const pageId = eventData.pageId;

    const [email, webhookAndImageUrl] = await Promise.all([
      getUserEmail(createdBy, users),
      getWebhookUrlAndPage(pageId, database),
    ]);

    console.log(3);

    if (!webhookAndImageUrl) {
      console.log("Unable able to find webhook url. Ignoring this event");
      return;
    }

    const { page, webhookUrl } = webhookAndImageUrl;

    const webhookBody = formatTextForStatus({
      email,
      page,
      status: eventData.status,
    });

    const resFromSlack = await fetch(webhookUrl, {
      method: "post",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(webhookBody),
    });

    console.log(resFromSlack);
    return res.json({ success: true });
  } catch (err) {
    console.log(err);
    return res.json({ success: false }, 400);
  }
}

async function getUserEmail(userId: string, users: Users) {
  const userObj = await users.get(userId);

  console.log("user");

  return userObj.email;
}

const PageDocSchema = z.object({
  createdBy: z.string(),
  $id: z.string(),
  url: z.string(),
  name: z.string(),
});
const UserWebhookUrlDocSchema = z.object({ url: z.string() });

async function getWebhookUrlAndPage(pageId: string, database: Databases) {
  const pageObj = PageDocSchema.parse(
    await database.getDocument(DATABASE_ID, collections.PAGES, pageId)
  );

  const pageCreatedByUserId = pageObj.createdBy;

  const userWebhookUrlDocList = await database.listDocuments(
    DATABASE_ID,
    collections.USER_WEBHOOK_URL,
    [Query.equal("userId", pageCreatedByUserId)]
  );

  if (userWebhookUrlDocList.total === 0) {
    return null;
  }

  const docs = UserWebhookUrlDocSchema.parse(
    userWebhookUrlDocList.documents[0]
  );

  console.log("webhook");

  return { webhookUrl: docs.url, page: pageObj };
}

type FormatTextOnSaveArgs = {
  email: string;
  page: z.infer<typeof PageDocSchema>;
  status: z.infer<typeof EventDataSchema>["status"];
};

function formatTextForStatus({ email, page, status }: FormatTextOnSaveArgs) {
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${email} has ${status.toLocaleLowerCase()} your <${`https://${WEBSITE_HOST}/page/${page.$id}`}|${
            page.name
          }>`,
        },
      },
      {
        type: "image",
        title: {
          type: "plain_text",
          text: `${page.name}`,
          emoji: true,
        },
        image_url: page.url,
        alt_text: page.name,
      },
    ],
  };
}
