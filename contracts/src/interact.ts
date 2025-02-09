import { equal } from "node:assert"
import { AccountUpdate, Mina, PrivateKey, UInt64, UInt8, Signature, Field, PublicKey, } from "o1js"
import { SmartMinaAccount } from './SmartMinaAccount.js';

const localChain = await Mina.LocalBlockchain({
  proofsEnabled: false,
  enforceTransactionLimits: false,
})
Mina.setActiveInstance(localChain)

const fee = 1e8

const [deployer, issuer,] = localChain.testAccounts
const contract = PrivateKey.randomKeypair()
const account = new SmartMinaAccount(contract.publicKey)

console.log("Deploying token contract...")

const deployTx = await Mina.transaction({
  sender: deployer,
  fee,
}, async () => {
  AccountUpdate.fundNewAccount(deployer)
  await account.deploy()
})

await deployTx.prove()
deployTx.sign([deployer.key, contract.privateKey])
await deployTx.send()
console.log("Deploy tx confirmed");

const x = await account.pubKey_X1.get()
console.log("x: ", x)

//const reserve = new UInt64(4e9)
//const signature_message: Field[] = reserve.toFields()
//signature_message.push(nonce)
//const signature = Signature.create(oracle.privateKey, signature_message)

/*
console.log("Minting new tokens to Issuer.")
const mintTx = await Mina.transaction({
  sender: deployer,
  fee,
}, async () => {
  AccountUpdate.fundNewAccount(deployer, 1)
  await token.mint(issuer, new UInt64(2e9), new UInt64(reserve), Signature.fromBase58(signature)) //we are minting 2000 USDM tokens to issuer
})
await mintTx.prove();
mintTx.sign([deployer.key, admin.privateKey]);

await mintTx.send();
console.log("Mint Tx Confirmed!")
*/
