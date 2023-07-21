import { MyRpc } from "../";

var rpc= new MyRpc();

rpc.on('test.hello', function(req:any, res:any) {
    console.log(req);
    console.log(res);
    res.send(req.params());
});

rpc.listen(8888,{});