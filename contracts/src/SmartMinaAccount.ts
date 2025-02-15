import {
  Field, SmartContract, state, State, method,
  createEcdsa, Crypto, createForeignCurve, Bytes,
  Bool, Hash
} from 'o1js';

class Secp256r1 extends createForeignCurve(Crypto.CurveParams.Secp256r1) { }
class EcdsaP256 extends createEcdsa(Secp256r1) { }
class Bytes32 extends Bytes(32) { }
//class Bytes40 extends Bytes(40) { } //This part will be changed as we progress through our passkey signature verification.

type Field3 = [Field, Field, Field];
const x_coordinate: Field3 = [Field(34139339299174658436352332n), Field(6401723155167912230812378n), Field(938468427987341925535700n)]
const y_coordinate: Field3 = [Field(99499429251129888946274641n), Field(67418975814022578011150840n), Field(785063205996460759380824n)]
//private key: 23254586026279689419597854806262192318471484469409586905448138334701124205881n

export class SmartMinaAccount extends SmartContract {
  @state(Field) pubKey_X1 = State<Field>();
  @state(Field) pubKey_X2 = State<Field>();
  @state(Field) pubKey_X3 = State<Field>();
  @state(Field) pubKey_Y1 = State<Field>();
  @state(Field) pubKey_Y2 = State<Field>();
  @state(Field) pubKey_Y3 = State<Field>();
  @state(Field) nonce = State<Field>();

  init() {
    super.init();
    this.pubKey_X1.set(x_coordinate[0])
    this.pubKey_X2.set(x_coordinate[1])
    this.pubKey_X3.set(x_coordinate[2])

    this.pubKey_Y1.set(y_coordinate[0])
    this.pubKey_Y2.set(y_coordinate[1])
    this.pubKey_Y3.set(y_coordinate[2])
  }

  //Question: we have message as Bytes32 type, but we can pass in 33 bytes long Bytes as a parameter. how does that work?
  @method.returns(Bool) async verifySignature(message: Bytes32, signature: EcdsaP256): Promise<Bool> {
    const pubKey_X1 = this.pubKey_X1.get();
    this.pubKey_X1.requireEquals(pubKey_X1);
    const pubKey_X2 = this.pubKey_X2.get();
    this.pubKey_X2.requireEquals(pubKey_X2);
    const pubKey_X3 = this.pubKey_X3.get();
    this.pubKey_X3.requireEquals(pubKey_X3);

    const pubKey_Y1 = this.pubKey_Y1.get();
    this.pubKey_Y1.requireEquals(pubKey_Y1);
    const pubKey_Y2 = this.pubKey_Y2.get();
    this.pubKey_Y2.requireEquals(pubKey_Y2);
    const pubKey_Y3 = this.pubKey_Y3.get();
    this.pubKey_Y3.requireEquals(pubKey_Y3);

    const nonce = this.nonce.get();
    this.nonce.requireEquals(nonce);

    const nonce_bytes = Bytes.fromString(nonce.toString()) //Not tested, it will be checked with a security expert.
    const nonceArray = nonce_bytes.toBytes()
    console.log("Nonce Array zkApp: ", nonceArray)
    const message_bytes = message.toBytes()
    console.log("message zkApp: ", message_bytes)
    const newMessage = new Uint8Array(message_bytes.length + nonceArray.length);
    newMessage.set(message_bytes, 0); // Copy combinedArray
    newMessage.set(nonceArray, message_bytes.length); // Append nonceArray
    console.log("zkApp newMessage: ", newMessage)

    const xCoordinate: Field3 = [pubKey_X1, pubKey_X2, pubKey_X3];
    const yCoordinate: Field3 = [pubKey_Y1, pubKey_Y2, pubKey_Y3];

    const pubKey = Secp256r1.from({
      x: xCoordinate,
      y: yCoordinate
    });

    const result = signature.verify(Bytes.from(newMessage), pubKey);
    //result.assertTrue("signature verified");
    return Bool(result);
  }
}

