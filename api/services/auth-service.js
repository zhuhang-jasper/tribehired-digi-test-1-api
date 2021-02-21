const appRoot = require("app-root-path");
const AppLogger = require(appRoot + "/config/logger/appLogger");
const envConfig = require(appRoot + "/config/config");

// DB requirement
// const mysql = require('../../db').mysql;

// Utility requirement
const JwtUtil = require("../utils/jwtUtil");
// const moment = require('moment');
// const bcrypt = require('bcrypt');

// Services
// const accessControlService = require('./access-control-service');

// Constants
// const UserRole = require('../constants/userRole');

// Models
// const User = require('../models/user');

// Error Handling
// const CustomError = require('../base/CustomError');
// const ErrorCode = require('../constants/responseErrorCode');
// const ResponseObject = require('../base/ResponseObject');

module.exports = { genJwtTokenFromAccountInfo };

/* PUBLIC FUNCTIONS / MAIN SERVICES : Consumes Error */
/* PRIVATE FUNCTIONS / SUB SERVICES : Throws Error */

const IDENTIFIER = "AuthService";
function logService(str) {
    AppLogger.debug(`Calling ${IDENTIFIER}->${str}()...`);
}

async function genJwtTokenFromAccountInfo(accountInfo) {
    logService("genJwtTokenFromAccountInfo");

    const tokenInfo = {
        id: accountInfo.id,
        name: accountInfo.name,
        email: accountInfo.email
    };

    const tokenExpireTime = parseInt(envConfig.biz.token.loginSessionValidityInSec);
    const jwtToken = JwtUtil.signToken("accountInfo", tokenInfo, tokenExpireTime);

    const body = {
        ...tokenInfo,
        token: jwtToken,
        expiresIn: tokenExpireTime
    };

    return body;
}
