import {
    Field,
    createEcdsa,
    Crypto,
    createForeignCurve,
    Bytes,
    Hash,
    Gadgets
} from 'o1js';

class Secp256r1 extends createForeignCurve(Crypto.CurveParams.Secp256r1) { }
class Ecdsa extends createEcdsa(Secp256r1) { }
class Bytes32 extends Bytes(32) { }

let message = Bytes32.random();
let privateKey = Secp256r1.Scalar.random();
let publicKey = Secp256r1.generator.scale(privateKey);

console.log("Public Key: ", publicKey.toBigint())
console.log("Private key: ", privateKey.toBigInt())

// Convert the message to Uint8Array
const messageArray = message.toBytes(); // Assuming message is of type Bytes32

// Create the additional Uint8Array you want to append
const additionalData = new Uint8Array([1, 2, 3, 4]); // Replace with your actual data
const combinedArray = new Uint8Array(messageArray.length + additionalData.length);

combinedArray.set(messageArray, 0);
combinedArray.set(additionalData, messageArray.length);

const new_message = Bytes.from(combinedArray); // Create Bytes from combined array

console.log()

// Now you can use combinedArray for signing or hashing
let signature = Ecdsa.sign(combinedArray, privateKey.toBigInt());

const result = signature.verify(new_message, publicKey);

console.log("Signature verification: ", result.toString());

const hash = Gadgets.SHA256.hash(combinedArray);

// Convert nonce to Bytes
const nonce = Field(32).toString();
const nonce_bytes = Bytes.fromString(nonce);

// Convert nonce_bytes to Uint8Array
const nonceArray = nonce_bytes.toBytes(); // Convert nonce_bytes to Uint8Array

// Create a new Uint8Array to hold the combined message and nonce
const finalCombinedArray = new Uint8Array(combinedArray.length + nonceArray.length);

// Copy the combinedArray and nonceArray into the final array
finalCombinedArray.set(combinedArray, 0); // Copy combinedArray
finalCombinedArray.set(nonceArray, combinedArray.length); // Append nonceArray

console.log("Final combined array: ", finalCombinedArray);

// Convert finalCombinedArray to hexadecimal
const hexString = uint8ArrayToHex(finalCombinedArray);
console.log("Hex: ", hexString);

// Now you can use finalCombinedArray for signing or hashing
let finalSignature = Ecdsa.sign(finalCombinedArray, privateKey.toBigInt());

const finalResult = finalSignature.verify(Bytes.from(finalCombinedArray), publicKey);

console.log("Final Signature verification: ", finalResult.toString());

function uint8ArrayToHex(uint8Array: Uint8Array) {
    return Array.from(uint8Array)
        .map(byte => byte.toString(16).padStart(2, '0')) // Convert each byte to hex and pad with zero if needed
        .join(''); // Join all hex strings into a single string
}
