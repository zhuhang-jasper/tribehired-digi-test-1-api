/* ----------------------------- */
/* Utility : Data Access Layer */
/* ----------------------------- */

module.exports = { genSortingCriteria, withoutAlias };

/**
 * Generate SQL ORDER BY clause
 * @param fieldName (string) name of field to be sorted
 * @param isAscending (boolean) true = ascending sort
 * @param tableAlias (string) table alias of fieldName
 * @return (string) sql order by clause
 */
function genSortingCriteria(fieldName = "", isAscending = true, tableAlias = "") {

    // return NULL if no field name
    fieldName = fieldName.trim();
    if (fieldName == "") {
        return null;
    }

    // sort ascending if non boolean specified
    if (isAscending !== true && isAscending !== false) {
        isAscending = true;
    }

    // optional: table alias
    tableAlias = tableAlias.trim();
    if (tableAlias != "") {
        tableAlias += ".";
    }

    return " ORDER BY " + tableAlias + fieldName + " " + (isAscending ? "ASC" : "DESC") + " ";
}

function withoutAlias(tableNameWithAlias) {
    return tableNameWithAlias.split(/\s+/)[0];
}
