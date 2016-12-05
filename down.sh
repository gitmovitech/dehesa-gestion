#!/bin/bash

expect <<- DONE
  set timeout -1
  spawn git pull
  match_max 100000
  expect "*?assword:*"
  send -- "Bnja7!\r"
  send -- "\r"
  expect eof
DONE

systemctl restart gestion-dehesa
