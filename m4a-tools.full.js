window.M4AFile = (() => {
    // Ported to JavaScript by themirrazz

//
//  M4AFile.swift
//  M4ATools
//
//  Created by Andrew Hyatt on 2/8/18.
//  Copyright © 2018 Andrew Hyatt. All rights reserved.
//

const M4AFileError = class M4AFileError extends Error {
    constructor(message) {
        super(message);
        this.name = 'M4AFileError';
    }
};


/**
 * Editable representation of a M4A audio file
 * 
 * @author Andrew Hyatt <ahyattdev@icloud.com>
 * @copyright Copyright © 2018 Andrew Hyatt
 */
const M4AFile = class M4AFile {

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

};
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
const Block = class Block {

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
};
//
//  Metadata.swift
//  M4ATools
//
//  Created by Andrew Hyatt on 3/10/18.
//

/**
 * Metadata type identifier strings
 */
const Metadata = {

    /** Hidden */
    init: () => { },

    /**
     * Metadata with a data type of string
     * Takes up a variant amount of bytes
     */
    StringMetadata: {
        album: '\u00A9alb',
        artist: '\u00A9ART',
        albumArtist: 'aART',
        comment: '\u00A9cmt',
        title: '\u00A9nam',
        genreCustom: '\u00A9gen',
        composer: '\u00A9wrt',
        encoder: '\u00A9too',
        copyright: 'cprt',
        compilation: 'cpil',
        lyrics: '\u00A9lyr',
        purchaseDate: 'purd',
        grouping: '@grp',
        misc: '----',
        sortingTitle: 'sonm',
        sortingAlbum: 'soal',
        sortingArtist: 'soar',
        sortingAlbumArtist: 'soaa',
        sortingComposer: 'soco',
        appleID: 'apID',
        owner: 'ownr',
        xid: 'xid ',
        work: '\u00A9wrk',
        movement: '\u00A9mvn'
    },

    /**
     * 8-bit integer metadata
     * The metadata takes up 9 bytes in the file
     */
    UInt8Metadata: {
        rating: 'rtng',
        gapless: 'pgap',
        mediaType: 'stik',
        genreID: 'gnre',
        compilation: 'cpil',
        showMovement: 'shwm'
    },

    UInt16Metadata: {
        bpm: 'tmpo',
        movementNumber: '\u00A9mvi',
        movementCount: '\u00A9mvc'
    },

    UInt32Metadata: {
        artistID: 'atID',
        genreID: 'geID',
        catalogID: 'cnID',
        countryCode: 'sfID',
        composerID: 'cmID'
    },

    UInt64Metadata: {
        collectionID: 'plID'
    },

    TwoIntMetadata: {
        track: 'trkn',
        disc: 'disc'
    },

    ImageMetadata: {
        artwork: 'covr'
    }

};
const ByteBlocks = {
    stringIdentifier: [0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x00],
    intIdentifier: [0x00,0x00,0x00,0x15,0x00,0x00,0x00,0x00]
};
return M4AFile;
})();
