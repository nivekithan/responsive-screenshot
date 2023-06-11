import * as React from "react";
import * as ReactDOM from "react-dom/client";
import "./styles/globals.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import * as rootPage from "./root";
import * as loginPage from "./routes/login";
import * as signUpPage from "./routes/signUp";
import * as logoutPage from "./routes/logout";
import * as rootIndexPage from "./routes/_index";
import * as screenshotPage from "./routes/page.$pageId";
import * as slackRedirectPage from "./routes/slack.oauth.redirect";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://5841071e15934decaf95db1931108d0f@o4505340268183552.ingest.sentry.io/4505340270149632",
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ["locahost"],
    }),
  ],

  tracesSampleRate: 0.0,
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 0.0,
});

const START_TEST_WORKER = false;

function prepareMock() {
  if (START_TEST_WORKER) {
    return import("./mocks/main").then(({ worker }) => {
      return worker.start();
    });
  }

  return Promise.resolve();
}

prepareMock().then(() => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <rootPage.RouteLayout />,
      loader: rootPage.loader,
      children: [
        {
          path: "/",
          index: true,
          action: rootIndexPage.action,
          element: <rootIndexPage.RootIndexPage />,
          loader: rootIndexPage.loader,
        },
        {
          path: "/page/:pageId",
          action: screenshotPage.action,
          loader: screenshotPage.loader,
          element: <screenshotPage.ScreenshotPage />,
        },
      ],
    },
    {
      path: "/login",
      element: <loginPage.LoginPage />,
      action: loginPage.action,
      loader: loginPage.loader,
    },
    {
      path: "/signUp",
      element: <signUpPage.SignUpPage />,
      action: signUpPage.action,
      loader: loginPage.loader,
    },
    {
      path: "/logout",
      action: logoutPage.action,
    },
    {
      path: "/slack/oauth/redirect",
      loader: slackRedirectPage.loader,
    },
  ]);

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
});
