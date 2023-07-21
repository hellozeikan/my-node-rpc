import * as client from "../src";
const cli = client.createClient([{port: 8888}],{});
cli.call('test.hello', {
    a: Math.random(),
    b: Math.random()
  },function(err:Error, data:any) {
    console.log(err, data);
},{});
