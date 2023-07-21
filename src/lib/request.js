"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = void 0;
var Request = /** @class */ (function () {
    function Request(socket, params, headers) {
        this.socket = socket;
        this._params = params || {};
        this._headers = headers || {};
    }
    Request.prototype.params = function () {
        return this._params;
    };
    Request.prototype.param = function (name, defaultValue) {
        var _params = this._params || {};
        if (_params.hasOwnProperty(name)) {
            return _params[name];
        }
        return defaultValue;
    };
    Request.prototype.headers = function () {
        return this._headers;
    };
    Request.prototype.header = function (name) {
        var _headers = this._headers || {};
        if (_headers.hasOwnProperty(name))
            return _headers[name];
    };
    return Request;
}());
exports.Request = Request;
