module.exports = class MarketExtractionModule {
  // Caches all regexes used to filter Market Orders
  regexMarketOrder = {
    marketId: /marketId\s?=\s?(\d+)/,
    orderId: /orderId\s?=\s?(\d+)/,
    itemType: /itemType\s?=\s?(\d+)/,
    buyQuantity: /buyQuantity\s?=\s?(-?\d+)/,
    expirationDate: /expirationDate\s?=\s?@\((\d+)\)/,
    updateDate: /updateDate\s?=\s?@\((\d+)\)/,
    playerId: /playerId\s?=\s?(\d+)/,
    organizationId: /organizationId\s?=\s?(\d+)/,
    ownerName: /ownerName\s?=\s?(.*?)[,\s]/,
    unitPrice: /amount\s?=\s?(\d+)/,
  };

  // Caches all item types
  itemTypes = require('./ItemTypes.json');

  // Caches all markets
  markets = require('./Markets.json');
  
  constructor (framework) {
    this.framework = framework;
    framework.on('MarketsPanel', this.onMarketsPanel());
  }

  parseMarketOrder (rawMarketOrder) {
    // Creates the Market Order
    const order = {};

    // Applies every regex to it
    Object.keys(this.regexMarketOrder).forEach((key) => {
      // Runs the regex first
      const result = this.regexMarketOrder[key].exec(rawMarketOrder);

      // Special handling of sell orders
      if (result && 'buyQuantity' === key) {
        // Gets the numeric value of quantity
        const quantity = parseInt(result[1]);

        // Stores order type and quantity
        order['orderType'] = (quantity > 0) ? 'buy' : 'sell';
        order['orderQuantity'] = Math.abs(quantity);
      } else {
        // Adds result if available
        order[key] = result ? result[1] : null;
      }

      // Proper processing of prices
      if ('unitPrice' === key) {
        order[key] = parseFloat(order[key]) / 100;
      }

      // Proper processing of dates
      if (
        'expirationDate' === key ||
        'updateDate' === key
      ) {
        order[key] = new Date(parseInt(order[key]));
      }

      // Adds the market name right after its ID (if available)
      if ('marketId' === key) {
        order.marketName = (order.marketId && this.markets[order.marketId]) ? this.markets[order.marketId].name : 'Unknown Market';
      }

      // Adds the item name right after item type (if available)
      if ('itemType' === key) {
        order.itemName = (order.itemType && this.itemTypes[order.itemType]) ? this.itemTypes[order.itemType] : 'Unknown Item';
      }
    });

    // Returns the finished order object
    return order;
  }

  onMarketsPanel () {
    return ({ event, source, data }) => {
      console.info(`Received market info of ${ data.length } bytes!`);

      // This will hold all market orders
      const orders = [];
      const separator = 'MarketOrder:';

      // Process the received data
      while (true) {
        if (data.length > 0) {
          // Gets next index of market data
          const nextIndex = data.indexOf(separator, separator.length);

          // Gets next data
          let currentData = data;
          if (~nextIndex) {
            currentData = data.substr(0, nextIndex);
          }

          // Checks if current info is valid
          if (separator === currentData.trim().substr(0, separator.length)) {
            orders.push(this.parseMarketOrder(currentData));
          }

          // Prepares for next loop
          data = data.substr(currentData.length);
        } else {
          // No more data, stops reading
          break;
        }
      }

      // Processes the market orders :)
      this.framework.pushDataToInterface('market', orders);
      // console.table(orders.map((order) => Object.assign(order, { unitPrice: order.unitPrice.toFixed(2) })));
    };
  }
};