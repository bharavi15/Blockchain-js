import MerkleTree from 'merkletreejs'
import { generateMerkleTree,searchTxnHashMerkleTree } from '../blockchain'
import { getSha256Buffer } from '../util'


let leaves = ['a','a'].map(x => getSha256Buffer(x))
let tree = new MerkleTree(leaves, getSha256Buffer)
console.log(tree.toString())
let root = tree.getRoot()
let leaf = getSha256Buffer('a')
let proof = tree.getProof(leaf)
console.log(tree.verify(proof, leaf, root)) // true

console.log('=====')
let block =   {"transactions":[{"timestamp":1682532031886,"debitAccount":"df6ddfd0c1c479d5e067b56743e79af8a807b000361f7fbd2c7c332e2bd775d2","creditAccount":"ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb","amount":2000,"txnHash":"1db5320da1bb94d85725ef29702351ec5e2ad5b1f8a2f783edf1fa01f66f5947"}],"prevHash":"0000000000000000000000000000000000000000000000000000000000000000","currHash":"18eb9eb55b352cbe7324f8262e65f3fa28fe2660e481745e87c1f58164f6d6ff","merkleRootHash":"a02468abf8156a94b99f4c8f2a771e6c456e04b61022b48a7070e22a928439f1"}
let merkleTree =  generateMerkleTree(block)
console.log(merkleTree.toString())
root =  Buffer.from(block.merkleRootHash,'hex')
leaf = getSha256Buffer('1db5320da1bb94d85725ef29702351ec5e2ad5b1f8a2f783edf1fa01f66f5947')
console.log('leaf:',leaf.toString('hex'))
proof = merkleTree.getProof(leaf)
// console.log(proof)
//searchTxnHashMerkleTree('e4f0f4b826c3ca4b43810a221bd1de81adbbcc4c30a425ad0670abf593801655')
console.log(merkleTree.verify(proof, leaf, root))