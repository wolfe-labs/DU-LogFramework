// Prepare our socket port
const socketHost = document.location.hostname;
const socketPort = parseInt(document.location.port);
const socketPath = `http://${ socketHost }:${ socketPort }`;

// Appends Socket.IO's js file
const scriptElement = document.createElement('script')
scriptElement.setAttribute('src', `${ socketPath }/socket.io/socket.io.js`);
scriptElement.onload = main;
document.body.appendChild(scriptElement);

// Here we start our script
function main () {
  // Starts socket connection
  const socket = io(socketPath);

  // Loads UI
  const UI = window.UI = new Vue({
    el: '#app',
    data () {
      return {
        currentModule: 'market',
        debug: {
          rows: [],
        },
        market: {
          sortBy: null,
          orderType: null,
          includeBotOrders: false,
          includeExpiredOrders: false,
          orders: [],
        }
      }
    },
    computed: {
      marketOrdersFiltered () {
        return this.market.orders
          .filter((order) => this.market.includeBotOrders || 'marketbot' !== order.ownerName)
          .filter((order) => !this.market.orderType || this.market.orderType === order.orderType)
          .filter((order) => this.market.includeExpiredOrders || Date.now() < (new Date(order.expirationDate).getTime()))
          .map((order) => Object.assign(order, {
            orderValue: order.unitPrice * order.orderQuantity,
          }))
          .map((order) => Object.assign(order, {
            sortOrderValue: (order.orderType === 'buy') ? order.orderValue * -1 : order.orderValue,
            sortUnitPrice: (order.orderType === 'buy') ? order.unitPrice * -1 : order.unitPrice,
          }))
          .sort((a, b) => {
            if (this.market.sortBy) {
              const vA = a[this.market.sortBy];
              const vB = b[this.market.sortBy];

              if (!isNaN(vA)) {
                return vA - vB;
              }

              return vA.toString().localeCompare(vB.toString());
            }

            return 0;
          });
      }
    },
    methods: {
      date (date) {
        return moment(date).format('HH:mm:ss');
      },
      dateRelative (date) {
        return moment(date).fromNow();
      },
      numeric (amount, options) {
        return Intl.NumberFormat('en-US', options).format(amount)
          .replace(/\,/g, ' ');
      },
      money (amount) {
        return `${ this.numeric(amount, { minimumFractionDigits: 2 }) } ℏ`
      },
    },
  });

  // Debug utility
  socket.on('debug', (entry) => {
    // Makes sure our console only keeps 250 latest rows
    UI.debug.rows = [entry, ...UI.debug.rows].slice(0, 250);
  });

  // Update market orders
  socket.on('market', (orders) => {
    UI.market.orders = orders;
  });
}