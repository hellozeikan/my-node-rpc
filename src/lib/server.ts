
import {EventEmitter} from 'events';
import * as net from 'net'
import {Connection} from './connection'
import {Request} from './request'
import {Response} from './response'
import * as util from 'util';
export class MyRpc extends EventEmitter{
    _offset?:number;
    _onservice?:boolean;
    _conns?:any;
    _processing:number = 0;
    _server?:any
    constructor (){
        super();
        this._init();
    }
    _init(){
        var self = this;
        this._offset = 0;
        this._conns = {};
        this._onservice = true;
        this._server = net.createServer(function(socket:net.Socket) {
            const conn = new Connection(socket);
            conn._connected = true;
            const key = socket.remoteAddress + ':' + socket.remotePort;
      
            conn.on('close', function() {
              delete self._conns[key];
            });
            conn.on('message', (msg:any) => {
                self._handle(conn, msg);
            });
            self._conns[key] = conn;
          });
    }
    closeConnection(callback:any){
        this._onservice = false;
        this._server.close(callback);
        const self = this;
        if (this._processing) {
            this.once('RPC_DONE', endConnections);
        } else {
            endConnections();
        }
        function endConnections(){
            setTimeout(() => {
                for (var key in self._conns) {
                  self._conns[key].end();
                }
              }, 100);
        }
    }
    listen(port:number, callback:any){
        this._server.listen(port, function(err:Error) {
            if (err) {
              console.error(err.stack);
              process.exit(1);
            }
            console.log('worker %s started', process.pid);
            if (typeof callback === 'function') {
              return callback();
            }
          });
    }
    _handle(conn:any,msg:any[]){
        var message_id:number;
        var type:string;
        var params:any;
        var headers:any;
        var method:string;
        var req:Request;
        var res:Response;
        try {
            message_id = Number(msg[0]);
            type = msg[1];
            method = msg.slice(2, 4).join('.').toLowerCase();
            params = msg[4];
            headers = msg[5] || {};
      
            req = new Request(conn, params, headers);
            res = new Response(this, conn, message_id, type, method);
            this._processing++;
          } catch (err:any) {
            console.error(err.stack || err);
            return;
          }
      
          try {
            if (this._onservice === false ) {
              return res.error(new Error('Mushi Server maybe reloading, please retry'));
            }
            if (!this.emit(method, req, res)) {
              res.error(new Error(util.format('Method: %s not found.', method)));
            }
          } catch (err:any) {
            console.error(method, err.stack || err);
            res.error(new Error('Mushi Server Error: ' + err.message));
          }
    }
    call() {
        if (arguments.length < 2) throw new Error('Missing arguments.');
    
        var args = Array.prototype.slice.call(arguments);
        var method = args.splice(0, 1)[0];
        var next = args.splice(args.length - 1, 1)[0];
    
        var fn = function(req:Request, res:Response) {
          var idx = 0;
    
          var dofn = function(req:Request, res:Response) {
            if (idx === args.length) {
              return next(req, res);
            }
    
            args[idx](req, res, function() {
              idx++;
              setTimeout(dofn, 0, req, res);
            });
          };
          dofn(req,res);
        };
        this.on(method, fn);
      }
    decr(){
        this._processing--;
        if (this._processing === 0 && this._onservice === false) {
          this.emit('MUSHI_DONE');
        }
    }
}

