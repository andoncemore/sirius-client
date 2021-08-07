const escpos = require('escpos');
escpos.USB = require('escpos-usb');


const usbDevice = new escpos.USB(0x04b8,0x0202);
console.log(usbDevice);
