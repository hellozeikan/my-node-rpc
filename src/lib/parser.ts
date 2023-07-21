const HEAD_LENGTH:number = 4;
parserBuffer.HEAD_LENGTH=HEAD_LENGTH;
export function parserBuffer(buffer:any) {
    if(buffer.length <= HEAD_LENGTH) {
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
    const pack = buffer.slice(0, length);
    buffer.consume(length);
    return pack;
}
