#!/usr/bin/env node

/**
 * SVG Font Glyph Extractor & Analyzer
 * 
 * This script extracts glyph data from your hand-drawn SVG font
 * and creates a JavaScript module you can use programmatically.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SVG_FONT_FILE = 'PremiumUltra43v6_handdrawn.svg';
const OUTPUT_JS_FILE = 'handdrawn-glyphs.js';

console.log('🎨 Hand-Drawn SVG Glyph Extractor\n');
console.log('='.repeat(50));

// Check if SVG file exists
if (!fs.existsSync(SVG_FONT_FILE)) {
    console.error(`❌ Error: File "${SVG_FONT_FILE}" not found!`);
    console.log('\nMake sure your SVG font file is in the same directory.');
    console.log('Expected filename: PremiumUltra43v6_handdrawn.svg\n');
    process.exit(1);
}

// Read SVG file
console.log(`📂 Reading: ${SVG_FONT_FILE}`);
const svgContent = fs.readFileSync(SVG_FONT_FILE, 'utf8');

// Extract glyphs using regex
const glyphRegex = /<glyph\s+([^>]+)\/>/g;
const glyphs = [];
let match;

while ((match = glyphRegex.exec(svgContent)) !== null) {
    const attrs = match[1];
    
    // Extract attributes
    const nameMatch = attrs.match(/glyph-name="([^"]+)"/);
    const unicodeMatch = attrs.match(/unicode="([^"]+)"/);
    const dMatch = attrs.match(/d="([^"]+)"/);
    const horizAdvMatch = attrs.match(/horiz-adv-x="([^"]+)"/);
    
    if (nameMatch && dMatch) {
        glyphs.push({
            name: nameMatch[1],
            unicode: unicodeMatch ? unicodeMatch[1] : null,
            unicodeValue: unicodeMatch ? unicodeMatch[1].replace(/&#(\d+);/, '$1') : null,
            path: dMatch[1],
            width: horizAdvMatch ? parseInt(horizAdvMatch[1]) : null,
            pathLength: dMatch[1].length,
            pointCount: (dMatch[1].match(/[ML]/g) || []).length
        });
    }
}

console.log(`✓ Found ${glyphs.length} glyphs\n`);

// Categorize glyphs
const categories = {
    dollar: glyphs.filter(g => g.name.startsWith('dollar')),
    percent: glyphs.filter(g => g.name.startsWith('percent')),
    slash: glyphs.filter(g => g.name.startsWith('slash')),
    equal: glyphs.filter(g => g.name.startsWith('equal'))
};

// Display summary
console.log('📊 Glyph Categories:\n');
Object.entries(categories).forEach(([category, items]) => {
    console.log(`  ${category.toUpperCase()}: ${items.length} variants`);
    if (items.length > 0) {
        console.log(`    Base: ${items[0].name} (U+${items[0].unicodeValue})`);
        const alts = items.filter(g => g.name.includes('.alt'));
        if (alts.length > 0) {
            console.log(`    Alternates: ${alts.length} (${alts[0].name} - ${alts[alts.length-1].name})`);
        }
    }
    console.log('');
});

// Generate statistics
console.log('📈 Statistics:\n');
const avgPathLength = glyphs.reduce((sum, g) => sum + g.pathLength, 0) / glyphs.length;
const avgPoints = glyphs.reduce((sum, g) => sum + g.pointCount, 0) / glyphs.length;
const minWidth = Math.min(...glyphs.map(g => g.width || 0));
const maxWidth = Math.max(...glyphs.map(g => g.width || 0));

console.log(`  Average path length: ${avgPathLength.toFixed(0)} characters`);
console.log(`  Average points per glyph: ${avgPoints.toFixed(1)}`);
console.log(`  Width range: ${minWidth} - ${maxWidth} units`);
console.log('');

// Create JavaScript module
console.log(`📝 Generating: ${OUTPUT_JS_FILE}\n`);

const jsModule = `/**
 * Hand-Drawn Glyphs Library
 * Auto-generated from ${SVG_FONT_FILE}
 * 
 * Total glyphs: ${glyphs.length}
 * Generated: ${new Date().toISOString()}
 */

export const HANDDRAWN_GLYPHS = ${JSON.stringify(glyphs, null, 2)};

export const GLYPH_CATEGORIES = {
    dollar: HANDDRAWN_GLYPHS.filter(g => g.name.startsWith('dollar')),
    percent: HANDDRAWN_GLYPHS.filter(g => g.name.startsWith('percent')),
    slash: HANDDRAWN_GLYPHS.filter(g => g.name.startsWith('slash')),
    equal: HANDDRAWN_GLYPHS.filter(g => g.name.startsWith('equal'))
};

/**
 * Get a glyph by name
 * @param {string} name - Glyph name (e.g., 'dollar', 'dollar.alt1')
 * @returns {Object|null} Glyph data or null if not found
 */
export function getGlyph(name) {
    return HANDDRAWN_GLYPHS.find(g => g.name === name) || null;
}

/**
 * Get all variants of a base glyph
 * @param {string} baseName - Base name (e.g., 'dollar')
 * @returns {Array} Array of glyph variants
 */
export function getVariants(baseName) {
    return HANDDRAWN_GLYPHS.filter(g => g.name.startsWith(baseName));
}

/**
 * Get a random variant of a glyph
 * @param {string} baseName - Base name (e.g., 'dollar')
 * @returns {Object|null} Random glyph variant
 */
export function getRandomVariant(baseName) {
    const variants = getVariants(baseName);
    if (variants.length === 0) return null;
    return variants[Math.floor(Math.random() * variants.length)];
}

/**
 * Scale a glyph path to fit target dimensions
 * @param {string} pathData - SVG path data
 * @param {number} targetWidth - Target width
 * @param {number} targetHeight - Target height
 * @returns {string} Scaled path data
 */
export function scaleGlyphPath(pathData, targetWidth, targetHeight) {
    // Parse path commands
    const commands = pathData.match(/[ML][^ML]*/g) || [];
    
    // Find bounding box
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    commands.forEach(cmd => {
        const coords = cmd.slice(1).match(/-?\\d+\\.?\\d*/g) || [];
        for (let i = 0; i < coords.length; i += 2) {
            const x = parseFloat(coords[i]);
            const y = parseFloat(coords[i + 1]);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
    });
    
    const width = maxX - minX;
    const height = maxY - minY;
    const scaleX = targetWidth / width;
    const scaleY = targetHeight / height;
    
    // Scale all coordinates
    return commands.map(cmd => {
        const type = cmd[0];
        const coords = cmd.slice(1).match(/-?\\d+\\.?\\d*/g) || [];
        const scaled = [];
        
        for (let i = 0; i < coords.length; i += 2) {
            const x = (parseFloat(coords[i]) - minX) * scaleX;
            const y = (parseFloat(coords[i + 1]) - minY) * scaleY;
            scaled.push(x.toFixed(2), y.toFixed(2));
        }
        
        return type + scaled.join(',');
    }).join('');
}

// Export summary
export const GLYPH_SUMMARY = {
    total: ${glyphs.length},
    categories: {
        dollar: ${categories.dollar.length},
        percent: ${categories.percent.length},
        slash: ${categories.slash.length},
        equal: ${categories.equal.length}
    },
    stats: {
        avgPathLength: ${avgPathLength.toFixed(0)},
        avgPoints: ${avgPoints.toFixed(1)},
        widthRange: [${minWidth}, ${maxWidth}]
    }
};
`;

fs.writeFileSync(OUTPUT_JS_FILE, jsModule);
console.log(`✓ Created ${OUTPUT_JS_FILE}`);
console.log(`  File size: ${(jsModule.length / 1024).toFixed(1)} KB`);
console.log('');

// Create sample usage
console.log('📖 Sample Usage:\n');
console.log('```javascript');
console.log("import { getGlyph, getRandomVariant, scaleGlyphPath } from './handdrawn-glyphs.js';");
console.log('');
console.log("// Get specific glyph");
console.log("const dollar = getGlyph('dollar');");
console.log('console.log(dollar.path);');
console.log('');
console.log("// Get random variant");
console.log("const randomDollar = getRandomVariant('dollar');");
console.log('');
console.log("// Scale path to fit 100x200px");
console.log("const scaledPath = scaleGlyphPath(dollar.path, 100, 200);");
console.log('```\n');

console.log('✅ All done!\n');
console.log('Next steps:');
console.log('1. Upload files to GitHub');
console.log('2. Test with test-handwritten-glyphs.html');
console.log('3. Use handdrawn-glyphs.js in your projects\n');
