"use strict";
const appRoot = require("app-root-path");
const logger = require(appRoot + "/config/logger/appLogger");
const config = require(appRoot + "/config/config");
const os = require("os");
const ip = require("ip");

const StatusCode = require("../constants/responseStatusCode");
const ErrorCode = require("../constants/responseErrorCode");
// const Validator = require("../utils/validator");
const CustomError = require("./CustomError");
const ResponseObject = require("./ResponseObject");

// const emailService = require('../services/email-service');
const EnvUtil = require("../utils/envUtil");
const ObjectUtil = require("../utils/objectUtil");

const moment = require("moment");
// const operationSupportEmail = config.biz.email.errorRecipientList;
// const operationSupportEmailCc = config.biz.email.errorCcList;

const excludeLoggingPath = [""];

function getRequestId() {
    const httpContext = require("express-http-context");
    return httpContext.get("reqId");
}

/* Empty Error Response Template */
const emptyApiErrorResponse = {
    reqId: "",
    statusCode: StatusCode.FAILED.code,
    errorCode: ErrorCode.UNKNOWN_EXCEPTION.code,
    errorMessage: ErrorCode.UNKNOWN_EXCEPTION.message
};

/* Empty Success Response Template */
const emptyApiSuccessResponse = {
    reqId: "",
    statusCode: StatusCode.SUCCESS.code,
    body: null
};

/**
 * Wraps Error into API Response Structure (using CustomError constructor)
 * @param error The throwable error object
 */
function getErrorResponse(error = null) {

    // var httpStatus = 500;
    const customError = new CustomError(error);
    const httpStatus = customError.statusCode;
    const resp = emptyApiErrorResponse;
    resp.reqId = getRequestId();
    resp.errorCode = customError.errorCode;
    resp.errorMessage = customError.errorMessage;
    resp.actualError = customError.actualError || undefined; // only ext-api show actual error in response

    return { statusCode: httpStatus, response: resp };
}

/* API Respond Helper Functions */
function respond(responder, responseObject) {
    if (!responseObject) {
        throw new Error("BaseController: Potential developer mistake. No responseObject given");
    } else if (!responder) {
        throw new Error("BaseController: Potential developer mistake. No swagger responder given");
    }
    if (responseObject instanceof ResponseObject) {
        if (responseObject.hasError()) {
            respondAndLogError(responder, responseObject.customError);
        } else {
            respondSuccessBody(responder, responseObject.body);
        }
    } else if (responseObject instanceof Error) {
        respondAndLogError(responder, responseObject);
    } else {
        respondSuccessBody(responder, responseObject);
    }
}

function respondSuccessBody(responder, responseBody) {
    if (!responseBody) {
        throw new Error("BaseController: Potential developer mistake. No responseBody given");
    } else if (!responder) {
        throw new Error("BaseController: Potential developer mistake. No swagger responder given");
    }
    const resp = emptyApiSuccessResponse;
    resp.reqId = getRequestId();
    resp.statusCode = StatusCode.SUCCESS.code;
    resp.body = responseBody;
    // resp.requestBody = getRequestBody(responder.req).body;
    sendApiResponse(responder, 200, resp);
}

function respondAndLogError(responder, errorObject) {
    if (!errorObject) {
        throw new Error("BaseController: Potential developer mistake. No errorObject given");
    } else if (!responder) {
        throw new Error("BaseController: Potential developer mistake. No swagger responder given");
    }
    errorObject = new CustomError(errorObject);
    const errResp = getErrorResponse(errorObject);
    logErrorStack(errorObject);

    // sendEmail(errorObject, responder);

    sendApiResponse(responder, errResp.statusCode, errResp.response);
}

function sendEmail(error, res) {
    logger.info("BaseController: sendEmail()");

    if (config.log.emailException == 0) {
        return;
    }

    const guessedStatusCode = ErrorCode.getEquivalentStatusCodeFromErrorCode(error.errorCode);
    // logger.info("error.errorCode = " + error.errorCode);
    // logger.info("guessedStatusCode = " + guessedStatusCode);
    const ignoredStatusCodes = [200, 400, 401, 403];
    if (ignoredStatusCodes.includes(error.statusCode) || ignoredStatusCodes.includes(guessedStatusCode)) {
        logger.info("Email: Skipped error due to whitelist");
        return;
    }

    error = new CustomError(error); // make into custom error

    if (EnvUtil.isLocal()) {
        if (config.log.emailLocalhostException == 0) {
            return; // skip localhost exceptions
        }
    }

    /** * Basic information ***/
    let message = "Environment: " + EnvUtil.environment + "<BR>" +
        "Host Name: " + os.hostname() + "<BR>" +
        "Host IP: " + ip.address() + "<BR>" +
        "Log path: " + config.log.path + "<BR>";

    /** * Error information ***/
    message += "<HR><BR>" +
        "<div style=\"margin-bottom:8px;\"><span style=\"font-size: 1.5em;\">" +
        "<U><B>Error information</B></U>" +
        "</span></div>" +
        "Date/Time: " + moment().format("YYYY-MM-DD HH:mm:ss.SSS") + " (GMT+8.00)<BR>" +
        "Request ID: " + getRequestId() + "<BR>" +
        "Request URL: " + res.req.url + "<BR>" +
        "Status Code: " + error.statusCode + "<BR>" +
        "Error Code: " + error.errorCode + "<BR>" +
        "Error Message: " + error.errorMessage + "<BR>" +
        "Details: <BR>" +
        "<BR>" +
        "<pre>" + error.toEmailable() + "</pre><BR>";

    /** * Request information ***/
    message += "<HR><BR>" +
        "<div style=\"margin-bottom:8px;\"><span style=\"font-size: 1.5em;\">" +
        "<U><B>Request information</B></U>" +
        "</span></div>" +
        "<pre>" + ObjectUtil.makeHtmlFriendly(getRequestBody(res.req)) + "</pre><BR>";

    // emailService.sendEmailViaPostfix(operationSupportEmail, operationSupportEmailCc, 'mtnt-ext-api exception', message);
}

function sendApiResponse(responder, statusCode, response) {
    if (!response) {
        throw new Error("BaseController: Potential developer mistake. No response given");
    } else if (!statusCode) {
        throw new Error("BaseController: Potential developer mistake. No statusCode given");
    } else if (!responder) {
        throw new Error("BaseController: Potential developer mistake. No swagger responder given");
    }
    // Log All Response
    if (config.log.logAllResponses == 1) {
        logResponse(response);
    }
    responder.status(statusCode).json(response);
}

/* API Log Helper Functions */

function getRequestBody(req) {
    const queryBody = req.query || {}; // GET requests
    const reqBody = req.body || {}; // POST,PUT,DELETE requests
    const requestInfo = {
        // logType: 'REQUEST',
        // reqId: req.reqId,
        client_ip: req.ip,
        client_remoteAddress: req.connection.remoteAddress,
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: {}
    };
    if (Object.keys(queryBody).length) {
        requestInfo.body = Object.assign({}, queryBody);
    } else if (Object.keys(reqBody).length) {
        requestInfo.body = Object.assign({}, reqBody);
    }

    // Mask sensitive info
    if (excludeLoggingPath.indexOf(requestInfo.url) != -1) {
        requestInfo.body = ObjectUtil.maskedProperties(requestInfo.body);
    }
    return requestInfo;
}

function logRequest(req) {
    if (req) {
        let requestInfo = getRequestBody(req);
        requestInfo = Object.assign({ logType: "REQUEST" }, requestInfo);
        logger.info(requestInfo);

        // if (excludeLoggingPath.indexOf(requestInfo.url) == -1) {
        //     logger.info(requestInfo);
        // } else {
        //     let req2 = requestInfo;
        //     req2.body = { message: 'PASSWORD not print out' };
        //     logger.info(req2);
        // }
    }
}

function logResponse(response) {
    if (response) {
        const responseInfo = Object.assign({ logType: "RESPONSE" }, response);
        delete responseInfo.reqId;
        logger.info(responseInfo);
    }
}

// function logDbBulkResponse(dbResponses) {
//     const responseInfo = {
//         logType: 'BULK_RESPONSE',
//         source: 'DB_MYSQL',
//         body: dbResponses
//     };
//     logger.info(responseInfo);
// }

function logErrorStack(error) {
    if (error instanceof CustomError) {
        logger.error(error.toLoggable());
        if (error.actualStack) {
            logger.error(error.actualStack);
        }
    } else if (error instanceof Error) {
        logger.error(error.stack);
    }
}

function respondQueryResults(responder, serviceResponse, pageSize, currentPage = 1) {
    let totalRecord = 0;
    const queryResult = serviceResponse.body.result;
    if (queryResult.length) {
        totalRecord = queryResult[0].TotalRecord;
        queryResult.forEach(result => delete result.TotalRecord);
    }
    const responseObj = {
        sort: serviceResponse.body.sort,
        totalRecord: totalRecord,
        totalPages: pageSize ? Math.ceil(totalRecord / pageSize) : 1,
        currentPage: currentPage,
        pageSize: pageSize,
        result: queryResult
    };
    respond(responder, responseObj);
}

function respondQueryResultsC4(responder, serviceResponse) {
    const queryResult = serviceResponse.body.result;
    const responseObj = {
        // totalRecord: queryResult.length,
        result: queryResult
    };
    respond(responder, responseObj);
}

module.exports = {
    // setRequestId,
    respond,
    respondQueryResults,
    respondQueryResultsC4,
    respondAndLogError,
    respondSuccessBody,
    logResponse,
    // logDbBulkResponse,
    logErrorStack,
    logRequest
};
