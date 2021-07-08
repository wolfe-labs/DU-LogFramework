const EventEmitter = require('events');
const StaticServer = require('static-server');

class Framework extends EventEmitter {
  constructor () {
    // Loads parent class
    super();

    // Starts webserver and websocket
    this.server = new StaticServer({
      name: 'Wolfe Labs Log Framework',
      rootPath: __dirname + '/public',
      port: 9000,
      cors: '*',
    });

    // Boots!
    this.server.start(() => {
      this.socket = require('socket.io')(this.server._socket);
      console.info('Web UI running at http://127.0.0.1:9000/');
    });
  }

  loadedModules = {};

  loadModule (modulePath, moduleName) {
    const mod = require(modulePath);

    // Initializes module
    this.loadedModules[moduleName] = new mod(this);
  }

  getModule (moduleName) {
    return this.loadedModules[moduleName];
  }

  pushDataToInterface (channelName, data) {
    this.socket.emit(channelName, data);
  }
}

module.exports = Framework;