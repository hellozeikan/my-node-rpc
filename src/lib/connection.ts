import * as net from 'net';
import {EventEmitter} from 'events';
import * as BufferList from 'bl';
import * as msgpack from '@msgpack/msgpack';
import {parserBuffer} from './parser';
export class Connection extends EventEmitter{
    _socket:net.Socket;
    _buffer:BufferList;
    _connected:boolean;
    constructor(socket:net.Socket){
        super();
        this._socket = socket;
        this._buffer = new BufferList()
        this._connected = false;
        socket.on('error', this._onError.bind(this));
        socket.on('close', this._onClose.bind(this));
        socket.on('data', this._onData.bind(this));
    }
    isConnected() {
        return this._connected;
    }

    connect(server:any, callback:any){
        if (!server) {
            throw new Error('need server config');
        }
        let called = false;
        const socket = net.connect(server);
        const conn = new Connection(socket);
        socket.on('connect', () => {
        conn._connected = true;

        if (!called) {
            called = true;
            return callback(null, conn);
        }
        });
        socket.on('error', (err) => {
        console.error('Mushi connection error ', err);
        if (!called) {
            called = true;
            return callback(err);
        }
        });
        return conn;
    }

    disconnect() {
        this._connected = false;
        this._socket.end();
    }

    _onClose() {
        this._connected = false;
        this.emit('close');
      }
    
    _onError() {
        this._connected = false;
    }
    _onData(buffer:BufferList) {
        this._buffer.append(buffer);
        var pack;
        while ((pack = parserBuffer(this._buffer))) {
          this.emit('message', msgpack.decode(pack));
        }
    }
    end() {
        const args: any = arguments;
        this._socket.end.apply(this._socket, args);
    }

    write(msg:any) {
        if (!this._connected) {
          throw new Error('please retry');
        }
    
        const data = msgpack.encode(msg);
        const pack = Buffer.alloc(parserBuffer.HEAD_LENGTH);
        pack.writeUInt32BE(data.length, 0);
    
        this._socket.write(Buffer.concat([pack, data], data.length + parserBuffer.HEAD_LENGTH));
    }
}