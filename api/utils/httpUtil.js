/* --------------------- */
/* Utility : HTTP    */
/* --------------------- */
const request = require("request");
// const http = require('http');

module.exports = { doHttpPost, forwardHttpPost };

async function doHttpPost(url, body) {
    return new Promise(function (resolve, reject) {
        const httpOpts = {
            method: "POST",
            url: url,
            json: true,
            body: body,
            insecure: true,
            rejectUnauthorized: false,
            headers: {
                authorization: global.sessionToken,
                "Content-type": "application/json"
            }
        };
        // console.log('POST: ' + url, body);
        request(httpOpts, function (err, resp, body) {
            try {
                // General error, i.e.
                //  - ECONNRESET - server closed the socket unexpectedly
                //  - ECONNREFUSED - server did not listen
                //  - HPE_INVALID_VERSION
                //  - HPE_INVALID_STATUS
                //  - ... (other HPE_* codes) - server returned garbage
                if (err) {
                    reject(err);
                } else {
                    if (resp.statusCode != 200) {
                        reject(new Error("OSCC server returns status code " + resp.statusCode));
                    } else {
                        resolve(body);
                    }
                }
            } catch (err) {
                console.log("ERROR", err);
            }
        });
    });
}

async function forwardHttpPost(url, body) {
    return new Promise(function (resolve, reject) {
        const httpOpts = {
            method: "POST",
            url: url,
            json: true,
            body: body,
            insecure: true,
            rejectUnauthorized: false,
            headers: {
                authorization: global.sessionToken, // headers.authorization,
                "Content-type": "application/json"
            }
        };
        console.log("FORWARDED-POST: " + url, body);
        request(httpOpts, function (err, resp, body) {
            try {
                if (err) {
                    resolve({
                        err
                    });
                } else {
                    resolve({
                        resp, body
                    });
                }
            } catch (err) {
                console.log("ERROR", err);
            }
        });
    });
}
