const moment = require("moment");
const ObjectUtil = require("../utils/objectUtil");

module.exports = class Account {

    /**
     * Create Account object
     * @param {string} name name
     * @param {string} email email
     * @param {string} password password
     */
    constructor(name, email, password) {
        /** @private */
        this._name = name;
        /** @private */
        this._email = email;
        /** @private */
        this._password = password;
    }

    /** @type {number} */
    get id() {
        return this._id;
    }

    set id(id) {
        this._id = id;
    }

    /** @type {string} */
    get name() {
        return this._name;
    }

    set name(val) {
        this._name = val;
    }

    /** @type {string} */
    get email() {
        return this._email;
    }

    set email(val) {
        this._email = val;
    }

    /** @type {string} */
    get password() {
        return this._password;
    }

    set password(val) {
        this._password = val;
    }

    /** @type {string} */
    get createdBy() {
        return this._createdBy;
    }

    set createdBy(val) {
        this._createdBy = val;
    }

    /** @type {moment.Moment} */
    get createdDate() {
        return this._createdDate;
    }

    set createdDate(val) {
        this._createdDate = val;
    }

    /** @type {string} */
    get updatedBy() {
        return this._updatedBy;
    }

    set updatedBy(val) {
        this._updatedBy = val;
    }

    /** @type {moment.Moment} */
    get updatedDate() {
        return this._updatedDate;
    }

    set updatedDate(val) {
        this._updatedDate = val;
    }

    /**
     * Returns JSON object representation of the model
     * @param {string[]} includeAttribs attributes to be included in the object
     * @param {string[]} excludedAttribs attributes to be excluded in the object
     */
    toJSONObject(includeAttribs = null, excludedAttribs = null) {
        const obj = {
            id: this._id,
            name: this._name,
            email: this._email,
            password: this._password,
            createdBy: this._createdBy,
            createdDate: this._createdDate ? moment(this._createdDate).format("YYYY-MM-DD HH:mm:ss") : undefined,
            updatedBy: this._updatedBy,
            updatedDate: this._updatedDate ? moment(this._updatedDate).format("YYYY-MM-DD HH:mm:ss") : undefined
        };
        let newObj = {};
        if (includeAttribs && includeAttribs.length) {
            for (const inAttrib of includeAttribs) {
                newObj[inAttrib] = obj[inAttrib];
            }
        } else {
            newObj = obj;
        }
        if (excludedAttribs && excludedAttribs.length) {
            for (const exAttrib of excludedAttribs) {
                delete newObj[exAttrib];
            }
        }
        return ObjectUtil.removeUndefinedProperties(newObj);
    }

};
