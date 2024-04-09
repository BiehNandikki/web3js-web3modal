"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWeb3Modal = exports.defaultConfig = void 0;
const client_js_1 = require("../client.js");
const scaffold_utils_1 = require("@web3modal/scaffold-utils");
var defaultConfig_js_1 = require("../utils/defaultConfig.js");
Object.defineProperty(exports, "defaultConfig", { enumerable: true, get: function () { return defaultConfig_js_1.defaultConfig; } });
function createWeb3Modal(options) {
    return new client_js_1.Web3Modal(Object.assign(Object.assign({}, options), { _sdkVersion: `html-ethers-${scaffold_utils_1.ConstantsUtil.VERSION}` }));
}
exports.createWeb3Modal = createWeb3Modal;
