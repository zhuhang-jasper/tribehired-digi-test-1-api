const CustomError = require("./CustomError");
// const ErrorCode = require('../constants/responseErrorCode');
const StatusCode = require("../constants/responseStatusCode");

module.exports = class ResponseObject {

    // SAMPLE:
    //   new ResponseObject(new CustomError());
    //   new ResponseObject(responseBody);
    constructor(dataOrError) {
        if (dataOrError instanceof ResponseObject) {
            this.status = dataOrError.status;
            this.customError = dataOrError.customError;
            this.body = dataOrError.body;
        } else if (dataOrError instanceof CustomError) {
            this.status = StatusCode.FAILED.code;
            this.customError = dataOrError;
            // this.body = null;
        } else if (dataOrError instanceof Error) {
            this.status = StatusCode.FAILED.code;
            this.customError = new CustomError(dataOrError);
        } else {
            this.status = StatusCode.SUCCESS.code;
            this.customError = null;
            this.body = dataOrError;
        }
    }

    setStatus(code) {
        this.status = code;
    }

    setStatusFailed() {
        this.status = StatusCode.FAILED.code;
    }

    hasError() {
        if (this.customError != null || this.status == StatusCode.FAILED.code) {
            return true;
        }
        return false;
    }

    isSuccess() {
        if (this.status == StatusCode.SUCCESS.code) {
            return true;
        }
        return false;
    }

};
