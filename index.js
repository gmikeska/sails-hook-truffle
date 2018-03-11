var Web3 = require('web3')

var OS = require("os");
var expect = require("truffle-expect");
var compile = require("truffle-compile");
var contract = require("truffle-contract");
var deployer = require("truffle-deployer");
var mkdirp = require('mkdirp')
var Resolver = require('truffle-resolver')
var fs = require('fs');
var truffleRequire = require("truffle-require");
// working_directory
resolverOpts = {working_directory:__dirname, contracts_build_directory:'build/contracts/'}
// opts = {file:'/build/contracts/PolicyManager.json', resolver:}
resolver= new Resolver(resolverOpts)

ResolverIntercept = function ResolverIntercept(resolver) {
  this.resolver = resolver;
  this.cache = {};
};

ResolverIntercept.prototype.require = function(import_path) {
  // TODO: Using the import path for relative files may result in multiple
  // paths for the same file. This could return different objects since it won't be a cache hit.
  if (this.cache[import_path]) {
    return this.cache[import_path];
  }

  // Note, will error if nothing is found.
  var resolved = this.resolver.require(import_path);

  this.cache[import_path] = resolved;

  // During migrations, we could be on a network that takes a long time to accept
  // transactions (i.e., contract deployment close to block size). Because successful
  // migration is more important than wait time in those cases, we'll synchronize "forever".
  resolved.synchronization_timeout = 0;

  return resolved;
};

ResolverIntercept.prototype.contracts = function() {
  var self = this;
  return Object.keys(this.cache).map(function(key) {
    return self.cache[key];
  });
};





module.exports =  function(sails)
{
   return {
     initialize:function(cb){
       sails.events = {}
       sails.web3 = new Web3(new Web3.providers.HttpProvider(`http://${sails.config[this.configKey].host}:${sails.config[this.configKey].port}`));
          path = sails.config.paths.tmp.split('/')

          path.pop()


          path = path.join('/')



       resolver = new Resolver({working_directory:path, contracts_build_directory:path+'/build/contracts'})
       var  artifacts = new ResolverIntercept(resolver)

      //  console.log("Connecting to Deployed Contracts")
      //  console.log("================================")
      //  console.log(path+"/contracts")

        fs.readdir(path+"/contracts", function(err, items) {
         a = items.shift()
        //  console.log(items)


         items.forEach(function(item)
         {

           fname = path+"/contracts/"+item
           if(!fs.lstatSync(fname).isDirectory())
           {
            //  console.log(item)
               cname = item.split('.')[0]
               sails[cname] = artifacts.require(`./${fname}`)
               sails[cname].setProvider(sails.web3.currentProvider)



                if(Object.keys(sails[cname].networks).length > 0)
                {
                  // console.log(cname)

                  sails[cname].deployed().then((instance)=>{
                    if(instance)
                    {

                      sails.events[cname] = instance.allEvents({fromBlock:0, toBlock:"latest" })
                      sails.events[cname].watch((error, result)=>{
                        // console.log(result)
                        // console.log('relaying')
                        sails.sockets.blast(cname+'Event', result)

                      })
                    }
                    else{

                    }
                  })
                }
          }
         })
        })
        cb()

     },
     defaults:{
       host:'localhost',
       port:'8545'
     },
     configure:function(){

       if(!sails.config[this.configKey])
          sails.config[this.configKey] = {}
       if(!sails.config[this.configKey].host)
          sails.config[this.configKey].host = this.defaults.host
       if(!sails.config[this.configKey].port)
          sails.config[this.configKey].port = this.defaults.port


     }, routes: {
      before: {
        'GET /contracts/:contractName': function (req, res, next) {
          name = req.allParams()['contractName']
          console.log(name)
          sails[name].deployed().then((contractObject)=>{
            return res.send({address:contractObject.address, abi:contractObject.abi})
          })
        }
      }
    }
   }
}
