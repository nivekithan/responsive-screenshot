import { z } from "zod";
import sdk from "node-appwrite";

const VariablesSchema = z.object({
  ACCESS_KEY: z.string().nonempty(),
  APPWRITE_FUNCTION_USER_ID: z.string().nonempty(),
});

const PayloadSchema = z.object({ pageId: z.string().nonempty() });

const ReqSchema = z.object({ variables: VariablesSchema, payload: z.string() });

const DATABASE_ID = "dev";

const collections = {
  PAGES: "647b0d9310b4ac4f8256",
  PAGE_APPROVAL_STATUS: "647c71d2cac511ce8e9b",
  PAGE_ACCESS_EMAILS: "647f3355ed75a176dba9",
};

export async function handleGetPage(
  req: unknown,
  res: { json(obj: unknown, code?: number): void }
) {
  try {
    const { payload, variables } = ReqSchema.parse(req);
    const { ACCESS_KEY, APPWRITE_FUNCTION_USER_ID } = variables;
    const { pageId } = PayloadSchema.parse(JSON.parse(payload));

    const client = new sdk.Client()
      .setEndpoint("https://cloud.appwrite.io/v1")
      .setProject("pdf")
      .setKey(ACCESS_KEY);

    const databases = new sdk.Databases(client);
    const users = new sdk.Users(client);
    const Query = sdk.Query;

    async function getPageAccessEmails(pageId: string) {
      const documentsList = await databases.listDocuments(
        DATABASE_ID,
        collections.PAGE_ACCESS_EMAILS,
        [Query.equal("pageId", pageId)]
      );

      console.log({ documentsList });

      return z
        .object({ emails: z.array(z.string()) })
        .parse(documentsList.documents[0]);
    }

    async function getEmailOfUser(userId: string) {
      const user = await users.get(userId);

      return user.email;
    }

    async function getPage(pageId: string) {
      const page = await databases.getDocument(
        DATABASE_ID,
        collections.PAGES,
        pageId
      );

      return page;
    }

    const [{ emails }, userEmail] = await Promise.all([
      getPageAccessEmails(pageId),
      getEmailOfUser(APPWRITE_FUNCTION_USER_ID),
    ]);

    if (!emails.includes(userEmail)) {
      return res.json(null, 401);
    }

    const page = await getPage(pageId);

    return res.json(page);
  } catch (err) {
    console.log(err);
    return res.json(null, 400);
  }
}
