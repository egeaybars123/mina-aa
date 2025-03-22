import { AccountUpdate, Mina, PrivateKey, createForeignCurve, Crypto, Bytes, createEcdsa, UInt64 } from "o1js"
import { SmartMinaAccount } from './SmartMinaAccount.js';
import { equal } from 'node:assert';

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
//console.log("Message: ", message_bytes)
const newMessage = new Uint8Array(message.length + nonceArray.length);
newMessage.set(message_bytes, 0); // Copy combinedArray
newMessage.set(nonceArray, message_bytes.length); // Append nonceArray
//console.log("Interact newMessage: ", newMessage)

let signature = EcdsaP256.sign(newMessage, testPrivateKey.toBigInt());

const result = await account.verifySignature(message, signature);
console.log("Signature verification: ", result.toBoolean())

const fundAmount = UInt64.from(2e9); // Amount to fund the zkApp account (1 MINA)
const fundTx = await Mina.transaction({
  sender: deployer,
  fee,
}, async () => {
  const senderUpdate = AccountUpdate.create(deployer)
  senderUpdate.requireSignature();
  senderUpdate.send({ to: account.address, amount: fundAmount });
});
await fundTx.prove();
fundTx.sign([deployer.key]);
await fundTx.send();
console.log("Funding zkApp account confirmed.");


// Check balance of zkApp account
const zkAppBalance = await Mina.getBalance(account.address);
const recipientBeforeBalance = await Mina.getBalance(issuer)
console.log("zkApp Balance before calling transferFunds(): ", zkAppBalance.div(1e9).toBigInt());

console.log("Recipient Balance before calling transferFunds(): ", recipientBeforeBalance.div(1e9).toBigInt());

// Prepare to transfer funds to another account
const recipient = issuer; // Use the issuer as the recipient
const transferAmount = UInt64.from(1e9); // Amount to transfer

// Transfer MINA tokens from zkApp to recipient
const transferTx = await Mina.transaction({
  sender: deployer,
  fee,
}, async () => {
  await account.transferFunds(recipient, transferAmount, message, signature); // Transfer to recipient
})
await transferTx.prove();
transferTx.sign([deployer.key]);
await transferTx.send();
console.log("Transfer Tx Confirmed!");

// Check balances after transfer
const newZkAppBalance = await Mina.getBalance(account.address);
const recipientBalance = await Mina.getBalance(recipient);
console.log("zkApp Balance after transferFunds(): ", newZkAppBalance.div(1e9).toBigInt());
console.log("Recipient Balance after transferFunds(): ", recipientBalance.div(1e9).toBigInt());

// Validate balances
const expectedZkAppBalance = zkAppBalance.sub(transferAmount);
equal(newZkAppBalance.toBigInt(), expectedZkAppBalance.toBigInt(), "zkApp balance should be updated correctly");
console.log("zkApp balance updated correctly.");

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
