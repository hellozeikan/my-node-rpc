"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
test('My Greeter', function () {
    expect((0, index_1.Greeter)('Carl')).toBe('Hello Carl');
});
