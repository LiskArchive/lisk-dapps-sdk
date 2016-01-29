# Lisk Dapps SDK

The official SDK for building dapps on the [Lisk](https://lisk.io) decentralized application platform.

## Directory Structure

  * **modules** - Contains the backend code of your dapp.
  * **public** - Contains the frontend user interface of your dapp.
  * **blockchain.json** - JSON file describing the SQL database schema. You will need this if you want to store any data within your dapp.
  * **config.json** - JSON file containing your dapp's configuration data. By default this file defines a list of peers.
  * **genesis.json** - JSON file containing important information about your dapp's genesis block.
  * **index.js** - JavaScript file used to start your dapp.
  * **modules.full.json** - JSON file containing a list of defined modules, required by **index.js**.
  * **routes.json** - JSON file defining the HTTP routes of every endpoint in your dapp's API.

Full documentation is available [here](https://github.com/LiskHQ/lisk-dapps-docs).

## Authors

- Boris Povod <boris@crypti.me>
- Pavel Nekrasov <landgraf.paul@gmail.com>
- Olivier Beddows <olivier@lisk.io>

## License

The MIT License (MIT)  

Copyright (c) 2016 Lisk  
Copyright (c) 2015 Crypti  

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:  

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
