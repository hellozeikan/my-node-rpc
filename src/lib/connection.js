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
exports.Connection = void 0;
var net = require("net");
var events_1 = require("events");
var BufferList = require("bl");
var msgpack = require("@msgpack/msgpack");
var parser_1 = require("./parser");
var Connection = /** @class */ (function (_super) {
    __extends(Connection, _super);
    function Connection(socket) {
        var _this = _super.call(this) || this;
        _this._socket = socket;
        _this._buffer = new BufferList();
        _this._connected = false;
        socket.on('error', _this._onError.bind(_this));
        socket.on('close', _this._onClose.bind(_this));
        socket.on('data', _this._onData.bind(_this));
        return _this;
    }
    Connection.prototype.isConnected = function () {
        return this._connected;
    };
    Connection.prototype.connect = function (server, callback) {
        if (!server) {
            throw new Error('need server config');
        }
        var called = false;
        var socket = net.connect(server);
        var conn = new Connection(socket);
        socket.on('connect', function () {
            conn._connected = true;
            if (!called) {
                called = true;
                return callback(null, conn);
            }
        });
        socket.on('error', function (err) {
            console.error('Mushi connection error ', err);
            if (!called) {
                called = true;
                return callback(err);
            }
        });
        return conn;
    };
    Connection.prototype.disconnect = function () {
        this._connected = false;
        this._socket.end();
    };
    Connection.prototype._onClose = function () {
        this._connected = false;
        this.emit('close');
    };
    Connection.prototype._onError = function () {
        this._connected = false;
    };
    Connection.prototype._onData = function (buffer) {
        this._buffer.append(buffer);
        var pack;
        while ((pack = (0, parser_1.parserBuffer)(this._buffer))) {
            this.emit('message', msgpack.decode(pack));
        }
    };
    Connection.prototype.end = function () {
        var args = arguments;
        this._socket.end.apply(this._socket, args);
    };
    Connection.prototype.write = function (msg) {
        if (!this._connected) {
            throw new Error('please retry');
        }
        var data = msgpack.encode(msg);
        var pack = Buffer.alloc(parser_1.parserBuffer.HEAD_LENGTH);
        pack.writeUInt32BE(data.length, 0);
        this._socket.write(Buffer.concat([pack, data], data.length + parser_1.parserBuffer.HEAD_LENGTH));
    };
    return Connection;
}(events_1.EventEmitter));
exports.Connection = Connection;
