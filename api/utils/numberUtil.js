/* --------------------- */
/* Utility : Number    */
/* --------------------- */

module.exports = { lpad, isInteger, isFloat, isNumeric, roundOff, nullIfUndefined, numberOrZero, int2float, numberOrUndefined, numberOrNull, numberOrDash, formatFloat, formatHourMinute, getDurationInHhMmSs };

/**
 * Left pad numeric value with leading characters
 * @param number (number) number to be padded
 * @param length (number) length of final output
 * @param paddingChar (string) character to left padding
 * @return (number) concatination of year and week
 */
function lpad(number = 0, length = 0, paddingChar) {
    let s = number.toString();
    while (s.length < length) {
        s = paddingChar + s;
    }
    return s;
}

/**
 * Check input is integer
 * @param x (string) input to be checked
 * @return (boolean) true = pass validation
 */
function isInteger(x) {
    const y = parseInt(x, 10);
    return !isNaN(y) && x == y && x.toString() == y.toString();
    // return (typeof value === 'number') && ((value % 1) === 0);
    // return Number.isInteger(value);
}

/**
 * Check input is float
 * @param x (string) input to be checked
 * @return (boolean) true = pass validation
 */
function isFloat(x) {
    const floatRegex = /^-?\d+(?:[.,]\d*?)?$/;
    if (!floatRegex.test(x)) {
        return false;
    }

    return !isNaN(parseFloat(x));
    // return Number.isFloat(value);
}

/**
 * Check input is Number
 * @param n (any) input to be checked
 * @return (boolean) true = pass validation
 */
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * Round off float value to specified number of decimal places
 * @param n number to be round off
 * @param p precision (number of decimal places)
 * @return (number) value after rounding off
 */
function roundOff(n, p) {
    try {
        const n1 = n * Math.pow(10, p + 1);
        const n2 = Math.floor(n1 / 10);
        if (n1 >= (n2 * 10 + 5)) {
            return (n2 + 1) / Math.pow(10, p);
        }
        return n2 / Math.pow(10, p);
    } catch (err) {
        return 0;
    }
}

/**
 * Converts float value into string, rounded off to specified number of decimal places
 * @param n number to be round off
 * @param p precision (number of decimal places)
 * @param textIfNullOrZero string to display if input value is null or 0. Default '-' for null & unset for zeroes
 * @return (string) value after rounding off
 */
function formatFloat(n, p, textIfNullOrZero = null) {
    if (isNumeric(n)) {
        const formatted = roundOff(n, p).toFixed(p);
        if (!textIfNullOrZero) {
            return formatted;
        } else {
            return Number(formatted) == 0 ? textIfNullOrZero : formatted;
        }
    } else {
        return textIfNullOrZero || "-";
    }
}

/**
 * Converts hours with fraction into hour:minute format
 * @param duration fractional number value
 * @param textIfNull string to display if empty duration
 * @return (string) formatted text in HH:mm, or specified textIfNull
 */
function formatHourMinute(duration = 0, textIfNull = "00:00", format = "HH:MM") {

    if (!isNumeric(duration)) {
        return textIfNull;
    }

    const fractionalHour = Math.abs(duration % 1);
    const h = Math.floor(duration).toString();
    const m = formatFloat(fractionalHour * 60, 0);
    const hh = h.length < 2 ? `0${h}` : h;
    const mm = m.length < 2 ? `0${m}` : m;

    const result = format
        .replace("HH", hh)
        .replace("MM", mm)
        .replace("H", h)
        .replace("M", m);

    return result;
}

function nullIfUndefined(val) {
    return val === undefined ? null : val;
}

function numberOrZero(val) {
    return (isNumeric(val) ? val : 0);
}

function numberOrNull(val) {
    return (isNumeric(val) ? val : null);
}

function numberOrUndefined(val) {
    return (isNumeric(val) ? val : undefined);
}

function numberOrDash(val) {
    return (isNumeric(val) ? val : "-");
}

function int2float(x) {
    if (isInteger(x)) {
        return Number(x);
    } else if (isFloat(x)) {
        return x;
    }
    return null;
}

function getDurationInHhMmSs(milliseconds) {
    return {
        second: parseInt(milliseconds / 1000 % 60),
        minute: parseInt(milliseconds / (60 * 1000) % 60),
        hour: parseInt(milliseconds / (60 * 60 * 1000))
    };
}
