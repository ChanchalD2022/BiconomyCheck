import './App.css';
import {Biconomy} from "@biconomy/mexa";
import Contract from  './Counter.json';
import {Magic} from 'magic-sdk';
const { ethers } = require("ethers");
// const fetch = require("node-fetch");
// const { URL, URLSearchParams } = require('url');
let sigUtil = require("eth-sig-util"); // additional dependency 

let functionSig;
let accounts;
let rawTx;
let wallet;
let biconomy;
let ethersProvider;
let signer;
let smartAccount;


function App() {

async function intialize(){

  const magic = new Magic('magic-API-key', {
    network : {
      rpcUrl: 'https://rpc-mumbai.maticvigil.com/',
      chainId: 80001
    }
  });  

  await magic.auth.loginWithMagicLink({email : "mail-id"})


  // const provider = new ethers.providers.Web3Provider(magic.rpcProvider);
  
  biconomy = new Biconomy(magic.rpcProvider,{apiKey: "biconomy-api-key", debug: true, walletProvider: window.ethereum, contractAddresses:["0xb6344965824084950d901bb692c551b65027498c"]});
  // const biconomy = new Biconomy(window.ethereum,{apiKey: "biconomy-api-key", debug: true});
  
  ethersProvider = new ethers.providers.Web3Provider(biconomy);

  // wallet = new ethers.Wallet("privateKey", ethersProvider);
  


console.log(biconomy);
console.log(ethersProvider);

console.log(Contract.abi);
let contract = Contract.abi;
let ContractInterface = new ethers.utils.Interface(Contract.abi);
signer = ethersProvider.getSigner("magic-public-address-sender");
accounts = await signer.getAddress();
console.log(accounts)
const ContractInstance = new ethers.Contract("0xb6344965824084950d901bb692c551b65027498c", contract, signer);

functionSig = ContractInterface.encodeFunctionData("incrementCounter");
// rawTx = {
//   from: "senderAddress",
//   to: "0xb6344965824084950d901bb692c551b65027498c",
//   data: functionSig,
// }

rawTx = {
  from: accounts,
  to: "0xb6344965824084950d901bb692c551b65027498c",
  data: functionSig,
}
// signer = ethersProvider.getSigner();
console.log("signer");
console.log(signer);

// const relayer2 = new LocalRelayer(signer);
// // to do transaction on smart account we need to set relayer
// smartAccount = await smartAccount.setRelayer(relayer2);   
biconomy.onEvent(biconomy.READY, async () => {
  // Initialize your dapp here like getting user accounts etc
  // accounts =  await ethersProvider.send('eth_requestAccounts', []); // <- this promps user to connect metamask

  
  const ContractInstance = new ethers.Contract("0xb6344965824084950d901bb692c551b65027498c", contract, signer);

  console.log(ContractInstance);
  // let check = await ContractInstance.incrementCounter();
  let check = await ContractInstance.getCount();

  console.log(check);
  
}).onEvent(biconomy.ERROR, (error, message) => {
  // Handle error while initializing mexa
});
  
  // let check = await ContractInstance.incrementCounter();
    
}

async function CallFunction(){
 

  const domain = {
    name: "TRUSTED_FORWARDER",
    version: "0.0.1",
    chainId: "80001",
    verifyingContract: "0xb6344965824084950d901bb692c551b65027498c"
  }
  const types = {
    ForwardRequest:[
      {name:'from', type:'address'},
      {name:'to', type:'address'},
      {name:'data', type:'string'}    
    ]
  }

  const req = {
    from: "magic-public-address-sender",
    to: "0xb6344965824084950d901bb692c551b65027498c",
    data: functionSig    
  }

  console.log(signer)
  const signedTx = await signer.signMessage(req);
  // const signedTx = await signer._signTypedData(domain,types,rawTx);
  console.log("signedTx");
  console.log(signedTx); 
  const frwdData = await biconomy.getForwardRequestAndMessageToSign(signedTx);
  console.log(frwdData); 

  const signature = sigUtil.signTypedMessage(new Buffer.from("privateKey", 'hex'), { data: frwdData.eip712Format }, 'V3');                                                                    


  let data = {    
    signature: signature,
    forwardRequest: frwdData.request,
    rawTransaction: signedTx,
    signatureType: biconomy.EIP712_SIGN
};

let txHash = await ethersProvider.send("eth_sendRawTransaction", [data]);
console.log(txHash)

let receipt = await ethersProvider.waitForTransaction(txHash);
console.log(receipt)

}

async function APICall(){


const authToken = "authToken";
const apiKey = "ApiKey";
const getUniqueUserData = () => {
    const url = new URL("https://data.biconomy.io/api/v1/dapp/uniqueUserData");

    const params = {
        startDate : "08-09-2022",
        endDate : "10-19-2022"
    }
    
    url.search = new URLSearchParams(params).toString();

    const requestOptions = {
        method: 'GET',
        headers: {  "Content-Type": "application/x-www-form-urlencoded", "authToken": authToken, "apiKey" : apiKey }
    };
    
    fetch(url, requestOptions)
    .then(response => response.json())
    .then(data => console.log(data))     
    .catch(error => console.error('Error:', error));
}

}
  
  return (
    <div className="App">
       <header className="App-header">
       <h1>Counter App Biconomy</h1>
        <p>
         Counter Value : 
        </p>
       <button onClick={intialize}>Increment Counter</button>
       <button onClick={CallFunction}>Call Transaction Function</button>
       <button onClick={APICall}>Call API Function</button>

      </header>
    </div>
  );
}

export default App;
