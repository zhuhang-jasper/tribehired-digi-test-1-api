/* --------------------- */
/* Utility : ASYNC     */
/* --------------------- */

/**
 * Wait for N milli seconds before continue
 * @param ms (number) Duration to wait in ms
 * @return (promise)
 */
async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { wait };
