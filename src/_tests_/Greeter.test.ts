import * as client from "../";
var cli = client.createClient([{port: 8888}],{});
test('My rpc client', () => {
  cli.call('test.hello', {
    a: Math.random(),
    b: Math.random()
  },function(err:Error, data:any) {
    console.log(err, data);
  },{});
  // expect(Greeter('Carl')).toBe('Hello Carl');
});


