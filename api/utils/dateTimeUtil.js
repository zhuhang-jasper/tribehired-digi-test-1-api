/* --------------------- */
/* Utility : Date Time */
/* --------------------- */
const moment = require("moment");
const NumberUtil = require("./numberUtil");
const momentDurationFormatSetup = require("moment-duration-format");

module.exports = {
    checkDateFormat,
    convertDurationToHourMinute,
    sortAscending,
    sortDescending,
    convertMinToHourMin,
    formatHourToHourMin
};

/**
 * Check if input date follows the specified format
 * @param dateStr (string) date to be checked
 * @param format (string) date format to check with
 * @return (boolean) true = pass validation
 */
function checkDateFormat(dateStr = "", format = "YYYY-MM-DD") {

    if (dateStr == null || dateStr.trim().length == 0) {
        return false;
    }
    const momDate = moment(dateStr, format, true);

    return momDate.isValid();
}

function convertDurationToHourMinute(startDateTime, endDateTime) {
    momentDurationFormatSetup(moment);

    const start = moment(new Date(startDateTime));
    const end = moment(new Date(endDateTime));
    const diff = moment(end).diff(moment(start));
    let duration = moment.duration(diff).format("hh:mm");
    duration = duration.length < 3 ? `00:${duration}` : duration;

    return duration;
}

function sortAscending(obj1, obj2, key, format = "YYYY-MM-DD") {

    if (format) {
        const date1 = moment(obj1[key], format);
        const date2 = moment(obj2[key], format);
        if (date1.isBefore(date2)) {
            return -1;
        }
        if (date1.isAfter(date2)) {
            return 1;
        }
    }
    return 0;
}

function sortDescending(obj1, obj2, key) {
    return sortAscending(obj1, obj2, key) * -1;
}
function convertMinToHourMin(totalMins) {
    const tripHours = parseInt(totalMins / 60);
    const tripMins = parseInt(totalMins % 60);
    return (tripHours < 10 ? "0" + tripHours : tripHours) + ":" + (tripMins < 10 ? "0" + tripMins : tripMins);
}

/**
 * Converts hours with fraction into hour:minute format
 * @param durationInHours fractional hour value
 * @param textIfNull string to display if hours = null
 * @return (string) formatted text in HH:mm, or specified textIfNull
 */
function formatHourToHourMin(durationInHours = 0, textIfNull = "00:00") {

    if (!durationInHours || durationInHours == 0) {
        return textIfNull;
    }

    const fractionalHour = durationInHours % 1;
    const hours = Math.floor(durationInHours).toString();
    let minutes = NumberUtil.formatFloat(fractionalHour * 60, 0);
    if (minutes.length < 2) {
        minutes = "0" + minutes;
    }

    return hours + ":" + minutes;
}
