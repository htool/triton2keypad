const debug = require('debug')('emulate')

var myArgs = process.argv.slice(2);
emulate = myArgs[0]
emulate_init = './device/' + emulate + '.js'

// Load device specific init info
debug('Loading %s', emulate_init)
require(emulate_init)

require('./canboatjs')
require('./canboatjs/lib/canbus')
const canDevice = require('./canboatjs/lib/canbus').canDevice
const device = require('./canboatjs/lib/candevice').device
const canbus = new (require('./canboatjs').canbus)({})
const util = require('util')

debug('Using device id: %i', canbus.candevice.address)

const keys_code = {
  '-1'        : '%s,3,130850,%s,255,0c,41,9f,00,ff,ff,%s,1a,00,02,ae,00',
  '+1'        : '%s,3,130850,%s,255,0c,41,9f,00,ff,ff,%s,1a,00,03,ae,00',
  '-10'       : '%s,3,130850,%s,255,0c,41,9f,00,ff,ff,%s,1a,00,02,d1,06',
  '+10'       : '%s,3,130850,%s,255,0c,41,9f,00,ff,ff,%s,1a,00,03,d1,06',
  'standby'   : '%s,3,130850,%s,255,0c,41,9f,00,ff,ff,%s,06,00,ff,ff,ff',
  'wind'      : '%s,3,130850,%s,255,0c,41,9f,00,ff,ff,%s,0e,00,ff,ff,ff',
  'navigation': '%s,3,130850,%s,255,0c,41,9f,00,ff,ff,%s,0a,00,ff,ff,ff',
  'auto'      : '%s,3,130850,%s,255,0c,41,9f,00,ff,ff,%s,09,00,ff,ff,ff'
}

// Sleep
const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

// Heartbeat PGN 126993
const hexByte = require('./canboatjs/lib/utilities').hexByte
const heartbeat_msg = "%s,7,126993,%s,255,8,60,ea,%s,ff,ff,ff,ff,ff"
var heartbeatSequencenumber = 0

function heartbeat () {
  heartbeatSequencenumber++
  if (heartbeatSequencenumber > 600) {
    heartbeatSequencenumber = 1
  }
  msg = util.format(heartbeat_msg, (new Date()).toISOString(), canbus.candevice.address, hexByte(heartbeatSequencenumber))
  canbus.sendPGN(msg)
}

async function PGN130822 () {
  const messages = [
    "%s,3,130822,%s,255,0f,13,99,ff,01,00,0e,00,00,fc,13,25,00,00,74,be",
    "%s,3,130822,%s,255,0f,13,99,ff,01,00,0f,00,00,fc,13,60,04,00,a3,5c",
    "%s,3,130822,%s,255,0f,13,99,ff,01,00,09,00,00,fc,12,1c,00,00,dd,d1",
    "%s,3,130822,%s,255,0f,13,99,ff,01,00,0a,00,00,fc,13,b6,00,00,94,3a",
    "%s,3,130822,%s,255,0f,13,99,ff,01,00,0b,00,00,fc,13,b9,00,00,16,67",
    "%s,3,130822,%s,255,0f,13,99,ff,01,00,0c,00,00,fc,13,6f,00,00,03,bb",
    "%s,3,130822,%s,255,0f,13,99,ff,01,00,0d,00,00,fc,13,25,00,00,74,be",
    "%s,3,130822,%s,255,0f,13,99,ff,01,00,0e,00,00,fc,13,25,00,00,74,be" ]

  for (var nr in messages) {
    msg = util.format(messages[nr], (new Date()).toISOString(), canbus.candevice.address)
    canbus.sendPGN(msg)
    await sleep(1000)
  }
}

function keypress (address, key) {
  debug('Creating packet button %s', key);
  msg  = util.format(keys_code[key], (new Date()).toISOString(), address, address.toString(16));
  debug('Packet: ', msg);
  canbus.sendPGN(msg)
}

debug('Emulate: B&G Triton2 Keypad')
setTimeout(PGN130822, 5000) // Once at startup
setInterval(PGN130822, 300000) // Every 5 minutes
setInterval(heartbeat, 60000) // Heart beat PGN

async function test () {
  keypress(canbus.candevice.address, 'auto');
  await sleep(5000);
  keypress(canbus.candevice.address, '+1');
  await sleep(5000);
  keypress(canbus.candevice.address, '-1');
  await sleep(5000);
  keypress(canbus.candevice.address, 'standby');
}

setInterval(test, 30000)

function mainLoop () {
	if (canbus.candevice.cansend) {
		while (canbus.readableLength > 0) {
			//debug('canbus.readableLength: %i', canbus.readableLength)
			msg = canbus.read()
			// debug('Received packet msg: %j', msg)
		  // debug('msg.pgn.src %i != canbus.candevice.address %i?', msg.pgn.src, canbus.candevice.address)
      if ( msg.pgn.dst == canbus.candevice.address || msg.pgn.dst == 255) {
        msg.pgn.fields = {}
        if (msg.pgn.pgn == 59904) {
          PGN1 = msg.data[1]
          PGN2 = msg.data[0]
          debug('ISO request. Data PGN1: %i  PGN2: %i', PGN1, PGN2)
          switch (PGN1) {
            case 238: // ISO Address claim
              msg.pgn.fields.PGN = 60928
              canbus.candevice.n2kMessage(msg.pgn)
              break;
            case 240: // Product info / ISO Group
              if (PGN2 == 20) { msg.pgn.fields.PGN = 126996 }
              if (PGN2 == 22) { msg.pgn.fields.PGN = 126998 }
              canbus.candevice.n2kMessage(msg.pgn)
              break;
            case 255: // PGN1: 255  PGN2: 24
              if (PGN2 == 24) { msg.pgn.fields.PGN = 65304}
              canbus.candevice.n2kMessage(msg.pgn)
              break;
          }
        //canbus.candevice.n2kMessage(msg.pgn)
        }
      }
		}
		// process.exit()
	}
}

// Check every 5 millisecnds
setInterval(mainLoop, 5);
