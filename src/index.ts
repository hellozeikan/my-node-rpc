import {MyRpc} from './lib/server';
import * as poollib from 'generic-pool';
import {MyRpcClient} from './lib/client';
import {RpcError} from './lib/error';
export function createClient(config:any, opts:any) {
      var cfg = {
        pool: {
          pool_size: 5
        },
        maxRetries: 3,
      };
      if (Array.isArray(config)) {
        //兼容现有的写法， config 是 servers. e.g [{host: 127.0.0.1, port: 8888}]
        (cfg as any).servers = config;
      } else if (config && config.servers) {
        //支持新的配置方式
        cfg = Object.assign(cfg, config);
      } else {
        throw new RpcError('please config myrpc servers');
      }
    
      var length = (cfg as any).servers.length;
      var rr = -1;
      var pool = poollib.createPool({
        create: function() {
          return new Promise((resolve, reject) => {
            rr++;
            rr = rr % length;
            var server = (cfg as any).servers[rr];
            console.log(server,opts);
            var client = new MyRpcClient(server, opts);
    
            client.connect((err:Error) => {
              if (err) {
                return reject(err);
              }
              return resolve(client);
            });
          });
        },
        destroy: async function(client:any) {
          if (client) {
            return new Promise(() => {
                client.disconnect();
            });
          }
        },
        validate: function(client:any) {
          return new Promise((resolve) => {
            return resolve(client.isConnected());
          });
        }
      }, {
        max: cfg.pool.pool_size,
        min: 0,
        softIdleTimeoutMillis: 20000,
        idleTimeoutMillis: 20000,
        evictionRunIntervalMillis: 20000,
        testOnBorrow: true,
        acquireTimeoutMillis: cfg && (cfg as any).acquireTimeout || 10000,
      });
      const maxRetries = cfg.maxRetries;
    
      function execute(type:string, event:any, params:any, callback:any, headers:any) {
        var retries = 0;
        if(typeof callback !== 'function') {
          throw new Error('Mushi error: callback should be a function');
        }
        function doit() {
            const client = pool.acquire();
            client.then((client:any) => {
            client[type](event, params, function(err:any, result:any) {
              if (!err) {
                pool.release(client);
                return callback(null, result);
              }
    
              const isString = typeof err.message === 'string';
              if (isString && err.message.indexOf('please retry') !== -1) {
                pool.destroy(client);
                return retry(err,0);
              }
              pool.release(client);
              if (err.type === 'server error') {
                // 服务端错误重试
                return callback(err);
              }
    
              const isQueryEvent = event.indexOf('.find') !== -1 || event.indexOf('.get') !== -1 ||
                event.indexOf('.list') !== -1;
              if(isString && err.message.indexOf('response timeout') !== -1 &&
              !isQueryEvent) {
                // 非查询类超时错误不主动重试，可能任务已经完成，避免重复
                return callback(err);
              }
              retry(err,0);
            }, headers);
          }).catch((err) => {
            console.error('Mushi acquire error: ', err.stack);
            retry(err,0);
          });
        }
        function retry(err:any, delay:number) {
          if (retries >= maxRetries) {
            return callback(err);
          }
          retries++;
          setTimeout(doit, delay || 0);
        }
        doit();
      }
    
      return {
        call: function call(event:any, params:any, callback:any, headers:any) {
          execute('call', event, params, callback, headers);
        },
        cast: function call(event:any, params:any, callback:any, headers:any) {
          execute('cast', event, params, callback, headers);
        },
        pool,
      };
}

export {MyRpc};
export {MyRpcClient};