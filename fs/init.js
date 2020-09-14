print('>>> Hello from firmware ');
load('api_config.js'); 
load('api_events.js'); 
load('api_gpio.js'); 
load('api_timer.js');
load('api_sys.js'); 
load('api_rpc.js'); 
load('api_esp32_touchpad.js');
load('api_adc.js'); 


let sensor=4;
let led = 2;
let purple = 5;
let orange=18;
let blue=19;
let yellow=21;

let motor = 19;
let gate = 21;

ADC.enable(sensor);
GPIO.set_mode(led, GPIO.MODE_OUTPUT);
GPIO.set_mode(purple, GPIO.MODE_OUTPUT);
GPIO.set_mode(orange, GPIO.MODE_OUTPUT);
GPIO.set_mode(blue, GPIO.MODE_OUTPUT);
GPIO.set_mode(yellow, GPIO.MODE_OUTPUT);

let setPin = function(on,level) { 
  GPIO.write(led, level);
  print('LED on ->', on);
  return true;
};


let ts = TouchPad.GPIO[sensor];

TouchPad.init();
TouchPad.setVoltage(TouchPad.HVOLT_2V4, TouchPad.LVOLT_0V8, TouchPad.HVOLT_ATTEN_1V5);
TouchPad.config(ts, 0);
// Timer.set(1000 /* 1 sec */, Timer.REPEAT, function() {
 
// }, null);


RPC.addHandler('read_touch', function(args) {
  let tv = TouchPad.read(ts);
  print('Sensor', ts, 'value', tv);
  return tv;
});

RPC.addHandler('read_adc', function(args) {
  if(args.pin!==sensor){
    ADC.enable(args.pin);
  }
  return ADC.read(args.pin);
});

RPC.addHandler('write_pin', function(args) {
  return setPin(args.pin,args.value);
});

print('>>> Registered Handlers');