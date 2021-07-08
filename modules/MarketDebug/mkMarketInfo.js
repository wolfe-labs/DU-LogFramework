const fs = require('fs');

// Ensures source file exists
if (!fs.existsSync('market.dump')) {
  console.error(`Please paste in the market dump information on the 'market.dump' file!`)
  process.exit(1);
}

// Reads source file
const raw = fs.readFileSync('market.dump');

// The regex that will convert all market info in actual usable data
const regex = /MarketInfo:\[marketId = ([0-9]*), relativeLocation = RelativeLocation:\[constructId = ([0-9]*), position = Vec3:\[([-.0-9]*), ([-.0-9]*), ([-.0-9]*)], rotation = Quat:\[([-.0-9]*), ([-.0-9]*), ([-.0-9]*), ([-.0-9]*)]], position = Vec3:\[([-.0-9]*), ([-.0-9]*), ([-.0-9]*)], parentConstruct = ([0-9]*), name = ([^,]*), creatorId = EntityId:\[playerId = ([0-9]*), organizationId = ([0-9]*)], creatorName = ([^,]*), creationDate = @\(([0-9]*)\) [^,]*, capacity = ([0-9]*), valueTax = ([.0-9]*), dailyStorageFee = ([0-9]*), orderFee = ([0-9]*), allowedItemTypes = \[([ ,0-9]*), ]updateCooldown = ([0-9]*)/g

// Where we'll store all markets
const markets = {};

// Processes in batch
while (result = regex.exec(raw)) {
  // Maps regex results to actual meaningful data
  const market = {
    marketId: result[1],
    relativeLocation: {
      constructId: result[2],
      position: {
        x: result[3],
        y: result[4],
        z: result[5],
      },
      rotation: {
        x: result[6],
        y: result[7],
        z: result[8],
        w: result[9],
      }
    },
    position: {
      x: result[10],
      y: result[11],
      z: result[12],
    },
    parentConstruct: result[13],
    name: result[14],
    creator: {
      playerId: result[15],
      organizationId: result[16],
      creatorName: result[17],
    },
    creationDate: new Date(parseInt(result[18])),
    capacity: parseInt(result[19]),
    valueTax: parseFloat(result[20]),
    dailyStorageFee: parseFloat(result[21]) / 100,
    orderFee: parseFloat(result[22]) / 100,
    allowedItemTypes: result[23].split(',').map((id) => id.trim()),
    updateCooldown: parseInt(result[24]),
  };

  // Adds to proper index
  markets[market.marketId] = market;
}

// Writes file
fs.writeFileSync('Markets.json', JSON.stringify(markets));

// Done
console.info(`Registered ${ Object.keys(markets).length } markets to file!`);