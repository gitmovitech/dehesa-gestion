#!/bin/bash
git add .
git commit -m 'upload'

expect <<- DONE
  set timeout -1
  spawn git push origin master
  match_max 100000
  expect "*?assword:*"
  send -- "Bnja7!\r"
  send -- "\r"
  expect eof
DONE

expect <<- DONE
  set timeout -1
  spawn ssh root@gestion.jvdehesa.cl "cd /usr/share/nginx/html/gestion-dehesa;sh down.sh;";
  match_max 100000
  expect "*?assword:*"
  send -- "T87pp7cdtg!\r"
  send -- "\r"
  expect eof
DONE
