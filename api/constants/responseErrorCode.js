const NumberUtil = require("../utils/numberUtil");

const errorCode = {

    /* JWT/AUTHENTICATION ERRORS : 2XX */
    CREDENTIALS_REQUIRED: {
        code: "200",
        message: "No authorization token was found."
    },
    ACCESS_TOKEN_EXPIRED: {
        code: "201",
        message: "The authorization token has expired. Please relogin."
    },
    INVALID_ACCESS_TOKEN: {
        code: "202",
        message: "The authorization token is invalid. Malformed token."
    },
    UNAUTHORISED_ACCESS: {
        code: "210",
        message: "User is unauthorised to perform this action."
    },

    /* REQUEST ERRORS / 1ST LEVEL VALIDATION : 3XX */
    INVALID_REQUEST_PARAMETER: {
        code: "300",
        message: "Input Validation Error: Invalid parameter"
    },

    /* SERVER/INFRA/DB ERRORS : 4XX */
    UNKNOWN_EXCEPTION: {
        code: "400",
        message: "Unknown Exception Occured"
    },
    TIME_OUT: {
        code: "401",
        message: "Server Timeout Error"
    },
    // SERVICE_NOT_AVAILABLE: {
    //     code: "???",
    //     message: "System is currently under maintenance"
    // },
    DB_MYSQL_CONNECTION_GET_FAILED: {
        code: "450",
        message: "Failed to get MySQL database connection. See log."
    },
    DB_MYSQL_QUERY_EXECUTE: {
        code: "460",
        message: "Error occured when performing MySQL query."
    },

    /* APPLICATION ERRORS / INTERNAL : 5XX */
    ERR_UNCAUGHT_EXCEPTION: {
        code: "500",
        message: "Unexpected exception in application"
    },
    // ERR_BULK_OPERATION: {
    //     code: "501",
    //     message: "Failure in bulk operation"
    // },

    /* OSCC GENERAL API PRE-VALIDATIONS : 60X */
    ERR_INTERNAL_OSCC_SERVICE_UNEXPECTED_RESPONSE: {
        code: "600",
        message: "Potential developer mistake in OsccService module. Response is not type of ResponseObject."
    },
    ERR_INTERNAL_OSCC_SERVICE_INVOKER_EXCEPTION: {
        code: "601",
        message: "Potential developer mistake in OsccService module. Exception occured in invokeRequest()."
    },
    ERR_INTERNAL_OSCC_INVALID_HTTP_REQUEST: {
        code: "602",
        message: "Invalid HTTP request to OSCC API"
    },
    ERR_INTERNAL_OSCC_INVALID_REQUEST_PARAMETER: {
        code: "603",
        message: "Invalid request parameters to OSCC API"
    },

    /* OSCC RESPONSE ERROR : 610+ */
    OSCC_ERR_COULD_NOT_GET_RESPONSE: {
        code: "610",
        message: "Error occured while connecting to OSCC API, or no HTTP response was returned by OSCC API"
    },
    // @amendment errorCode
    OSCC_ERR_HTTP_HEADER: {
        type: "OSCC_ERR_HTTP_HEADER",
        code: "611",
        message: "OSCC respond HTTP {0}: {1}",
        desc: "OSCC API returns HTTP not 200."
    },
    // @amendment errorCode
    OSCC_ERR_HTTP_BODY: {
        type: "OSCC_ERR_HTTP_BODY",
        code: "612",
        message: "OSCC respond Error: {0}",
        desc: "OSCC API returns HTTP 200 but with error code."
    },

    /* OSCC API SPECIFIC REALM ERRORS : 620+ */

    // MAIN REALM
    OSCC_ERR_MAIN_REGISTER_APPLICATION: {
        code: "620",
        message: "Error occured at OSCC API: Main Register Application"
    },
    OSCC_ERR_MAIN_UNREGISTER_APPLICATION: {
        code: "620",
        message: "Error occured at OSCC API: Main Unregister Application"
    },
    OSCC_ERR_MAIN_LOGON: {
        code: "620",
        message: "Error occured at OSCC API: Main Logon Application"
    },
    OSCC_ERR_MAIN_KEEP_ALIVE: {
        code: "620",
        message: "Error occured at OSCC API: Main Keep Alive"
    },

    // ADMIN REALM
    OSCC_ERR_ADMIN_GET_USERS: {
        code: "621",
        message: "Error occured at OSCC API: Admin GetUsers"
    },
    OSCC_ERR_ADMIN_START_LISTEN_FOR_EVENTS: {
        code: "621",
        message: "Error occured at OSCC API: Admin StartListenForEvents"
    },
    OSCC_ERR_ADMIN_STOP_LISTEN_FOR_EVENTS: {
        code: "621",
        message: "Error occured at OSCC API: Admin StopListenForEvents"
    },

    // PRESENCE REALM
    OSCC_ERR_PRESENCE_START_LISTEN_FOR_EVENTS: {
        code: "622",
        message: "Error occured at OSCC API: Presence StartListenForEvents"
    },
    OSCC_ERR_PRESENCE_STOP_LISTEN_FOR_EVENTS: {
        code: "622",
        message: "Error occured at OSCC API: Presence StopListenForEvents"
    },
    OSCC_ERR_PRESENCE_SET_ROUTING_STATE: {
        code: "622",
        message: "Error occured at OSCC API: Presence Set Routing State"
    },

    // ROUTING REALM
    OSCC_ERR_ROUTING_START_LISTEN_FOR_EVENTS: {
        code: "623",
        message: "Error occured at OSCC API: Routing StartListenForEvents"
    },
    OSCC_ERR_ROUTING_STOP_LISTEN_FOR_EVENTS: {
        code: "623",
        message: "Error occured at OSCC API: Routing StopListenForEvents"
    },

    // TELEPHONY REALM
    OSCC_ERR_TELEPHONY_LOGON: {
        code: "624",
        message: "Error occured at OSCC API: Telephony Logon"
    },
    OSCC_ERR_TELEPHONY_LOGOFF: {
        code: "624",
        message: "Error occured at OSCC API: Telephony Logoff"
    },
    OSCC_ERR_TELEPHONY_DIAL: {
        code: "624",
        message: "Error occured at OSCC API: Telephony Dial"
    },
    OSCC_ERR_TELEPHONY_ANSWER: {
        code: "624",
        message: "Error occured at OSCC API: Telephony Answer"
    },
    OSCC_ERR_TELEPHONY_DISCONNECT: {
        code: "624",
        message: "Error occured at OSCC API: Telephony Disconnect"
    },
    OSCC_ERR_TELEPHONY_CONSULT: {
        code: "624",
        message: "Error occured at OSCC API: Telephony Consult"
    },
    OSCC_ERR_TELEPHONY_HOLD: {
        code: "624",
        message: "Error occured at OSCC API: Telephony Hold"
    },
    OSCC_ERR_TELEPHONY_RETRIEVE: {
        code: "624",
        message: "Error occured at OSCC API: Telephony Retrieve"
    },
    OSCC_ERR_TELEPHONY_RECONNECT: {
        code: "624",
        message: "Error occured at OSCC API: Telephony Reconnect"
    },
    OSCC_ERR_TELEPHONY_TRANSFER: {
        code: "624",
        message: "Error occured at OSCC API: Telephony Transfer"
    },
    OSCC_ERR_TELEPHONY_SINGLE_STEP_TRANSFER: {
        code: "624",
        message: "Error occured at OSCC API: Telephony Single Step Transfer"
    },
    OSCC_ERR_TELEPHONY_DIVERT: {
        code: "624",
        message: "Error occured at OSCC API: Telephony Divert"
    },
    OSCC_ERR_TELEPHONY_START_LISTEN_FOR_EVENTS: {
        code: "624",
        message: "Error occured at OSCC API: Telephony StartListenForEvents"
    },
    OSCC_ERR_TELEPHONY_STOP_LISTEN_FOR_EVENTS: {
        code: "624",
        message: "Error occured at OSCC API: Telephony StopListenForEvents"
    },
    OSCC_ERR_TELEPHONY_QUERY_LINE: {
        code: "624",
        message: "Error occured at OSCC API: Telephony Query Line"
    },
    OSCC_ERR_TELEPHONY_QUERY_CALL: {
        code: "624",
        message: "Error occured at OSCC API: Telephony Query Call"
    },

    /* POSITIVE ERROR MESSAGES : 100 */
    INVALID_LOGIN_CREDENTIALS: {
        code: "100",
        message: "Invalid Username or Password"
    },
    EMAIL_IN_USE: {
        code: "100",
        message: "Email already in use"
    },

    /**
     * Return HTTP status code with the closest meaning as the provided error code
     * (*Just for reference, Do not use as API response*)
        * * 5001xx ~ HTTP 200,
        * * 5002xx ~ HTTP 401/403,
        * * 5003xx ~ HTTP 400,
        * * others ~ HTTP 500
        @param errorCode the error code
     */
    getEquivalentStatusCodeFromErrorCode: function (errorCode) {
        errorCode = String(errorCode);
        if (NumberUtil.isNumeric(errorCode) && errorCode.startsWith("500")) {
            const code = errorCode.substring(3, errorCode.length - 1); // remove prefix 500
            if (code.startsWith("1")) {
                return 200;
            } else if (code.startsWith("2")) {
                return 401; // 403
            } else if (code.startsWith("3")) {
                return 400;
            } else {
                return 500;
            }
        }
        return null;
    }
};

module.exports = errorCode;
