/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    KATEX HANDWRITING GEOMETRY v3.1                          ║
 * ║                         Production Ready                                     ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  Transforms KaTeX mathematical notation into hand-drawn style               ║
 * ║  using perfect-freehand and rough.js                                        ║
 * ║                                                                              ║
 * ║  Author: Moon                                                                ║
 * ║  License: MIT                                                                ║
 * ║  Repository: https://github.com/[your-repo]                                 ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * USAGE:
 * ──────────────────────────────────────────────────────────────────────────────
 *   import { applyHandwritingGeometry, clearHandwritingGeometry } 
 *       from './katex-handwriting-geometry.js';
 *   
 *   // After rendering KaTeX:
 *   await applyHandwritingGeometry();
 *   
 *   // To reset:
 *   clearHandwritingGeometry();
 * 
 * DEPENDENCIES:
 * ──────────────────────────────────────────────────────────────────────────────
 *   - perfect-freehand: https://esm.sh/perfect-freehand@1.2.0
 *   - rough.js: https://unpkg.com/roughjs@latest/bundled/rough.esm.js
 * 
 * PROCESSORS (9 total):
 * ──────────────────────────────────────────────────────────────────────────────
 *   1. processDelimiters()      - Big ( ) [ ] { } | ⟨ ⟩ ⌊ ⌋ ⌈ ⌉
 *   2. processHorizontalLines() - Fraction bars, overlines, underlines
 *   3. processSquareRoots()     - √ symbols (including nested)
 *   4. processExtensibleArrows()- \xrightarrow, \xleftarrow
 *   5. processStretchyBraces()  - \overbrace, \underbrace
 *   6. processWideAccents()     - \widehat, \widetilde
 *   7. processCancel()          - \cancel, \bcancel, \xcancel
 *   8. processStrikethrough()   - \sout
 *   9. processBoxed()           - \boxed, \fbox
 * 
 * DEBUG:
 * ──────────────────────────────────────────────────────────────────────────────
 *   See DEBUG_UTILITIES section at bottom for debugging broken elements.
 *   Use: debugElement(containerElement) to analyze KaTeX structure.
 */

// ════════════════════════════════════════════════════════════════════════════════
// DEPENDENCY MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════════

let getStroke = null;
let generator = null;
let dependenciesLoaded = false;

/**
 * Initialize dependencies (perfect-freehand and rough.js)
 * Call this once before using applyHandwritingGeometry()
 */
export async function initDependencies() {
    if (dependenciesLoaded) return { getStroke, generator };
    
    try {
        const [perfectFreehand, rough] = await Promise.all([
            import('https://esm.sh/perfect-freehand@1.2.0'),
            import('https://unpkg.com/roughjs@latest/bundled/rough.esm.js')
        ]);
        
        getStroke = perfectFreehand.getStroke;
        generator = rough.default.generator();
        dependenciesLoaded = true;
        
        console.log('[KaTeX-HWK] Dependencies loaded successfully');
        return { getStroke, generator };
    } catch (error) {
        console.error('[KaTeX-HWK] Failed to load dependencies:', error);
        throw error;
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Base settings for hand-drawn effect
 * Adjust these values to change the overall appearance
 */
const CONFIG = {
    // Stroke appearance
    size: 3.0,           // Base stroke thickness (1.5 - 4.5)
    thinning: 0.25,      // Pressure variation (-0.1 - 0.45)
    smoothing: 0.4,      // Curve smoothing (0 - 1) - lower = more sketchy
    streamline: 0.4,     // Path simplification (0 - 1) - lower = more rough
    
    // Roughness (hand-drawn feel) - INCREASED for sketchy look!
    roughness: 2.0,      // Line roughness (0.8 - 3.0) - higher = more wobbly
    bowing: 1.4,         // Line bowing/curvature (0.3 - 2.0) - higher = more curved
    
    // Randomization variance - INCREASED for more variation!
    sizeVariance: 1.0,
    thinningVariance: 0.2,
    roughnessVariance: 0.6,
    bowingVariance: 0.5,
};

/**
 * Generate randomized settings for each element
 * This creates natural variation in the hand-drawn appearance
 */
function getSettings() {
    const rand = (base, variance) => base + (Math.random() - 0.5) * 2 * variance;
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
    
    return { 
        size: clamp(rand(CONFIG.size, CONFIG.sizeVariance), 1.5, 5.0), 
        thinning: clamp(rand(CONFIG.thinning, CONFIG.thinningVariance), -0.1, 0.5), 
        smoothing: CONFIG.smoothing, 
        streamline: CONFIG.streamline, 
        simulatePressure: true, 
        roughness: clamp(rand(CONFIG.roughness, CONFIG.roughnessVariance), 1.0, 3.0), 
        bowing: clamp(rand(CONFIG.bowing, CONFIG.bowingVariance), 0.5, 2.2), 
        disableMultiStroke: true, 
        seed: Math.floor(Math.random() * 10000) 
    };
}

// ════════════════════════════════════════════════════════════════════════════════
// DRAWING UTILITIES
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Interpolate points along a line for smooth hand-drawn effect
 */
function interpolateLine(p0, p1) {
    const points = [];
    const distance = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const steps = Math.max(10, Math.ceil(distance / 2.5));
    
    for (let i = 0; i <= steps; i++) { 
        const t = i / steps;
        const x = p0[0] + (p1[0] - p0[0]) * t;
        const y = p0[1] + (p1[1] - p0[1]) * t;
        const pressure = 0.35 + Math.sin(t * Math.PI) * 0.35 + Math.random() * 0.08;
        points.push([x, y, pressure]); 
    }
    return points;
}

/**
 * Interpolate cubic bezier curve
 */
function interpolateBezier(p0, p1, p2, p3) {
    const points = [];
    const steps = 18;
    
    for (let i = 0; i <= steps; i++) { 
        const t = i / steps;
        const mt = 1 - t;
        const x = mt*mt*mt*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t*t*t*p3[0];
        const y = mt*mt*mt*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t*t*t*p3[1];
        const pressure = 0.35 + Math.sin(t * Math.PI) * 0.4;
        points.push([x, y, pressure]); 
    }
    return points;
}

/**
 * Draw a Rough.js shape into an SVG using perfect-freehand
 */
function drawRoughShape(svg, drawable, color, settings, scale = 1) {
    if (!drawable || !drawable.sets) return;
    
    drawable.sets.forEach(set => {
        let points = [];
        let currentPos = [0, 0];
        
        set.ops.forEach(op => {
            if (op.op === 'move') { 
                currentPos = [op.data[0] * scale, op.data[1] * scale]; 
                points.push([...currentPos, 0.5]); 
            } else if (op.op === 'lineTo') { 
                const nextPos = [op.data[0] * scale, op.data[1] * scale]; 
                points = points.concat(interpolateLine(currentPos, nextPos)); 
                currentPos = nextPos; 
            } else if (op.op === 'bcurveTo') { 
                const cp1 = [op.data[0] * scale, op.data[1] * scale];
                const cp2 = [op.data[2] * scale, op.data[3] * scale];
                const end = [op.data[4] * scale, op.data[5] * scale];
                points = points.concat(interpolateBezier(currentPos, cp1, cp2, end)); 
                currentPos = end; 
            }
        });
        
        if (points.length > 1) {
            const strokePoints = getStroke(points, { 
                size: settings.size * scale, 
                thinning: settings.thinning, 
                smoothing: settings.smoothing, 
                streamline: settings.streamline, 
                simulatePressure: settings.simulatePressure, 
                last: true 
            });
            
            if (strokePoints && strokePoints.length) { 
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); 
                path.setAttribute('d', 'M' + strokePoints.map(p => `${p[0]},${p[1]}`).join('L') + 'Z'); 
                path.setAttribute('fill', color); 
                path.classList.add('hwk-path'); 
                svg.appendChild(path); 
            }
        }
    });
}

/**
 * Draw raw points into an SVG using perfect-freehand
 */
function drawPoints(svg, points, color, settings) {
    if (!points || points.length < 2) return;
    
    const strokePoints = getStroke(points, { 
        size: settings.size, 
        thinning: settings.thinning, 
        smoothing: settings.smoothing, 
        streamline: settings.streamline, 
        simulatePressure: settings.simulatePressure, 
        last: true 
    });
    
    if (strokePoints && strokePoints.length) { 
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); 
        path.setAttribute('d', 'M' + strokePoints.map(p => `${p[0]},${p[1]}`).join('L') + 'Z'); 
        path.setAttribute('fill', color); 
        path.classList.add('hwk-path'); 
        svg.appendChild(path); 
    }
}

/**
 * Create an overlay SVG element
 */
function createOverlaySVG(width, height) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width); 
    svg.setAttribute('height', height);
    svg.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;overflow:visible;z-index:10;';
    svg.classList.add('hwk-overlay');
    return svg;
}

/**
 * Clear all children from an SVG
 */
function clearSVG(svg) { 
    while (svg.firstChild) svg.removeChild(svg.firstChild); 
}

/**
 * Get computed color from element or ancestors
 */
function getColor(element) {
    let el = element;
    while (el) {
        const color = getComputedStyle(el).color;
        if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
            return color;
        }
        el = el.parentElement;
    }
    return '#000';
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 1: BIG DELIMITERS
// Target: .delimsizing svg (with viewBox)
// Handles: ( ) [ ] { } | || ⟨ ⟩ ⌊ ⌋ ⌈ ⌉
// ════════════════════════════════════════════════════════════════════════════════

function processDelimiters() {
    let count = 0;
    
    document.querySelectorAll('.delimsizing').forEach(delimEl => {
        const svg = delimEl.querySelector('svg');
        if (!svg || svg.dataset.hwk) return;
        
        const viewBox = svg.getAttribute('viewBox');
        if (!viewBox) return;
        
        svg.dataset.hwk = 'delimiter';
        
        const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
        const color = getColor(delimEl);
        const isOpeningDelim = delimEl.closest('.mopen') !== null;
        
        const settings = getSettings();
        settings.size = Math.max(18, Math.min(55, vbHeight / 55));
        
        clearSVG(svg);
        
        // Generate smooth parenthesis arc
        const points = [];
        const numPoints = 45;
        const paddingY = vbHeight * 0.015;
        const bowAmount = vbWidth * 0.75;
        
        for (let i = 0; i <= numPoints; i++) { 
            const t = i / numPoints;
            const y = paddingY + t * (vbHeight - paddingY * 2);
            const arcAmount = Math.sin(t * Math.PI);
            
            let x;
            if (isOpeningDelim) {
                x = vbWidth - 40 - arcAmount * bowAmount;
            } else {
                x = 40 + arcAmount * bowAmount;
            }
            
            x += (Math.random() - 0.5) * 25;
            const pressure = 0.25 + arcAmount * 0.45;
            points.push([x, y, pressure]); 
        }
        
        drawPoints(svg, points, color, settings);
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 2: HORIZONTAL LINES
// Target: .frac-line, .overline-line, .underline-line, .hline
// Handles: Fraction bars, overlines, underlines
// ════════════════════════════════════════════════════════════════════════════════

function processHorizontalLines() {
    let count = 0;
    
    document.querySelectorAll('.frac-line, .overline-line, .underline-line, .hline').forEach(el => {
        if (el.dataset.hwk) return;
        
        const rect = el.getBoundingClientRect();
        const width = rect.width;
        if (width < 2) return;
        
        el.dataset.hwk = 'hline';
        
        const color = getColor(el);
        const height = 20;
        const settings = getSettings();
        
        const svg = createOverlaySVG(width, height);
        svg.style.top = '50%'; 
        svg.style.transform = 'translateY(-50%)';
        
        drawRoughShape(svg, generator.line(0, height/2, width, height/2, settings), color, settings);
        
        el.style.position = 'relative'; 
        el.style.borderBottomColor = 'transparent';
        el.appendChild(svg);
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 3: SQUARE ROOTS
// Target: .sqrt .hide-tail svg (with viewBox)
// Handles: √ symbols including nested roots
// ════════════════════════════════════════════════════════════════════════════════

function processSquareRoots() {
    let count = 0;
    
    // Process ALL sqrt SVGs directly - each .hide-tail svg is one sqrt symbol
    document.querySelectorAll('.sqrt .hide-tail svg').forEach(svg => {
        if (svg.dataset.hwk) return;
        
        const viewBox = svg.getAttribute('viewBox');
        if (!viewBox) return;
        
        svg.dataset.hwk = 'sqrt';
        
        const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
        const color = getColor(svg);
        
        clearSVG(svg);
        
        const settings = getSettings();
        settings.size = Math.max(22, Math.min(85, vbHeight / 14));
        
        // EXTRA ROUGHNESS for sqrt - make it more sketchy!
        settings.roughness = Math.min(3.5, settings.roughness * 1.4);
        settings.bowing = Math.min(2.5, settings.bowing * 1.3);
        
        // Square root shape parameters with slight random wobble
        const wobble = () => (Math.random() - 0.5) * vbHeight * 0.02;
        const surdWidth = Math.min(vbHeight * 0.85, 850);
        const topY = vbHeight * 0.04 + wobble();
        const bottomY = vbHeight * 0.96 + wobble();
        const midY = vbHeight * 0.42 + wobble();
        
        // Draw sqrt shape: small hook, down stroke, up stroke, vinculum (top bar)
        // Each segment gets fresh settings for natural variation
        drawRoughShape(svg, generator.line(0, midY + vbHeight * 0.06, surdWidth * 0.32 + wobble(), midY, settings), color, settings);
        
        settings.seed = Math.floor(Math.random() * 10000); // New seed for variation
        drawRoughShape(svg, generator.line(surdWidth * 0.32, midY, surdWidth * 0.52 + wobble(), bottomY, settings), color, settings);
        
        settings.seed = Math.floor(Math.random() * 10000);
        drawRoughShape(svg, generator.line(surdWidth * 0.52, bottomY, surdWidth + wobble(), topY, settings), color, settings);
        
        settings.seed = Math.floor(Math.random() * 10000);
        drawRoughShape(svg, generator.line(surdWidth - 25, topY, vbWidth, topY + wobble() * 0.5, settings), color, settings);
        
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 4: EXTENSIBLE ARROWS
// Target: .x-arrow .hide-tail svg
// Handles: \xrightarrow, \xleftarrow (with optional labels above/below)
// ════════════════════════════════════════════════════════════════════════════════

function processExtensibleArrows() {
    let count = 0;
    
    document.querySelectorAll('.x-arrow').forEach(arrowEl => {
        const svg = arrowEl.querySelector('.hide-tail svg');
        if (!svg || svg.dataset.hwk) return;
        
        svg.dataset.hwk = 'xarrow';
        
        const rect = svg.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        if (width < 10 || height < 5) return;
        
        const color = getColor(arrowEl);
        
        clearSVG(svg);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        const settings = getSettings();
        settings.size = Math.max(1.8, Math.min(3.5, height / 7));
        
        const midY = height / 2;
        const arrowSize = Math.min(height * 0.45, 7);
        
        // Detect direction from preserveAspectRatio
        const isLeftArrow = svg.getAttribute('preserveAspectRatio')?.includes('xMin');
        
        if (isLeftArrow) {
            // Left arrow ←
            drawRoughShape(svg, generator.line(arrowSize + 3, midY, width - 2, midY, settings), color, settings);
            drawRoughShape(svg, generator.line(2, midY, arrowSize + 3, midY - arrowSize, settings), color, settings);
            drawRoughShape(svg, generator.line(2, midY, arrowSize + 3, midY + arrowSize, settings), color, settings);
        } else {
            // Right arrow →
            drawRoughShape(svg, generator.line(2, midY, width - arrowSize - 3, midY, settings), color, settings);
            drawRoughShape(svg, generator.line(width - 2, midY, width - arrowSize - 3, midY - arrowSize, settings), color, settings);
            drawRoughShape(svg, generator.line(width - 2, midY, width - arrowSize - 3, midY + arrowSize, settings), color, settings);
        }
        
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 5: STRETCHY BRACES
// Target: .stretchy (inside .mover or .munder, not .delimsizing or .sout)
// Handles: \overbrace, \underbrace
// ════════════════════════════════════════════════════════════════════════════════

function processStretchyBraces() {
    let count = 0;
    
    document.querySelectorAll('.stretchy').forEach(stretchyEl => {
        // Skip delimiters and strikethrough
        if (stretchyEl.closest('.delimsizing')) return;
        if (stretchyEl.classList.contains('sout')) return;
        if (stretchyEl.dataset.hwk) return;
        
        // Must be inside .mover or .munder
        const inMover = stretchyEl.closest('.mover');
        const inMunder = stretchyEl.closest('.munder');
        if (!inMover && !inMunder) return;
        
        stretchyEl.dataset.hwk = 'stretchy-brace';
        
        const rect = stretchyEl.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        if (width < 10 || height < 3) return;
        
        const color = getColor(stretchyEl);
        const settings = getSettings();
        settings.size = Math.max(1.8, Math.min(3.2, height / 5));
        
        // Hide original SVGs
        stretchyEl.querySelectorAll('svg').forEach(svg => svg.style.opacity = '0');
        
        // Create overlay
        const svg = createOverlaySVG(width, height);
        
        const isUnderbrace = inMunder !== null;
        const midX = width / 2;
        const tipWidth = Math.min(width * 0.1, 10);
        
        if (isUnderbrace) {
            // Underbrace ⏟ - tip points DOWN
            const topY = 3;
            const bottomY = height - 2;
            drawRoughShape(svg, generator.line(0, topY, midX - tipWidth, topY, settings), color, settings);
            drawRoughShape(svg, generator.line(midX - tipWidth, topY, midX, bottomY, settings), color, settings);
            drawRoughShape(svg, generator.line(midX, bottomY, midX + tipWidth, topY, settings), color, settings);
            drawRoughShape(svg, generator.line(midX + tipWidth, topY, width, topY, settings), color, settings);
        } else {
            // Overbrace ⏞ - tip points UP
            const topY = 2;
            const bottomY = height - 3;
            drawRoughShape(svg, generator.line(0, bottomY, midX - tipWidth, bottomY, settings), color, settings);
            drawRoughShape(svg, generator.line(midX - tipWidth, bottomY, midX, topY, settings), color, settings);
            drawRoughShape(svg, generator.line(midX, topY, midX + tipWidth, bottomY, settings), color, settings);
            drawRoughShape(svg, generator.line(midX + tipWidth, bottomY, width, bottomY, settings), color, settings);
        }
        
        stretchyEl.style.position = 'relative';
        stretchyEl.appendChild(svg);
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 6: WIDE ACCENTS
// Target: .accent svg (without <line> elements)
// Handles: \widehat, \widetilde
// ════════════════════════════════════════════════════════════════════════════════

function processWideAccents() {
    let count = 0;
    
    document.querySelectorAll('.accent').forEach(accentEl => {
        const svg = accentEl.querySelector('svg');
        if (!svg || svg.dataset.hwk) return;
        
        // Skip if has line elements (those are cancel)
        if (svg.querySelector('line')) return;
        
        svg.dataset.hwk = 'wide-accent';
        
        const rect = svg.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        if (width < 5 || height < 3) return;
        
        const color = getColor(accentEl);
        
        clearSVG(svg);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        const settings = getSettings();
        settings.size = Math.max(1.4, Math.min(2.8, height / 4));
        
        // Detect hat vs tilde by aspect ratio
        const isWidehat = width > height * 3.5;
        
        if (isWidehat) {
            // Draw ^ hat shape
            const midX = width / 2;
            drawRoughShape(svg, generator.line(0, height - 1, midX, 1, settings), color, settings);
            drawRoughShape(svg, generator.line(midX, 1, width, height - 1, settings), color, settings);
        } else {
            // Draw ~ tilde shape (sine wave)
            const points = [];
            const numPoints = 28;
            for (let i = 0; i <= numPoints; i++) {
                const t = i / numPoints;
                const x = t * width;
                const y = height / 2 - Math.sin(t * Math.PI * 2) * (height * 0.38);
                const pressure = 0.35 + Math.sin(t * Math.PI) * 0.35;
                points.push([x + (Math.random() - 0.5) * 1.5, y + (Math.random() - 0.5) * 0.8, pressure]);
            }
            drawPoints(svg, points, color, settings);
        }
        
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 7: CANCEL
// Target: .svg-align svg containing <line> elements
// Handles: \cancel (diagonal /), \bcancel (diagonal \), \xcancel (X)
// ════════════════════════════════════════════════════════════════════════════════

function processCancel() {
    let count = 0;
    
    document.querySelectorAll('.svg-align svg').forEach(svg => {
        const lines = svg.querySelectorAll('line');
        if (lines.length === 0) return;
        if (svg.dataset.hwk) return;
        
        svg.dataset.hwk = 'cancel';
        
        const rect = svg.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        if (width < 3 || height < 3) return;
        
        const color = getColor(svg);
        const settings = getSettings();
        settings.size = Math.max(1.8, Math.min(3.2, Math.min(width, height) / 12));
        
        // Hide original lines
        lines.forEach(line => line.style.opacity = '0');
        
        // Set viewBox to pixel dimensions
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        // Draw hand-drawn version of each line
        lines.forEach(line => {
            const x1Attr = line.getAttribute('x1');
            const y1Attr = line.getAttribute('y1');
            const x2Attr = line.getAttribute('x2');
            const y2Attr = line.getAttribute('y2');
            
            // Convert percentage values to pixels
            const x1 = x1Attr === '100%' ? width : (x1Attr === '0' ? 0 : parseFloat(x1Attr));
            const y1 = y1Attr === '100%' ? height : (y1Attr === '0' ? 0 : parseFloat(y1Attr));
            const x2 = x2Attr === '100%' ? width : (x2Attr === '0' ? 0 : parseFloat(x2Attr));
            const y2 = y2Attr === '100%' ? height : (y2Attr === '0' ? 0 : parseFloat(y2Attr));
            
            drawRoughShape(svg, generator.line(x1, y1, x2, y2, settings), color, settings);
        });
        
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 8: STRIKETHROUGH
// Target: .stretchy.sout (uses CSS border, not SVG)
// Handles: \sout
// ════════════════════════════════════════════════════════════════════════════════

function processStrikethrough() {
    let count = 0;
    
    document.querySelectorAll('.stretchy.sout').forEach(el => {
        if (el.dataset.hwk) return;
        
        el.dataset.hwk = 'strikethrough';
        
        const rect = el.getBoundingClientRect();
        const width = rect.width;
        if (width < 3) return;
        
        const color = getComputedStyle(el).borderBottomColor || getColor(el);
        
        const settings = getSettings();
        const height = 20;
        
        const svg = createOverlaySVG(width, height);
        svg.style.top = '50%';
        svg.style.transform = 'translateY(-50%)';
        
        drawRoughShape(svg, generator.line(0, height / 2, width, height / 2, settings), color, settings);
        
        el.style.position = 'relative';
        el.style.borderBottomColor = 'transparent';
        el.appendChild(svg);
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 9: BOXED
// Target: .boxed, .fbox
// Handles: \boxed, \fbox
// ════════════════════════════════════════════════════════════════════════════════

function processBoxed() {
    let count = 0;
    
    document.querySelectorAll('.boxed, .fbox').forEach(el => {
        if (el.dataset.hwk) return;
        
        el.dataset.hwk = 'boxed';
        
        const rect = el.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        if (width < 5 || height < 5) return;
        
        const color = getComputedStyle(el).borderColor || getColor(el);
        
        const settings = getSettings();
        const svg = createOverlaySVG(width, height);
        
        drawRoughShape(svg, generator.rectangle(2, 2, width - 4, height - 4, settings), color, settings);
        
        el.style.position = 'relative';
        el.style.border = 'none';
        el.appendChild(svg);
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN API
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Apply handwriting geometry to all KaTeX elements on the page
 * @returns {Object} Counts of processed elements by type
 */
export async function applyHandwritingGeometry() {
    // Ensure dependencies are loaded
    if (!dependenciesLoaded) {
        await initDependencies();
    }
    
    const counts = {
        delimiters: processDelimiters(),
        hlines: processHorizontalLines(),
        sqrts: processSquareRoots(),
        xarrows: processExtensibleArrows(),
        braces: processStretchyBraces(),
        accents: processWideAccents(),
        cancel: processCancel(),
        strike: processStrikethrough(),
        boxed: processBoxed(),
    };
    
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log('[KaTeX-HWK] Applied to', total, 'elements:', counts);
    
    return counts;
}

/**
 * Remove all handwriting geometry and restore original appearance
 */
export function clearHandwritingGeometry() {
    // Remove overlay SVGs
    document.querySelectorAll('.hwk-overlay').forEach(svg => svg.remove());
    
    // Remove paths we added to existing SVGs
    document.querySelectorAll('.hwk-path').forEach(path => path.remove());
    
    // Reset all processed elements
    document.querySelectorAll('[data-hwk]').forEach(el => { 
        el.removeAttribute('data-hwk'); 
        el.style.borderBottomColor = ''; 
        el.style.opacity = ''; 
        el.style.border = ''; 
    });
    
    // Restore hidden SVGs
    document.querySelectorAll('.stretchy svg').forEach(svg => svg.style.opacity = '');
    
    // Restore hidden lines
    document.querySelectorAll('line').forEach(line => line.style.opacity = '');
    
    console.log('[KaTeX-HWK] Cleared all handwriting geometry');
}

// ════════════════════════════════════════════════════════════════════════════════
// DEBUG UTILITIES
// Use these functions to debug broken elements
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Debug a KaTeX element to analyze its structure
 * @param {HTMLElement} container - Container element with KaTeX content
 * @returns {string} Debug output
 */
export function debugElement(container) {
    let output = '';
    
    output += '════════════════════════════════════════════════════════════════\n';
    output += 'DEBUG ANALYSIS\n';
    output += '════════════════════════════════════════════════════════════════\n\n';
    
    // Find SVGs
    const svgs = container.querySelectorAll('svg');
    output += `📊 SVGs found: ${svgs.length}\n`;
    svgs.forEach((svg, i) => {
        const rect = svg.getBoundingClientRect();
        output += `\n─── SVG #${i + 1} ───\n`;
        output += `  viewBox: ${svg.getAttribute('viewBox') || 'none'}\n`;
        output += `  width/height attr: ${svg.getAttribute('width')} x ${svg.getAttribute('height')}\n`;
        output += `  boundingRect: ${rect.width.toFixed(1)} x ${rect.height.toFixed(1)}\n`;
        output += `  data-hwk: ${svg.dataset.hwk || 'not processed'}\n`;
        
        // Parent chain
        let parent = svg.parentElement;
        const chain = [];
        for (let j = 0; j < 6 && parent; j++) {
            if (parent.className) chain.push(parent.className);
            parent = parent.parentElement;
        }
        output += `  parent chain: ${chain.join(' → ')}\n`;
        
        // Check for lines
        const lines = svg.querySelectorAll('line');
        if (lines.length > 0) {
            output += `  <line> elements: ${lines.length}\n`;
            lines.forEach((line, li) => {
                output += `    line ${li + 1}: (${line.getAttribute('x1')},${line.getAttribute('y1')}) → (${line.getAttribute('x2')},${line.getAttribute('y2')})\n`;
            });
        }
        
        // Check key indicators
        const indicators = ['.mover', '.munder', '.stretchy', '.x-arrow', '.accent', '.sqrt', '.delimsizing', '.svg-align'];
        indicators.forEach(sel => {
            if (svg.closest(sel)) output += `  ⭐ Inside ${sel}\n`;
        });
    });
    
    // Key structural elements
    output += '\n📋 KEY STRUCTURAL ELEMENTS:\n';
    const keyClasses = ['.sqrt', '.delimsizing', '.mover', '.munder', '.stretchy', '.accent', '.x-arrow', '.svg-align', '.cancel', '.boxed', '.frac-line'];
    keyClasses.forEach(cls => {
        const els = container.querySelectorAll(cls);
        if (els.length > 0) {
            output += `\n  ${cls}: ${els.length} found\n`;
            els.forEach((el, i) => {
                const rect = el.getBoundingClientRect();
                output += `    #${i + 1}: ${rect.width.toFixed(1)}x${rect.height.toFixed(1)}`;
                if (el.querySelector('svg')) output += ' [has SVG]';
                if (el.querySelector('line')) output += ' [has LINE]';
                if (el.dataset.hwk) output += ` [hwk: ${el.dataset.hwk}]`;
                output += '\n';
            });
        }
    });
    
    // HTML structure (abbreviated)
    output += '\n📝 HTML STRUCTURE (first 3000 chars):\n';
    output += '────────────────────────────────────────\n';
    output += container.innerHTML
        .replace(/></g, '>\n<')
        .replace(/style="[^"]*"/g, 'style="..."')
        .substring(0, 3000);
    
    console.log(output);
    return output;
}

/**
 * Highlight specific elements for visual debugging
 * @param {string} selector - CSS selector
 * @param {string} color - Outline color
 */
export function highlightElements(selector, color = 'red') {
    document.querySelectorAll(selector).forEach(el => {
        el.style.outline = el.style.outline ? '' : `3px solid ${color}`;
    });
}

/**
 * List all unprocessed SVGs (potential bugs)
 * @returns {Array} List of unprocessed SVG elements
 */
export function findUnprocessedSVGs() {
    const unprocessed = [];
    document.querySelectorAll('.katex svg').forEach(svg => {
        if (!svg.dataset.hwk && !svg.closest('.katex-mathml')) {
            unprocessed.push({
                element: svg,
                viewBox: svg.getAttribute('viewBox'),
                parent: svg.parentElement?.className,
                hasLines: svg.querySelectorAll('line').length > 0,
            });
        }
    });
    console.log('[KaTeX-HWK] Unprocessed SVGs:', unprocessed);
    return unprocessed;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR TEMPLATES
// Copy these templates when adding new processors
// ════════════════════════════════════════════════════════════════════════════════

/*
┌──────────────────────────────────────────────────────────────────────────────┐
│ TEMPLATE: New Processor                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. Identify the target element using debugElement()                          │
│ 2. Find the selector pattern (e.g., '.myclass svg')                          │
│ 3. Determine if drawing INTO existing SVG or creating OVERLAY                │
│ 4. Copy the appropriate template below                                        │
└──────────────────────────────────────────────────────────────────────────────┘

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR N: [NAME]
// Target: [selector]
// Handles: [LaTeX commands]
// ════════════════════════════════════════════════════════════════════════════════

function processMyElement() {
    let count = 0;
    
    document.querySelectorAll('[YOUR_SELECTOR]').forEach(el => {
        // Skip if already processed
        if (el.dataset.hwk) return;
        
        // Mark as processed
        el.dataset.hwk = 'my-element';
        
        // Get dimensions
        const rect = el.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        if (width < 5 || height < 5) return;
        
        // Get color
        const color = getColor(el);
        
        // Get randomized settings
        const settings = getSettings();
        
        // OPTION A: Draw INTO existing SVG (for elements with viewBox)
        // ─────────────────────────────────────────────────────────────
        // const svg = el.querySelector('svg');
        // if (!svg) return;
        // const viewBox = svg.getAttribute('viewBox');
        // if (!viewBox) return;
        // const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
        // clearSVG(svg);
        // drawRoughShape(svg, generator.line(0, 0, vbWidth, vbHeight, settings), color, settings);
        
        // OPTION B: Create OVERLAY SVG (for elements without SVG)
        // ─────────────────────────────────────────────────────────────
        // const svg = createOverlaySVG(width, height);
        // drawRoughShape(svg, generator.line(0, 0, width, height, settings), color, settings);
        // el.style.position = 'relative';
        // el.appendChild(svg);
        
        // OPTION C: Hide original + create overlay (for complex SVGs)
        // ─────────────────────────────────────────────────────────────
        // el.querySelectorAll('svg').forEach(s => s.style.opacity = '0');
        // const svg = createOverlaySVG(width, height);
        // drawRoughShape(svg, generator.line(0, 0, width, height, settings), color, settings);
        // el.style.position = 'relative';
        // el.appendChild(svg);
        
        count++;
    });
    
    return count;
}

// Don't forget to add to applyHandwritingGeometry():
// myElement: processMyElement(),

*/

// ════════════════════════════════════════════════════════════════════════════════
// BROWSER GLOBAL EXPORTS
// ════════════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.KaTeXHandwriting = {
        apply: applyHandwritingGeometry,
        clear: clearHandwritingGeometry,
        init: initDependencies,
        debug: debugElement,
        highlight: highlightElements,
        findUnprocessed: findUnprocessedSVGs,
        config: CONFIG,
    };
    
    // Also expose main functions directly
    window.applyHandwritingGeometry = applyHandwritingGeometry;
    window.clearHandwritingGeometry = clearHandwritingGeometry;
}
