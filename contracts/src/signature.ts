import {
    Field,
    createEcdsa,
    Crypto,
    createForeignCurve,
    Bytes,
} from 'o1js';
import { Field3 } from 'o1js/dist/node/lib/provable/gadgets/foreign-field.js';

class Secp256r1 extends createForeignCurve(Crypto.CurveParams.Secp256r1) { }
class Ecdsa extends createEcdsa(Secp256r1) { }
class Bytes32 extends Bytes(32) { }

let message = Bytes32.random();
let privateKey = Secp256r1.Scalar.random();
let publicKey = Secp256r1.generator.scale(privateKey);

let signature = Ecdsa.sign(message.toBytes(), privateKey.toBigInt());

const result = signature.verify(message, publicKey);

console.log("Signature verification: ", result.toString())

//const y_coordinate = calculateYCoordinate(publicKey.x.toBigInt())
//console.log("Y coordinate: ", y_coordinate)
console.log("Y coordinate: ", publicKey.y.toBigInt())
//const field3: Field3 = [publicKey.x.toFields()[0], publicKey.x.toFields()[1], publicKey.x.toFields()[2]]
//const test = toBigint(field3)
//console.log("Test", test)

console.log("Test p256 private key: ", privateKey.toBigInt())
console.log("p256 public key: ", publicKey.toBigint())

console.log("X coordinate: ", publicKey.x.toFields().toString())
console.log("Y coordinate: ", publicKey.y.toFields().toString())

function calculateYCoordinate(x: bigint): bigint {
    // y² = x³ + ax + b where a = -3 and b is the curve parameter for secp256r1
    const x2 = Secp256r1.Field.Bigint.mul(x, x)
    const x3 = Secp256r1.Field.Bigint.mul(x2, x)

    const a = Crypto.CurveParams.Secp256r1.a
    const ax = Secp256r1.Field.Bigint.mul(a, x);  // ax
    const b = Crypto.CurveParams.Secp256r1.b;
    const rhs = Secp256r1.Field.Bigint.add(x3, Secp256r1.Field.Bigint.add(ax, b)); // x³ + ax + b

    // Calculate square root to get y
    const y = Secp256r1.Field.Bigint.sqrt(rhs);
    if (y === undefined) throw new Error('No square root exists - point is not on curve');
    return y;
}


function toBigint(field3: Field3) {
    return combine(toBigint3(field3))
}

function combine([x0, x1, x2]: [bigint, bigint, bigint]) {
    return x0 + (x1 << 88n) + (x2 << 166n);
}

function toBigint3(x: Field3): [bigint, bigint, bigint] {
    return [x[0].toBigInt(), x[1].toBigInt(), x[2].toBigInt()];
}
