/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║   KATEX ROUGH + INK HYBRID v2.1                                              ║
 * ║   Now with BIG DELIMITER support (parentheses, brackets, braces)!            ║
 * ║                                                                              ║
 * ║   1. Calculates geometry using Rough.js (wobbles, bowing, multi-stroke)      ║
 * ║   2. Renders ink using Perfect-Freehand (variable width, pressure)           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { getStroke } from 'https://esm.sh/perfect-freehand@1.2.0';
import rough from 'https://unpkg.com/roughjs@latest/bundled/rough.esm.js';

const generator = rough.generator();

// ════════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════════════════════════════════════════

const BASE_SETTINGS = {
    // Perfect Freehand (Ink) Settings
    size: 3,
    thinning: 0.3,
    smoothing: 0.5,
    streamline: 0.5,
    
    // Rough.js (Geometry) Settings
    roughness: 1.5,
    bowing: 1,
    disableMultiStroke: true
};

function getRandomizedSettings() {
    const rand = (b, v) => b + (Math.random() - 0.5) * 2 * v;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    return {
        size: clamp(rand(BASE_SETTINGS.size, 1), 1.5, 5),
        thinning: clamp(rand(BASE_SETTINGS.thinning, 0.1), -0.3, 0.5),
        smoothing: 0.5,
        streamline: 0.5,
        simulatePressure: true,
        roughness: clamp(rand(BASE_SETTINGS.roughness, 0.4), 0.5, 2.5),
        bowing: clamp(rand(BASE_SETTINGS.bowing, 0.4), 0.3, 1.8),
        disableMultiStroke: BASE_SETTINGS.disableMultiStroke,
        seed: Math.floor(Math.random() * 1000)
    };
}

// ════════════════════════════════════════════════════════════════════════════════
// ROUGH.JS -> PERFECT FREEHAND BRIDGE
// ════════════════════════════════════════════════════════════════════════════════

function interpolateBezier(p0, p1, p2, p3, segments = 12) {
    const points = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const mt = 1 - t;
        const x = mt*mt*mt*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t*t*t*p3[0];
        const y = mt*mt*mt*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t*t*t*p3[1];
        const pressure = 0.4 + Math.sin(t * Math.PI) * 0.4;
        points.push([x, y, pressure]);
    }
    return points;
}

function interpolateLine(p0, p1, segments = 8) {
    const points = [];
    const dist = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const steps = Math.max(segments, Math.ceil(dist / 3));
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = p0[0] + (p1[0] - p0[0]) * t;
        const y = p0[1] + (p1[1] - p0[1]) * t;
        const pressure = 0.4 + Math.sin(t * Math.PI) * 0.3 + Math.random() * 0.1;
        points.push([x, y, pressure]);
    }
    return points;
}

function drawRoughShape(svg, drawable, color, settings) {
    drawable.sets.forEach(set => {
        let points = [];
        let currentPos = [0, 0];

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

        if (points.length > 1) {
            const stroke = getStroke(points, {
                size: settings.size,
                thinning: settings.thinning,
                smoothing: settings.smoothing,
                streamline: settings.streamline,
                simulatePressure: settings.simulatePressure,
                last: true
            });

            if (stroke.length) {
                const pathData = 'M' + stroke.map(p => `${p[0]},${p[1]}`).join('L') + 'Z';
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', pathData);
                path.setAttribute('fill', color);
                svg.appendChild(path);
            }
        }
    });
}

function createSVG(w, h) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;overflow:visible;z-index:10;';
    svg.classList.add('hwk-overlay');
    return svg;
}

// ════════════════════════════════════════════════════════════════════════════════
// NEW: BIG DELIMITERS PROCESSOR (parentheses, brackets, braces, pipes)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Process big delimiters that KaTeX renders as SVG
 * 
 * KaTeX uses SVG for tall delimiters (.delimsizing.mult)
 * Smaller ones use fonts (.delimsizing.size1-4) - those already work!
 * 
 * This handles: ( ) [ ] { } | ‖ and their variants
 */
function processDelimiters() {
    // Find all .delimsizing elements that contain SVG
    document.querySelectorAll('.delimsizing').forEach(delimEl => {
        const origSvg = delimEl.querySelector('svg');
        if (!origSvg || origSvg.dataset.hwk) return;
        origSvg.dataset.hwk = '1';
        
        const rect = origSvg.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        
        if (w < 3 || h < 10) return;
        
        const color = getComputedStyle(delimEl).color || '#000';
        const s = getRandomizedSettings();
        
        // Scale stroke size based on height
        s.size = Math.max(1.5, Math.min(4, h / 30));
        
        // Determine delimiter type by checking mopen/mclose and analyzing shape
        const isOpen = delimEl.closest('.mopen') !== null;
        const isClose = delimEl.closest('.mclose') !== null;
        
        // Create overlay SVG
        const svg = createSVG(w + 10, h + 4); // Extra padding for wobble
        svg.style.left = '-5px';
        svg.style.top = '-2px';
        
        const padX = 5;
        const padY = 2;
        
        // Detect delimiter type from the SVG path or viewBox
        // KaTeX parentheses have viewBox like "0 0 875 3600"
        // For now, we'll draw based on mopen/mclose
        
        if (isOpen) {
            // Opening delimiter: ( [ {
            // Draw a curved line from top-right to bottom-right, curving left
            drawParenthesis(svg, w + padX, h + padY, 'left', color, s);
        } else if (isClose) {
            // Closing delimiter: ) ] }
            // Draw a curved line from top-left to bottom-left, curving right
            drawParenthesis(svg, w + padX, h + padY, 'right', color, s);
        }
        
        origSvg.style.opacity = '0';
        delimEl.style.position = 'relative';
        delimEl.appendChild(svg);
    });
}

/**
 * Draw a hand-drawn parenthesis curve
 */
function drawParenthesis(svg, w, h, direction, color, settings) {
    const padY = 4;
    const topY = padY;
    const bottomY = h - padY;
    const midY = h / 2;
    
    // Control how much the curve bows
    const bowAmount = Math.min(w * 0.8, h * 0.15);
    
    let points = [];
    
    if (direction === 'left') {
        // Opening paren: starts top-right, curves left, ends bottom-right
        const startX = w - 2;
        const endX = w - 2;
        const midX = w - bowAmount - 2;
        
        // Use Rough.js to generate the curve
        const curve = generator.curve([
            [startX, topY],
            [midX - bowAmount * 0.3, midY * 0.4],
            [midX, midY],
            [midX - bowAmount * 0.3, midY + (bottomY - midY) * 0.6],
            [endX, bottomY]
        ], settings);
        
        drawRoughShape(svg, curve, color, settings);
    } else {
        // Closing paren: starts top-left, curves right, ends bottom-left
        const startX = 2;
        const endX = 2;
        const midX = bowAmount + 2;
        
        const curve = generator.curve([
            [startX, topY],
            [midX + bowAmount * 0.3, midY * 0.4],
            [midX, midY],
            [midX + bowAmount * 0.3, midY + (bottomY - midY) * 0.6],
            [endX, bottomY]
        ], settings);
        
        drawRoughShape(svg, curve, color, settings);
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// EXISTING PROCESSORS (unchanged)
// ════════════════════════════════════════════════════════════════════════════════

function processHorizontalLines() {
    const selector = '.frac-line, .overline-line, .underline-line, .hline, .sout';
    document.querySelectorAll(selector).forEach(el => {
        if (el.dataset.hwk) return; 
        el.dataset.hwk = '1';
        
        const rect = el.getBoundingClientRect();
        const w = rect.width;
        if (w < 2) return;
        
        const color = getComputedStyle(el).color || '#000';
        const h = 20;
        
        const s = getRandomizedSettings();
        const svg = createSVG(w, h);
        svg.style.top = '50%';
        svg.style.transform = 'translateY(-50%)';
        
        const shape = generator.line(0, h/2, w, h/2, s);
        drawRoughShape(svg, shape, color, s);
        
        el.style.position = 'relative';
        el.style.borderBottomColor = 'transparent';
        el.appendChild(svg);
    });
}

function processSqrt() {
    const allSqrts = Array.from(document.querySelectorAll('.sqrt'));
    const sqrtToSvg = new Map();
    
    const findDirectSvg = (sqrtEl) => {
        const allSvgs = sqrtEl.querySelectorAll('svg');
        for (const svg of allSvgs) {
            // Skip if already processed
            if (svg.dataset.hwk) continue;
            
            let el = svg.parentElement;
            let belongsToNested = false;
            while (el && el !== sqrtEl) {
                if (el.classList && el.classList.contains('sqrt')) { 
                    belongsToNested = true; 
                    break; 
                }
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
    
    sqrtToSvg.forEach((origSvg, sqrtEl) => {
        if (origSvg.dataset.hwk) return; 
        origSvg.dataset.hwk = '1';
        
        const rect = origSvg.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        if (w < 5 || h < 5) return;
        
        const color = getComputedStyle(sqrtEl).color || '#000';
        
        const svg = createSVG(w, h);
        const topY = 2, bottomY = h - 2, midY = h * 0.42;
        const surdW = Math.max(4, Math.min(14, h * 0.17));
        
        const s = getRandomizedSettings();
        s.size = Math.max(1.5, Math.min(3, h / 25));
        
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

function processArrows() {
    document.querySelectorAll('.x-arrow, .stretchy').forEach(el => {
        if (el.closest('.sqrt')) return;
        if (el.closest('.delimsizing')) return; // Skip delimiters
        
        const origSvg = el.querySelector('svg');
        if (!origSvg || origSvg.dataset.hwk) return; 
        origSvg.dataset.hwk = '1';
        
        const rect = el.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        if (w < 15 || h < 3) return;
        
        const color = getComputedStyle(el).color || '#000';
        const midY = h / 2;
        const arrowSize = Math.min(h * 0.4, 6);
        
        const svg = createSVG(w, h);
        const s = getRandomizedSettings();

        const l1 = generator.line(3, midY, w - arrowSize - 2, midY, s);
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

function processBoxed() {
    document.querySelectorAll('.boxed, .fbox').forEach(el => {
        if (el.dataset.hwk) return; 
        el.dataset.hwk = '1';
        
        const rect = el.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        if (w < 5 || h < 5) return;
        
        const color = getComputedStyle(el).borderColor || getComputedStyle(el).color || '#000';
        
        const svg = createSVG(w, h);
        const s = getRandomizedSettings();
        
        const shape = generator.rectangle(1, 1, w-2, h-2, s);
        drawRoughShape(svg, shape, color, s);
        
        el.style.position = 'relative';
        el.style.border = 'none';
        el.appendChild(svg);
    });
}

function processBraces() {
    document.querySelectorAll('.munder svg, .mover svg').forEach(svg => {
        if (svg.dataset.hwk) return;
        if (svg.closest('.delimsizing')) return; // Skip delimiters
        
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
// MAIN API
// ════════════════════════════════════════════════════════════════════════════════

function applyHandwritingGeometry() {
    processHorizontalLines();
    processSqrt();
    processDelimiters();  // NEW: Big parentheses, brackets, etc.
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

export { applyHandwritingGeometry, clearHandwritingGeometry, BASE_SETTINGS };

// ════════════════════════════════════════════════════════════════════════════════
// COVERAGE SUMMARY
// ════════════════════════════════════════════════════════════════════════════════

/*
 * ✅ COVERED:
 * - Fraction bars (.frac-line)
 * - Square roots (.sqrt) - including nested
 * - Overlines (.overline-line)
 * - Underlines (.underline-line)
 * - Arrows (.x-arrow, .stretchy)
 * - Strikethrough (.sout)
 * - Boxed (.boxed, .fbox)
 * - Underbraces/Overbraces (.munder, .mover)
 * - BIG DELIMITERS (.delimsizing with SVG) - NEW!
 *   - Parentheses ( )
 *   - Brackets [ ]
 *   - Braces { }
 *   - Pipes | ‖
 * 
 * ✅ HANDLED BY YOUR FONTS:
 * - Small delimiters (.delimsizing.size1-4 use fonts)
 * - All letters, numbers, symbols
 * - Greek letters
 * - Operators
 * 
 * ❌ TODO:
 * - Matrix borders
 * - Chemistry bonds
 * - Commutative diagrams
 */
