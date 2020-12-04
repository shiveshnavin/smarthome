#!/bin/sh
sudo mos build --platform esp32
sudo mos flash --platform esp32
sudo mos wifi wifi_my_ssid paswd 
sudo mos config-set dash.enable=true dash.token=tOkeNNNN00193
sudo mos console