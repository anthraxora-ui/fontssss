/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║   KATEX ROUGH + INK HYBRID                                                   ║
 * ║   Version: 2.0 (Rough.js Logic + Perfect Freehand Rendering)                 ║
 * ║                                                                              ║
 * ║   1. Calculates geometry using Rough.js (wobbles, bowing, multi-stroke)      ║
 * ║   2. Renders ink using Perfect-Freehand (variable width, pressure)           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { getStroke } from 'https://esm.sh/perfect-freehand@1.2.0';
import rough from 'https://unpkg.com/roughjs@latest/bundled/rough.esm.js';

// Initialize Rough Generator
const generator = rough.generator();

// ════════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════════════════════════════════════════

const BASE_SETTINGS = {
    // Perfect Freehand (Ink) Settings
    size: 4,            // Base thickness
    thinning: 0.4,      // How much it thins on speed
    smoothing: 0.5,
    streamline: 0.5,
    
    // Rough.js (Geometry) Settings
    roughness: 1.8,     // How messy the lines are
    bowing: 1,          // How curved lines are
    disableMultiStroke: false // false = double lines (sketchy), true = single line
};

/**
 * Randomized Settings Generator
 * Maps your original randomization logic to Rough.js parameters
 */
function getRandomizedSettings() {
    const rand = (b, v) => b + (Math.random() - 0.5) * 2 * v;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    return {
        // Ink properties
        size: clamp(rand(BASE_SETTINGS.size, 1.5), 2, 8),
        thinning: clamp(rand(BASE_SETTINGS.thinning, 0.1), -0.5, 0.5),
        smoothing: 0.5,
        streamline: 0.5,
        simulatePressure: true,

        // Rough.js properties
        roughness: clamp(rand(BASE_SETTINGS.roughness, 0.5), 0.5, 3),
        bowing: clamp(rand(BASE_SETTINGS.bowing, 0.5), 0, 2),
        disableMultiStroke: BASE_SETTINGS.disableMultiStroke,
        
        // Random seed for Rough.js to keep strokes consistent on re-renders if needed
        seed: Math.floor(Math.random() * 1000)
    };
}

// ════════════════════════════════════════════════════════════════════════════════
// THE BRIDGE: ROUGH.JS -> PERFECT FREEHAND
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Interpolates a Cubic Bezier to a stream of points [x, y, pressure]
 */
function interpolateBezier(p0, p1, p2, p3, segments = 10) {
    const points = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;

        const x = mt3 * p0[0] + 3 * mt2 * t * p1[0] + 3 * mt * t2 * p2[0] + t3 * p3[0];
        const y = mt3 * p0[1] + 3 * mt2 * t * p1[1] + 3 * mt * t2 * p2[1] + t3 * p3[1];
        
        // Simulate pressure variation (sine wave based on t)
        const pressure = 0.5 + Math.sin(t * Math.PI) * 0.5; 
        points.push([x, y, pressure]);
    }
    return points;
}

/**
 * Interpolates a Line to a stream of points
 */
function interpolateLine(p0, p1, segments = 5) {
    const points = [];
    const dist = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const steps = Math.max(segments, dist / 2); // At least one point every 2px

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = p0[0] + (p1[0] - p0[0]) * t;
        const y = p0[1] + (p1[1] - p0[1]) * t;
        points.push([x, y, Math.random()]); // Random pressure for lines
    }
    return points;
}

/**
 * Takes a Rough.js "Drawable" and renders it using Perfect Freehand logic
 */
function drawRoughShape(svg, drawable, color, settings) {
    // Rough.js returns 'sets' (paths). A sketchy line might have 2 sets (double stroke).
    drawable.sets.forEach(set => {
        let points = [];
        let currentPos = [0, 0];

        // Iterate over operations (move, lineTo, bcurveTo)
        set.ops.forEach(op => {
            if (op.op === 'move') {
                currentPos = [op.data[0], op.data[1]];
                points.push([...currentPos, 0.5]);
            } 
            else if (op.op === 'lineTo') {
                const nextPos = [op.data[0], op.data[1]];
                points = points.concat(interpolateLine(currentPos, nextPos));
                currentPos = nextPos;
            } 
            else if (op.op === 'bcurveTo') {
                const p1 = [op.data[0], op.data[1]];
                const p2 = [op.data[2], op.data[3]];
                const p3 = [op.data[4], op.data[5]];
                points = points.concat(interpolateBezier(currentPos, p1, p2, p3));
                currentPos = p3;
            }
        });

        // 2. Generate Ink Stroke
        if (points.length > 1) {
            const stroke = getStroke(points, {
                size: settings.size,
                thinning: settings.thinning,
                smoothing: settings.smoothing,
                streamline: settings.streamline,
                simulatePressure: settings.simulatePressure,
                last: true
            });

            // 3. Render SVG
            const pathData = stroke.length 
                ? 'M' + stroke.map(p => `${p[0]},${p[1]}`).join('L') + 'Z' 
                : '';
                
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', color);
            svg.appendChild(path);
        }
    });
}

function createSVG(w, h) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    // Allow overflow for wobbles
    svg.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;overflow:visible;z-index:10;';
    svg.classList.add('hwk-overlay');
    return svg;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSORS (100% Same Logic as your file, just swapped the drawing function)
// ════════════════════════════════════════════════════════════════════════════════

function processHorizontalLines() {
    const selector = '.frac-line, .overline-line, .underline-line, .hline, .sout';
    document.querySelectorAll(selector).forEach(el => {
        if (el.dataset.hwk) return; el.dataset.hwk = '1';
        
        const rect = el.getBoundingClientRect();
        const w = rect.width;
        if (w < 2) return;
        
        const color = getComputedStyle(el).color || '#000';
        const h = 20; // Extra height for wobbles
        
        const s = getRandomizedSettings();
        const svg = createSVG(w, h);
        svg.style.top = '50%';
        svg.style.transform = 'translateY(-50%)';
        
        // ROUGH GENERATOR CALL
        const shape = generator.line(0, h/2, w, h/2, s);
        drawRoughShape(svg, shape, color, s);
        
        el.style.position = 'relative';
        el.style.borderBottomColor = 'transparent';
        el.appendChild(svg);
    });
}

function processSqrt() {
    // 1. Map Phase (Keep exact same logic to handle nested sqrts)
    const allSqrts = Array.from(document.querySelectorAll('.sqrt'));
    const sqrtToSvg = new Map();
    
    const findDirectSvg = (sqrtEl) => {
        const allSvgs = sqrtEl.querySelectorAll('svg');
        for (const svg of allSvgs) {
            let el = svg.parentElement;
            let belongsToNested = false;
            while (el && el !== sqrtEl) {
                if (el.classList && el.classList.contains('sqrt')) { belongsToNested = true; break; }
                el = el.parentElement;
            }
            if (belongsToNested) continue;
            const hideTail = svg.closest('.hide-tail');
            if (!hideTail) continue;
            el = hideTail.parentElement;
            while (el) {
                if (el === sqrtEl) return svg;
                if (el.classList && el.classList.contains('sqrt')) break;
                el = el.parentElement;
            }
        }
        return null;
    };

    allSqrts.forEach(sqrtEl => {
        const svg = findDirectSvg(sqrtEl);
        if (svg) sqrtToSvg.set(sqrtEl, svg);
    });
    
    // 2. Process Phase
    sqrtToSvg.forEach((origSvg, sqrtEl) => {
        if (origSvg.dataset.hwk) return; origSvg.dataset.hwk = '1';
        
        const rect = origSvg.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        const color = getComputedStyle(sqrtEl).color || '#000';
        
        const svg = createSVG(w, h);
        const topY = 2, bottomY = h - 2, midY = h * 0.42;
        const surdW = Math.max(4, Math.min(14, h * 0.17));
        
        const s = getRandomizedSettings();
        
        // Use Rough.js Generator for the 4 parts
        // Note: We use generator.line for each segment to control them precisely
        const l1 = generator.line(0, midY + 2, surdW * 0.38, midY, s);
        const l2 = generator.line(surdW * 0.38, midY, surdW * 0.62, bottomY, s);
        const l3 = generator.line(surdW * 0.62, bottomY, surdW, topY, s);
        const l4 = generator.line(surdW - 1, topY, w, topY, s);

        drawRoughShape(svg, l1, color, s);
        drawRoughShape(svg, l2, color, s);
        drawRoughShape(svg, l3, color, s);
        drawRoughShape(svg, l4, color, s);
        
        origSvg.style.opacity = '0';
        origSvg.parentElement.style.position = 'relative';
        origSvg.parentElement.appendChild(svg);
    });
}

function processBoxed() {
    document.querySelectorAll('.boxed, .fbox').forEach(el => {
        if (el.dataset.hwk) return; el.dataset.hwk = '1';
        
        const rect = el.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        const color = getComputedStyle(el).borderColor || getComputedStyle(el).color || '#000';
        
        const svg = createSVG(w, h);
        const s = getRandomizedSettings();
        
        // ROUGH GENERATOR CALL
        const shape = generator.rectangle(1, 1, w-2, h-2, s);
        drawRoughShape(svg, shape, color, s);
        
        el.style.position = 'relative';
        el.style.border = 'none';
        el.appendChild(svg);
    });
}

function processArrows() {
    document.querySelectorAll('.x-arrow, .stretchy').forEach(el => {
        if (el.closest('.sqrt')) return;
        const origSvg = el.querySelector('svg');
        if (!origSvg || origSvg.dataset.hwk) return; origSvg.dataset.hwk = '1';
        
        const rect = el.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        const color = getComputedStyle(el).color || '#000';
        const midY = h / 2;
        const arrowSize = Math.min(h * 0.4, 6);
        
        const svg = createSVG(w, h);
        const s = getRandomizedSettings();

        // Shaft
        const l1 = generator.line(3, midY, w - arrowSize - 2, midY, s);
        // Arrowhead
        const l2 = generator.line(w - arrowSize - 2, midY - arrowSize, w - 2, midY, s);
        const l3 = generator.line(w - arrowSize - 2, midY + arrowSize, w - 2, midY, s);

        drawRoughShape(svg, l1, color, s);
        drawRoughShape(svg, l2, color, s);
        drawRoughShape(svg, l3, color, s);
        
        origSvg.style.opacity = '0';
        el.style.position = 'relative';
        el.appendChild(svg);
    });
}

function processBraces() {
    document.querySelectorAll('.munder svg, .mover svg').forEach(svg => {
        if (svg.dataset.hwk) return;
        const rect = svg.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        if (w < 20 || h > 30 || w / h < 3) return;
        
        svg.dataset.hwk = '1';
        const parent = svg.parentElement;
        const color = getComputedStyle(parent).color || '#000';
        
        const overlaySvg = createSVG(w, h);
        const s = getRandomizedSettings();
        const isUnder = svg.closest('.munder') !== null;
        const midX = w / 2;

        if (isUnder) {
            // Use Rough Curve
            // Points: Start, Control, End. Rough.js creates the wobble.
            // We simulate the brace with 4 lines for crispness or curves.
            // Let's use lines to match the original "pointed" look but with rough wobble
            const tipY = h - 2, topY = 2;
            const l1 = generator.line(2, topY, midX - 5, topY, s);
            const l2 = generator.line(midX - 5, topY, midX, tipY, s);
            const l3 = generator.line(midX, tipY, midX + 5, topY, s);
            const l4 = generator.line(midX + 5, topY, w - 2, topY, s);
            drawRoughShape(overlaySvg, l1, color, s);
            drawRoughShape(overlaySvg, l2, color, s);
            drawRoughShape(overlaySvg, l3, color, s);
            drawRoughShape(overlaySvg, l4, color, s);
        } else {
            const tipY = 2, botY = h - 2;
            const l1 = generator.line(2, botY, midX - 5, botY, s);
            const l2 = generator.line(midX - 5, botY, midX, tipY, s);
            const l3 = generator.line(midX, tipY, midX + 5, botY, s);
            const l4 = generator.line(midX + 5, botY, w - 2, botY, s);
            drawRoughShape(overlaySvg, l1, color, s);
            drawRoughShape(overlaySvg, l2, color, s);
            drawRoughShape(overlaySvg, l3, color, s);
            drawRoughShape(overlaySvg, l4, color, s);
        }
        
        svg.style.opacity = '0';
        parent.style.position = 'relative';
        parent.appendChild(overlaySvg);
    });
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT & RUN
// ════════════════════════════════════════════════════════════════════════════════

function applyHandwritingGeometry() {
    processHorizontalLines();
    processSqrt();
    processArrows();
    processBoxed();
    processBraces();
}

function clearHandwritingGeometry() {
    document.querySelectorAll('.hwk-overlay').forEach(svg => svg.remove());
    document.querySelectorAll('[data-hwk]').forEach(el => {
        el.removeAttribute('data-hwk');
        el.style.borderBottomColor = '';
        el.style.opacity = '';
        el.style.border = '';
    });
}

window.applyHandwritingGeometry = applyHandwritingGeometry;
window.clearHandwritingGeometry = clearHandwritingGeometry;


// Also export as ES module
export { applyHandwritingGeometry, clearHandwritingGeometry, BASE_SETTINGS };

// ════════════════════════════════════════════════════════════════════════════════
// TEMPLATE: FUTURE PROCESSORS
// Add new geometry handlers here as needed
// ════════════════════════════════════════════════════════════════════════════════

/*
// TEMPLATE: How to add a new processor
// ─────────────────────────────────────────────────────────────────────────────

function processNewElement() {
    document.querySelectorAll('.new-katex-class').forEach(el => {
        if (el.dataset.hwk) return;
        el.dataset.hwk = '1';
        
        const rect = el.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        if (w < 5 || h < 5) return;
        
        const color = getComputedStyle(el).color || '#000';
        const settings = getRandomizedSettings();
        
        const svg = createSVG(w, h);
        
        // Draw your element here
        drawPath(svg, handLine(x1, y1, x2, y2, settings), settings, color);
        
        // Hide original, show ours
        el.style.position = 'relative';
        el.appendChild(svg);
    });
}

// Then add to applyHandwritingGeometry():
// processNewElement();
*/

// ════════════════════════════════════════════════════════════════════════════════
// TODO LIST - Future additions
// ════════════════════════════════════════════════════════════════════════════════

/*
 * - [ ] Matrix borders (need to identify KaTeX class)
 * - [ ] Chemistry bonds (mhchem extension)
 * - [ ] Commutative diagrams (CD environment)
 * - [ ] Long division symbols
 * - [ ] Custom delimiters when they become SVG
 * - [ ] Tensor notation brackets
 * - [ ] ...add more as discovered
 */
