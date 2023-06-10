import { rest, setupWorker } from "msw";

const handlers = [rest.post("/login", null)];

export const worker = setupWorker(...handlers);
