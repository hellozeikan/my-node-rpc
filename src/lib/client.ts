import {EventEmitter} from 'events';
import * as util from 'util';
import { Connection } from './connection';
import { RpcError } from './error';

const MAX_MESSAGE_ID:number = Math.pow(2,32) -1;
const EVENT_PREFIX:string = "myrpc";

export class MyRpcClient extends EventEmitter {
    _server:any;
    _timeout?:number;
    _enable_headers?:any;
    _connection?:Connection;
    _message_id?:number;
    constructor(server:any, opts:any){
        super();
        if(!opts) opts = {};
        this._server = server;
        this._connection = new Connection(server);
        this._timeout = opts.timeout || 5000;
        this._enable_headers =  opts.enable_headers === undefined ? true : opts.enable_headers;
    }

    connect(callback:any) {
        this._connection?.connect(this._server, (err:any) => {
          if (!err) {
            this._connection?.on('message', this._handle.bind(this));
          }
          if (typeof callback === 'function') {
            return callback(err);
          }
        });
      }

    isConnected() {
        return this._connection?.isConnected();
    }
    disconnect() {
        this._connection?.disconnect();
    }
    generateMessageID() {
        if (!this._message_id) this._message_id = 0;
        if (++this._message_id >= MAX_MESSAGE_ID) this._message_id = 1;
        return this._message_id;
    }
    _handle(msg:any) {
        try {
          var message_id = msg[0];
          var status = msg[1];
          var result = msg[2];
          var event_name = util.format('%s.%s', EVENT_PREFIX, message_id);
          this.emit(event_name, null, status, result);
        } catch (err) {
          console.error(err);
        }
    }
    _send (message_id:number, method:string, msg:any, params:any, headers:any) {
        var events = msg.split('.');
        var data;
        if (this._enable_headers) {
          data = [message_id, method, events.shift(), events.join('.'), params, headers];
        } else {
          data = [message_id, method, events.shift(), events.join('.'), params];
        }
        this._connection?.write(data);
    }
    
    _bindEvent(message_id:number, method:string, callback:any) {
        var event_name = util.format('%s.%s', EVENT_PREFIX, message_id);
        var self = this;
        var timer = setTimeout(function() {
          var host = self._server.host || null;
          var port = self._server.port || null;
          self.emit(event_name, new RpcError(util.format('call method: %s:%s:%s, response timeout.', method, host, port)));
        }.bind(this), this._timeout);
    
        this.once(event_name, function(err, status, data) {
          if (timer) clearTimeout(timer);
    
          if (err) return callback(err);
    
          if (status === 'error') {
            var error = new RpcError(data);
            error.type = 'server error';
            return callback(error);
          }
    
          return callback(null, data);
        });
    }
    
    call(msg:any, params:any, callback:any, headers:any) {
        var message_id = this.generateMessageID();
        this._bindEvent(message_id, msg, callback);
        this._send(message_id, 'call', msg, params, headers);
    }
}



