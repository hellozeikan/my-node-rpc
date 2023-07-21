"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("../");
var rpc = new __1.MyRpc();
rpc.on('test.hello', function (req, res) {
    console.log(req);
    console.log(res);
    res.send(req.params());
});
rpc.listen(8888, {});
