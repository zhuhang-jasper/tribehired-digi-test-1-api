/* --------------------- */
/* Utility : File    */
/* --------------------- */
const appRoot = require("app-root-path");
const AppLogger = require(appRoot + "/config/logger/appLogger");
const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");

module.exports = { createFolder, createFolderAsync, readFileAsync, writeFileAsync, isExists };

function createFolder(path) {
    if (typeof path == "string") {
        fs.stat(__dirname, function (err, stats) {
            if (!err) {
                if (stats && stats.isDirectory()) {
                    return;
                }
            }
            fs.mkdir(path, { recursive: true }, (err) => {
                if (err) {
                    AppLogger.error(err);
                }
            });
        });
        // if (!fs.access(path)) {
        //     fs.mkdir(path, err => { console.error(err.stack); });
        // }
    }
}

async function readFileAsync(file) {
    try {
        const data = await fsPromises.readFile(file);
        // console.log(data);
        return data.toString();
    } catch (err) {
        AppLogger.error(err.stack);
        return null;
    }
}

async function createFolderAsync(folder) {
    try {
        await fsPromises.mkdir(folder, { recursive: true });
    } catch (err) {
        AppLogger.error(err.stack);
    }
}

async function writeFileAsync(file, data) {
    try {
        // make sure folder exists first
        await createFolderAsync(path.dirname(file));
        await fsPromises.writeFile(file, data);
    } catch (err) {
        AppLogger.error(err.stack);
        return null;
    }
    return data;
}

function isExists(filePath) {
    return (fs.existsSync(filePath));
}
