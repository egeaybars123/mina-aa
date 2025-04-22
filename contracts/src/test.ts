import { MerkleTree, MerkleWitness, Field, Bytes, Hash, Poseidon } from "o1js";

//npm run build && node build/src/test.js
const treeHeight = 4
class BitcoinMerkleWitness extends MerkleWitness(treeHeight) {}
class Bytes64 extends Bytes(64) {}
class Bytes32 extends Bytes(32) {}
class Bytes1 extends Bytes(1) {}

class BitcoinMerkleTree extends MerkleTree {

    nodes: Record<number, Record<string, Field>> = {};

    private setMerkleNode(level: number, index: bigint, value: Field) {
        (this.nodes[level] ??= {})[index.toString()] = value;
    }
    
    setLeaf(index: bigint, leaf: Field) {
        if (index >= this.leafCount) {
            throw new Error(`index ${index} is out of range for ${this.leafCount} leaves.`);
        }
        this.setMerkleNode(0, index, leaf);
        let currIndex = index;
        for (let level = 1; level < this.height; level++) {
            currIndex /= 2n;

            const left = this.getNode(level - 1, currIndex * 2n);
            const right = this.getNode(level - 1, currIndex * 2n + 1n);

            this.setMerkleNode(level, currIndex, Poseidon.hash([left, right]));
        }
    }
}

/*
const Tree = new BitcoinMerkleTree(treeHeight)
Tree.setLeaf(0n, Field(123));
const root = Tree.getRoot();
console.log("Root: ", root)
*/


const preimage_1 = Bytes32.random();
const preimage_2 = Bytes32.random();

// Get the raw bytes from both Bytes32 objects
const bytes1 = preimage_1.toBytes();
const bytes2 = preimage_2.toBytes();

// Combine the byte arrays
const combinedByteArray = new Uint8Array(64);
combinedByteArray.set(bytes1, 0);
combinedByteArray.set(bytes2, 32);

// Create a new Bytes64 from the combined byte array
const combinedBytes = Bytes64.from(combinedByteArray)

console.log("Preimage-1: ", preimage_1.toBytes());
console.log("Preimage-2: ", preimage_2.toBytes());
console.log("Bytes64: ", combinedBytes.toBytes());


let hash = Hash.SHA2_256.hash(combinedBytes);
console.log(hash.toBytes());

