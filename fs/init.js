print('>>> Hello from firmware ');
load('api_config.js');
load('api_events.js');
load('api_gpio.js');
load('api_timer.js');
load('api_sys.js');
load('api_rpc.js');
// load('api_esp32_touchpad.js');
load('api_adc.js'); 
load('api_dash.js');
load('api_shadow.js');



let sensor = 34;
let led = 2;
let purple = 5;
let orange = 18;
let blue = 19;
let yellow = 21;

let motor = 19;
let GATE_OPEN = orange;
let GATE_CLOSE = yellow;
let waterOverflow = 14;

ADC.enable(sensor);
// GPIO.set_mode(sensor, GPIO.MODE_INPUT);
let overflowTick = 0;

GPIO.set_mode(led, GPIO.MODE_OUTPUT);
GPIO.set_mode(purple, GPIO.MODE_OUTPUT);
GPIO.set_mode(orange, GPIO.MODE_OUTPUT);
GPIO.set_mode(blue, GPIO.MODE_OUTPUT);
GPIO.set_mode(yellow, GPIO.MODE_OUTPUT );
GPIO.set_mode(waterOverflow, GPIO.MODE_INPUT );
GPIO.set_pull(waterOverflow, GPIO.PULL_DOWN ) ;


GPIO.write(purple, 1);
GPIO.write(orange, 0);
GPIO.write(blue, 1);
GPIO.write(yellow, 0);

let motorStatusValue = 1;
let setPin = function (pin, level) {
  GPIO.write(pin, level);
  print('Set pin = ', pin, ' to ', level);
  if(pin === motor)
  {
    motorStatusValue = level;
    if(level === 0)
     overflowTick = 0;
  }
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

RPC.addHandler('read_adc', function(args) {
  if(args.pin!==sensor){
    ADC.enable(args.pin);
  }
  return ADC.read(args.pin);
});


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

let checkWaterOverflowAndStop = function(){

  let isOverflow = GPIO.read(waterOverflow);
  if(isOverflow){
    overflowTick = overflowTick + 1;
    if(overflowTick >= 1){
      overflowTick = 0;
      setPin(autoPin, 1);
    }
  }
};

Timer.set(keepAliveTick, Timer.REPEAT, function () {

  if(motorStatusValue === 0){
    checkWaterOverflowAndStop();
  }

  if (isAutoMode) {
    let now = Timer.now();
    if (now - lastTryTime > minautoretry) {
      let curHour = JSON.parse(Timer.fmt("%H:%m", Timer.now()).slice(0, 2));
      let atoEnd0 = autostarthour + 2  ;
      let atoEnd1 = autoendhour + 2  ;
      let isItTimeYet = (curHour >= autostarthour && curHour <= atoEnd0) 
      || (curHour >= autoendhour && curHour <= atoEnd1);
      
      if (isItTimeYet) {

        lastTryTime = now;
        Cfg.set({ smarthome: { lastautotry: now } });
        print('Try Motor Now !!!');
        setPin(autoPin, 0);
        stopMotorByPullingUpPin(autoPin, 1, runautofor);
        Dash.notify('MotorOnNow', 
        {isItTimeYet:isItTimeYet,lastTryTime: lastTryTime,isOvertime:
         now - lastTryTime > minautoretry,nowtime:now});


      }
      //  Dash.notify('HeartBeat', 
      //           {isItTimeYet:isItTimeYet,lastTryTime: lastTryTime,isOvertime:
      //            now - lastTryTime > minautoretry,nowtime:now});
    }
   
    // print('Hearbeat ! last try = ', lastTryTime); 
  }

}, null);

let lastPin = 0;
let lastValue = 0;
let delay = Cfg.get('smarthome.stoptimeout');
let stopMotorByPullingUpPin = function (pin, value, timeOut) {
  lastPin = pin;
  lastValue = value;
  if (timeOut !== undefined) {
    delay = timeOut;
  }
  Timer.set(delay, 0, function () {
    setPin(lastPin, lastValue);
  }, null);
};



let elapsedopenGate = 0;
let timeridopenGate = 0;

let openGate = function(){
  setPin(GATE_OPEN,1);
  setPin(GATE_CLOSE,0);
  Timer.set(delay, 0 , function () {
      
    setPin(GATE_OPEN,0);
    setPin(GATE_CLOSE,0);
      
  }, null); 

};
let elapsedcloseGate=0;
let timeridcloseGate=0;
let closeGate = function(){
  setPin(GATE_OPEN,0);
  setPin(GATE_CLOSE,1);
  Timer.set(delay, 0 , function () {
  
      
    setPin(GATE_OPEN,0);
    setPin(GATE_CLOSE,0);
   
  }, null); 

};



RPC.addHandler('gate_control', function (args) {
 
  if(args.open === 1){
    openGate();
  }
  else if(args.open === -1)
  {
    closeGate();
  }
  else{
    setPin(GATE_OPEN,0);
    setPin(GATE_CLOSE,0);
  }
  
  return true;

});

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
  let config = getStatus();
  let now = Timer.now();
  let fullTime = Timer.fmt("%Y-%m-%d %H:%M:%S", now);

  return { time: curtime, time_fmt: fullTime , config: (config)};
});

let getStatus = function(){
  
  let smarthome = {
     stoptimeout : Cfg.get('smarthome.stoptimeout'),
     automode :  Cfg.get('smarthome.automode'),
     autostarthour :  Cfg.get('smarthome.autostarthour'),
     autoendhour :  Cfg.get('smarthome.autoendhour'),
     hearbeat :  Cfg.get('smarthome.hearbeat'),
     lastautotry :  Timer.fmt("%Y-%m-%d %H:%M:%S", Cfg.get('smarthome.lastautotry')),
     minautoretry :  Cfg.get('smarthome.minautoretry'),
     runautofor :  Cfg.get('smarthome.runautofor'),
     var0 :  Cfg.get('smarthome.var0'),
     var1 :  Cfg.get('smarthome.var1'),
     var2 :  Cfg.get('smarthome.var2'),
    var3:  Cfg.get('smarthome.var3'),
    var4:  Cfg.get('smarthome.var4')
  };
    return smarthome;
};
print('>>> Registered Handlers');