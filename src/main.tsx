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
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
