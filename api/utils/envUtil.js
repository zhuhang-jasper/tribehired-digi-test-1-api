/* --------------------- */
/* Utility : Environment    */
/* --------------------- */
const appRoot = require("app-root-path");
const config = require(appRoot + "/config/config");
const environment = config.environment || "";
const env = String(environment).toUpperCase().trim();

function isProduction() {
    return (env.startsWith("PRD") || env.startsWith("PROD"));
}

function isStaging() {
    return (env.startsWith("STG") || env.startsWith("STAG"));
}

function isDev() {
    return (env.startsWith("DEV"));
}

function isLocal() {
    return (env.startsWith("LOCAL") || env.includes("LOCALHOST"));
}

module.exports = { isProduction, isStaging, isLocal, isDev, environment };
