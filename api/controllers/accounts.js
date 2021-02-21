const appRoot = require("app-root-path");
const AppLogger = require(appRoot + "/config/logger/appLogger");
const BaseController = require("../base/baseController");

// Utility requirement
const ParamValidator = require("../utils/validator");
const NumberUtil = require("../utils/numberUtil");
const StringUtil = require("../utils/stringUtil");
// const ObjectUtil = require("../utils/objectUtil");
// const moment = require('moment');

// Services
const AccountService = require("../services/account-service");

// Constants

// Error Handling
// const ErrorCode = require('../constants/responseErrorCode');
// const CustomError = require('../base/CustomError');
// const ResponseObject = require('../base/ResponseObject');

module.exports = {
    getAccounts,
    registerAccount
};

const IDENTIFIER = "AccountsController";
function logController(str) {
    AppLogger.debug(`Calling ${IDENTIFIER}->${str}()...`);
}

async function getAccounts(req, res) {
    logController("getAccounts");

    try {
        // Validate Query Parameters
        const validatorResponse = ParamValidator.validateParams(
            req.query, // GET:req.query | POST:req.body
            {
                name: { type: "string", required: false },
                pageSize: { type: "integer", required: false },
                currentPage: { type: "integer", required: false },
                sortField: { type: "string", required: false },
                sortAscending: { type: "boolean", required: false }
            },
            null // GET:'value' | POST:null
        );
        if (validatorResponse.errObj != null) {
            throw validatorResponse.errObj;
        }

        // Prepare request params
        const filterName = req.query.name;
        const pageSize = NumberUtil.numberOrUndefined(parseInt(req.query.pageSize));
        const currentPage = NumberUtil.numberOrUndefined(parseInt(req.query.currentPage));
        const sortField = StringUtil.headToLowerCase(req.query.sortField) || undefined;
        const sortAscending = ParamValidator.booleanOrUndefined(req.query.sortAscending);

        // Pull results from database
        const serviceResponse = await AccountService.getAccountList(undefined, filterName, pageSize, currentPage, sortField, sortAscending);
        BaseController.respondQueryResults(res, serviceResponse, pageSize, currentPage);

    } catch (err) {
        BaseController.respondAndLogError(res, err);
    }
}

async function registerAccount(req, res) {
    logController("registerAccount");

    try {
        // Validate Query Parameters
        const validatorResponse = ParamValidator.validateParams(
            req.body, // GET:req.query | POST:req.body
            {
                name: { type: "string", required: true },
                email: { type: "string", required: true },
                password: { type: "string", required: true }
            },
            null // GET:'value' | POST:null
        );
        if (validatorResponse.errObj != null) {
            throw validatorResponse.errObj;
        }

        // Prepare request params
        const name = req.body.name;
        const email = req.body.email;
        const password = req.body.password;

        // Proxy
        const serviceResponse = await AccountService.insertAccount(name, email, password);
        BaseController.respond(res, serviceResponse);

    } catch (err) {
        BaseController.respondAndLogError(res, err);
    }
}
