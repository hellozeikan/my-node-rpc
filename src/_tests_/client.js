"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var client = require("../");
var cli = client.createClient([{ port: 8888 }], {});
cli.call('test.hello', {
    a: Math.random(),
    b: Math.random()
}, function (err, data) {
    console.log(err, data);
}, {});
