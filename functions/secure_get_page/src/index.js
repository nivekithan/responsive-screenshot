// @ts-check

const sdk = require("node-appwrite");
const { z } = require("zod");

/*
  'req' variable has:
  'headers' - object with request headers
    'payload' - request body data as a string
    'variables' - object with function variables
    
    'res' variable has:
    'send(text, status)' - function to return text response. Status code defaults to 200
    'json(obj, status)' - function to return JSON response. Status code defaults to 200

  If an error is thrown, a response with code 500 will be returned.
  */

const VariablesSchema = z.object({
  ACCESS_KEY: z.string().nonempty(),
  APPWRITE_FUNCTION_USER_ID: z.string().nonempty(),
});
const PayloadSchema = z.object({ pageId: z.string().nonempty() });

const DATABASE_ID = "dev";
const collections = {
  PAGES: "647b0d9310b4ac4f8256",
  PAGE_APPROVAL_STATUS: "647c71d2cac511ce8e9b",
  PAGE_ACCESS_EMAILS: "647f3355ed75a176dba9",
};

module.exports = async function (req, res) {
  try {
    console.log("I am here");
    const { ACCESS_KEY, APPWRITE_FUNCTION_USER_ID } = VariablesSchema.parse(
      req.variables
    );
    const { pageId } = PayloadSchema.parse(JSON.parse(req.payload));

    const client = new sdk.Client()
      .setEndpoint("https://cloud.appwrite.io/v1")
      .setProject("pdf")
      .setKey(ACCESS_KEY);

    const databases = new sdk.Databases(client);
    const users = new sdk.Users(client);
    const Query = sdk.Query;

    /**
     *
     * @param {string} pageId
     * @returns
     */
    async function getPageAccessEmails(pageId) {
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

    /**
     *
     * @param {string} userId
     */
    async function getEmailOfUser(userId) {
      const user = await users.get(userId);

      return user.email;
    }

    /**
     *
     * @param {string} pageId
     * @returns
     */
    async function getPage(pageId) {
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

    console.log("I am here 2");
    if (!emails.includes(userEmail)) {
      console.log("unknown email");
      return res.json(null, 401);
    }

    const page = await getPage(pageId);

    return res.json(page);
  } catch (err) {
    console.log(err);
    return res.json(null, 400);
  }
};
