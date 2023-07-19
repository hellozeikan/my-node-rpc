import {EventEmitter} from 'events';
import * as net from 'net'
import {RpcError,RpcUnknownError} from './error'
export class Response extends EventEmitter {
    _server:any;
    _conn?: net.Socket;
    _message_id? : number;
    _type?: string;
    _method?:string;
    constructor(server:any, conn: net.Socket, message_id:number, type:string, method:string){
        super()
        this._server = server;
        this._conn = conn;
        this._message_id = message_id;
        this._type = type;
        this._method = method;
    }

    send(data: any){
        var message:any[] = [this._message_id,'reply',data];
        this._server.decr();
        try{
            this._conn?.write(Buffer.from(message));
            this.emit('finish', data);
        } catch(err){
            console.error('can not response send', err);
        }
    }
    error(err: Error){
        var message:any[] = [this._message_id, 'error', err.message || new RpcError('Server error.').message];
        this._server.decr();
        try {
          this._conn?.write(Buffer.from(message));
        } catch (err) {
        console.error('can not response error: ', err);
        }
    }
    fail(code:any, message:string){
        var data = {
            error_code: code,
            method: this._method,
            message: message || new RpcUnknownError('Unknow error.').message
          };
        this.send(data);
    }
}
