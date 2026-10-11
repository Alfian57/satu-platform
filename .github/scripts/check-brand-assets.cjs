const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file));
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function assertPngSize(buffer, size) {
    assert.deepEqual(buffer.subarray(0, 8), pngSignature);
    assert.equal(buffer.toString('ascii', 12, 16), 'IHDR');
    assert.equal(buffer.readUInt32BE(16), size);
    assert.equal(buffer.readUInt32BE(20), size);
}

test('Logo bersama dan ikon PNG memakai ukuran runtime yang sesuai', () => {
    for (const [file, size] of [
        ['public/images/logo.png', 256],
        ['public/favicon.png', 64],
        ['public/apple-touch-icon.png', 180],
    ]) {
        assertPngSize(read(file), size);
    }

    assert.equal(read('public/images/logo.png')[25], 6);
    assert.equal(read('public/favicon.png')[25], 6);
    const provenance = JSON.parse(
        read('public/image/logo-satu-konsep-02.provenance.json'),
    );
    assert.ok(provenance.runtime_assets);
    assert.ok(provenance.status.includes('seluruh sistem'));
});

test('Favicon ICO memiliki header asli dan tiga frame PNG transparan', () => {
    const icon = read('public/favicon.ico');
    assert.equal(icon.readUInt16LE(0), 0);
    assert.equal(icon.readUInt16LE(2), 1);
    assert.equal(icon.readUInt16LE(4), 3);
    let expectedOffset = 6 + 3 * 16;

    for (const [index, size] of [16, 32, 48].entries()) {
        const entry = 6 + index * 16;
        assert.equal(icon[entry], size);
        assert.equal(icon[entry + 1], size);
        assert.equal(icon.readUInt16LE(entry + 4), 1);
        assert.equal(icon.readUInt16LE(entry + 6), 32);
        const length = icon.readUInt32LE(entry + 8);
        const offset = icon.readUInt32LE(entry + 12);
        assert.equal(offset, expectedOffset);
        const frame = icon.subarray(offset, offset + length);
        assert.equal(frame.length, length);
        assertPngSize(frame, size);
        assert.equal(frame[25], 6);
        expectedOffset += length;
    }

    assert.equal(expectedOffset, icon.length);
});

test('Favicon SVG mandiri memakai artwork yang sama dengan logo bersama', () => {
    const svg = read('public/favicon.svg').toString();
    const embedded = svg.match(/href="data:image\/png;base64,([^"\s]+)"/);
    assert.ok(embedded);
    assert.deepEqual(
        Buffer.from(embedded[1], 'base64'),
        read('public/images/logo.png'),
    );
    assert.ok(svg.includes('<title>Logo SATU</title>'));
    assert.ok(!svg.includes('#FF2D20'));
});

test('Komponen bersama dan ikon browser memiliki versi cache logo baru', () => {
    const logo = read('resources/js/components/app-logo.tsx').toString();
    assert.ok(logo.includes('src="/images/logo.png?v=logo-02"'));
    assert.ok(!logo.includes('logoSrc'));
    const template = read('resources/views/app.blade.php').toString();

    for (const file of ['favicon.png', 'favicon.ico', 'apple-touch-icon.png']) {
        assert.ok(template.includes(`/${file}?v=logo-02`));
    }

    const publicPortfolio = read(
        'resources/js/pages/portfolio/public.tsx',
    ).toString();
    assert.ok(publicPortfolio.includes('<AppLogo'));
    assert.ok(
        !read('resources/js/pages/welcome.tsx').toString().includes('logoSrc'),
    );
});
