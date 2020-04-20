#!/bin/sh
cd com
fpc upkey.pas
cd ..
rm upkey
mv com/upkey upkey
