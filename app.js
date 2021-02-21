"use strict";
process.title = `TribeHired_Digi_Node_RESTful_Socket_Server v${process.env.npm_package_version}`;
process.setMaxListeners(30); // mostly for winston listeners

// Import libraries
const app = require("express")();
const cors = require("cors");
const uuid = require("uuid");
const http = require("http");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const nodeCleanup = require("node-cleanup");
const httpContext = require("express-http-context");

// Import local libs
const appRoot = require("app-root-path");
const envConfig = require(appRoot + "/config/config");
const FileUtil = require("./api/utils/fileUtil");
FileUtil.createFolder(envConfig.APPDATA_PATH); // Create data folder
const AppLogger = require(appRoot + "/config/logger/appLogger");
const BaseController = require("./api/base/baseController");
const EnvUtil = require("./api/utils/envUtil");
const JwtUtil = require("./api/utils/jwtUtil");
// const SocketUtil = require("./api/utils/socketUtil");
const CustomError = require("./api/base/CustomError");
const ResponseErrorCode = require("./api/constants/responseErrorCode");
// const OsccSdkService = require("./api/services/oscc-sdk-service/oscc-sdk-service");
// const AgentService = require("./api/services/agent-service");
// const AgentController = require("./api/controllers/agent");

/* For Swagger UI documentation */
const YAML = require("yamljs");
const swaggerUi = require("swagger-ui-express");
const SwaggerExpress = require("swagger-express-mw");
const swaggerDocument = YAML.load("./api/swagger/swagger.yaml");
swaggerDocument.host = envConfig.app.host;
swaggerDocument.schemes = [envConfig.app.scheme];
app.use(envConfig.app.apiDocUrl, swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/* For Debug: Increase stacktrace limit */
if (!EnvUtil.isProduction()) {
    Error.stackTraceLimit = 50;
    console.info("Stacktrace limit: " + Error.stackTraceLimit);
}

/* ---------- */
/* MIDDLEWARE */
/* ---------- */

// 0. HELMET - apply setting HTTP header to protect from well-known web vulnerabilities
app.use(helmet());

// 1. CORS
const devHostUrl = "http://localhost:4200"; // local Angular ng-serve host
const corsWhitelist = [envConfig.web.hostUrl];
if (/*! EnvUtil.isProduction() && */ !corsWhitelist.includes(devHostUrl)) {
    corsWhitelist.push(devHostUrl);
} // Allow CORS from dev host to Non-Production API
const corsOptions = {
    origin: corsWhitelist,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 (default = 204)
    // maxAge: 300 // how long the results of a preflight request can be cached.
};
app.use(cors(corsOptions));

// 2. BODY PARSER
app.use(bodyParser.json({
    limit: "50mb"
})); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({
    limit: "50mb",
    extended: true
})); // to support URL-encoded bodies

// 3. HTTP CONTEXT
app.use(httpContext.middleware); // to support HTTP Context

// 4. INTERCEPTORS
app.use(reqIdGenerator); // Generate UUID as request Id
app.use(preInterceptor); // Custom Pre-Interceptor
app.use(errorHandler); // Catch Middleware Errors

// 5. SWAGGER INITIALIZATION
const config = {
    appRoot: __dirname, // required config
    swaggerSecurityHandlers: {
        BearerJwt: function (req, authOrSecDef, scopesOrApiKey, cb) {
            if (JwtUtil.verifyToken(scopesOrApiKey)) {
                cb(null);
            } else if (scopesOrApiKey) {
                const jwtErr = new CustomError(ResponseErrorCode.INVALID_ACCESS_TOKEN);
                cb(jwtErr);
            } else {
                cb(new CustomError(ResponseErrorCode.CREDENTIALS_REQUIRED));
            }
        }
    }
};
SwaggerExpress.create(config, async function (err, swaggerExpress) {
    if (err) { throw err; }

    // install middleware
    swaggerExpress.register(app);
    app.use(errorHandler);

    try {
        AppLogger.info("----- START OF SERVER -----");
        // Test database connection
        try {
            const mysql = require("./config/db").mysql;
            await mysql.testConnection();
            AppLogger.info("Check MySQL DB: Success connected MySQL database.");
        } catch (err) {
            AppLogger.info("Check MySQL DB: Failed to connect MySQL database.");
            process.exit(1);
        }

        // console display
        const port = envConfig.app.port;
        console.log("---------------------------------------------------");
        console.log(" TribeHired Digi RESTful Server");
        console.log("    NODE_ENV=" + process.env.NODE_ENV);
        console.log("    API Doc: " + envConfig.app.scheme + "://" + envConfig.app.host + envConfig.app.apiDocUrl);
        console.log("    Application started. Listening at port: " + port);
        console.log("---------------------------------------------------");
        app.listen(port);
    } catch (err) {
        AppLogger.error(err.stack);
        process.exit(1);
    }
});

// 6. NODE PROCESS WARN/ERROR HANDLERS
process.on("error", e => {
    AppLogger.error(e.stack);
    process.exit(1);
});
process.on("warning", e => AppLogger.warn(e.stack));

// 7. NODE PROCESS EXIT HANDLER
nodeCleanup((exitCode, signal) => {
    beforeServerStop(exitCode, signal); // Clean-up
    nodeCleanup.uninstall();
    return false;
});

/* --------- */
/* FUNCTIONS */
/* --------- */

function errorHandler(err, req, res, next) {
    // Handle Swagger/Application Errors
    if (err) {
        BaseController.respondAndLogError(res, err);
    }
}

function reqIdGenerator(req, res, next) {
    // Intercept: Assign UUID to each request
    const reqId = uuid.v1();
    httpContext.set("reqId", reqId);
    req.reqId = reqId; // Append request ID into request object to pass along
    next();
}

function preInterceptor(req, res, next) {
    if (envConfig.log.logAllRequests == 1) {
        BaseController.logRequest(req);
    } // Log All Request
    next();
}

async function beforeServerStop(exitCode, signal) {

    /* Do some clean-up before application closes */
    AppLogger.info("[beforeServerStop] Application stopping... Performing clean-ups...");

    // TODO: Cleaning

    AppLogger.info("[beforeServerStop] ----- END OF SERVER -----");
    try {
        process.kill(process.pid, signal); // finally, this line kills the process.
    } catch (err) {
        // do nothing
    }
}
