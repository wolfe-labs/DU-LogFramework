const { Tail } = require('tail');
const { DOMParser } = require('xmldom');
const Framework = require('./Framework');
const fsUtils = require('fs');
const fs = fsUtils.promises;
const path = require('path');

// Enables debugging
const DEBUG = false;

// Initializes the framework entity
const framework = new Framework;

// Our app entrypoint
async function main () {
  // Initializes modules
  console.info('Loading modules...');
  const modDir = path.join(__dirname, 'modules');
  const modFiles = await fs.readdir(modDir);

  // Loads each of the modules
  await Promise.all(
    modFiles.map(async (fileName) => {
      console.info(`Loading module '${ fileName }'...`);
      framework.loadModule(path.join(modDir, fileName, 'module.js'), fileName);
    })
  );

  if (DEBUG) {
    setInterval(async () => {
      processLogEntry(await fs.readFile(__dirname + '/dumps/orders.dump', { encoding: 'utf-8' }));
    }, 5000);
    return;
  }

  // Starts reading logs
  console.info('Preparing log file...');
  const logDir = process.env.LOCALAPPDATA
    ? `${ process.env.LOCALAPPDATA }/NQ/DualUniverse/log/`
    : `${ process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] }/AppData/Local/NQ/DualUniverse/log/`;
  const logFiles = await fs.readdir(logDir);

  // Sorts logs from earliest to latest
  logFiles.sort();

  // Get latest log file
  const logCurrent = logFiles.pop();
  const logFile = path.join(logDir, logCurrent);
  console.info(`Selected log file: ${ logFile }`)

  // Tail reader starts here
  const logStream = new Tail(logFile);

  // This is what separates every log entry
  const logSeparator = 'record';
  const logSeparatorStart = `<${ logSeparator }>`;
  const logSeparatorEnd = `</${ logSeparator }>`;

  // The current log line goes here
  let currentLog = '';

  // Starts reading the log!
  console.info('Reading log file!');
  logStream.on('line', function (data) {
    // Appends data to the current log buffer
    currentLog += data;

    // Tries to extract log entries
    while (true) {
      // Gets current entry end
      const currentEntryEnd = currentLog.indexOf(logSeparatorEnd);
      if (~currentEntryEnd) {
        // Gets the entry
        const currentEntry = `${ currentLog.substr(0, currentEntryEnd + logSeparatorEnd.length) }`;

        // If empty stops
        if (0 === currentEntry.length) break;

        // Ignores entries not starting with a valid tag are ignored
        if (logSeparatorStart === currentEntry.trim().substr(0, logSeparatorStart.length)) {
          setImmediate(() => {
            processLogEntry(currentEntry);
          });
        }

        // Removes entry from the current log
        currentLog = currentLog.substr(currentEntry.length);
      } else {
        break;
      }
    }
  });

  // Tries to force the OS to flush file whenever possible
  setInterval(async () => {
    if (DEBUG) {
      console.log('Refreshing...');
    }

    // This may improve latency
    await fs.stat(logFile);
  }, 100);
}

// This function does the processing of our log entry
async function processLogEntry (xmlEntry) {
  // Parses entry
  const DOM = (new DOMParser).parseFromString(xmlEntry);
  const emitter = DOM.getElementsByTagName('logger')[0].textContent;
  const emitterFriendly = emitter
    .split('\\').pop()
    .split('/').pop()
    .split('.').shift();
  const message = DOM.getElementsByTagName('message')[0].textContent;

  if (DEBUG) {
    console.log(`Event '${ emitterFriendly }' with length ${ message.length }`)
  }

  // Sends to debug channel too
  framework.socket.emit('debug', {
    time: new Date(),
    event: emitterFriendly,
    source: emitter,
    length: message.length,
    preview: message.substr(0, 128),
  });

  // Sends down the message for processing
  framework.emit(emitterFriendly, {
    event: emitterFriendly,
    source: emitter,
    data: message,
  });
}

// Here we go
main();