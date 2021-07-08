# DU-LogFramework
📜 An extensible framework for reading Dual Universe log files in realtime

**Note:** Please keep in mind this is still a prototype and things may change

## Installation

Clone the repository into your computer, run `npm install` to install all dependencies and `npm start` to start the program.

## How it works

When initialized, the program will create a small web UI for better data presentation.

The program will read any new changes from the game's current log file, parse them and emit events accordingly.

You can create your own module to listen to those events and perform actions on the parsed data, optionally sending data to the web UI.

Please, use the reference `MarketDebug` module to have a better idea on how it works! :)
