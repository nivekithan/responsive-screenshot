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
    APPWRITE_FUNCTION_EVENT: z.union([
      z
        .string()
        .startsWith(
          `databases.${DATABASE_ID}.collections.${collections.PAGE_APPROVAL_STATUS}.documents`
        ),
      z
        .string()
        .startsWith(
          `databases.${DATABASE_ID}.collections.${collections.PAGE_COMMENTS}.documents`
        ),
    ]),
    APPWRITE_FUNCTION_EVENT_DATA: z.string(),
    ACCESS_KEY: z.string(),
  }),
});

const PageApprovalStatusDocSchema = z.object({
  $id: z.string(),
  status: z.union([z.literal("APPROVED"), z.literal("DISAPPROVED")]),
  createdBy: z.string(),
  pageId: z.string(),
});

const PageCommentsDocSchema = z.object({
  $id: z.string(),
  createdBy: z.string(),
  pageId: z.string(),
  comment: z.string(),
});

const EventDataSchema = z.union([
  PageApprovalStatusDocSchema,
  PageCommentsDocSchema,
]);

export async function handleEvent(
  req: unknown,
  res: { json(obj: unknown, code?: number): void }
) {
  try {
    const { variables } = ReqSchema.parse(req);

    const eventData = EventDataSchema.parse(
      JSON.parse(variables.APPWRITE_FUNCTION_EVENT_DATA)
    );

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

    if (!webhookAndImageUrl) {
      console.log("Unable able to find webhook url. Ignoring this event");
      return;
    }

    const { page, webhookUrl } = webhookAndImageUrl;

    const webhookBody = (() => {
      if ("status" in eventData) {
        const webhookBody = formatTextForStatus({
          email,
          page,
          status: eventData.status,
        });
        return webhookBody;
      } else if ("comment" in eventData) {
        const webhookBody = formatTextForComment({
          email,
          page,
          comment: eventData.comment,
        });

        return webhookBody;
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

async function getUserEmail(userId: string, users: Users) {
  const userObj = await users.get(userId);

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

  return { webhookUrl: docs.url, page: pageObj };
}

type FormatTextOnSaveArgs = {
  email: string;
  page: z.infer<typeof PageDocSchema>;
  status: z.infer<typeof PageApprovalStatusDocSchema>["status"];
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

type FormatTextForCommentArgs = {
  email: string;
  page: z.infer<typeof PageDocSchema>;
  comment: string;
};
function formatTextForComment({
  email,
  page,
  comment,
}: FormatTextForCommentArgs) {
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${email} has commented on <${`https://${WEBSITE_HOST}/page/${page.$id}`}|${
            page.name
          }>:\n>${comment}`,
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
