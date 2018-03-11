# sails-hook-truffle
A hook which handles all contract parsing and instantiation via truffle.

### Installing the Hook

#### On an existing Sails & Truffle projects.

1. Copy contracts folder and truffle.js (or truffle-config.js depending on which your project is using) from your truffle project into the sails project.
0. `npm install -s sails-hook-truffle`

### Usage:
If your contract's filename is `ContractName.sol`:

#### on the server side you can interact with your contract using:
```javascript
sails.ContractName.deployed().then((contractName)=>{
    // include method calls here, or return instance for
    // functionality outside of callback
})
```

#### on the clientSide:
```javascript
io.socket.get('/contracts/ContractName', (ContractName) =>{
  contractName = web3.eth.contract(ContractName.abi).at(ContractName.address);

  // include method calls here, or return instance for
  // functionality outside of callback


  }
````
