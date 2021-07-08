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
        market: {
          includeBotOrders: false,
          includeExpiredOrders: false,
          orders: [],
        }
      }
    },
    computed: {
      marketOrdersFiltered () {
        return this.market.orders
          .filter((order) => this.market.includeExpiredOrders || Date.now() < (new Date(order.expirationDate).getTime()))
          .filter((order) => this.market.includeBotOrders || 'marketbot' !== order.ownerName);
      }
    },
    methods: {
      dateRelative (date) {
        return moment(date).fromNow();
      },
      numeric (amount) {
        return Intl.NumberFormat('en-US').format(amount)
          .replace(/\,/g, ' ');
      },
      money (amount) {
        return `${ this.numeric(amount) } ℏ`
      },
    },
  });

  // Update market orders
  socket.on('market', (orders) => {
    UI.market.orders = orders;
  });
}