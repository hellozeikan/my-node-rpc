"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyRpcClient = exports.MyRpc = exports.createClient = void 0;
var server_1 = require("./lib/server");
Object.defineProperty(exports, "MyRpc", { enumerable: true, get: function () { return server_1.MyRpc; } });
var poollib = require("generic-pool");
var client_1 = require("./lib/client");
Object.defineProperty(exports, "MyRpcClient", { enumerable: true, get: function () { return client_1.MyRpcClient; } });
var error_1 = require("./lib/error");
function createClient(config, opts) {
    var cfg = {
        pool: {
            pool_size: 5
        },
        maxRetries: 3,
    };
    if (Array.isArray(config)) {
        //兼容现有的写法， config 是 servers. e.g [{host: 127.0.0.1, port: 8888}]
        cfg.servers = config;
    }
    else if (config && config.servers) {
        //支持新的配置方式
        cfg = Object.assign(cfg, config);
    }
    else {
        throw new error_1.RpcError('please config myrpc servers');
    }
    var length = cfg.servers.length;
    var rr = -1;
    var pool = poollib.createPool({
        create: function () {
            return new Promise(function (resolve, reject) {
                rr++;
                rr = rr % length;
                var server = cfg.servers[rr];
                console.log(server, opts);
                var client = new client_1.MyRpcClient(server, opts);
                client.connect(function (err) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(client);
                });
            });
        },
        destroy: function (client) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (client) {
                        return [2 /*return*/, new Promise(function () {
                                client.disconnect();
                            })];
                    }
                    return [2 /*return*/];
                });
            });
        },
        validate: function (client) {
            return new Promise(function (resolve) {
                return resolve(client.isConnected());
            });
        }
    }, {
        max: cfg.pool.pool_size,
        min: 0,
        softIdleTimeoutMillis: 20000,
        idleTimeoutMillis: 20000,
        evictionRunIntervalMillis: 20000,
        testOnBorrow: true,
        acquireTimeoutMillis: cfg && cfg.acquireTimeout || 10000,
    });
    var maxRetries = cfg.maxRetries;
    function execute(type, event, params, callback, headers) {
        var retries = 0;
        if (typeof callback !== 'function') {
            throw new Error('Mushi error: callback should be a function');
        }
        function doit() {
            var client = pool.acquire();
            client.then(function (client) {
                client[type](event, params, function (err, result) {
                    if (!err) {
                        pool.release(client);
                        return callback(null, result);
                    }
                    var isString = typeof err.message === 'string';
                    if (isString && err.message.indexOf('please retry') !== -1) {
                        pool.destroy(client);
                        return retry(err, 0);
                    }
                    pool.release(client);
                    if (err.type === 'server error') {
                        // 服务端错误重试
                        return callback(err);
                    }
                    var isQueryEvent = event.indexOf('.find') !== -1 || event.indexOf('.get') !== -1 ||
                        event.indexOf('.list') !== -1;
                    if (isString && err.message.indexOf('response timeout') !== -1 &&
                        !isQueryEvent) {
                        // 非查询类超时错误不主动重试，可能任务已经完成，避免重复
                        return callback(err);
                    }
                    retry(err, 0);
                }, headers);
            }).catch(function (err) {
                console.error('Mushi acquire error: ', err.stack);
                retry(err, 0);
            });
        }
        function retry(err, delay) {
            if (retries >= maxRetries) {
                return callback(err);
            }
            retries++;
            setTimeout(doit, delay || 0);
        }
        doit();
    }
    return {
        call: function call(event, params, callback, headers) {
            execute('call', event, params, callback, headers);
        },
        cast: function call(event, params, callback, headers) {
            execute('cast', event, params, callback, headers);
        },
        pool: pool,
    };
}
exports.createClient = createClient;
