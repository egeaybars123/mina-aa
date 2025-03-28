export async function verifySignature(publicKeyArrayBuffer: ArrayBuffer, derSignature: ArrayBuffer, dataBuffer: ArrayBuffer) {
    // Import the public key
const publicKey = await crypto.subtle.importKey(
    "spki", // or "raw" if you have the key in raw format
    publicKeyArrayBuffer, // ArrayBuffer containing your public key data
    {
      name: "ECDSA",
      namedCurve: "P-256" // secp256r1
    },
    true,
    ["verify"]
  );
  
  // Verify the signature
  const isValid = await crypto.subtle.verify(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" } // ensure this matches the hash used during signing
    },
    publicKey,
    derSignature,    // DER-encoded signature from the previous step
    dataBuffer       // ArrayBuffer of the original message/data that was signed
  );
  
  return isValid
  
}