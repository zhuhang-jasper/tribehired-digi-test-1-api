/* --------------------- */
/* Utility : Validator */
/* --------------------- */
const DateTimeUtil = require("./dateTimeUtil");
const StringUtil = require("./stringUtil");
const NumberUtil = require("./numberUtil");
const ObjectUtil = require("./objectUtil");
const CustomError = require("../base/CustomError");
const ErrorCode = require("../constants/responseErrorCode");

/**
 * Check input is boolean
 * @param value (string) input to be checked
 * @param compareToTrue (boolean) boolean to be checked against
 * @return (boolean) true = pass validation
 */
function isBool(value, compareToTrue = null) {
    if (value === undefined || value === null) {
        return false;
    }
    if (compareToTrue != null) {
        return value.toString().toLowerCase() == compareToTrue.toString();
    }
    return (value.toString().toLowerCase() == "true" || value.toString().toLowerCase() == "false");
}

function valueOrUndefined(value) {
    return ((value == undefined || value == null) ? undefined : value);
}

function booleanOrUndefined(value) {
    if (isBool(value) && value.toString() == "false") {
        return false;
    } else if (isBool(value) && value.toString() == "true") {
        return true;
    } else {
        return undefined;
    }
}

/**
 * Check Request Body fields based on specified type definitions.
 * Currently supported types: boolean/bool, integer/int, float, date/datetime
 * @param requestBody (object) request body object
 * @param typeDefs (object) type definition for fields to be validated
 * @param valueSelector (string) property of object to be validated:
 *                      'value' = requestBody[fieldName].value,
 *                         ''   = requestBody[fieldName]
 * @return (object) {
 *      valid:boolean, \*true = pass all validations\*
 *      errField:string, \*field with wrong data type\*
 *      errType:string, \*error type required/type/format\*
 *      errObj:Error \*throwable error object\*
 * }
 */
function validateParams(requestBody, typeDefs, valueSelector = "value") {

    let response = {
        valid: true,
        errField: "",
        errType: "",
        errObj: null
    };

    if (!requestBody || !typeDefs) {
        throw new Error("Error Validating Query Parameters. No request param or no type definition found!");
    }

    let hasViolation = false;

    outerloop:
    for (const fieldName in typeDefs) {
        if (!Object.prototype.hasOwnProperty.call(typeDefs, fieldName)) {
            continue;
        }

        const fieldValue = valueSelector ? requestBody[fieldName][valueSelector] : requestBody[fieldName];
        const fieldRule = typeDefs[fieldName];

        // Check Required
        if (fieldRule.required) {
            if (!Array.isArray(fieldValue) &&
                !StringUtil.isNotEmptyOrNull(fieldValue)) {
                hasViolation = true;
                response = initValidatorErrorRequired(response, fieldName);
            }
        }

        // Check Value Data Type and Format
        let fieldTypes = fieldRule.type || [];
        if (!Array.isArray(fieldTypes) && typeof fieldTypes == "string") {
            fieldTypes = [fieldTypes];
        }
        if (!hasViolation && StringUtil.isNotEmptyOrNull(fieldValue)) {

            let passAny = false;
            for (const fieldType of fieldTypes) {
                switch (fieldType.toLowerCase()) {
                    case "object": {
                        if (!ObjectUtil.isObject(fieldValue)) {
                            hasViolation = true;
                        }
                        break;
                    }
                    case "string": {
                        if (typeof fieldValue != "string") {
                            hasViolation = true;
                        }
                        break;
                    }
                    case "array": {
                        if (!Array.isArray(fieldValue)) {
                            hasViolation = true;
                        }
                        break;
                    }
                    case "bool":
                    case "boolean": {
                        if (!isBool(fieldValue)) {
                            hasViolation = true;
                        }
                        break;
                    }
                    case "int":
                    case "integer": {
                        if (Boolean(fieldRule.maxLength) && fieldValue.length > fieldRule.maxLength) {
                            hasViolation = true;
                            response = initValidatorErrorMaxLength(response, fieldName, fieldRule);
                        } else if (!NumberUtil.isInteger(fieldValue)) {
                            hasViolation = true;
                        }
                        break;
                    }
                    case "float": {
                        if (Boolean(fieldRule.maxLength) && fieldValue.length > fieldRule.maxLength) {
                            hasViolation = true;
                            response = initValidatorErrorMaxLength(response, fieldName, fieldRule);
                        } else if (!NumberUtil.isFloat(fieldValue)) {
                            hasViolation = true;
                        }
                        break;
                    }
                    case "number": {
                        if (Boolean(fieldRule.maxLength) && fieldValue.length > fieldRule.maxLength) {
                            hasViolation = true;
                            response = initValidatorErrorMaxLength(response, fieldName, fieldRule);
                        } else if (!NumberUtil.isNumeric(fieldValue)) {
                            hasViolation = true;
                        }
                        break;
                    }
                    case "date":
                    case "datetime": {
                        const dateFormat = fieldRule.format || "";
                        if (!DateTimeUtil.checkDateFormat(fieldValue, dateFormat)) {
                            hasViolation = true;
                            response = initValidatorErrorDateFormat(response, fieldName);
                        }
                        break;
                    }
                    default: {
                        break;
                    }
                }
                if (hasViolation) {
                    hasViolation = !hasViolation;
                } else {
                    passAny = true;
                    hasViolation = false;
                    break;
                }
            }
            if (!passAny) {
                hasViolation = true;
            }
        }

        // Wrap Validation Response / Errors
        if (hasViolation) {
            response.valid = false;
            response.errField = fieldName;
            if (response.errType == "") {
                response = initValidatorErrorDataType(response, fieldName, fieldTypes);
            }
            break outerloop;
        }
    }

    // Wrap error as custom error
    if (response.errObj) {
        response.errObj = new CustomError({
            statusCode: ErrorCode.INVALID_REQUEST_PARAMETER.statusCode,
            code: ErrorCode.INVALID_REQUEST_PARAMETER.code,
            message: response.errObj.message
        });
    }
    return response;
}

const errorMessagePrefix = "Invalid parameter ";
function initValidatorErrorMaxLength(validatorResponse, fieldName, fieldRule) {
    validatorResponse.errType = "maxLength";
    validatorResponse.errObj = new Error(errorMessagePrefix +
        "(" + fieldName + "): Value length exceeds limit of " + fieldRule.maxLength);
    return validatorResponse;
}

function initValidatorErrorRequired(validatorResponse, fieldName) {
    validatorResponse.errType = "required";
    validatorResponse.errObj = new Error(errorMessagePrefix +
        "(" + fieldName + "): Empty value for required field");
    return validatorResponse;
}

function initValidatorErrorDateFormat(validatorResponse, fieldName) {
    validatorResponse.errType = "dateFormat";
    validatorResponse.errObj = new Error(errorMessagePrefix +
        "(" + fieldName + "): Incorrect date format for field");
    return validatorResponse;
}

function initValidatorErrorDataType(validatorResponse, fieldName, fieldTypes) {
    validatorResponse.errType = "dataType";
    validatorResponse.errObj = new Error(errorMessagePrefix +
        "(" + fieldName + "): Expected type [" + fieldTypes +
        "]");
    return validatorResponse;
}

module.exports = { isBool, validateParams, errorMessagePrefix, valueOrUndefined, booleanOrUndefined };
