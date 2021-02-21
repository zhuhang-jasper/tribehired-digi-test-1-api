// require('dotenv').config();
const path = require("path");
const appRoot = require("app-root-path");
const APPDATA_PATH = path.resolve(appRoot + "/data");
require("custom-env").env(true, appRoot + "/deploy", true);

const config = {
    APPDATA_PATH: APPDATA_PATH,
    environment: process.env.ENVIRONMENT,
    app: {
        scheme: process.env.APP_SCHEME,
        host: process.env.APP_HOST,
        port: parseInt(process.env.APP_PORT) || 4300,
        apiDocUrl: process.env.APP_API_DOC_URL
    },
    web: {
        hostUrl: process.env.WEB_HOST_URL
    },
    db: {
        mysql: {
            host: process.env.DB_MYSQL_HOST,
            user: process.env.DB_MYSQL_USER,
            password: process.env.DB_MYSQL_PASSWORD,
            dbName: process.env.DB_MYSQL_DB_NAME,
            timezone: process.env.DB_MYSQL_TIMEZONE
        }
    },
    log: {
        path: path.resolve(APPDATA_PATH + process.env.LOGGING_PATH),
        datePattern: process.env.LOGGING_DATE_PATTERN,
        maxSizeInMb: process.env.LOGGING_MAX_SIZE_IN_MB,
        maxFilesInDays: process.env.LOGGING_MAX_FILES_IN_DAYS,
        zippedArchive: process.env.LOGGING_ZIPPED_ARCHIVE,
        logAllRequests: process.env.LOGGING_LOG_ALL_REQUESTS,
        logAllResponses: process.env.LOGGING_LOG_ALL_RESPONSES,
        emailException: parseInt(process.env.EMAIL_EXCEPTION),
        emailLocalhostException: parseInt(process.env.EMAIL_LOCALHOST_EXCEPTION)
    },
    biz: {
        token: {
            loginSessionValidityInSec: process.env.LOGIN_SESSION_VALIDITY_IN_SEC
        }
    }
};

module.exports = config;
