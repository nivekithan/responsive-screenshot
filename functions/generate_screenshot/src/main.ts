import { z } from "zod";
import { Client, TakeOptions } from "screenshotone-api-sdk";
import { screenshotDevices } from "./devices";

const payloadSchema = z.object({
  url: z.string(),
  version: z.string(),
});

const variablesSchema = z.object({
  SCREENSHOT_ACCESS_KEY: z.string(),
  SCREENSHOT_SIGNING_KEY: z.string(),
});

const requestSchema = z.object({
  payload: z.string(),
  variables: variablesSchema,
});

const MONTH_IN_SECONDS = 2592000;

export async function generateScreenshotUrl(
  req: unknown,
  res: { json(obj: unknown, code?: number): void }
) {
  try {
    const parsedReq = await requestSchema.parse(req);
    const payloadParseRes = payloadSchema.safeParse(
      JSON.parse(parsedReq.payload)
    );
    const variablesParseRes = variablesSchema.safeParse(parsedReq.variables);

    if (!payloadParseRes.success) {
      return res.json(payloadParseRes.error, 400);
    }

    if (!variablesParseRes.success) {
      return res.json(variablesParseRes.error, 400);
    }

    const variables = variablesParseRes.data;
    const { url, version } = payloadParseRes.data;

    const screenshotClient = new Client(
      variables.SCREENSHOT_ACCESS_KEY,
      variables.SCREENSHOT_SIGNING_KEY
    );

    const screenshotUrls = screenshotDevices.map((device) => {
      const options = TakeOptions.url(url)
        .fullPage(true)
        .viewportWidth(device.viewportWidth)
        .viewportHeight(device.viewportHeight)
        .deviceScaleFactor(device.deviceScaleFactor)
        .cache(true)
        .cacheTtl(MONTH_IN_SECONDS)
        .cacheKey(version);

      const screenshotUrl = screenshotClient.generateSignedTakeURL(options);
      return {
        name: device.name,
        url: screenshotUrl,
        width: device.viewportWidth,
        height: device.viewportHeight,
      };
    });

    return res.json({ screenshotUrls });
  } catch (err) {
    console.log(err);
    return res.json({ err }, 500);
  }
}
