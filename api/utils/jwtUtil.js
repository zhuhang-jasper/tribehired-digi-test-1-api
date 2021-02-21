/* -------------------------- */
/* Utility : Json Web Token */
/* -------------------------- */
const appRoot = require("app-root-path");
const logger = require(appRoot + "/config/logger/appLogger");

const fs = require("fs");
const jwt = require("jsonwebtoken");
const publicCert = fs.readFileSync("./config/Key/public.key");
const privateCert = fs.readFileSync("./config/Key/private.key");

const StringUtil = require("./stringUtil");

module.exports = { decodeToken, verifyToken, signToken };

/**
 * Decode token information
 * @param token (string) 'bearer iowejfeonfkoowasdae' (Get From Authorization Header)
 * @return (object) consists of infomation of user
 */
function decodeToken(bearerToken = null) {
    let decodedToken;

    if (StringUtil.isNotEmptyOrNull(bearerToken)) {
        let token;
        if (bearerToken.toUpperCase().includes("BEARER")) {
            token = bearerToken.split(" ")[1];
        } else {
            token = bearerToken;
        }
        decodedToken = jwt.decode(token, publicCert);
    } else {
        decodedToken = null;
    }
    return decodedToken;
}

function verifyToken(bearerToken = null) {

    try {
        if (StringUtil.isNotEmptyOrNull(bearerToken)) {
            const token = bearerToken.split(" ")[1];
            // console.log("token:" + token);
            jwt.verify(token, publicCert);
            // console.log(true)
            return true;
        }
        // console.log(false)
        return false;
    } catch (err) {
        logger.error(err.stack);
        return false;
    }
}

function signToken(tokenName = "tokenInfo", objToken, expireTime = undefined) {
    const option = {
        algorithm: "RS256"
    };
    if (expireTime !== undefined) {
        option.expiresIn = expireTime;
    }

    const token = {};
    token[tokenName] = objToken;

    return jwt.sign(token, privateCert, option);
}
