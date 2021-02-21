const appRoot = require("app-root-path");
// const AppLogger = require(appRoot + "/config/logger/appLogger");
const SoLogger = require(appRoot + "/config/logger/socketLogger");

// Util
const NumberUtil = require("./numberUtil");

// Models
const CallLog = require("../models/callLog");

// Constants
const SERVER_SOCKET_EVENT_TYPE = require("../constants/socket/serverSocketEventType");

module.exports = {
    addAgentToMemory,
    getAgentIdFromMapBySocketId,
    getAgentExtFromMapByAgentId,
    getAgentInfoFromMapBySocketId,
    getAgentInfoFromMapByAgentId,
    getAgentInfoFromMapByAgentExt,
    removeAgentFromMapBySocketId,
    removeAgentFromMapByAgentId,
    addAgentToStandbyMemory,
    getAgentStandbyInfoFromMapByAgentId,
    removeAgentFromStandbyMapByAgentId,
    clearAgentMap,
    sendMessage,
    sendEvent,
    sendError,
    generateRandomNumber,
    logIncomingEvent,
    logOutgoingEvent,
    getActiveCalls,
    updateActiveCalls,
    getCallActivityUuid,
    setCallActivityUuid
};

/**
 * Get agent standby info and insert into agent map
 * @param {string} agentId agent id
 */
function addAgentToMemory(agentId) {
    // Get standby object
    const agentStandByInfo = global.agentStandbyInfoByAgentIdMap[agentId];
    if (agentStandByInfo) {
        global.agentIdBySocketIdMap[agentStandByInfo.socketId] = agentId; // nodejs check by socketId
        global.agentExtByAgentIdMap[agentId] = agentStandByInfo.agentExt;
        global.agentInfoByAgentExtMap[agentStandByInfo.agentExt] = agentStandByInfo;
        // SoLogger.debug(`Agent(C4:${c4EmployeeId}, NAME:${c4EmployeeName}, ID:${agentId}, EXT:${agentExt}) added to memory.`);
        SoLogger.debug(`Agent(ID:${agentId})[${agentStandByInfo.socketId}] added to memory.`);
        removeAgentFromStandbyMapByAgentId(agentId); // remove standby
    }
}

/**
 * Lookup agent id using socket id
 * @param {string} socketId socket id
 * @returns {string} agent id or empty string if not found
 */
function getAgentIdFromMapBySocketId(socketId) {
    return socketId ? (global.agentIdBySocketIdMap[socketId] || "") : "";
}

/**
 * Lookup agent extension using agent id
 * @param {string} agentId agent id
 * @returns {string} agent extension or empty string if not found
 */
function getAgentExtFromMapByAgentId(agentId) {
    return agentId ? (global.agentExtByAgentIdMap[agentId] || "") : "";
}

/**
 * Lookup agent info using agent extension
 * @param {string} agentExt agent extension
 * @returns {* | null} agent info or null if not found
 */
function getAgentInfoFromMapByAgentExt(agentExt) {
    return (agentExt && global.agentInfoByAgentExtMap[agentExt]) ? Object.assign({}, global.agentInfoByAgentExtMap[agentExt]) : null;
}

/**
 * Lookup agent info using socket id
 * @param {string} socketId socket id
 * @returns {{
        socketId: string,
        agentId: string,
        agentExt: string,
        c4EmployeeId: string,
        c4EmployeeName: string
    } | null} agent info or null if not found
 */
function getAgentInfoFromMapBySocketId(socketId) {
    const agentId = getAgentIdFromMapBySocketId(socketId);
    const agentExt = getAgentExtFromMapByAgentId(agentId);
    return getAgentInfoFromMapByAgentExt(agentExt);
}

/**
 * Lookup agent info using agent id
 * @param {string} agentId agent id
 * @returns {{
        socketId: string,
        agentId: string,
        agentExt: string,
        c4EmployeeId: string,
        c4EmployeeName: string
    } | null} agent info or null if not found
 */
function getAgentInfoFromMapByAgentId(agentId) {
    const agentExt = getAgentExtFromMapByAgentId(agentId);
    return getAgentInfoFromMapByAgentExt(agentExt);
}

function removeAgentFromMapBySocketId(socketId) {
    const agentId = getAgentIdFromMapBySocketId(socketId);
    if (agentId) {
        const agentExt = getAgentExtFromMapByAgentId(agentId);
        delete global.agentIdBySocketIdMap[socketId];
        delete global.agentExtByAgentIdMap[agentId];
        delete global.agentInfoByAgentExtMap[agentExt];
        delete global.outboundCallActivities[agentExt];
        delete global.callIdByAgentIdMap[agentId];
        SoLogger.debug(`Agent(ID:${agentId})[${socketId}] removed from memory.`);
        removeAgentFromStandbyMapByAgentId(agentId);
    }
}

function removeAgentFromMapByAgentId(agentId) {
    const agentInfo = getAgentInfoFromMapByAgentId(agentId);
    if (agentInfo) {
        removeAgentFromMapBySocketId(agentInfo.socketId);
    }
}

/**
 * Add agent to standby memory
 * @param {string} socketId socket id
 * @param {string} agentId agent id
 * @param {string} agentExt agent extension
 * @param {string} c4EmployeeId c4 employee id
 * @param {string} c4EmployeeName c4 employee name / agent name
 */
function addAgentToStandbyMemory(socketId, agentId, agentExt, c4EmployeeId, c4EmployeeName) {
    global.agentStandbyInfoByAgentIdMap[agentId] = {
        socketId,
        agentId,
        agentExt,
        c4EmployeeId,
        c4EmployeeName
    };
    // SoLogger.debug(`Agent(C4:${c4EmployeeId}, NAME:${c4EmployeeName}, ID:${agentId}, EXT:${agentExt}) added to handshake memory.`);
    SoLogger.debug(`Agent(ID:${agentId})[${socketId}] added to handshake memory.`);
}

/**
 * Lookup agent standby info using agent id
 * @param {string} agentId agent id
 * @returns {{
        socketId: string,
        agentId: string,
        agentExt: string,
        c4EmployeeId: string,
        c4EmployeeName: string
    } | null} agent standby info or null if not found
 */
function getAgentStandbyInfoFromMapByAgentId(agentId) {
    return global.agentStandbyInfoByAgentIdMap[agentId] ? global.agentStandbyInfoByAgentIdMap[agentId] : null;
}

function removeAgentFromStandbyMapByAgentId(agentId) {
    delete global.agentStandbyInfoByAgentIdMap[agentId];
    SoLogger.debug(`Agent(ID:${agentId}) removed from handshake memory.`);
}

function clearAgentMap() {
    global.agentIdBySocketIdMap = {};
    global.agentExtByAgentIdMap = {};
    global.agentInfoByAgentExtMap = {};
    global.agentStandbyInfoByAgentIdMap = {};
    global.outboundCallActivities = {};
    global.callIdByAgentIdMap = {};
    SoLogger.debug("Success cleared memory.");
}

function sendEvent(socketId, data, agentIdGiven = null) {
    const agentId = agentIdGiven || getAgentIdFromMapBySocketId(socketId);
    if (agentId) {
        const wrapped = {
            type: SERVER_SOCKET_EVENT_TYPE.EVENT,
            data: data
        };
        sendMessage(socketId, wrapped);
        SoLogger.info(`Emitted event to Agent(ID:${agentId})[${socketId}]: ${wrapped.type}/${wrapped.data.type}.`);
    }
}

function sendError(socketId, error, extras) {
    const agentId = getAgentIdFromMapBySocketId(socketId) || "new";
    if (agentId && error) {
        const wrapped = {
            type: SERVER_SOCKET_EVENT_TYPE.ERROR,
            error,
            ...extras
        };
        sendMessage(socketId, wrapped);
        SoLogger.warn(`Emitted error to Agent(ID:${agentId})[${socketId}]: ${error.code}`);
    }
}

function sendMessage(socketId, message) {
    const agentId = getAgentIdFromMapBySocketId(socketId);
    logOutgoingEvent(socketId, agentId, message);
    global.socketIO.emit(socketId, message);
}

/**
 * Generate a unique number
 * @param length Length of random number output
 */
function generateRandomNumber(length = 10) {
    if (length > 0) {
        const fixed = 1 * Math.pow(10, length - 1);
        const randonNumber = Math.floor(fixed + Math.random() * 9 * fixed);
        return randonNumber;
    }
    return 0;
}

function logIncomingEvent(socketId, agentId, event) {
    if (event) {
        const incomingEvent = Object.assign({
            io: "IN",
            socketId: socketId,
            agentId: agentId
        }, event);
        SoLogger.info(incomingEvent);
    }
}

function logOutgoingEvent(socketId, agentId, event) {
    if (event) {
        const outgoingEvent = Object.assign({
            io: "OUT",
            socketId: socketId,
            agentId: agentId
        }, event);
        SoLogger.info(outgoingEvent);
    }
}

/**
 * Get agent active calls from memory
 * @param {string} agentId agent id
 */
function getActiveCalls(agentId) {
    const activeCallIds = global.callIdByAgentIdMap[agentId];
    return {
        hasOngoingCall: (Array.isArray(activeCallIds) && activeCallIds.length > 0),
        isConsulting: (Array.isArray(activeCallIds) && activeCallIds.length == 2),
        activeCallIds: activeCallIds || []
    };
}

/**
 * Update agent active calls in memory
 * @param {string} agentId agent id
 * @param {number[]} activeCallIds array of callIds
 */
function updateActiveCalls(agentId, activeCallIds = []) {
    // const activeCallIds = activeCalls.filter(call => !!call).map(call => {
    //     if (NumberUtil.isNumeric(call)) {
    //         return call;
    //     } else if (call instanceof CallLog) {
    //         return call.id;
    //     }
    //     return false;
    // });
    global.callIdByAgentIdMap[agentId] = activeCallIds;
    return {
        hasOngoingCall: (activeCallIds && activeCallIds.length > 0),
        isConsulting: (activeCallIds && activeCallIds.length == 2),
        activeCallIds: activeCallIds || []
    };
}

function getCallActivityUuid(agentExt, refCustomerANI) {
    const outboundCallTemp = global.outboundCallActivities[agentExt];
    if (outboundCallTemp && outboundCallTemp.to == refCustomerANI) {
        // call matched
        return outboundCallTemp.activityUUID;
    } else {
        // clear obsolete activityUuid
        delete global.outboundCallActivities[agentExt];
        return undefined;
    }
}

function setCallActivityUuid(agentExt, refCustomerANI, activityUUID) {
    if (activityUUID) {
        global.outboundCallActivities[agentExt] = { to: refCustomerANI, activityUUID };
    } else {
        delete global.outboundCallActivities[agentExt];
    }
}
