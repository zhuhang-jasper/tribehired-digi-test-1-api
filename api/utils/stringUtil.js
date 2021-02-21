/* --------------------- */
/* Utility : String    */
/* --------------------- */

module.exports = { isNotEmptyOrNull, returnEmptyStringIfNull, isAlphabetic, equalsIgnoreCase, headToLowerCase, sortAscending, sortDescending, toTitleCase, stringTruncate, getListFromDelimitedText, stringify, replaceVarsInText };

/**
 * Check if string is null or empty
 * @param value (any) value to be checked
 * @return (boolean) true = pass validation
 */
function isNotEmptyOrNull(value) {

    if (value != null && value != undefined && value.toString().trim().length) {
        return true;
    }
    return false;
}

/**
 * Check if string and int value is null or empty
 * @param value (string/int) value to be checked
 * @return empty string if is null value
 */
function returnEmptyStringIfNull(value) {

    if (Boolean(value) && value !== null && value !== undefined) {
        return value;
    }
    return "";
}

/**
 * Check if string consist only alphabetic characters only
 * @param value (string/int) value to be checked
 * @return true || false
 */
function isAlphabetic(value) {

    const result = /^[A-Za-z]+$/.test(value);

    return result;
}

function equalsIgnoreCase(str1 = "", str2 = "") {
    if (str1 && str2) {
        if (str1.toLowerCase() == str2.toLowerCase()) {
            return true;
        }
    }
}

function toTitleCase(strMessage) {
    if (!isNotEmptyOrNull(strMessage)) {
        return "";
    }
    return strMessage.split(/\s+/)
        .map(firstChar => firstChar[0].toUpperCase() + firstChar.substr(1).toLowerCase())
        .join(" ");
}

function headToLowerCase(strMessage) {
    if (!isNotEmptyOrNull(strMessage)) {
        return "";
    }
    return strMessage.split(/\s+/)
        .map(firstChar => firstChar[0].toLowerCase() + firstChar.substr(1))
        .join(" ");
}

function sortAscending(obj1, obj2, key) {
    if (typeof obj1[key] === "string" && typeof obj2[key] === "string") {
        if (obj1[key].toLowerCase() < obj2[key].toLowerCase()) {
            return -1;
        }
        if (obj1[key].toLowerCase() > obj2[key].toLowerCase()) {
            return 1;
        }
    } else {
        if (obj1[key] < obj2[key]) {
            return -1;
        }
        if (obj1[key] > obj2[key]) {
            return 1;
        }
    }
    return 0;
}

function sortDescending(obj1, obj2, key) {
    return sortAscending(obj1, obj2, key) * -1;
}

function stringTruncate(string, length, text) {
    if (!string) { return null; }
    if (string.length > length) {
        return string.substring(0, length) + text;
    } else {
        return string;
    }

}

function getListFromDelimitedText(text = "", delimiter = ",") {
    if (text) {
        return text.split(delimiter).filter(item => isNotEmptyOrNull(item)).map(item => item.trim());
    }
    return [];
}

function stringify(value) {
    return value ? value.toString() : value;
}

/**
 * Replace variables in text with actual value
 * Variable format: "{n}"
 * @param msg original message
 * @param params variables
 * @param keyOpen character before variable index (default: '{')
 * @param keyClose character after variable index (default: '}')
 */
function replaceVarsInText(msg, params, keyOpen = "{", keyClose = "}") {
    if (!isNotEmptyOrNull(msg)) {
        return null;
    }
    for (let i = 0; i < params.length; i++) {
        msg = msg.replace(`${keyOpen}${i}${keyClose}`, params[i]);
    }
    // remove any unreplaced variables
    msg = replaceUnusedVarsInText(msg);
    return msg;
}

function replaceUnusedVarsInText(msg, keyOpen = "{", keyClose = "}") {
    if (!isNotEmptyOrNull(msg)) {
        return null;
    }
    const rgx = new RegExp(`${keyOpen}\\d*${keyClose}`, "g");
    msg = msg.replace(rgx, ""); // remove unused {n}
    msg = msg.replace(/\(\)/g, ""); // remove empty brackets
    msg = msg.replace(/ {2,}/g, " "); // remove consecutive spaces
    return msg;
}
