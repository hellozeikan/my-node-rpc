"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parserBuffer = void 0;
var HEAD_LENGTH = 4;
parserBuffer.HEAD_LENGTH = HEAD_LENGTH;
function parserBuffer(buffer) {
    if (buffer.length <= HEAD_LENGTH) {
        return false;
    }
    if (buffer.length <= HEAD_LENGTH) {
        return false;
    }
    var length = buffer.readUInt32BE(0, true);
    if (!length || buffer.length < length + HEAD_LENGTH) {
        return false;
    }
    buffer.consume(HEAD_LENGTH);
    var pack = buffer.slice(0, length);
    buffer.consume(length);
    return pack;
}
exports.parserBuffer = parserBuffer;
