// @ts-check
require("esbuild-register/dist/node").register();
const { handleEvent } = require("./main");
module.exports = handleEvent;
