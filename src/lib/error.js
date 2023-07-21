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
exports.RpcUnknownError = exports.RpcError = void 0;
var RpcError = /** @class */ (function (_super) {
    __extends(RpcError, _super);
    function RpcError(msg) {
        var _this = _super.call(this) || this;
        _this.name = 'RpcError';
        _this.message = msg || 'rpc Error';
        _this.type = "";
        Error.captureStackTrace(_this, _this.constructor);
        return _this;
    }
    return RpcError;
}(Error));
exports.RpcError = RpcError;
var RpcUnknownError = /** @class */ (function (_super) {
    __extends(RpcUnknownError, _super);
    function RpcUnknownError(msg) {
        var _this = _super.call(this) || this;
        _this.name = 'RpcError';
        _this.message = msg || 'rpc Error';
        Error.captureStackTrace(_this, _this.constructor);
        return _this;
    }
    return RpcUnknownError;
}(Error));
exports.RpcUnknownError = RpcUnknownError;
