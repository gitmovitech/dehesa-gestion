#!/bin/bash
echo 'Mensaje:'
read mensaje
git add .
git commit -m @mensaje
git push origin master


#expect <<- DONE
 # set timeout -1
 # spawn git push origin master
 # match_max 100000
 # expect "*?assword:*"
 # send -- "Bnja7!\r"
  #send -- "\r"
 # expect eof
#DONE

