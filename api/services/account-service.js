const appRoot = require("app-root-path");
const AppLogger = require(appRoot + "/config/logger/appLogger");
const config = require(appRoot + "/config/config");

// DB requirement
const mysql = require("../../config/db").mysql;

// Utility requirement
// const moment = require("moment");
const bcrypt = require("bcrypt");
const DalUtil = require("../utils/dalUtil");
const ObjectUtil = require("../utils/objectUtil");
const NumberUtil = require("../utils/numberUtil");
const StringUtil = require("../utils/stringUtil");

// DAL
const AccountModel = require("../models/account");
const AccountDal = require("../dals/accountDal");

// Constants
// const StatusCode = require("../constants/responseStatusCode");

// Error Handling
const ResponseObject = require("../base/ResponseObject");
const CustomError = require("../base/CustomError");
const ErrorCode = require("../constants/responseErrorCode");

// Database Table Names
const accountTable = "account"; // a

module.exports = {
    getAccountList,
    insertAccount,
    login
};

const IDENTIFIER = "AccountService";
function logService(str, ...args) {
    AppLogger.debug(`Calling ${IDENTIFIER}->${str}()... | ${args.join()}`);
}

/**
 * Service: Get Account List
 * @param {String[]} ids account ids
 * @param {String} filterName filterName
 * @param {Number} pageSize pageSize
 * @param {Number} currentPage currentPage
 * @param {String} sortField sortField
 * @param {Boolean} sortAscending sortAscending
 */
async function getAccountList(ids = null, filterName = null, pageSize = null, currentPage = 1, sortField = "", sortAscending = true) {
    logService("getAccountList");

    // Prepare SQL statement
    const selectors = " a.id, " +
        " a.email, " +
        " a.name ";
    let sql = ` SELECT ${selectors} ` +
        ` FROM ${accountTable} a ` +
        " WHERE 1=1 ";

    // Prepare SQL params
    let params = [];
    if (Array.isArray(ids) && ids.length) {
        sql += " AND a.id IN (?) ";
        params.push(ids);
    }
    if (StringUtil.isNotEmptyOrNull(filterName)) {
        sql += ` AND a.name LIKE '%${filterName}%'`;
    }

    // sorting
    const defaultSort = {
        sortField: "id",
        sortAscending: true,
        tableAlias: "a"
    };

    let tableAlias = "a";
    const newSortField = sortField;
    let sortingCriteria = DalUtil.genSortingCriteria(newSortField, sortAscending, tableAlias);
    if (sortingCriteria == null) {
        sortField = defaultSort.sortField;
        sortAscending = defaultSort.sortAscending;
        tableAlias = defaultSort.tableAlias;
        sortingCriteria = DalUtil.genSortingCriteria(sortField, sortAscending, tableAlias);
    }
    sql += sortingCriteria;

    const totalRecordSql = "SELECT COUNT(*) FROM (" + sql + ") nested";
    sql = "SELECT *, (" + totalRecordSql + ") as TotalRecord FROM (" + sql + ") x ";

    // prepare query params
    let sqlResult = [];
    if (Array.isArray(ids) && !ids.length) {
        // skip
    } else {
        params = params.concat(params); // repeat for totalRecordSql

        // pagination
        if (pageSize) {
            pageSize = Math.max(1, pageSize);
            currentPage = Math.max(1, currentPage);
            sql += " LIMIT ? OFFSET ? ";
            params = params.concat([pageSize, (currentPage - 1) * pageSize]);
        }

        sqlResult = await mysql.executeQuery(sql, params);
    }

    const body = {
        sort: { sortField: sortField, sortAscending: sortAscending },
        result: sqlResult
    };

    return new ResponseObject(body);
}

/**
 * Service: Insert Account
 * @param {String} name account name
 * @param {String} email account email
 * @param {String} password account password
 * @param {*} connection MySQL connection
 */
async function insertAccount(name, email, password, connection) {
    logService("insertAccount", arguments);

    try {

        const accountProps = {
            name: name,
            email: email,
            password: bcrypt.hashSync(password, 10)
        };
        const existingAccount = await AccountDal.getAccountByEmail(accountProps.email);
        if (existingAccount) {
            throw new CustomError(ErrorCode.EMAIL_IN_USE);
        }
        const newAccount = AccountDal.makeAccount(accountProps);
        const insertedAccount = await AccountDal.createAccount(newAccount);

        return new ResponseObject({
            id: insertedAccount.id
        });
    } catch (err) {
        return new ResponseObject(err);
    }
}

/**
 * Service: Account login
 * @param {String} email account email
 * @param {String} password account password
 * @returns account model
 */
async function login(email, password) {
    logService("login", arguments);

    try {

        const existingAccount = await AccountDal.getAccountByEmail(email);
        if (existingAccount) {
            if (bcrypt.compareSync(password, existingAccount.password)) {
                return new ResponseObject(existingAccount);
            }
        }
        throw new CustomError(ErrorCode.INVALID_LOGIN_CREDENTIALS);

    } catch (err) {
        return new ResponseObject(err);
    }
}
