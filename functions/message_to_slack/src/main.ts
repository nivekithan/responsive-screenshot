import { z } from "zod";
import { Client, Databases, Query } from "node-appwrite";
import fetch from "node-fetch";

const DATABASE_ID = "dev";

const collections = {
  PAGES: "647b0d9310b4ac4f8256",
  PAGE_ISSUE: "647f630632a9fb64e6ef",
  PAGE_ACCESS_EMAILS: "647f3355ed75a176dba9",
  USER_WEBHOOK_URL: "648046bd24a66d4b1503",
};

const WEBSITE_HOST = "niveth.loca.lt";

const ReqSchema = z.object({
  variables: z.object({
    APPWRITE_FUNCTION_EVENT: z
      .string()
      .startsWith(
        `databases.${DATABASE_ID}.collections.${collections.PAGE_ISSUE}.documents`
      ),
    APPWRITE_FUNCTION_EVENT_DATA: z.string(),
    ACCESS_KEY: z.string(),
  }),
});

const PageIssuesDocSchema = z.object({
  $id: z.string(),
  createdBy: z.string(),
  pageId: z.string(),
  issue: z.string(),
  createdByEmail: z.string(),
});

const EventDataSchema = PageIssuesDocSchema;

export async function handleEvent(
  req: unknown,
  res: { json(obj: unknown, code?: number): void }
) {
  try {
    const { variables } = ReqSchema.parse(req);

    const eventData = EventDataSchema.parse(
      JSON.parse(variables.APPWRITE_FUNCTION_EVENT_DATA)
    );

    const eventName = variables.APPWRITE_FUNCTION_EVENT;

    const client = new Client()
      .setEndpoint("https://cloud.appwrite.io/v1")
      .setProject("pdf")
      .setKey(variables.ACCESS_KEY);

    const database = new Databases(client);
    const pageId = eventData.pageId;

    const email = eventData.createdByEmail;

    const [webhookAndImageUrl] = await Promise.all([
      getWebhookUrlAndPage(pageId, database),
    ]);

    if (!webhookAndImageUrl) {
      console.log("Unable able to find webhook url. Ignoring this event");
      return;
    }

    const { page, webhookUrl } = webhookAndImageUrl;

    const webhookBody = (() => {
      if ("issue" in eventData) {
        if (eventName.endsWith("create")) {
          const webhookBody = formatTextForIssueCreate({
            email,
            page,
            issue: eventData.issue,
          });

          return webhookBody;
        } else if (eventName.endsWith("delete")) {
          const webhookBody = formatTextForIssueDelete({
            email,
            issue: eventData.issue,
            page,
          });

          return webhookBody;
        }
      }
    })();

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

  return { webhookUrl: docs.url, page: pageObj };
}

type FormatTextForIssueCreateArgs = {
  email: string;
  page: z.infer<typeof PageDocSchema>;
  issue: string;
};
function formatTextForIssueCreate({
  email,
  page,
  issue,
}: FormatTextForIssueCreateArgs) {
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${email} has created new isssue on <${`https://${WEBSITE_HOST}/page/${page.$id}`}|${
            page.name
          }>:\n>${issue}`,
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

type FormatTextForIssueDeleteArgs = {
  email: string;
  page: z.infer<typeof PageDocSchema>;
  issue: string;
};
function formatTextForIssueDelete({
  email,
  page,
  issue,
}: FormatTextForIssueDeleteArgs) {
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${email} has resolved isssue on <${`https://${WEBSITE_HOST}/page/${page.$id}`}|${
            page.name
          }>:\n>${issue}`,
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
