const appRoot = require("app-root-path");
const AppLogger = require(appRoot + "/config/logger/appLogger");
const config = require(appRoot + "/config/config");

const Util = require("util");
const ErrorCode = require("../api/constants/responseErrorCode");
const CustomError = require("../api/base/CustomError");

const mysql = require("mysql");
const SqlString = require("mysql/lib/protocol/SqlString");
const ObjectUtil = require("../api/utils/objectUtil");

/**
 * MySQL Pool Connection
 */
// AppLogger.info("MySQL creating connection pool...");
const pool = mysql.createPool({
    host: config.db.mysql.host,
    user: config.db.mysql.user,
    password: config.db.mysql.password,
    database: config.db.mysql.dbName,
    timezone: config.db.mysql.timezone,
    connectionLimit: 50,
    charset: "utf8mb4",
    queryFormat: function(sql, values, timeZone) {
        sql = SqlString.format(sql, values, false, timeZone);
        sql = sql.replace(/'CURRENT_TIMESTAMP\(\)'/g, "CURRENT_TIMESTAMP()");
        sql = sql.replace("'TIMESTAMPDIFF(SECOND, startTime, endTime)'", "TIMESTAMPDIFF(SECOND, startTime, endTime)");
        // sql = sql.replace(/'UNIX_TIMESTAMP\(\)'/g, "UNIX_TIMESTAMP()");
        // sql = sql.replace(/'NOW\(\)'/g, "NOW()");
        return sql;
    }
});
// const poolMultiStmt = mysql.createPool({
//     host: config.db.mysql.host,
//     user: config.db.mysql.user,
//     password: config.db.mysql.password,
//     database: config.db.mysql.dbName,
//     timezone: config.db.mysql.timezone,
//     multipleStatements: true,
//     connectionLimit: 50
// });

/**
 * Export Mysql Connection through Promise
 */
function getConnection() {
    // AppLogger.debug("MySQL getting connection...");
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, conn) {
            if (err) {
                // if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                //     console.error('Database connection was closed.')
                // }
                // if (err.code === 'ER_CON_COUNT_ERROR') {
                //     console.error('Database has too many connections.')
                // }
                // if (err.code === 'ECONNREFUSED') {
                //     console.error('Database connection was refused.')
                // }
                AppLogger.error(err.stack);
                reject(new CustomError(ErrorCode.DB_MYSQL_CONNECTION_GET_FAILED));
            }
            // promisify the query for better response result
            if (conn) {
                conn.query = Util.promisify(conn.query);
            }
            resolve(conn);
        });
    });
}

// function getMultiStmtConnection() {
//     return new Promise((resolve, reject) => {
//         poolMultiStmt.getConnection(function (err, conn) {
//             if (err) {
//                 AppLogger.error(err.stack);
//                 reject(new CustomError(ErrorCode.DB_MYSQL_CONNECTION_GET_FAILED));
//             }
//             // promisify the query for better response result
//             if (conn) {
//                 conn.query = Util.promisify(conn.query);
//             }
//             resolve(conn);
//         });
//     });
// }

async function tryRelease(connection) {
    try {
        await connection.release();
    } catch (err) {
        // do nothing
    }
}

async function commitAndRelease(connection) {
    try {
        await connection.commit();
    } catch (err) {
        AppLogger.error(err.stack);
    } finally {
        try {
            await connection.release();
        } catch (err2) {
            // do nothing
        }
    }
}

async function rollbackAndRelease(connection) {
    try {
        await connection.rollback();
    } catch (err) {
        AppLogger.error(err.stack);
    } finally {
        try {
            await connection.release();
        } catch (err2) {
            // do nothing
        }
    }
}

function genSqlCriteria(object) {
    let sql = " 1 = 1 ";
    for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
            let value = object[key];
            if (typeof value == "string") {
                value = `'${value}'`;
            }
            if (value === null) {
                value = "IS NULL";
            } else {
                value = "= " + value;
            }
            sql += ` AND ${key} ${value} `;
        }
    }
    return sql;
}

async function manualRollbackInsertFailed(failIndex, tableName, criteriaToUse, insertedObjects, conn) {
    let success = false;
    insertedObjects = JSON.parse(JSON.stringify(insertedObjects)); // clone
    insertedObjects.forEach(obj => {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key) && criteriaToUse.indexOf(key) == -1) {
                delete obj[key];
            }
        }
    });
    AppLogger.info("Manual Rolling Back: ");
    for (const index of failIndex) {
        const objectToDelete = insertedObjects[index];
        const sqlRbFailed = `DELETE FROM ${tableName} WHERE ` +
            genSqlCriteria(objectToDelete);
        AppLogger.info(sqlRbFailed + ";");
        try {
            const rollbackFailed = await conn.query(sqlRbFailed);
            if (rollbackFailed.affectedRows != 1) {
                AppLogger.info("WARNING: Manual Rollback is expecting single record, but found multiple records that met the provided criteria");
            }
            success = true;
        } catch (err) {
            // DO NOT ROLLBACK
            AppLogger.error(err.stack);
        }
    }
    return success;
}

// Use for SQL queries without need of commit/rollback
async function executeQuery(sql, params = null, connection = null) {
    let sqlResult = [];

    let localConnection = connection;
    if (!connection) {
        localConnection = await getConnection();
        await localConnection.beginTransaction();
    }

    try {
        const newParams = params;
        // Debug log - Truncate long params
        // if (Array.isArray(params)) {
        //     newParams = [];
        //     for (const param of params) {
        //         if (Array.isArray(param) && param.length > 50) {

        //             const truncated = ObjectUtil.truncateArray(param.slice(), 2);
        //             newParams.push(truncated);
        //         } else {
        //             newParams.push(param);
        //         }
        //     }
        // }

        AppLogger.debug("MySQL executing query: " + JSON.stringify({ sql, params: newParams }, null, 2)); // log the SQL statement

        sqlResult = localConnection.query(sql, params);

        if (!ObjectUtil.isEmptyStringify(sqlResult)) {
            AppLogger.debug("MySQL result: " + JSON.stringify(sqlResult, null, 2)); // log the SQL result
        }

        // commit records if everything is working
        if (!connection) {
            await commitAndRelease(localConnection);
        }
    } catch (err) {
        if (!connection) {
            AppLogger.error(err.stack);
            await rollbackAndRelease(localConnection);
        }
        throw err;
    } finally {
        await tryRelease(localConnection);
    }
    return sqlResult;
}

async function testConnection() {
    const localConnection = await getConnection();
    await tryRelease(localConnection);
    return true;
}

exports.mysql = {
    commitAndRelease,
    rollbackAndRelease,
    getConn: getConnection,
    // getMultiStmtConnection,
    // manualRollbackInsertFailed,
    tryRelease,
    executeQuery,
    testConnection
};
