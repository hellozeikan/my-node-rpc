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
exports.MyRpcClient = void 0;
var events_1 = require("events");
var util = require("util");
var connection_1 = require("./connection");
var error_1 = require("./error");
var MAX_MESSAGE_ID = Math.pow(2, 32) - 1;
var EVENT_PREFIX = "myrpc";
var MyRpcClient = /** @class */ (function (_super) {
    __extends(MyRpcClient, _super);
    function MyRpcClient(server, opts) {
        var _this = _super.call(this) || this;
        if (!opts)
            opts = {};
        _this._server = server;
        _this._connection = new connection_1.Connection(server);
        _this._timeout = opts.timeout || 5000;
        _this._enable_headers = opts.enable_headers === undefined ? true : opts.enable_headers;
        return _this;
    }
    MyRpcClient.prototype.connect = function (callback) {
        var _this = this;
        var _a;
        (_a = this._connection) === null || _a === void 0 ? void 0 : _a.connect(this._server, function (err) {
            var _a;
            if (!err) {
                (_a = _this._connection) === null || _a === void 0 ? void 0 : _a.on('message', _this._handle.bind(_this));
            }
            if (typeof callback === 'function') {
                return callback(err);
            }
        });
    };
    MyRpcClient.prototype.isConnected = function () {
        var _a;
        return (_a = this._connection) === null || _a === void 0 ? void 0 : _a.isConnected();
    };
    MyRpcClient.prototype.disconnect = function () {
        var _a;
        (_a = this._connection) === null || _a === void 0 ? void 0 : _a.disconnect();
    };
    MyRpcClient.prototype.generateMessageID = function () {
        if (!this._message_id)
            this._message_id = 0;
        if (++this._message_id >= MAX_MESSAGE_ID)
            this._message_id = 1;
        return this._message_id;
    };
    MyRpcClient.prototype._handle = function (msg) {
        try {
            var message_id = msg[0];
            var status = msg[1];
            var result = msg[2];
            var event_name = util.format('%s.%s', EVENT_PREFIX, message_id);
            this.emit(event_name, null, status, result);
        }
        catch (err) {
            console.error(err);
        }
    };
    MyRpcClient.prototype._send = function (message_id, method, msg, params, headers) {
        var _a;
        var events = msg.split('.');
        var data;
        if (this._enable_headers) {
            data = [message_id, method, events.shift(), events.join('.'), params, headers];
        }
        else {
            data = [message_id, method, events.shift(), events.join('.'), params];
        }
        (_a = this._connection) === null || _a === void 0 ? void 0 : _a.write(data);
    };
    MyRpcClient.prototype._bindEvent = function (message_id, method, callback) {
        var event_name = util.format('%s.%s', EVENT_PREFIX, message_id);
        var self = this;
        var timer = setTimeout(function () {
            var host = self._server.host || null;
            var port = self._server.port || null;
            self.emit(event_name, new error_1.RpcError(util.format('call method: %s:%s:%s, response timeout.', method, host, port)));
        }.bind(this), this._timeout);
        this.once(event_name, function (err, status, data) {
            if (timer)
                clearTimeout(timer);
            if (err)
                return callback(err);
            if (status === 'error') {
                var error = new error_1.RpcError(data);
                error.type = 'server error';
                return callback(error);
            }
            return callback(null, data);
        });
    };
    MyRpcClient.prototype.call = function (msg, params, callback, headers) {
        var message_id = this.generateMessageID();
        this._bindEvent(message_id, msg, callback);
        this._send(message_id, 'call', msg, params, headers);
    };
    return MyRpcClient;
}(events_1.EventEmitter));
exports.MyRpcClient = MyRpcClient;
