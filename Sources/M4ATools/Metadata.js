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

}
