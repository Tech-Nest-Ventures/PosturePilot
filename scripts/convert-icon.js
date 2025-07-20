const fs = require('fs');
const svg2png = require('svg2png');
const path = require('path');

const svgPath = path.join(__dirname, '../src/assets/icon.svg');
const pngPath = path.join(__dirname, '../src/assets/icon.png');

fs.readFile(svgPath, (err, buffer) => {
    if (err) {
        console.error('Error reading SVG file:', err);
        process.exit(1);
    }

    svg2png(buffer, { width: 1024, height: 1024 })
        .then(buffer => {
            fs.writeFile(pngPath, buffer, err => {
                if (err) {
                    console.error('Error saving PNG file:', err);
                    process.exit(1);
                }
                console.log('✓ Icon converted successfully');
            });
        })
        .catch(err => {
            console.error('Error converting SVG to PNG:', err);
            process.exit(1);
        });
}); 