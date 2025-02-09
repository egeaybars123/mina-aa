/*
import { AccountUpdate, Field, ForeignCurve, Mina, PrivateKey, PublicKey } from 'o1js';
import { Field3 } from 'o1js/dist/node/lib/provable/gadgets/foreign-field';
import { SmartMinaAccount } from './SmartMinaAccount.js';


let proofsEnabled = false;

describe('Smart Mina Account', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: SmartMinaAccount;

  beforeAll(async () => {
    if (proofsEnabled) await SmartMinaAccount.compile();
  });

  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    [deployerAccount, senderAccount] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new SmartMinaAccount(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('generates and deploys the `SmartMinaAccount` smart contract & publicKey is equal to (0,0)', async () => {
    await localDeploy();
    const publicKeyX: Field3 = zkApp.publicKeyX.get();
    const publicKeyY: Field3 = zkApp.publicKeyY.get();
    expect(publicKeyX).toEqual([Field(0), Field(0), Field(0)])
    expect(publicKeyY).toEqual([Field(0), Field(0), Field(0)])
  });

  /*
  it('correctly updates the num state on the `Add` smart contract', async () => {
    await localDeploy();

    // update transaction
    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.update();
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const updatedNum = zkApp.num.get();
    expect(updatedNum).toEqual(Field(3));
  });
  
});
*/