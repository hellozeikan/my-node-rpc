export function createClient(config: object, options: object): object;

export class MyRpc {
    constructor();

    closeConnection(callback?: (had_error?: boolean) => void): void;

    listen(port: number, callback?: () => void): void;
}

export class MyRpcClient {
  constructor(server: { host: string, port: number }, 
    options?: { timeout: number, enable_headers?: boolean });

  call(msg: string, params: object, callback: (err?: any, data?: any) => void, headers?: object);
}