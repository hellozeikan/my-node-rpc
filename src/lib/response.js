"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Response = void 0;
var events_1 = require("events");
var error_1 = require("./error");
var Response = /** @class */ (function (_super) {
    __extends(Response, _super);
    function Response(server, conn, message_id, type, method) {
        var _this = _super.call(this) || this;
        _this._server = server;
        _this._conn = conn;
        _this._message_id = message_id;
        _this._type = type;
        _this._method = method;
        return _this;
    }
    Response.prototype.send = function (data) {
        var _a;
        var message = [this._message_id, 'reply', data];
        this._server.decr();
        try {
            (_a = this._conn) === null || _a === void 0 ? void 0 : _a.write(Buffer.from(message));
            this.emit('finish', data);
        }
        catch (err) {
            console.error('can not response send', err);
        }
    };
    Response.prototype.error = function (err) {
        var _a;
        var message = [this._message_id, 'error', err.message || new error_1.RpcError('Server error.').message];
        this._server.decr();
        try {
            (_a = this._conn) === null || _a === void 0 ? void 0 : _a.write(Buffer.from(message));
        }
        catch (err) {
            console.error('can not response error: ', err);
        }
    };
    Response.prototype.fail = function (code, message) {
        var data = {
            error_code: code,
            method: this._method,
            message: message || new error_1.RpcUnknownError('Unknow error.').message
        };
        this.send(data);
    };
    return Response;
}(events_1.EventEmitter));
exports.Response = Response;
