// const Websocket = require('ws');
// const addr = 'wss://dash.mongoose-os.com/api/v2/notify?access_token=si0baz91IhLRRGdk99nVNaiA';
// const ws = new Websocket(addr, { origin: addr });
// ws.on('message', msg => console.log('Got message:', msg.toString()));


var request = require('request');
var options = {
    'method': 'POST',
    'url': 'http://192.168.0.116/rpc/read_adc',
    'headers': {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ "pin": 34 })

};

function sleep(miliseconds) {
    var currentTime = new Date().getTime();
 
    while (currentTime + miliseconds >= new Date().getTime()) {
    }
 }

function get() {
   
    request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        sleep(500)
        get();
    });

}
get();