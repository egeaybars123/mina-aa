import { decode } from "cbor2";

export function arrayBufferToStr(buf: ArrayBuffer) {
    return String.fromCharCode(...new Uint8Array(buf));
}

// Function to convert ArrayBuffer to hexadecimal string
export function arrayBufferToHex(buffer: ArrayBuffer): string {
    const byteArray = new Uint8Array(buffer);
    return Array.from(byteArray)
        .map((byte) => byte.toString(16).padStart(2, '0')) // Convert each byte to hex
        .join(''); // Join all hex values into a single string
}

export function getNewChallenge() {
    return Math.random().toString(36).substring(2);
}

export function convertChallenge(challenge: string) {
    return btoa(challenge).replaceAll('=', '');
}

function readAsn1IntegerSequence(input: Uint8Array) {
    if (input[0] !== 0x30) throw new Error('Input is not an ASN.1 sequence');
    const seqLength = input[1];
    const elements = [];


    let current = input.slice(2, 2 + seqLength);
    while (current.length > 0) {
        const tag = current[0];
        if (tag !== 0x02) throw new Error('Expected ASN.1 sequence element to be an INTEGER');


        const elLength = current[1];
        elements.push(current.slice(2, 2 + elLength));


        current = current.slice(2 + elLength);
    }
    return elements;
}

export function convertEcdsaAsn1Signature(input: Uint8Array) {
    const elements = readAsn1IntegerSequence(input);
    if (elements.length !== 2) throw new Error('Expected 2 ASN.1 sequence elements');
    let [r, s] = elements;


    // R and S length is assumed multiple of 128bit.
    // If leading is 0 and modulo of length is 1 byte then
    // leading 0 is for two's complement and will be removed.
    if (r[0] === 0 && r.byteLength % 16 == 1) {
        r = r.slice(1);
    }
    if (s[0] === 0 && s.byteLength % 16 == 1) {
        s = s.slice(1);
    }


    // R and S length is assumed multiple of 128bit.
    // If missing a byte then it will be padded by 0.
    if ((r.byteLength % 16) == 15) {
        r = new Uint8Array(mergeBuffer(new Uint8Array([0]), r));
    }
    if ((s.byteLength % 16) == 15) {
        s = new Uint8Array(mergeBuffer(new Uint8Array([0]), s));
    }


    // If R and S length is not still multiple of 128bit,
    // then error
    if (r.byteLength % 16 != 0) throw Error("unknown ECDSA sig r length error");
    if (s.byteLength % 16 != 0) throw Error("unknown ECDSA sig s length error");


    return mergeBuffer(r, s);
}

function mergeBuffer(buffer1: Uint8Array<ArrayBuffer>, buffer2: Uint8Array<ArrayBuffer>) {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
}

export function uint8ArrayToHex(uint8Array: Uint8Array) {
    return Array.from(uint8Array)
        .map(byte => byte.toString(16).padStart(2, '0')) // Convert each byte to hex and pad with 0 if necessary
        .join(''); // Join all the hex strings together
}

export function uint8ArrayToBigInt(uint8Array: Uint8Array) {
    if (uint8Array.length !== 32) {
        throw new Error("Invalid Uint8Array length for u256. Expected 32 bytes.");
    }

    let hexString = "0x";
    for (const byte of uint8Array) {
        hexString += byte.toString(16).padStart(2, "0");
    }

    return BigInt(hexString);
}

export function extractPublicKeyFromAttestation(attestationObjectBuffer: ArrayBuffer) {
    // Convert the ArrayBuffer to a Uint8Array and decode the CBOR structure
    const attestationObject = decode(new Uint8Array(attestationObjectBuffer));
    // Extract the authenticator data as a Uint8Array
    const authData = new Uint8Array((attestationObject as any).authData);

    // Set an initial pointer to navigate through authData
    let pointer = 0;
    // Skip rpIdHash (32 bytes)
    pointer += 32;
    
    // Skip flags (1 byte)
    pointer += 1;
    
    // Skip signCount (4 bytes)
    pointer += 4;
    
    // If attested credential data is present, extract it.
    // AAGUID (16 bytes)
    pointer += 16;
    
    // Credential ID Length (2 bytes, big-endian)
    const credIdLen = (authData[pointer] << 8) | authData[pointer + 1];
    pointer += 2;
    
    // Skip the Credential ID
    pointer += credIdLen;
    
    // The remaining bytes represent the credentialPublicKey in COSE format
    const cosePublicKeyBuffer = authData.slice(pointer);
    
    // Decode the COSE public key using CBOR
    const publicKeyCose = decode(cosePublicKeyBuffer);
    
    return publicKeyCose;
  }