import { rest, setupWorker } from "msw";
import { AUTH_COOKIE_KEY, authorizeReq, login } from "./auth";
import { getData } from "./users";

function appwriteUrl(url: string) {
  return `https://cloud.appwrite.io/v1${url}`;
}

const handlers = [
  rest.get(appwriteUrl("/account"), async (req, res, ctx) => {
    const auth = authorizeReq(req);

    if (!auth.isAuthenticated) {
      return res(
        ctx.status(401),
        ctx.json({
          message: "User (role: guests) missing scope (account)",
          code: 401,
          type: "general_unauthorized_scope",
          version: "0.10.30",
        })
      );
    }

    const data = getData(auth.userId);

    return res(ctx.json(data.account));
  }),

  rest.post(appwriteUrl("/account/sessions/email"), async (req, res, ctx) => {
    const { email, password } = (await req.json()) as {
      email: string;
      password: string;
    };

    const userCredInfo = login(email, password);

    if (userCredInfo === null) {
      throw new Error("TODO!");
    }

    const allUserData = getData(userCredInfo.id);

    return res(
      ctx.json(allUserData.userObj),
      ctx.status(201),
      ctx.cookie(AUTH_COOKIE_KEY, userCredInfo.id)
    );
  }),

  rest.delete(appwriteUrl("/account/sessions"), async (_, res, ctx) => {
    return res(ctx.cookie(AUTH_COOKIE_KEY, ""), ctx.status(201));
  }),
];

export const worker = setupWorker(...handlers);
