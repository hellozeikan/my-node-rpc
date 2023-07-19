export class Request{
    private socket:any;
    private _params:any;
    private _headers:any;
    constructor (socket:any, params:any, headers:any) {
        this.socket = socket;
        this._params = params || {};
        this._headers = headers || {};
    }
    public params(){
        return this._params
    }
    public param(name:string, defaultValue:any){
        var _params = this._params || {};
        if(_params.hasOwnProperty(name)) {
            return _params[name];
        }
        return defaultValue;
    }
    public headers(){
        return this._headers
    }
    public header(name:string){
        var _headers = this._headers || {};
        if (_headers.hasOwnProperty(name)) return _headers[name];
    }
}
