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
exports.MyRpc = void 0;
var events_1 = require("events");
var net = require("net");
var connection_1 = require("./connection");
var request_1 = require("./request");
var response_1 = require("./response");
var util = require("util");
var MyRpc = /** @class */ (function (_super) {
    __extends(MyRpc, _super);
    function MyRpc() {
        var _this = _super.call(this) || this;
        _this._processing = 0;
        _this._init();
        return _this;
    }
    MyRpc.prototype._init = function () {
        var self = this;
        this._offset = 0;
        this._conns = {};
        this._onservice = true;
        this._server = net.createServer(function (socket) {
            var conn = new connection_1.Connection(socket);
            conn._connected = true;
            var key = socket.remoteAddress + ':' + socket.remotePort;
            conn.on('close', function () {
                delete self._conns[key];
            });
            conn.on('message', function (msg) {
                self._handle(conn, msg);
            });
            self._conns[key] = conn;
        });
    };
    MyRpc.prototype.closeConnection = function (callback) {
        this._onservice = false;
        this._server.close(callback);
        var self = this;
        if (this._processing) {
            this.once('RPC_DONE', endConnections);
        }
        else {
            endConnections();
        }
        function endConnections() {
            setTimeout(function () {
                for (var key in self._conns) {
                    self._conns[key].end();
                }
            }, 100);
        }
    };
    MyRpc.prototype.listen = function (port, callback) {
        this._server.listen(port, function (err) {
            if (err) {
                console.error(err.stack);
                process.exit(1);
            }
            console.log('worker %s started', process.pid);
            if (typeof callback === 'function') {
                return callback();
            }
        });
    };
    MyRpc.prototype._handle = function (conn, msg) {
        var message_id;
        var type;
        var params;
        var headers;
        var method;
        var req;
        var res;
        try {
            message_id = Number(msg[0]);
            type = msg[1];
            method = msg.slice(2, 4).join('.').toLowerCase();
            params = msg[4];
            headers = msg[5] || {};
            req = new request_1.Request(conn, params, headers);
            res = new response_1.Response(this, conn, message_id, type, method);
            this._processing++;
        }
        catch (err) {
            console.error(err.stack || err);
            return;
        }
        try {
            if (this._onservice === false) {
                return res.error(new Error('Mushi Server maybe reloading, please retry'));
            }
            if (!this.emit(method, req, res)) {
                res.error(new Error(util.format('Method: %s not found.', method)));
            }
        }
        catch (err) {
            console.error(method, err.stack || err);
            res.error(new Error('Mushi Server Error: ' + err.message));
        }
    };
    MyRpc.prototype.call = function () {
        if (arguments.length < 2)
            throw new Error('Missing arguments.');
        var args = Array.prototype.slice.call(arguments);
        var method = args.splice(0, 1)[0];
        var next = args.splice(args.length - 1, 1)[0];
        var fn = function (req, res) {
            var idx = 0;
            var dofn = function (req, res) {
                if (idx === args.length) {
                    return next(req, res);
                }
                args[idx](req, res, function () {
                    idx++;
                    setTimeout(dofn, 0, req, res);
                });
            };
            dofn(req, res);
        };
        this.on(method, fn);
    };
    MyRpc.prototype.decr = function () {
        this._processing--;
        if (this._processing === 0 && this._onservice === false) {
            this.emit('MUSHI_DONE');
        }
    };
    return MyRpc;
}(events_1.EventEmitter));
exports.MyRpc = MyRpc;
