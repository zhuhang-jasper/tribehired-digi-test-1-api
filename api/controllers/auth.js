const appRoot = require("app-root-path");
// const config = require(appRoot + '/config/config');
const AppLogger = require(appRoot + "/config/logger/appLogger");
const BaseController = require("../base/baseController");

// Utility requirement
const ParamValidator = require("../utils/validator");
// const JwtUtil = require('../utils/jwtUtil');
// const moment = require('moment');

// Services
const AuthService = require("../services/auth-service");
const AccountService = require("../services/account-service");

// Error Handling
const CustomError = require("../base/CustomError");
const ErrorCode = require("../constants/responseErrorCode");

module.exports = { authenticate };

const IDENTIFIER = "AuthController";
function logController(str) {
    AppLogger.debug(`Calling ${IDENTIFIER}->${str}()...`);
}

async function authenticate(req, res) {
    logController("authenticate");

    try {
        // Validate Query Parameters
        const validatorResponse = ParamValidator.validateParams(
            req.body, // GET:req.query | POST:req.body
            {
                email: { type: "string", required: true },
                password: { type: "string", required: true }
            },
            null // GET:'value' | POST:null
        );
        if (validatorResponse.errObj != null) {
            throw validatorResponse.errObj;
        }

        // Prepare request params
        const email = req.body.email;
        const password = req.body.password;

        // Login attempt
        const loginResp = await AccountService.login(email, password);
        if (loginResp.body && loginResp.body.id) {
            const resp = await AuthService.genJwtTokenFromAccountInfo(loginResp.body);
            BaseController.respond(res, resp);
        } else {
            throw new CustomError(ErrorCode.INVALID_LOGIN_CREDENTIALS);
        }
    } catch (err) {
        BaseController.respondAndLogError(res, err);
    }
}
