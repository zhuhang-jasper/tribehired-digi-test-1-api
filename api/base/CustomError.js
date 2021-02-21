// const appRoot = require('app-root-path');
// const logger = require(appRoot + '/config/logger/appLogger');

const ObjectUtil = require("../utils/objectUtil");
const NumberUtil = require("../utils/numberUtil");
const StringUtil = require("../utils/stringUtil");
const ErrorCode = require("../constants/responseErrorCode");
// const Validator = require("../utils/validator");

module.exports = class CustomError extends Error {

    /* SMART DIFFERENTIATE ERROR & CUSTOM ERROR */
    // SAMPLE:
    //   throw new CustomError(throwableError);
    //   throw new CustomError(ErrorCode.ERR_SOMETHING);
    //   throw new CustomError({ code:"", message: ""});
    //   throw new CustomError({... custom: {code:"", message:""}});
    constructor(errObj) {
        super(getErrorNameForSuper());
        this.name = "CustomError"; // Change the type of error

        function getErrorNameForSuper() {
            if (errObj instanceof CustomError || errObj instanceof Error) {
                return errObj.message;
            } else if (typeof errObj === "string") {
                return errObj.trim();
            } else {
                return typeof errObj;
            }
        }

        this.statusCode = 500;

        // CASE 1: CustomError
        if (errObj instanceof CustomError) {
            this.statusCode = errObj.statusCode;
            this.errorCode = errObj.errorCode;
            this.errorMessage = errObj.errorMessage;
            this.transferActualError(errObj);
            // return; // skip the rest checking
        }
        // CASE 2: Throwable Error
        else if (errObj instanceof Error) {
            let keepOriginalErrorCopy = false;
            // SUB CASE : JWT Error
            if (this.isJwtError(errObj)) {
                // logger.debug("CustomError: is JWT Error");
                this.statusCode = errObj.status;
                this.errorCode = errObj.code;
                this.errorMessage = errObj.message;
            }
            // SUB CASE : Swagger Error
            else if (this.isSwaggerError(errObj)) {
                // logger.debug("CustomError: is Swagger Error");
                this.statusCode = errObj.statusCode;
                this.errorCode = errObj.errors[0].code;
                this.errorMessage = errObj.errors[0].message;
            }
            // SUB CASE : Body Parser Error
            else if (this.isBodyParserError(errObj)) {
                // logger.debug("CustomError: is Body Parser Error");
                this.statusCode = errObj.status;
                this.errorCode = errObj.type;
                this.errorMessage = errObj.message;
            }
            // SUB CASE : Validator Error
            // else if (this.isValidatorError(errObj)) {
            //     // logger.debug("CustomError: is Validator Error");
            //     this.statusCode = 400; //bad request
            //     this.errorCode = ErrorCode.INVALID_REQUEST_PARAMETER.code;
            //     this.errorMessage = errObj.message;
            // }
            // SUB CASE : MySQL Error
            else if (this.isMySqlError(errObj)) {
                // logger.debug("CustomError: is MySQL Error");
                // this.errorCode = 'DB_MYSQL_' + errObj.code;
                this.errorCode = ErrorCode.DB_MYSQL_QUERY_EXECUTE.code;
                this.errorMessage = errObj.errno + ": " + errObj.sqlMessage;
                // logger.error(errObj.stack); //avoid stack trace missing
                keepOriginalErrorCopy = true;
                // Remove info that already appended to errCode & errMsg
                delete errObj.code;
                delete errObj.errno;
                delete errObj.sqlMessage;
            }
            // SUB CASE : Other Throwable Errors
            else {
                // console.log("CustomError: is other throwable Error");
                this.errorCode = ErrorCode.ERR_UNCAUGHT_EXCEPTION.code;
                this.errorMessage = this.formatErrorNameMessage(errObj.name, errObj.message);
                // logger.error(errObj.stack); //avoid stack trace missing
                keepOriginalErrorCopy = true;
            }
            if (keepOriginalErrorCopy) {
                this.saveAsActualError(errObj);
            }
        }
        // CASE 3: ErrorCode Amendment Object
        else if (this.isErrorCodeAmendmentObject(errObj)) {
            // logger.debug("CustomError: is derived from ErrorCode amendment object");
            // logger.debug("CustomError @amendment: " +  ErrorCode[errObj.type].desc);
            // this.errorCode = errObj.type + '_' + errObj.codeAmend;
            // this.errorMessage = ErrorCode[errObj.type].message + errObj.messageAmend;
            this.errorCode = ErrorCode[errObj.type].code;
            this.errorMessage = StringUtil.replaceVarsInText(ErrorCode[errObj.type].message, errObj.amend);
        }
        // CASE 4: ErrorCode Constant / Custom ErrorCode with Message
        else if (this.isErrorCodeObject(errObj)) {
            // logger.debug("CustomError: is derived from ErrorCode Constant");
            this.statusCode = errObj.statusCode || this.statusCode;
            this.errorCode = errObj.code;
            this.errorMessage = errObj.message;
        }
        // TIMEOUT ERROR
        else if (errObj == "timeout") {
            this.errorCode = ErrorCode.TIME_OUT.code;
            this.errorMessage = ErrorCode.TIME_OUT.message;
            this.saveAsActualError(errObj);
        }
        // DEFAULT: Unknown Exception
        else {
            // logger.debug("CustomError: is Unknown Error");
            this.errorCode = ErrorCode.UNKNOWN_EXCEPTION.code;
            this.errorMessage = ErrorCode.UNKNOWN_EXCEPTION.message;
            this.saveAsActualError(errObj);
            // this.saveAsActualError(new Error('Unknown Error instance Received: ' + JSON.stringify(errObj)));
        }

        // Prioritise Custom assigned errors
        // console.log("CustomError: checking... Prioritise Custom assigned errors", errObj);
        if (errObj.custom && this.isErrorCodeObject(errObj.custom)) {
            // console.log("CustomError: is custom throwable Error");
            this.statusCode = 500;
            this.errorCode = errObj.custom.code;
            if (errObj.custom.message) {
                this.errorMessage = errObj.custom.message;
            }
            if (errObj instanceof CustomError) {
                this.saveAsActualError(errObj);
            }
        }

        // Set OSCC Error Code
        if (errObj.osccErrorCode) {
            this.osccErrorCode = errObj.osccErrorCode;
        }

        // Force correct http status codes
        // if (this.errorCode == ErrorCode.INVALID_REQUEST_PARAMETER.code) {
        //     this.statusCode = 400; //bad request
        // }

        // Change Error codes to 500xxx
        if (NumberUtil.isNumeric(this.errorCode) && String(this.errorCode).length < 6) {
            this.errorCode = `${this.statusCode}${this.errorCode}`;
        }

        // Force errorCode to UPPER case
        this.errorCode = this.errorCode.toUpperCase();
    }

    setStatusCode(statusCode) {
        this.statusCode = statusCode;
    }

    saveAsActualError(errObj) {

        // Keep original error details
        // let tempActualError = {};
        if (errObj instanceof CustomError) {
            this.actualError = {
                errorCode: errObj.errorCode,
                errorMessage: errObj.errorMessage
            };
            // ObjectUtil.mergeDeep({}, errObj);
        } else if (errObj instanceof Error) {
            // tempActualError = {
            //     name: errObj.name,
            //     message: errObj.message,
            //     stack: errObj.stack
            // };
            this.actualError = this.formatErrorNameMessage(
                errObj.name, errObj.message
            );
            this.actualStack = errObj.stack;
        } else {
            this.actualError = JSON.stringify(errObj, null, 2);
        }

        // this.actualError = tempActualError;
        // delete this.actualError.custom;
        // delete this.actualError.statusCode;
    }

    transferActualError(customError) {
        // Copy original error details from another Custom Error object
        if (customError.actualError) {
            // this.actualError = ObjectUtil.mergeDeep({}, customError.actualError);
            this.actualError = customError.actualError;
        }
        if (customError.actualStack) {
            this.actualStack = customError.actualStack;
        }
    }

    // Error Rules
    isErrorCodeAmendmentObject(error) {
        return (typeof error == "object" && error.type);
        // && error.codeAmend && error.messageAmend);
    }

    isErrorCodeObject(error) {
        return (typeof error == "object" && error.code);
    }

    isJwtError(error) {
        return (error.status && error.code && error.inner);
    }

    isSwaggerError(error) {
        return (error.statusCode && error.errors && error.errors.length);
    }

    // isValidatorError(error) {
    //     return (error.message.indexOf(Validator.errorMessagePrefix) != -1);
    // }

    isMySqlError(error) {
        return (error.code && error.errno && error.sqlMessage);
    }

    isBodyParserError(error) {
        return (error.status && error.type);
    }

    formatErrorNameMessage(errName, errMessage) {
        if (errName && errMessage) {
            // return {
            //     error: errName,
            //     errorMessage: errMessage
            // };
            return `${errName}: ${errMessage}`;
        }
        return undefined;
    }

    toSimpleLoggableObj() {
        const resp = {
            errorCode: this.errorCode,
            errorMessage: this.errorMessage,
            osccErrorCode: this.osccErrorCode
        };
        return resp;
    }

    toLoggableObj(actualErrorStack = false) {
        const resp = {
            errorCode: this.errorCode,
            errorMessage: this.errorMessage,
            osccErrorCode: this.osccErrorCode,
            actualError: this.actualError
        };

        if (!resp.actualError || ObjectUtil.isEmpty(resp.actualError)) {
            delete resp.actualError;
        } else if (actualErrorStack && this.actualStack) {
            resp.actualStack = this.actualStack;
        }

        return resp;
    }

    toLoggable() {
        const loggable = this.toLoggableObj();

        // Log Stack Trace if is Pure Throwable Error
        // if (loggable.errorCode == ErrorCode.ERR_UNCAUGHT_EXCEPTION.code) {
        //     return this.actualStack;
        // }
        // else if (loggable.errorMessage == loggable.actualError.message) {
        //     delete loggable.actualError;
        // }

        // if (this.actualStack) {
        //     logger.error(this.actualStack);
        // }

        return JSON.stringify(loggable, null, 2);
        // return `${this.errorCode} - ${this.errorMessage}`;
    }

    toEmailable() {
        const loggable = this.toLoggableObj(true);
        let stack = "";
        if (loggable.actualStack) {
            stack = ObjectUtil.makeHtmlFriendly(loggable.actualStack);
        } else {
            stack = ObjectUtil.makeHtmlFriendly(loggable);
        }
        return stack;
    }

};
