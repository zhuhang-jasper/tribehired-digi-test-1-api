const appRoot = require("app-root-path");
const config = require(appRoot + "/config/config");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const { format } = require("winston");
const { splat, combine, timestamp, printf } = format;
const loggerConfig = require("../../config/winston");
const ObjectUtil = require("../../api/utils/objectUtil");

// define the custom settings for each transport
// reference: https://github.com/winstonjs/winston-daily-rotate-file
const options = {
    dynamicPath: "",
    main: null,
    reqRes: null,
    error: null,
    console: ObjectUtil.mergeDeep({}, loggerConfig.options.console, {})
};

/** @type {winston.Logger} */
let mainLogger = null;
/** @type {winston.Logger} */
let reqresLogger = null;
/** @type {winston.Logger} */
let errorLogger = null;

function initOptions() {
    const dynamicPath = loggerConfig.getPathOfCurrentDate();
    options.dynamicPath = dynamicPath;
    options.main = ObjectUtil.mergeDeep({}, loggerConfig.options.file, {
        level: "debug",
        dirname: config.log.path + "/app/main" + dynamicPath,
        filename: "test-app-%DATE%.log"
    });
    options.reqRes = ObjectUtil.mergeDeep({}, loggerConfig.options.file, {
        level: "info",
        dirname: config.log.path + "/app/request-response" + dynamicPath,
        filename: "test-app-req-res-%DATE%.log"
    });
    options.error = ObjectUtil.mergeDeep({}, loggerConfig.options.file, {
        level: "warn",
        dirname: config.log.path + "/app/error" + dynamicPath,
        filename: "test-app-error-%DATE%.log"
    });
}

function updateOptionsDynamicPath() {
    const dynamicPath = loggerConfig.getPathOfCurrentDate();
    if (dynamicPath != options.dynamicPath) {
        options.dynamicPath = dynamicPath;
        options.main.dirname = config.log.path + "/app/main" + dynamicPath;
        options.reqRes.dirname = config.log.path + "/app/request-response" + dynamicPath;
        options.error.dirname = config.log.path + "/app/error" + dynamicPath;
        mainLogger.clear();
        mainLogger.configure({
            transports: [
                new winston.transports.Console(options.console),
                new DailyRotateFile(options.main)
            ]
        });
        reqresLogger.clear();
        reqresLogger.configure({
            transports: [
                // new winston.transports.Console(options.console),
                new DailyRotateFile(options.reqRes)
            ]
        });
        errorLogger.clear();
        errorLogger.configure({
            transports: [
                // new winston.transports.Console(options.console),
                new DailyRotateFile(options.error)
            ]
        });
    }
}

const splitter = format((info, opts) => {
    updateOptionsDynamicPath(); // update daily new folder path
    if (info.level == "info") {
        if (info.message.logType) {
            const msgLogType = info.message.logType;
            if (msgLogType.indexOf("REQUEST") != -1 || msgLogType.indexOf("RESPONSE") != -1) {
                // delete info.message.logType;
                reqresLogger.info(info.message);
                return false; // do not log to mainLogger
            }
        }
    } else if (info.level == "warn") {
        errorLogger.warn(info.message);
        // return false; // do not log to mainLogger
    } else if (info.level == "error") {
        errorLogger.error(info.message);
        // return false; // do not log to mainLogger
    }
    return info;
});

const customFormatter = printf(({ timestamp, level, message }) => {
    return loggerConfig.getCustomFormattedLog({ timestamp, level, message });
});

function initLoggers() {
    initOptions();

    // instantiate a new Winston Logger with the settings defined above
    mainLogger = winston.createLogger({
        format: combine(
            timestamp(loggerConfig.options.timestamp),
            splat(),
            splitter(),
            customFormatter
        ),
        transports: [
            new DailyRotateFile(options.main),
            new winston.transports.Console(options.console)
        ],
        exitOnError: false // do not exit on handled exceptions
    });

    reqresLogger = winston.createLogger({
        format: combine(
            timestamp(loggerConfig.options.timestamp),
            splat(),
            customFormatter
        ),
        transports: [
            new DailyRotateFile(options.reqRes)
            // new winston.transports.Console(options.console)
        ],
        exitOnError: false // do not exit on handled exceptions
    });

    errorLogger = winston.createLogger({
        format: combine(
            timestamp(loggerConfig.options.timestamp),
            splat(),
            customFormatter
        ),
        transports: [
            new DailyRotateFile(options.error)
            // new winston.transports.Console(options.console)
        ],
        exitOnError: false // do not exit on handled exceptions
    });
}

/* runtime */
initLoggers();
module.exports = mainLogger;
