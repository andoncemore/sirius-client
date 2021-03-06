import { PrinterDriverInterface, PrintingResult } from '.';
import bitmapify from '../decoder/parser/bitmapify';
import escpos from 'escpos';
import getPixels from 'get-pixels';
import gm from 'gm';

type Pixels = {};

const im = gm.subClass({ imageMagick: true });

escpos.USB = require('escpos-usb');
const device = new escpos.USB(0x04b8,0x0202);
const printer = new escpos.Printer(device);

const tester = async (buf: Buffer): Promise<String> => {
  return new Promise((resolve,reject) => {
    im(buf).size(function(err,value) {
      console.log(value);
      if(err){
        return reject(err);
      }
      return resolve("Success");
    });
  });	
};


const pnger = async (buf: Buffer): Promise<Buffer> => {
  console.log("pnger",buf);
  return new Promise((resolve, reject) => {
    im(buf,"example.jpeg")
      .colors(2)
      .define('png:bit-depth=1')
      .toBuffer('png', (err, out) => {
        if (err) {
           return reject(err);
        }
        return resolve(out);
     });
  });
};

const pixeler = async (buf: Buffer): Promise<Pixels> => {
  return new Promise((resolve, reject) => {
    getPixels(buf, 'image/png', (err, pixels) => {
      if (err) {
        return reject(err);
      }
      resolve(pixels);
    });
  });
};

const printr = async (pixels: Pixels): Promise<void> => {
  return new Promise(resolve => {
    const image = new escpos.Image(pixels);

    device.open(() => {
      // via: https://www.sparkfun.com/datasheets/Components/General/Driver%20board.pdf
      // Set “max heating dots”,”heating time”, “heating interval”
      // n1 = 0-255 Max printing dots，Unit(8dots)，Default:7(64 dots)
      // n2 = 3-255 Heating time，Unit(10us),Default:80(800us)
      // n3 = 0-255 Heating interval,Unit(10us)，Default:2(20us)
      // The  more  max  heting  dots,  the  more  peak  current  will  cost when
      // printing, the faster printing speed. The max heating dots is 8*(n1+1)
      // The more heating time, the more density , but the slower printing speed.
      // If heating time is too short, blank page may occur.
      // The  more  heating  interval,  the  more  clear,  but  the  slower printingspeed
      // printer.buffer.write('\x1b\x37');
      // printer.buffer.writeUInt8(127); // maxPrintingDots, default 7
      // printer.buffer.writeUInt8(127); // heatingTime, default 80
      // printer.buffer.writeUInt8(127); // heatingInterval, default 2

      printer
        .raster(image)
        .close();

      resolve();
    });
  });
};

const thermalise = async (buf: Buffer): Promise<void> => {
  // convert to PNG, because `get-pixels` doesn't support 1bit BMPs
  try{
    const bitmap = bitmapify(buf);
    console.log(bitmap);
    // await tester(buf);
    const png = await pnger(bitmap);
    console.log("png variable", png);
    // create pixels from png
    const pixels = await pixeler(png);
    console.log("pixels variable", pixels);
    // print 'em
    await printr(pixels);
  } catch(e){
    console.log("Error", e);
  }
};

export default class EscposPrinter implements PrinterDriverInterface {
  async print(buffer: Buffer): Promise<PrintingResult> {
    return await thermalise(buffer);
  }
}
