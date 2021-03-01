const debug = require('debug')('device')
debug('Emulate: B&G Triton Pilot Keypad')

// Device address (suggested)
deviceAddress = 54

// AddressClaim PGN
addressClaim = {
  pgn: 60928,
  dst: 255,
  "Unique Number": 30006,
  "Manufacturer Code": 381, // B&G
  "Device Function": 140,
  "Device Class": 40,
  "Device Instance Lower": 0,
  "Device Instance Upper": 0,
  "System Instance": 0,
  "Industry Group": 4,          // Marine
  "Reserved1": 1,
  "Reserved2": 2
}

// Product info PGN
productInfo = {
  pgn: 126996,
  dst: 255,
  "NMEA 2000 Version": 2100,
  "Product Code": 24547,
  "Model ID": "Triton2 Pilot Keypad",
  "Software Version Code": "1.4.13.00",
  "Model Version": "",
  "Model Serial Code": "000000",
  "Certification Level": 2,
  "Load Equivalency": 4
}
