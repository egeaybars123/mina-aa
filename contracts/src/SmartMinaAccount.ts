import {
  Field, SmartContract, state, State, method,
  createEcdsa, Crypto, createForeignCurve, Bytes,

} from 'o1js';

class Secp256r1 extends createForeignCurve(Crypto.CurveParams.Secp256r1) { }
class EcdsaP256 extends createEcdsa(Secp256r1) { }
class Bytes32 extends Bytes(32) { }

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

  @method async verifySignature(message: Bytes32, signature: EcdsaP256) {
    const pubKey_X1 = this.pubKey_X1.get();
    const pubKey_X2 = this.pubKey_X2.get();
    const pubKey_X3 = this.pubKey_X3.get();

    const pubKey_Y1 = this.pubKey_Y1.get();
    const pubKey_Y2 = this.pubKey_Y2.get();
    const pubKey_Y3 = this.pubKey_Y3.get();

    const xCoordinate: Field3 = [pubKey_X1, pubKey_X2, pubKey_X3];
    const yCoordinate: Field3 = [pubKey_Y1, pubKey_Y2, pubKey_Y3];

    const pubKey = Secp256r1.from({
      x: xCoordinate,
      y: yCoordinate
    });

    const result = signature.verify(message, pubKey);
    result.assertTrue("signature verified");
  }

  /*
    const hexString = "82EB3D8D0FF886BF050869F000CBDD2649A67C48E1F68E83BEDC79B6CFBFC0CF";
    const bytes = Bytes32.fromHex(hexString);
    const fields = bytes.toFields();
    
    this.pubKey_X1.set(fields[0]);
    this.pubKey_X2.set(fields[1]);
    this.pubKey_X3.set(fields[2]);
    */

  /*
  @method async createAccount(accountPublicKey: ForeignCurve) {
    this.publicKeyX.requireEquals([Field(0), Field(0), Field(0)]);
    this.publicKeyY.requireEquals([Field(0), Field(0), Field(0)]);
    
    this.publicKeyX.set(accountPublicKey.x.value);
    this.publicKeyY.set(accountPublicKey.y.value);
  }
  */
}
