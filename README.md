# M4ATools JavaScript Port

This is a JavaScript port of the popular Swift library M4ATools ([ahyattdev/M4ATools](https://github.com/ahyattdev/M4ATools)). It runs in your browser and won't freeze the page. As of right now, it's used in [my smart TV OS](https://thewebtv.github.io/) for reading metadata from M4A files, so you can see it in action there by connecting an iPod.

[Loading metadata from an iTunes-purchased file](https://github.com/user-attachments/assets/5c6c513b-1272-4846-9227-8ef7c155db79)

## Usage
```javascript
const response = await fetch('./my-audio.m4a');
const buffer = await file.response();
const uint8 = new Uint8Array(buffer);

const m4a = new M4AFile(uint8);

console.log(m4a.getStringMetadata("\u00A9nam") + ' by ' + m4a.getStringMetadata("\u00A9ART"))
```
