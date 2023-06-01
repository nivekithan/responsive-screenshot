// @ts-check
const { z } = require("zod");
const { Client, TakeOptions } = require("screenshotone-api-sdk");

const payloadSchema = z.object({ url: z.string() });

const variablesScheam = z.object({
  SCREENSHOT_ACCESS_KEY: z.string(),
  SCREENSHOT_SIGNING_KEY: z.string(),
});

module.exports = async function (req, res) {
  try {
    const payloadParseRes = payloadSchema.safeParse(JSON.parse(req.payload));
    const variablesParseRes = variablesScheam.safeParse(req.variables);

    if (!payloadParseRes.success) {
      return res.json(payloadParseRes.error, 400);
    }

    if (!variablesParseRes.success) {
      return res.json(variablesParseRes.error, 400);
    }

    const variables = variablesParseRes.data;
    const { url } = payloadParseRes.data;

    const screenshotClient = new Client(
      variables.SCREENSHOT_ACCESS_KEY,
      variables.SCREENSHOT_SIGNING_KEY
    );

    const options = TakeOptions.url(url)
      .fullPage(true)
      .viewportDevice("iphone_13_pro_max");

    const screenshotUrl = screenshotClient.generateSignedTakeURL(options);

    return res.json({ screenshotUrl });
  } catch (err) {
    console.log(err);
    return res.json({ err }, 500);
  }
};
