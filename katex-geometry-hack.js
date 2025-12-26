/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║   KATEX GEOMETRY HACK - Handwritten Math Lines                               ║
 * ║                                                                              ║
 * ║   Version: 1.0.0                                                             ║
 * ║   Author: anthraxora-ui                                                      ║
 * ║   License: MIT                                                               ║
 * ║                                                                              ║
 * ║   This script replaces KaTeX geometry (fraction bars, square roots,          ║
 * ║   overlines, arrows) with hand-drawn versions using perfect-freehand.        ║
 * ║                                                                              ║
 * ║   Usage:                                                                     ║
 * ║   1. Include this script after KaTeX                                         ║
 * ║   2. Call applyHandwritingGeometry() after rendering math                    ║
 * ║                                                                              ║
 * ║   <script type="module" src="katex-geometry-hack.js"></script>               ║
 * ║   <script>                                                                   ║
 * ║       katex.render('\\sqrt{x}', element);                                    ║
 * ║       applyHandwritingGeometry();                                            ║
 * ║   </script>                                                                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { getStroke } from 'https://esm.sh/perfect-freehand@1.2.0';

// ════════════════════════════════════════════════════════════════════════════════
// SETTINGS - Your chosen base settings with RANDOM VARIATIONS
// Each stroke gets slightly different settings so nothing looks identical!
// ════════════════════════════════════════════════════════════════════════════════

const BASE_SETTINGS = {
    // Core stroke settings (your chosen: bold, thick)
    size: 1.4,
    thinning: -0.5,
    smoothing: 0.7,
    streamline: 0.6,
    
    // Wobble settings
    wobble: 0.5,
    wobbleScale: 50,
    pressureMin: 0.4,
    pressureVar: 0.3,
    
    // Point density
    minPoints: 4,
    maxPoints: 25,
    pointSpacing: 3
};

/**
 * Get randomized settings - each stroke is unique!
 * 
 * 10-11 random variations applied:
 * 1. size: ±0.3
 * 2. thinning: ±0.15
 * 3. smoothing: ±0.15
 * 4. streamline: ±0.15
 * 5. wobble: ±0.2
 * 6. wobbleScale: ±15
 * 7. pressureMin: ±0.1
 * 8. pressureVar: ±0.1
 * 9. pointSpacing: ±1
 * 10. random phase offset for wobble pattern
 * 11. random pressure curve shape
 */
function getRandomizedSettings() {
    const rand = (base, variance) => base + (Math.random() - 0.5) * 2 * variance;
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
    
    return {
        // 1. Size variation: 1.1 to 1.7
        size: clamp(rand(BASE_SETTINGS.size, 0.3), 0.8, 2.0),
        
        // 2. Thinning variation: -0.65 to -0.35
        thinning: clamp(rand(BASE_SETTINGS.thinning, 0.15), -0.8, 0.2),
        
        // 3. Smoothing variation: 0.55 to 0.85
        smoothing: clamp(rand(BASE_SETTINGS.smoothing, 0.15), 0.3, 1.0),
        
        // 4. Streamline variation: 0.45 to 0.75
        streamline: clamp(rand(BASE_SETTINGS.streamline, 0.15), 0.2, 0.9),
        
        // 5. Wobble variation: 0.3 to 0.7
        wobble: clamp(rand(BASE_SETTINGS.wobble, 0.2), 0.1, 1.0),
        
        // 6. Wobble scale variation: 35 to 65
        wobbleScale: clamp(rand(BASE_SETTINGS.wobbleScale, 15), 20, 80),
        
        // 7. Pressure min variation: 0.3 to 0.5
        pressureMin: clamp(rand(BASE_SETTINGS.pressureMin, 0.1), 0.2, 0.6),
        
        // 8. Pressure variation: 0.2 to 0.4
        pressureVar: clamp(rand(BASE_SETTINGS.pressureVar, 0.1), 0.1, 0.5),
        
        // 9. Point spacing variation: 2 to 4
        pointSpacing: clamp(rand(BASE_SETTINGS.pointSpacing, 1), 1.5, 5),
        
        // 10. Random phase offset (0 to 2π) - shifts wobble pattern
        phaseOffset: Math.random() * Math.PI * 2,
        
        // 11. Random pressure curve type (0, 1, or 2)
        pressureCurve: Math.floor(Math.random() * 3),
        
        // Keep these from base
        minPoints: BASE_SETTINGS.minPoints,
        maxPoints: BASE_SETTINGS.maxPoints
    };
}

// ════════════════════════════════════════════════════════════════════════════════
// DRAWING ENGINE
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Convert perfect-freehand stroke to SVG path
 */
function strokeToPath(stroke) {
    if (!stroke.length) return '';
    const d = stroke.reduce(
        (acc, [x0, y0], i, arr) => {
            const [x1, y1] = arr[(i + 1) % arr.length];
            acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
            return acc;
        },
        ['M', ...stroke[0], 'Q']
    );
    d.push('Z');
    return d.join(' ');
}

/**
 * Create SVG element for overlay
 */
function createSVG(w, h) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;overflow:visible;';
    svg.classList.add('hwk-overlay'); // For identification
    return svg;
}

/**
 * Generate hand-drawn line points with randomized wobble
 * Each line is unique due to randomized settings!
 */
function handLine(x1, y1, x2, y2, settings) {
    const length = Math.hypot(x2 - x1, y2 - y1);
    const points = [];
    
    // Calculate number of points based on length
    const numPoints = Math.max(
        settings.minPoints,
        Math.min(settings.maxPoints, Math.ceil(length / settings.pointSpacing))
    );
    
    // Wobble amount scales with line length
    const wobbleAmount = Math.min(settings.wobble, length / settings.wobbleScale);
    
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        let x = x1 + (x2 - x1) * t;
        let y = y1 + (y2 - y1) * t;
        
        // 10. Apply random phase offset to wobble pattern
        const wobblePhase = t * Math.PI + settings.phaseOffset;
        const wobbleMultiplier = Math.sin(wobblePhase);
        
        // Random wobble perpendicular to line
        const w = wobbleMultiplier * wobbleAmount * (Math.random() - 0.5) * 2;
        const angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
        x += Math.cos(angle) * w;
        y += Math.sin(angle) * w;
        
        // 11. Different pressure curves for variation
        let pressure;
        switch (settings.pressureCurve) {
            case 0: // Standard sine curve
                pressure = settings.pressureMin + settings.pressureVar * Math.sin(t * Math.PI);
                break;
            case 1: // Asymmetric - heavier at start
                pressure = settings.pressureMin + settings.pressureVar * Math.sin(t * Math.PI * 0.8);
                break;
            case 2: // Asymmetric - heavier at end
                pressure = settings.pressureMin + settings.pressureVar * Math.sin((t + 0.2) * Math.PI * 0.9);
                break;
            default:
                pressure = settings.pressureMin + settings.pressureVar * Math.sin(t * Math.PI);
        }
        
        points.push([x, y, pressure]);
    }
    return points;
}

/**
 * Draw a hand-drawn path into SVG
 */
function drawPath(svg, points, settings, color) {
    const stroke = getStroke(points, {
        size: settings.size,
        thinning: settings.thinning,
        smoothing: settings.smoothing,
        streamline: settings.streamline,
    });
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', strokeToPath(stroke));
    path.setAttribute('fill', color);
    svg.appendChild(path);
}

// ════════════════════════════════════════════════════════════════════════════════
// GEOMETRY PROCESSORS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Process horizontal lines: fraction bars, overlines, underlines, etc.
 * 
 * Handles:
 * - .frac-line (fraction bars)
 * - .overline-line (overlines)
 * - .underline-line (underlines)
 * - .hline (table horizontal lines)
 * - .sout (strikethrough)
 */
function processHorizontalLines() {
    const selector = '.frac-line, .overline-line, .underline-line, .hline, .sout';
    
    document.querySelectorAll(selector).forEach(el => {
        if (el.dataset.hwk) return; // Already processed
        el.dataset.hwk = '1';
        
        const rect = el.getBoundingClientRect();
        const w = rect.width;
        if (w < 2) return; // Too small
        
        const color = getComputedStyle(el).color || '#000';
        const h = 8;
        
        // Get RANDOMIZED settings for this stroke
        const settings = getRandomizedSettings();
        
        const svg = createSVG(w, h);
        svg.style.top = '50%';
        svg.style.transform = 'translateY(-50%)';
        
        drawPath(svg, handLine(1, h/2, w-1, h/2, settings), settings, color);
        
        el.style.position = 'relative';
        el.style.borderBottomColor = 'transparent';
        el.appendChild(svg);
    });
}

/**
 * Process square roots
 * 
 * Handles nested sqrts correctly by mapping each sqrt to its direct SVG
 * before processing, preventing "SVG stealing" in nested cases.
 */
function processSqrt() {
    const allSqrts = Array.from(document.querySelectorAll('.sqrt'));
    const sqrtToSvg = new Map();
    
    // Phase 1: Map each sqrt to its direct SVG
    allSqrts.forEach(sqrtEl => {
        const svg = findDirectSvgForSqrt(sqrtEl);
        if (svg) sqrtToSvg.set(sqrtEl, svg);
    });
    
    // Phase 2: Process each sqrt
    sqrtToSvg.forEach((origSvg, sqrtEl) => {
        if (origSvg.dataset.hwk) return;
        origSvg.dataset.hwk = '1';
        
        const rect = origSvg.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        if (w < 5 || h < 5) return;
        
        const color = getComputedStyle(sqrtEl).color || '#000';
        
        // Auto-scaling based on size
        const surdW = Math.max(4, Math.min(14, h * 0.17));
        const sizeScale = Math.max(0.6, Math.min(1.2, h / 40));
        
        // Get RANDOMIZED settings for this sqrt
        const settings = getRandomizedSettings();
        settings.size *= sizeScale; // Scale for sqrt size
        
        const svg = createSVG(w, h);
        const topY = 2, bottomY = h - 2, midY = h * 0.42;
        
        // Draw sqrt shape (4 strokes, each with slight variation)
        // Hook
        const s1 = getRandomizedSettings(); s1.size *= sizeScale * 0.7;
        drawPath(svg, handLine(1, midY + 2, surdW * 0.38, midY, s1), s1, color);
        
        // Down stroke
        const s2 = getRandomizedSettings(); s2.size *= sizeScale * 1.1;
        drawPath(svg, handLine(surdW * 0.38, midY, surdW * 0.62, bottomY, s2), s2, color);
        
        // Up stroke
        const s3 = getRandomizedSettings(); s3.size *= sizeScale * 1.1;
        drawPath(svg, handLine(surdW * 0.62, bottomY, surdW, topY, s3), s3, color);
        
        // Vinculum (top bar)
        const s4 = getRandomizedSettings(); s4.size *= sizeScale;
        drawPath(svg, handLine(surdW - 1, topY, w - 1, topY, s4), s4, color);
        
        origSvg.style.opacity = '0';
        origSvg.parentElement.style.position = 'relative';
        origSvg.parentElement.appendChild(svg);
    });
}

/**
 * Find the SVG that belongs directly to a sqrt element
 * (not to nested sqrts)
 */
function findDirectSvgForSqrt(sqrtEl) {
    const allSvgs = sqrtEl.querySelectorAll('svg');
    
    for (const svg of allSvgs) {
        // Check if another .sqrt is between this svg and sqrtEl
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
        
        // Check if svg is inside .hide-tail (where KaTeX puts sqrt svgs)
        const hideTail = svg.closest('.hide-tail');
        if (!hideTail) continue;
        
        // Verify hide-tail belongs to this sqrt
        el = hideTail.parentElement;
        while (el) {
            if (el === sqrtEl) return svg;
            if (el.classList && el.classList.contains('sqrt')) break;
            el = el.parentElement;
        }
    }
    
    return null;
}

/**
 * Process arrows (extensible arrows)
 * 
 * Handles:
 * - .x-arrow (xrightarrow, xleftarrow, etc.)
 * - .stretchy (stretchy delimiters/arrows)
 */
function processArrows() {
    document.querySelectorAll('.x-arrow, .stretchy').forEach(el => {
        // Skip arrows inside sqrt (those are sqrt SVGs)
        if (el.closest('.sqrt')) return;
        
        const origSvg = el.querySelector('svg');
        if (!origSvg || origSvg.dataset.hwk) return;
        origSvg.dataset.hwk = '1';
        
        const rect = el.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        if (w < 15 || h < 3) return;
        
        const color = getComputedStyle(el).color || '#000';
        const midY = h / 2;
        const arrowSize = Math.min(h * 0.4, 6);
        
        // Get RANDOMIZED settings
        const settings = getRandomizedSettings();
        settings.size *= Math.max(0.6, Math.min(1.0, h / 15));
        
        const svg = createSVG(w, h);
        
        // Shaft
        drawPath(svg, handLine(3, midY, w - arrowSize - 2, midY, settings), settings, color);
        
        // Arrowhead (each line slightly different)
        const s2 = getRandomizedSettings(); s2.size *= 0.9;
        drawPath(svg, handLine(w - arrowSize - 2, midY - arrowSize, w - 2, midY, s2), s2, color);
        
        const s3 = getRandomizedSettings(); s3.size *= 0.9;
        drawPath(svg, handLine(w - arrowSize - 2, midY + arrowSize, w - 2, midY, s3), s3, color);
        
        origSvg.style.opacity = '0';
        el.style.position = 'relative';
        el.appendChild(svg);
    });
}

/**
 * Process cancel lines (\cancel, \bcancel, \xcancel)
 */
function processCancel() {
    document.querySelectorAll('.cancel-pad, .cancel').forEach(el => {
        const origSvg = el.querySelector('svg');
        if (!origSvg || origSvg.dataset.hwk) return;
        origSvg.dataset.hwk = '1';
        
        const rect = el.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        if (w < 5 || h < 5) return;
        
        const color = getComputedStyle(el).color || '#000';
        const settings = getRandomizedSettings();
        
        const svg = createSVG(w, h);
        
        // Draw diagonal line
        drawPath(svg, handLine(2, h - 2, w - 2, 2, settings), settings, color);
        
        origSvg.style.opacity = '0';
        el.style.position = 'relative';
        el.appendChild(svg);
    });
}

/**
 * Process boxed content (\boxed, \fbox)
 */
function processBoxed() {
    document.querySelectorAll('.boxed, .fbox').forEach(el => {
        if (el.dataset.hwk) return;
        el.dataset.hwk = '1';
        
        const rect = el.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        if (w < 5 || h < 5) return;
        
        const color = getComputedStyle(el).borderColor || getComputedStyle(el).color || '#000';
        
        const svg = createSVG(w, h);
        const pad = 1;
        
        // Draw 4 edges, each with unique randomized settings
        const s1 = getRandomizedSettings(); s1.size *= 0.8;
        const s2 = getRandomizedSettings(); s2.size *= 0.8;
        const s3 = getRandomizedSettings(); s3.size *= 0.8;
        const s4 = getRandomizedSettings(); s4.size *= 0.8;
        
        drawPath(svg, handLine(pad, pad, w - pad, pad, s1), s1, color);         // Top
        drawPath(svg, handLine(w - pad, pad, w - pad, h - pad, s2), s2, color); // Right
        drawPath(svg, handLine(w - pad, h - pad, pad, h - pad, s3), s3, color); // Bottom
        drawPath(svg, handLine(pad, h - pad, pad, pad, s4), s4, color);         // Left
        
        el.style.position = 'relative';
        el.style.border = 'none';
        el.appendChild(svg);
    });
}

/**
 * Process underbraces and overbraces
 */
function processBraces() {
    document.querySelectorAll('.munder svg, .mover svg').forEach(svg => {
        if (svg.dataset.hwk) return;
        
        const rect = svg.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        
        // Only process wide, short elements (braces)
        if (w < 20 || h > 30 || w / h < 3) return;
        
        svg.dataset.hwk = '1';
        
        const parent = svg.parentElement;
        const color = getComputedStyle(parent).color || '#000';
        
        const overlaySvg = createSVG(w, h);
        const isUnder = svg.closest('.munder') !== null;
        
        const midX = w / 2;
        
        if (isUnder) {
            // Underbrace: \_____/
            const tipY = h - 2, topY = 2;
            const s1 = getRandomizedSettings(); s1.size *= 0.7;
            const s2 = getRandomizedSettings(); s2.size *= 0.7;
            const s3 = getRandomizedSettings(); s3.size *= 0.7;
            const s4 = getRandomizedSettings(); s4.size *= 0.7;
            
            drawPath(overlaySvg, handLine(2, topY, midX - 5, topY, s1), s1, color);
            drawPath(overlaySvg, handLine(midX - 5, topY, midX, tipY, s2), s2, color);
            drawPath(overlaySvg, handLine(midX, tipY, midX + 5, topY, s3), s3, color);
            drawPath(overlaySvg, handLine(midX + 5, topY, w - 2, topY, s4), s4, color);
        } else {
            // Overbrace: /‾‾‾‾‾\
            const tipY = 2, botY = h - 2;
            const s1 = getRandomizedSettings(); s1.size *= 0.7;
            const s2 = getRandomizedSettings(); s2.size *= 0.7;
            const s3 = getRandomizedSettings(); s3.size *= 0.7;
            const s4 = getRandomizedSettings(); s4.size *= 0.7;
            
            drawPath(overlaySvg, handLine(2, botY, midX - 5, botY, s1), s1, color);
            drawPath(overlaySvg, handLine(midX - 5, botY, midX, tipY, s2), s2, color);
            drawPath(overlaySvg, handLine(midX, tipY, midX + 5, botY, s3), s3, color);
            drawPath(overlaySvg, handLine(midX + 5, botY, w - 2, botY, s4), s4, color);
        }
        
        svg.style.opacity = '0';
        parent.style.position = 'relative';
        parent.appendChild(overlaySvg);
    });
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN API
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Apply hand-drawn effect to ALL KaTeX geometry
 * 
 * Call this after rendering math with KaTeX.
 * Safe to call multiple times (idempotent).
 * 
 * @example
 *   katex.render('\\sqrt{x}', element);
 *   applyHandwritingGeometry();
 * 
 * COVERAGE:
 * ✅ Fraction bars (.frac-line)
 * ✅ Square roots (.sqrt) - including nested
 * ✅ Overlines (.overline-line)
 * ✅ Underlines (.underline-line)
 * ✅ Arrows (.x-arrow, .stretchy)
 * ✅ Strikethrough (.sout)
 * ✅ Cancel lines (.cancel-pad)
 * ✅ Boxed (.boxed, .fbox)
 * ✅ Underbraces/Overbraces (.munder, .mover)
 */
function applyHandwritingGeometry() {
    processHorizontalLines();
    processSqrt();
    processArrows();
    processCancel();
    processBoxed();
    processBraces();
}

/**
 * Clear all hand-drawn overlays (reset to original KaTeX)
 */
function clearHandwritingGeometry() {
    // Remove overlays
    document.querySelectorAll('.hwk-overlay').forEach(svg => svg.remove());
    
    // Reset marked elements
    document.querySelectorAll('[data-hwk]').forEach(el => {
        el.removeAttribute('data-hwk');
        el.style.borderBottomColor = '';
        el.style.opacity = '';
        el.style.border = '';
    });
}

// Export to window for global access
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
