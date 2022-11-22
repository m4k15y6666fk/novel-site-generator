const path = require('path');
const fs = require('fs');
const glob = require('glob');

function magic(buffer) {
    if (!Buffer.isBuffer(buffer)) {
        throw new Error('not Buffer');
    }
    const hex = buffer.toString('hex', 0, 16).toLowerCase();

    let type = '';
    if (hex.slice(0, 4 * 2) == '89504e47') {
        type = 'image/png';
    } else if (hex.slice(0, 2 * 2) == 'ffd8') {
        type = 'image/jpeg';
    } else if (hex.slice(0, 3 * 2) == '474946') {
        type = 'image/gif';
    } else if (hex.slice(0, 2 * 2) == '424d') {
        type = 'image/bmp';
    } else if (hex.slice(0, 4 * 2) == '49492a00') {
        type = 'image/tiff';
    } else if (hex.slice(0, 4 * 2) == '4d4d002a') {
        type = 'image/tiff';
    } else if (hex.slice(0, 4 * 2) == '52494646' && hex.slice(8 * 2, 12 * 2) == '57454250') {
        type = 'image/webp';
    } else if (hex.slice(0, 4 * 2) == '25504446') {
        type = 'application/pdf';
    }

    return type;
}

module.exports = magic;
