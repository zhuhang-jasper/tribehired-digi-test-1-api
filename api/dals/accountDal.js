const appRoot = require("app-root-path");
const AppLogger = require(appRoot + "/config/logger/appLogger");
const config = require(appRoot + "/config/config");

// DB requirement
const mysql = require("../../config/db").mysql;

// Utility requirement
const moment = require("moment");
const StringUtil = require("../utils/stringUtil");

// Models
const AccountModel = require("../models/account");

module.exports = {
    createAndReturnAccount,
    createAccount,
    updateAccount,
    makeAccount,
    getAccountById,
    getAccountByEmail
};

// Database Table Names
const accountTable = "account"; // a

const IDENTIFIER = "AccountDal";
function logDal(str) {
    AppLogger.debug(`Calling ${IDENTIFIER}->${str}()...`);
}

/**
 * Create Account if not exists, else returns Account from database
 * @param {AccountModel} account account model
 * @throws Errors
 * @returns {Promise<AccountModel>} account model
 */
async function createAndReturnAccount(account = null) {
    logDal("createAndReturnAccount");

    if (account) {
        // Check if account exists
        const dbInstance = await getAccountById(account.id);
        if (!dbInstance) {
            const createdInstance = await createAccount(account);
            return createdInstance;
        } else {
            return dbInstance;
        }
    } else {
        throw new Error("Account not specified");
    }
}

function makeAccount(raw) {
    const account = new AccountModel();
    account.id = raw.id;
    account.name = raw.name;
    account.email = raw.email;
    account.password = raw.password;
    account.createdBy = raw.createdBy;
    account.createdDate = raw.createdDate ? moment(raw.createdDate) : undefined;
    account.updatedBy = raw.updatedBy;
    account.updatedDate = raw.updatedDate ? moment(raw.updatedDate) : undefined;
    return account;
}

/**
 * Get one account by id
 * @param {number} id id
 * @throws Errors
 * @returns {Promise<AccountModel|null>} account model or null
 */
async function getAccountById(id) {
    logDal("getAccountById");

    // Prepare SQL statement
    const selectors = " a.id, " +
        " a.email, " +
        " a.name, " +
        " a.password ";
    const sql = ` SELECT ${selectors} ` +
        ` FROM ${accountTable} a ` +
        " WHERE a.id = ? ";

    // Prepare SQL params
    const params = [id];

    // prepare query params
    let sqlResult = null;
    if (id) {
        const sqlResultTemp = await mysql.executeQuery(sql, params);
        if (sqlResultTemp.length) {
            const raw = sqlResultTemp[0];
            sqlResult = makeAccount(raw);
        }
    }
    const singleResult = sqlResult;
    return singleResult;
}

/**
 * Get one account by email
 * @param {number} email email
 * @throws Errors
 * @returns {Promise<AccountModel|null>} account model or null
 */
async function getAccountByEmail(email) {
    logDal("getAccountByEmail");

    // Prepare SQL statement
    const selectors = " a.id, " +
        " a.email, " +
        " a.name, " +
        " a.password ";
    const sql = ` SELECT ${selectors} ` +
        ` FROM ${accountTable} a ` +
        " WHERE a.email = ? ";

    // Prepare SQL params
    const params = [email];

    // prepare query params
    let sqlResult = null;
    if (email) {
        const sqlResultTemp = await mysql.executeQuery(sql, params);
        if (sqlResultTemp.length) {
            const raw = sqlResultTemp[0];
            sqlResult = makeAccount(raw);
        }
    }
    const singleResult = sqlResult;
    return singleResult;
}

/**
 * Get accounts by name
 * @param {string} agentId agent id
 * @param {string} agentExt agent extension
 * @throws Errors
 * @returns {Promise<AccountModel[]>} Account models
 */
// async function getAccountsByName(name = null) {
//     logDal("getAccountsByName");

//     // Prepare SQL statement
//     const selectors = " a.id, " +
//         " a.name, " +
//         " a.email, " +
//         " a.password ";
//     let sql = ` SELECT ${selectors} ` +
//         ` FROM ${accountTable} a ` +
//         " WHERE 1=1 ";

//     // Prepare SQL params
//     const params = [];
//     if (StringUtil.isNotEmptyOrNull(name)) {
//         sql += ` AND a.name LIKE ? '%${name}%' `;
//     }

//     sql += " ORDER BY a.name";

//     // prepare query params
//     let account = null;
//     if (StringUtil.isNotEmptyOrNull(name)) {
//         const resultTemp = await mysql.executeQuery(sql, params);
//         if (resultTemp.length) {
//             const raw = resultTemp[0];
//             account = makeAccount(raw);
//         }
//     }
//     return { primaryCall, secondaryCall };
// }

/**
 * Insert account into database
 * @param {AccountModel} account account model
 * @param {*} connection MySQL connection
 * @throws Errors
 * @returns {Promise<AccountModel>} account model
 */
async function createAccount(account = null, connection = null) {
    logDal("createAccount");

    let insertedId = null;
    let insertedAccount = null;

    // Prepare DB Connection
    let localConnection = connection;
    if (!connection) {
        localConnection = await mysql.getConn();
        await localConnection.beginTransaction();
    }

    try {
        // Prepare SQL statement
        const insertSql = `INSERT INTO ${accountTable} SET ? `;

        if (account) {
            // Prepare SQL params
            const jsonModel = account.toJSONObject();
            jsonModel.createdBy = config.db.mysql.user;
            const params = [jsonModel];

            // Execute SQL
            const sqlInsertResult = await mysql.executeQuery(insertSql, params, localConnection);
            if (sqlInsertResult.affectedRows) {
                insertedId = sqlInsertResult.insertId;
            } else {
                throw new Error("No record inserted.");
            }
        }

        // commit records if everything is working
        if (!connection) {
            await mysql.commitAndRelease(localConnection);
        }

        if (insertedId) {
            insertedAccount = await getAccountById(insertedId);
        }

    } catch (err) {
        if (!connection) {
            AppLogger.error(err.stack);
            await mysql.rollbackAndRelease(localConnection);
        }
        throw err;
    }

    return insertedAccount;
}

/**
 * Update account in database
 * @param {AccountModel} account CallLog model
 * @param {*} connection MySQL connection
 * @returns {Promise<AccountModel>} CallLog model
 */
async function updateAccount(account = null, connection = null) {
    logDal("updateAccount");

    let updatedId = null;
    let updatedAccount = null;

    // Prepare DB Connection
    let localConnection = connection;
    if (!connection) {
        localConnection = await mysql.getConn();
        await localConnection.beginTransaction();
    }

    try {
        // Prepare SQL statement
        const updateSql = `UPDATE ${accountTable} SET ? ` +
            " WHERE id = ?  ";

        if (account) {
            // Prepare SQL params
            const jsonModel = account.toJSONObject(null, ["id", "email"]);
            jsonModel.updatedBy = config.db.mysql.user;
            jsonModel.updatedDate = "CURRENT_TIMESTAMP()";
            const params = [jsonModel, account.id];

            // Execute SQL
            const sqlUpdateResult = await mysql.executeQuery(updateSql, params, localConnection);
            if (sqlUpdateResult.affectedRows) {
                updatedId = account.id;
            } else {
                throw new Error("No record inserted.");
            }
        }

        // commit records if everything is working
        if (!connection) {
            await mysql.commitAndRelease(localConnection);
        }

        updatedAccount = await getAccountById(updatedId);

    } catch (err) {
        if (!connection) {
            AppLogger.error(err.stack);
            await mysql.rollbackAndRelease(localConnection);
        }
        throw err;
    }

    return updatedAccount;
}
