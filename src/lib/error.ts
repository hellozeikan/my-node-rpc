export class RpcError extends Error{
    constructor(msg:string) {
        super();
        this.name = 'RpcError';
        this.message = msg || 'rpc Error';
        Error.captureStackTrace(this, this.constructor);
    }
}
export class RpcUnknownError extends Error{
    constructor(msg:string) {
        super();
        this.name = 'RpcError';
        this.message = msg || 'rpc Error';
        Error.captureStackTrace(this, this.constructor);
    }
}
