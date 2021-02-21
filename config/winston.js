const appRoot = require("app-root-path");
const config = require(appRoot + "/config/config");
const moment = require("moment");
const fs = require("fs");

const EnvUtil = require("../api/utils/envUtil");
// const ImageUtil = require("../api/utils/imageUtil");
const ObjectUtil = require("../api/utils/objectUtil");

// define the custom settings for each transport (file, console)
// reference: https://github.com/winstonjs/winston-daily-rotate-file
const options = {
    file: {
        level: "debug",
        dirname: config.log.path,
        // filename: config.log.fileName + '.log',
        datePattern: config.log.datePattern, // YYYY-MM-DD-HH
        zippedArchive: (config.log.zippedArchive == "1"),
        maxFiles: config.log.maxFilesInDays + "d", // 14d
        maxsize: config.log.maxSizeInMb + "m", // 100m
        handleExceptions: true,
        json: false,
        colorize: false
        // maxFiles: 5
    },
    console: {
        level: EnvUtil.isDev() ? "debug" : "info",
        handleExceptions: true,
        json: false,
        colorize: true
    },
    timestamp: {
        format: "YYYY-MM-DD HH:mm:ss.SSS"
    }
};

// meta param is ensured by splat()
const getCustomFormattedLog = function ({ timestamp, level, message, meta }, type) {
    const httpContext = require("express-http-context");
    const requestId = httpContext.get("reqId");

    if (ObjectUtil.isCyclic(message)) {
        return "Skip logging cyclic object"; // do not log cyclic objects
    }

    let msg = message;
    if (message) {
        msg = JSON.parse(JSON.stringify(message));

        if (ObjectUtil.isObject(message) || Array.isArray(message)) {

            // OPTIMIZATIONS:
            // 1.remove blob images in logging
            // ObjectUtil.traverseDeep(msg, ImageUtil.isBase64, "[TRUNC] A base64 string", true);

            // 2.truncate array size to 20
            ObjectUtil.traverseDeep(msg, function (val) {
                return (Array.isArray(val) && val.length > 20);
            }, 20);

            // 3.pretty print if log level = info
            if (level == "info") {
                msg = JSON.stringify(msg, null, 2);
            } else if (level == "debug") {
                msg = JSON.stringify(msg);
            }
        }
    }
    const reqIdMsg = requestId ? ` [${requestId}]` : "";
    const typeMsg = type ? ` [${type}]` : "";
    // if (type == "SOCKET") {
    //     typeMsg = "";
    //     msg = ">> SOCKET-server: " + msg;
    // }

    return `${level.toUpperCase()}: ${timestamp}${reqIdMsg}${typeMsg} - ${msg}`;
    // - ${meta? JSON.stringify(meta) : ''}`;
};

function makeLogFolder() {
    const path = config.log.path;
    if (typeof path == "string") {
        fs.mkdir(path, { recursive: true }, (err) => {
            if (err) {
                console.error(err);
            }
        });
    }
}

function getPathOfCurrentDate() {
    return moment().format("/YYYY/MM/DD");
}

/* runtime */
makeLogFolder(); // create log folder
getPathOfCurrentDate();

module.exports = { options, getCustomFormattedLog, getPathOfCurrentDate };
