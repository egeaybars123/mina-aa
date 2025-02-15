import { equal } from "node:assert"
import { AccountUpdate, Mina, PrivateKey, createForeignCurve, Crypto, Bytes, createEcdsa } from "o1js"
import { SmartMinaAccount } from './SmartMinaAccount.js';

//npm run build && node build/src/interact.js
class Secp256r1 extends createForeignCurve(Crypto.CurveParams.Secp256r1) { }
class EcdsaP256 extends createEcdsa(Secp256r1) { }
class Bytes32 extends Bytes(32) { }

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

const testPrivateKey = Secp256r1.Scalar.from(23254586026279689419597854806262192318471484469409586905448138334701124205881n);
let message = Bytes32.random();
let nonce = await account.nonce.get();
const nonce_bytes = Bytes.fromString(nonce.toString()) //Not tested, it will be checked with a security expert.
const nonceArray = nonce_bytes.toBytes();
const message_bytes = message.toBytes();
console.log("Message: ", message_bytes)
const newMessage = new Uint8Array(message.length + nonceArray.length);
newMessage.set(message_bytes, 0); // Copy combinedArray
newMessage.set(nonceArray, message_bytes.length); // Append nonceArray
console.log("Interact newMessage: ", newMessage)

let signature = EcdsaP256.sign(newMessage, testPrivateKey.toBigInt());

const result = await account.verifySignature(message, signature);
console.log("Signature verification: ", result.toBoolean())

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
