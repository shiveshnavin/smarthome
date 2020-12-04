print('>>> Hello from firmware ');
load('api_config.js');
load('api_events.js');
load('api_gpio.js');
load('api_timer.js');
load('api_sys.js');
load('api_rpc.js');
// load('api_esp32_touchpad.js');
// load('api_adc.js'); 


let sensor = 4;
let led = 2;
let purple = 5;
let orange = 18;
let blue = 19;
let yellow = 21;

let motor = 19;
let gate = 21;

// ADC.enable(sensor);
GPIO.set_mode(led, GPIO.MODE_OUTPUT);
GPIO.set_mode(purple, GPIO.MODE_OUTPUT);
GPIO.set_mode(orange, GPIO.MODE_OUTPUT);
GPIO.set_mode(blue, GPIO.MODE_OUTPUT);
GPIO.set_mode(yellow, GPIO.MODE_OUTPUT);

GPIO.write(purple, 1);
GPIO.write(orange, 1);
GPIO.write(blue, 1);
GPIO.write(yellow, 1);

let setPin = function (pin, level) {
  GPIO.write(pin, level);
  print('Set pin = ', pin, ' to ', level);
  return true;
};


// let ts = TouchPad.GPIO[sensor];

// TouchPad.init();
// TouchPad.setVoltage(TouchPad.HVOLT_2V4, TouchPad.LVOLT_0V8, TouchPad.HVOLT_ATTEN_1V5);
// TouchPad.config(ts, 0);
// Timer.set(1000 /* 1 sec */, Timer.REPEAT, function() {

// }, null);


// RPC.addHandler('read_touch', function(args) {
//   let tv = TouchPad.read(ts);
//   print('Sensor', ts, 'value', tv);
//   return tv;
// });

// RPC.addHandler('read_adc', function(args) {
//   if(args.pin!==sensor){
//     ADC.enable(args.pin);
//   }
//   return ADC.read(args.pin);
// });


let keepAliveTick = Cfg.get('smarthome.hearbeat');
let isAutoMode = Cfg.get('smarthome.automode');
let minautoretry = Cfg.get('smarthome.minautoretry');
let lastTryTime = Cfg.get("smarthome.lastautotry");
let runautofor = 1000 * Cfg.get("smarthome.runautofor");

let autostarthour = Cfg.get('smarthome.autostarthour');
let autoendhour = Cfg.get('smarthome.autoendhour');

let autoPin = motor;
if (lastTryTime < 1607099824) {

  Cfg.set({ smarthome: { lastautotry: Timer.now() } });

}

Timer.set(keepAliveTick, Timer.REPEAT, function () {

  if (isAutoMode) {
    let now = Timer.now();
    if (now - lastTryTime > minautoretry) {
      let curHour = JSON.parse(Timer.fmt("%H:%m", Timer.now()).slice(0, 2));
      let isItTimeYet = curHour >= autostarthour && curHour <= autostarthour;
      if (isItTimeYet) {

        lastTryTime = now;
        Cfg.set({ smarthome: { lastautotry: now } });
        print('Try Motor Now !!!');
        setPin(autoPin, 0);
        stopMotorByPullingUpPin(autoPin, 1, runautofor);

      }
    }
    // print('Hearbeat ! last try = ', lastTryTime);

  }

}, null);

let lastPin = 0;
let lastValue = 0;
let stopMotorByPullingUpPin = function (pin, value, timeOut) {
  lastPin = pin;
  lastValue = value;
  let delay = Cfg.get('smarthome.stoptimeout');
  if (timeOut !== undefined) {
    delay = timeOut;
  }
  Timer.set(delay, 0, function () {
    setPin(lastPin, lastValue);
  }, null);
};

RPC.addHandler('read_pin', function (args) {
  return GPIO.read(args.pin);
});

RPC.addHandler('write_pin', function (args) {
  return setPin(args.pin, args.value);
});

RPC.addHandler('write_pin_auto', function (args) {
  stopMotorByPullingUpPin(args.pin, 1);
  return setPin(args.pin, args.value);
});

RPC.addHandler('set_status', function (args) {
  return Cfg.set(args.object);
});

RPC.addHandler('status', function (args) {
  let curtime = Timer.now();
  let config = Cfg.get("smarthome");
  let now = Timer.now();
  let fullTime = Timer.fmt("%Y-%m-%d %H:%M:%S", now);

  return { time: curtime, config: config, time_fmt: fullTime };
});

print('>>> Registered Handlers');