//
//  Block.swift
//  M4ATools
//
//  Created by Andrew Hyatt on 3/10/18.
//

/**
 * Represents a block within an M4A file.
 * 
 * - Note: often nested within other blocks
 */
class Block {

    /** The block type */
    type;
    /**
     * The data of the block
     * - note: Is only written on a write call if there are no children
    */
    data;

    /** The parent block, if the block has one */
    parent;

    /**
     * Children blocks, may be empty
     * @type {Block[]}
    */
    children = [];

    largeAtomSize = false;

    /**
     * Initializes a block
     * @param {string} type The block type
     * @param {Uint8Array} data The data of the block. Excludes the size and type data.
     * @param {Block|null} parent 
     */
    constructor(type, data, parent) {
        this.type = type;
        this.data = data;

        // Load child blocks
        // Only explore supported parent blocks for now
        if(type == 'moov' || type == 'udta' || type == 'meta' || type == 'ilst' || (parent != null && parent.type == "ilst")) {
            let index = 0;

            if(type == 'meta') {
                // The first 4 bytes of meta are empty
                index += 4;
            }

            while (index != data.length) {
                const sizeData = data.slice(index, index + 4);
                const size = (new DataView(sizeData.buffer)).getUint32(0);
                const typeData = data.slice(index + 4, index + 8);
                const type = (new TextDecoder('x-mac-roman')).decode(typeData.buffer);

                const contents = data.subarray(index + 8, index + size);

                const childBlock = new Block(type, contents, this);

                this.children.push(childBlock);

                index += size;
            }
        }
    }
}
