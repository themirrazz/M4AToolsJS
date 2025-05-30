// Ported to JavaScript by themirrazz

//
//  M4AFile.swift
//  M4ATools
//
//  Created by Andrew Hyatt on 2/8/18.
//  Copyright © 2018 Andrew Hyatt. All rights reserved.
//

class M4AFileError extends Error {
    constructor(message) {
        super(message);
        this.name = 'M4AFileError';
    }
}


/**
 * Editable representation of a M4A audio file
 * 
 * @author Andrew Hyatt <ahyattdev@icloud.com>
 * @copyright Copyright © 2018 Andrew Hyatt
 */
class M4AFile {

    /** M4A file related errors */
    M4AFileError = {

        /** When a block of an unknown type is loaded */
        invalidBlockType: new M4AFileError('invalid block type'),
        /** When a file is not a valid M4A */
        invalidFile: new M4AFileError('invalid M4A file')

    };

    /// Used to check if a block is recognized
    #validTypes = ['ftyp', 'mdat', 'moov', 'pnot', 'udta',
                         'uuid', 'moof', 'free', 'skip', 'jP2',
                         'wide', 'load', 'ctab', 'imap', 'matt',
                         'kmat', 'clip', 'crgn', 'sync', 'chap',
                         'tmcd', 'scpt', 'ssrc', 'PICT'];
    
    /** The `Block`s in the M4A file */
    #blocks;

    /**
     * Used to get the metadata block
     * @type {Block|null}
    */
    get metadataBlock() {
        return this.#findBlock(['moov', 'udta', 'meta', 'ilst']);
    }

    /** The name of the file, if created from a URL or otherwise set */
    fileName;
    /**
     * The URL the file was loaded from
     * 
     * If loaded from data this is null
     */
    url;

    get blocks() {
        return this.#blocks;
    };

    /**
     * Creates an instance from data
     * @param {Uint8Array} data The data of an M4A file
     * @throws `M4AFileError.invalidBlockType`
     */
    constructor(data) {
        this.#blocks = [];

        
        if(!(data.byteLength >= 8)) {
            throw this.M4AFileError.invalidFile;
        }

        // Begin reading file
        let index = 0;
        while(index < data.length) {
            // Offset 0 to 4
            const sizeData = data.slice(index, index + 4);
            // Offset 4 to 8
            const typeData = data.slice(index + 4, index + 8);

            // Turn size into an integer
            let size = (new DataView(sizeData.buffer)).getUint32(0);


            const type = (new TextDecoder('x-mac-roman')).decode(typeData.buffer);

            if(!(this.#validTypes.includes(type))) {
                throw this.M4AFileError.invalidBlockType;
            }

            let largeSize = false;
            if(size == 1 && type == 'mdat') {
                // mdat sometimes has a size of 1 and
                // it's size is 12 bytes into itself
                const mdatSizeData = data.slice(index + 12, index + 16);
                size = (new DataView(mdatSizeData.buffer)).getUint32(0);
            }

            // Load block
            const blockContents = data.subarray(index + 8, index + size);

            index += size;

            const block = new Block(type, blockContents, null);
            block.largeAtomSize = largeSize;

            this.#blocks.push(block);
        }

        // See if loaded metadata identifiers are recognized
        const meta = this.metadataBlock;
        if(meta) {
            for(const block of meta.children) {
                if(
                    Metadata.StringMetadata[block.type] == undefined &&
                    Metadata.UInt8Metadata[block.type] == undefined &&
                    Metadata.UInt16Metadata[block.type] == undefined &&
                    Metadata.UInt32Metadata[block.type] == undefined &&
                    Metadata.UInt64Metadata[block.type] == undefined &&
                    Metadata.TwoIntMetadata[block.type] == undefined &&
                    Metadata.ImageMetadata[block.type] === undefined
                ) {
                    console.log("Unrecognized metadata type: " + block.type);
                }
            }
        }
    }

    /**
     * Gets metadata of the `string` type
     * @param {string} metadata The metadtata type
     * @returns {string|null}
     */
    getStringMetadata(metadata) {
        const metadataContainerBlock = this.metadataBlock;
        if(!metadataContainerBlock) return null;

        const type = metadata.toString();

        const metaBlock = this.getMetadataBlock(metadataContainerBlock, type);
        if(!metaBlock) return null;

        const data = this.readMetadata(metaBlock);
        if(!data) return null;

        return (new TextDecoder('utf-8')).decode(data);
    }

    getUint8Metadata(metadata) {
        const metadataChild = this.getMetadataBlock(this.metadataBlock, metadata);
        if(metadataChild) {
            if(!(metadataChild.data.length == 9)) {
                console.warn('UInt8 metadata should have 1 byte of data!');
                return null;
            }
            return metadataChild.data[8];
        }
        return null;
    }

    getUint16Metadata(metadata) {
        const metadataChild = this.getMetadataBlock(this.metadataBlock, metadata);
        if(metadataChild) {
            if(!(metadataChild.data.length == 10)) {
                console.warn('UInt8 metadata should have 2 bytes of data!');
                return null;
            }
            return new Uint16Array(
                [metadataChild.data[9], metadataChild.data[8]]
            )[0];
        }
        return null;
    }

    getUint32Metadata(metadata) {
        const metadataChild = this.getMetadataBlock(this.metadataBlock, metadata);
        if(metadataChild) {
            if(!(metadataChild.data.length == 12)) {
                console.warn('UInt8 metadata should have 4 bytes of data!');
                return null;
            }
            return new Uint32Array(
                [metadataChild.data[11], metadataChild.data[10], metadataChild.data[9], metadataChild.data[8]]
            )[0];
        }
        return null;
    }

    getUint64Metadata(metadata) {
        const metadataChild = this.getMetadataBlock(this.metadataBlock, metadata);
        if(metadataChild) {
            if(!(metadataChild.data.length == 16)) {
                console.warn('UInt8 metadata should have 8 bytes of data!');
                return null;
            }
            return new Uint32Array(
                [metadataChild.data[15], metadataChild.data[14], metadataChild.data[13], metadataChild.data[12],
                metadataChild.data[11], metadataChild.data[10], metadataChild.data[9], metadataChild.data[8]]
            )[0];
        }
        return null;
    }

    getTwoIntMetadata(metadata) {
        const metadataChild = this.getMetadataBlock(this.metadataBlock, metadata);
        if(metadataChild) {
            if(!(metadataChild.data.length == 16)) {
                console.warn('Invalid two int metadata read attempted.');
                return null;
            }
            const data = metadataChild.data;
            const firstIntData = data.slice(10, 12);
            const secondIntData = data.slice(12, 14);

            const firstInt = (new Uint16Array(firstIntData))[0];
            const secondInt = (new Uint16Array(secondIntData))[0];

            return (firstInt, secondInt);
        }
    }

    /**
     * 
     * @param {Block} container 
     * @param {string} type 
     * @returns {Block|null}
     */
    getMetadataBlock(container, name) {
        for(const block of container.children) {
            if(block.type == name) return block;
        }
        return null;
    }

    /**
     * 
     * @param {Block} metadata 
     */
    readMetadata(metadata) {
        let data = metadata.data;
        const sizeData = data.slice(0, 4);
        const typeData = data.slice(4, 8);
        const shouldBeNullData = data.slice(8, 16);
        data = data.subarray(sizeData.byteLength + typeData.byteLength + shouldBeNullData.byteLength);

        const size = (new DataView(sizeData.buffer)).getUint32(0);
        const type = (new TextDecoder('x-mac-roman')).decode(typeData.buffer);
        if(!(type == 'data')) {
            console.warn('Could not get metadata entry type');
            return null;
        }
        if(
            !((shouldBeNullData.toString() == ByteBlocks.stringIdentifier.toString()) ||
            (shouldBeNullData.toString() == ByteBlocks.intIdentifier.toString()))
        ) {
            return null;
        }

        if(!(size == shouldBeNullData.byteLength + typeData.byteLength + sizeData.byteLength + data.byteLength)) {
            return null;
        }

        return data;
    }

    /**
     * 
     * @param {string[]} components 
     */
    #findBlock(components) {
        if(components.length == 0) throw new Error('assertion');

        let blocks = this.#blocks;
        for(const component of components) {
            let block = this.getBlockLevelOne(blocks, component);
            if(block) {
                if(component == components[components.length - 1]) return block;
                else blocks = block.children;
            } else return null;
        }

        return null
    }

    /**
     * 
     * @param {Block[]} blocks 
     * @param {string} type 
     */
    getBlockLevelOne(blocks, type) {
        for(const block of blocks) {
            if(block.type === type) return block;
        }
        return null;
    }

}
