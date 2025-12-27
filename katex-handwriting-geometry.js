/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    KATEX HANDWRITING GEOMETRY v4.0                          ║
 * ║                    Complete Settings Control Edition                         ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  Transforms KaTeX mathematical notation into hand-drawn style               ║
 * ║  using perfect-freehand and rough.js                                        ║
 * ║                                                                              ║
 * ║  Author: Moon                                                                ║
 * ║  License: MIT                                                                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * USAGE:
 * ──────────────────────────────────────────────────────────────────────────────
 *   import { initDependencies, applyHandwritingGeometry, MASTER_SETTINGS } 
 *       from './katex-handwriting-geometry.js';
 *   
 *   // Customize settings before applying:
 *   MASTER_SETTINGS.sqrt.roughness = 4.0;
 *   
 *   // After rendering KaTeX:
 *   await initDependencies();
 *   await applyHandwritingGeometry();
 * 
 * PROCESSORS (11 total):
 * ──────────────────────────────────────────────────────────────────────────────
 *   1. processDelimiters()      - Big ( ) [ ] { } | ⟨ ⟩ ⌊ ⌋ ⌈ ⌉
 *   2. processHorizontalLines() - Fraction bars, overlines, underlines
 *   3. processSquareRoots()     - √ symbols (including nested)
 *   4. processExtensibleArrows()- \xrightarrow, \xleftarrow, \overrightarrow
 *   5. processStretchyBraces()  - \overbrace, \underbrace
 *   6. processWideAccents()     - \widehat, \widetilde
 *   7. processCancel()          - \cancel, \bcancel, \xcancel
 *   8. processStrikethrough()   - \sout
 *   9. processBoxed()           - \boxed, \fbox
 *  10. processTableLines()      - \hline, | in arrays/matrices
 *  11. processVectorArrows()    - \vec{} small arrows
 */

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                                                                              ║
// ║                    ★★★ MASTER SETTINGS - TWEAK HERE! ★★★                   ║
// ║                                                                              ║
// ║  All settings are exported so you can modify them before calling            ║
// ║  applyHandwritingGeometry()                                                  ║
// ║                                                                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

export const MASTER_SETTINGS = {
    
    // ═══════════════════════════════════════════════════════════════════════════
    // GLOBAL PERFECT-FREEHAND SETTINGS
    // These are the defaults used by all processors unless overridden
    // ═══════════════════════════════════════════════════════════════════════════
    
    global: {
        strokeSize: 3.0,          // Base stroke thickness [1.0 - 6.0]
        thinning: 0.25,           // Pressure variation [-0.1 - 0.5]
        smoothing: 0.4,           // Curve smoothing [0 - 1] lower = sketchy
        streamline: 0.4,          // Path simplification [0 - 1] lower = wobbly
        roughness: 2.0,           // Line roughness [0.5 - 4.0]
        bowing: 1.4,              // Line bowing [0.3 - 3.0]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RANDOMIZATION (natural variation between elements)
    // ═══════════════════════════════════════════════════════════════════════════
    
    variance: {
        size: 1.0,                // Stroke size randomness [0 - 2.0]
        thinning: 0.2,            // Thinning randomness [0 - 0.3]
        roughness: 0.6,           // Roughness randomness [0 - 1.0]
        bowing: 0.5,              // Bowing randomness [0 - 1.0]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // LINE INTERPOLATION (waviness of all lines)
    // ═══════════════════════════════════════════════════════════════════════════
    
    line: {
        waveAmount: 0.015,        // Sine wave amplitude [0 - 0.04]
        wobbleAmount: 0.02,       // Random wobble amplitude [0 - 0.05]
        waveFrequency: 3,         // Sine wave frequency [1 - 8]
        minSteps: 15,             // Minimum interpolation steps [5 - 30]
        stepDivisor: 2.5,         // Distance per step [1.5 - 5.0]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 1. DELIMITERS - ( ) [ ] and stacked { } |
    // ═══════════════════════════════════════════════════════════════════════════
    
    delimiter: {
        roughness: 2.0,           // Delimiter roughness [0.5 - 4.0]
        bowing: 1.4,              // Delimiter bowing [0.3 - 3.0]
        bowPercent: 0.75,         // Arc curve amount [0.3 - 1.0]
        wobble: 25,               // Random X wobble [5 - 50]
        sizeMultiplier: 55,       // Divide height by this for stroke [30 - 80]
        minSize: 18,              // Minimum stroke size [10 - 30]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 2. HORIZONTAL LINES - fraction bars, overlines, underlines
    // ═══════════════════════════════════════════════════════════════════════════
    
    hline: {
        roughness: 2.0,           // Line roughness [0.5 - 4.0]
        bowing: 1.4,              // Line bowing [0.3 - 3.0]
        strokeSize: 3.0,          // Stroke thickness [1.0 - 5.0]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 3. SQUARE ROOTS - √ symbols
    // ═══════════════════════════════════════════════════════════════════════════
    
    sqrt: {
        roughness: 3.5,           // Extra rough for √ [2.0 - 5.0]
        bowing: 3.0,              // Extra bowing [1.5 - 5.0]
        thinning: 0.4,            // More pressure variation [0.2 - 0.6]
        smoothing: 0.2,           // Less smooth = rough [0.1 - 0.5]
        streamline: 0.2,          // Less streamline = wobbly [0.1 - 0.5]
        wobblePercent: 0.06,      // Position wobble % [0.02 - 0.12]
        sizeMultiplier: 14,       // Divide height by this [8 - 20]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 4. EXTENSIBLE ARROWS - \xrightarrow, \xleftarrow, \overrightarrow
    // ═══════════════════════════════════════════════════════════════════════════
    
    xarrow: {
        roughness: 2.0,           // Arrow roughness [0.5 - 4.0]
        bowing: 1.4,              // Arrow bowing [0.3 - 3.0]
        strokeSize: 2.5,          // Stroke thickness [1.0 - 4.0]
        arrowSizePercent: 0.45,   // Arrowhead size as % of height [0.2 - 0.6]
        maxArrowSize: 7,          // Maximum arrowhead size px [4 - 12]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 5. STRETCHY BRACES - \overbrace, \underbrace
    // ═══════════════════════════════════════════════════════════════════════════
    
    brace: {
        roughness: 2.5,           // Brace roughness [1.0 - 4.0]
        bowing: 1.8,              // Brace bowing [0.5 - 3.0]
        sizeMultiplier: 5,        // Divide thin dimension by this [3 - 10]
        tipPercent: 0.1,          // Tip size as % of length [0.05 - 0.2]
        maxTip: 10,               // Maximum tip size px [5 - 20]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 6. WIDE ACCENTS - \widehat, \widetilde
    // ═══════════════════════════════════════════════════════════════════════════
    
    wideAccent: {
        roughness: 2.0,           // Accent roughness [0.5 - 4.0]
        bowing: 1.5,              // Accent bowing [0.3 - 3.0]
        strokeSize: 2.5,          // Stroke thickness [1.0 - 4.0]
        hatPeakPercent: 0.5,      // Hat peak position [0.3 - 0.7]
        tildeWaves: 2,            // Number of tilde waves [1 - 4]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 7. CANCEL - \cancel, \bcancel, \xcancel
    // ═══════════════════════════════════════════════════════════════════════════
    
    cancel: {
        roughness: 2.5,           // Cancel line roughness [1.0 - 4.0]
        bowing: 1.5,              // Cancel line bowing [0.3 - 3.0]
        strokeSize: 2.5,          // Stroke thickness [1.0 - 4.0]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 8. STRIKETHROUGH - \sout
    // ═══════════════════════════════════════════════════════════════════════════
    
    strike: {
        roughness: 2.0,           // Strike roughness [0.5 - 4.0]
        bowing: 1.4,              // Strike bowing [0.3 - 3.0]
        strokeSize: 2.5,          // Stroke thickness [1.0 - 4.0]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 9. BOXED - \boxed, \fbox
    // ═══════════════════════════════════════════════════════════════════════════
    
    boxed: {
        roughness: 2.0,           // Box roughness [0.5 - 4.0]
        bowing: 1.4,              // Box bowing [0.3 - 3.0]
        strokeSize: 2.5,          // Stroke thickness [1.0 - 4.0]
        padding: 2,               // Padding inside box [0 - 6]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 10. TABLE LINES - \hline, | in arrays
    // ═══════════════════════════════════════════════════════════════════════════
    
    table: {
        roughness: 2.0,           // Table line roughness [0.5 - 4.0]
        bowing: 1.4,              // Table line bowing [0.3 - 3.0]
        strokeSize: 2.5,          // Stroke thickness [1.0 - 4.0]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 11. VECTOR ARROWS - \vec{}
    // ═══════════════════════════════════════════════════════════════════════════
    
    vector: {
        roughness: 2.4,           // Arrow roughness [0.5 - 4.0]
        bowing: 1.4,              // Arrow bowing [0.3 - 3.0]
        strokeSize: 2.0,          // Stroke thickness [1.0 - 4.0]
        arrowSizePercent: 0.35,   // Arrowhead size as % of height [0.2 - 0.5]
        maxArrowSize: 6,          // Maximum arrowhead size px [3 - 10]
        lineYPercent: 0.55,       // Vertical position of line [0.4 - 0.7]
    },
};

// ════════════════════════════════════════════════════════════════════════════════
// DEPENDENCY MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════════

let getStroke = null;
let generator = null;
let dependenciesLoaded = false;

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
        
        console.log('[KaTeX-HWG v4.0] Dependencies loaded');
        return { getStroke, generator };
    } catch (error) {
        console.error('[KaTeX-HWG] Failed to load dependencies:', error);
        throw error;
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

function getSettings(category = null) {
    const g = MASTER_SETTINGS.global;
    const v = MASTER_SETTINGS.variance;
    const rand = (base, variance) => base + (Math.random() - 0.5) * 2 * variance;
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
    
    // Get category-specific settings if provided
    const cat = category ? MASTER_SETTINGS[category] : {};
    
    return { 
        size: cat.strokeSize || clamp(rand(g.strokeSize, v.size), 1.0, 6.0),
        thinning: cat.thinning || clamp(rand(g.thinning, v.thinning), -0.1, 0.6),
        smoothing: cat.smoothing || g.smoothing,
        streamline: cat.streamline || g.streamline,
        simulatePressure: true,
        roughness: cat.roughness || clamp(rand(g.roughness, v.roughness), 0.5, 4.0),
        bowing: cat.bowing || clamp(rand(g.bowing, v.bowing), 0.3, 3.0),
        disableMultiStroke: true,
        seed: Math.floor(Math.random() * 10000),
    };
}

function getRoughOpts(category) {
    const cat = MASTER_SETTINGS[category] || MASTER_SETTINGS.global;
    return {
        roughness: cat.roughness || MASTER_SETTINGS.global.roughness,
        bowing: cat.bowing || MASTER_SETTINGS.global.bowing,
        seed: Math.random() * 10000,
    };
}

function interpolateLine(p0, p1) {
    const L = MASTER_SETTINGS.line;
    const points = [];
    const distance = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const steps = Math.max(L.minSteps, Math.ceil(distance / L.stepDivisor));
    
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const len = Math.hypot(dx, dy) || 1;
    const perpX = -dy / len;
    const perpY = dx / len;
    
    for (let i = 0; i <= steps; i++) { 
        const t = i / steps;
        let x = p0[0] + dx * t;
        let y = p0[1] + dy * t;
        
        const waveAmount = Math.sin(t * Math.PI * L.waveFrequency) * distance * L.waveAmount;
        const randomWobble = (Math.random() - 0.5) * distance * L.wobbleAmount;
        x += perpX * (waveAmount + randomWobble);
        y += perpY * (waveAmount + randomWobble);
        
        const pressure = 0.25 + Math.sin(t * Math.PI) * 0.45 + Math.random() * 0.15;
        points.push([x, y, pressure]); 
    }
    return points;
}

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

function drawRoughShape(svg, drawable, color, settings) {
    if (!drawable || !drawable.sets) return;
    
    drawable.sets.forEach(set => {
        let points = [];
        let currentPos = [0, 0];
        
        set.ops.forEach(op => {
            if (op.op === 'move') {
                currentPos = [op.data[0], op.data[1]];
                points.push([...currentPos, 0.5]);
            } else if (op.op === 'lineTo') {
                const nextPos = [op.data[0], op.data[1]];
                points = points.concat(interpolateLine(currentPos, nextPos));
                currentPos = nextPos;
            } else if (op.op === 'bcurveTo') {
                const cp1 = [op.data[0], op.data[1]];
                const cp2 = [op.data[2], op.data[3]];
                const endPos = [op.data[4], op.data[5]];
                points = points.concat(interpolateBezier(currentPos, cp1, cp2, endPos));
                currentPos = endPos;
            }
        });
        
        if (points.length > 1) {
            const g = MASTER_SETTINGS.global;
            const stroke = getStroke(points, {
                size: settings.size || g.strokeSize,
                thinning: settings.thinning || g.thinning,
                smoothing: settings.smoothing || g.smoothing,
                streamline: settings.streamline || g.streamline,
                simulatePressure: true,
                last: true,
            });
            
            if (stroke.length > 0) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const d = 'M' + stroke.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('L') + 'Z';
                path.setAttribute('d', d);
                path.setAttribute('fill', color);
                path.classList.add('hwk-path');
                svg.appendChild(path);
            }
        }
    });
}

function drawPoints(svg, points, color, settings) {
    if (points.length < 2) return;
    
    const g = MASTER_SETTINGS.global;
    const stroke = getStroke(points, {
        size: settings.size || g.strokeSize,
        thinning: settings.thinning || g.thinning,
        smoothing: settings.smoothing || g.smoothing,
        streamline: settings.streamline || g.streamline,
        simulatePressure: true,
        last: true,
    });
    
    if (stroke.length > 0) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = 'M' + stroke.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('L') + 'Z';
        path.setAttribute('d', d);
        path.setAttribute('fill', color);
        path.classList.add('hwk-path');
        svg.appendChild(path);
    }
}

function createOverlaySVG(width, height) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;overflow:visible;z-index:10;';
    svg.classList.add('hwk-overlay');
    return svg;
}

function clearSVG(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
}

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
// PROCESSOR 1: DELIMITERS
// ════════════════════════════════════════════════════════════════════════════════

function drawVerticalCurlyBrace(svg, width, height, isOpen, color) {
    const B = MASTER_SETTINGS.brace;
    const roughOpts = { roughness: B.roughness, bowing: B.bowing, seed: Math.random() * 10000 };
    const settings = { size: Math.max(1.8, width / B.sizeMultiplier) };
    
    const midY = height / 2;
    const tipW = Math.min(height * B.tipPercent, B.maxTip);
    
    if (isOpen) {
        const rightX = width - 3, leftX = 2;
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(rightX, 0, rightX, midY - tipW, roughOpts), color, settings);
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(rightX, midY - tipW, leftX, midY, roughOpts), color, settings);
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(leftX, midY, rightX, midY + tipW, roughOpts), color, settings);
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(rightX, midY + tipW, rightX, height, roughOpts), color, settings);
    } else {
        const rightX = width - 2, leftX = 3;
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(leftX, 0, leftX, midY - tipW, roughOpts), color, settings);
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(leftX, midY - tipW, rightX, midY, roughOpts), color, settings);
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(rightX, midY, leftX, midY + tipW, roughOpts), color, settings);
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(leftX, midY + tipW, leftX, height, roughOpts), color, settings);
    }
}

function processDelimiters() {
    let count = 0;
    const D = MASTER_SETTINGS.delimiter;
    
    document.querySelectorAll('.delimsizing').forEach(delimEl => {
        if (delimEl.dataset.hwk) return;
        
        const rect = delimEl.getBoundingClientRect();
        const color = getColor(delimEl);
        const isOpen = delimEl.closest('.mopen') !== null;
        const width = rect.width;
        const height = rect.height;
        
        const hasMultClass = delimEl.classList.contains('mult');
        const delimInner = delimEl.querySelectorAll('.delimsizinginner');
        const svgs = delimEl.querySelectorAll('svg');
        
        // TYPE 1: Stacked curly brace
        if (hasMultClass && delimInner.length > 0) {
            delimEl.dataset.hwk = 'stacked-brace';
            delimInner.forEach(el => el.style.visibility = 'hidden');
            svgs.forEach(svg => svg.style.visibility = 'hidden');
            delimEl.style.position = 'relative';
            const overlay = createOverlaySVG(width, height);
            drawVerticalCurlyBrace(overlay, width, height, isOpen, color);
            delimEl.appendChild(overlay);
            count++;
            return;
        }
        
        // TYPE 2: Stacked vertical bar (vmatrix)
        if (hasMultClass && svgs.length > 0 && delimInner.length === 0) {
            delimEl.dataset.hwk = 'stacked-vbar';
            svgs.forEach(svg => svg.style.visibility = 'hidden');
            delimEl.style.position = 'relative';
            const overlay = createOverlaySVG(width, height);
            const roughOpts = getRoughOpts('delimiter');
            const settings = { size: Math.max(1.8, width / 4) };
            drawRoughShape(overlay, generator.line(width / 2, 2, width / 2, height - 2, roughOpts), color, settings);
            delimEl.appendChild(overlay);
            count++;
            return;
        }
        
        // TYPE 3: SVG-based delimiter
        const svg = delimEl.querySelector('svg');
        if (!svg || svg.dataset.hwk) return;
        
        const viewBox = svg.getAttribute('viewBox');
        if (!viewBox) return;
        
        svg.dataset.hwk = 'delimiter';
        delimEl.dataset.hwk = 'svg-delim';
        
        const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
        const settings = getSettings('delimiter');
        settings.size = Math.max(D.minSize, Math.min(55, vbHeight / D.sizeMultiplier));
        
        clearSVG(svg);
        
        const points = [];
        const numPoints = 45;
        const paddingY = vbHeight * 0.015;
        const bowAmount = vbWidth * D.bowPercent;
        
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const y = paddingY + t * (vbHeight - paddingY * 2);
            const arcAmount = Math.sin(t * Math.PI);
            let x = isOpen ? (vbWidth - 40 - arcAmount * bowAmount) : (40 + arcAmount * bowAmount);
            x += (Math.random() - 0.5) * D.wobble;
            points.push([x, y, 0.25 + arcAmount * 0.45]);
        }
        
        drawPoints(svg, points, color, settings);
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 2: HORIZONTAL LINES
// ════════════════════════════════════════════════════════════════════════════════

function processHorizontalLines() {
    let count = 0;
    const H = MASTER_SETTINGS.hline;
    
    document.querySelectorAll('.frac-line, .overline-line, .underline-line').forEach(el => {
        if (el.dataset.hwk) return;
        
        const rect = el.getBoundingClientRect();
        if (rect.width < 2) return;
        
        el.dataset.hwk = 'hline';
        
        const color = getColor(el);
        const svgHeight = 20;
        const settings = { size: H.strokeSize, roughness: H.roughness, bowing: H.bowing };
        const roughOpts = { roughness: H.roughness, bowing: H.bowing, seed: Math.random() * 10000 };
        
        const svg = createOverlaySVG(rect.width, svgHeight);
        svg.style.top = '50%';
        svg.style.transform = 'translateY(-50%)';
        
        drawRoughShape(svg, generator.line(0, svgHeight / 2, rect.width, svgHeight / 2, roughOpts), color, settings);
        
        el.style.position = 'relative';
        el.style.borderBottomColor = 'transparent';
        el.appendChild(svg);
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 3: SQUARE ROOTS
// ════════════════════════════════════════════════════════════════════════════════

function processSquareRoots() {
    let count = 0;
    const S = MASTER_SETTINGS.sqrt;
    
    document.querySelectorAll('.sqrt .hide-tail svg').forEach(svg => {
        if (svg.dataset.hwk) return;
        
        const viewBox = svg.getAttribute('viewBox');
        if (!viewBox) return;
        
        svg.dataset.hwk = 'sqrt';
        
        const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
        const color = getColor(svg);
        
        clearSVG(svg);
        
        const settings = {
            size: Math.max(22, vbHeight / S.sizeMultiplier),
            thinning: S.thinning,
            smoothing: S.smoothing,
            streamline: S.streamline,
        };
        
        const roughOpts = { roughness: S.roughness, bowing: S.bowing, seed: Math.random() * 10000 };
        const wobble = () => (Math.random() - 0.5) * vbHeight * S.wobblePercent;
        const surdWidth = Math.min(vbHeight * 0.85, 850);
        const topY = vbHeight * 0.04 + wobble();
        const bottomY = vbHeight * 0.96 + wobble();
        const midY = vbHeight * 0.42 + wobble();
        
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(0, midY + vbHeight * 0.06, surdWidth * 0.32 + wobble(), midY, roughOpts), color, settings);
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(surdWidth * 0.32, midY, surdWidth * 0.52 + wobble(), bottomY, roughOpts), color, settings);
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(surdWidth * 0.52, bottomY, surdWidth + wobble(), topY, roughOpts), color, settings);
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(surdWidth - 25, topY, vbWidth, topY + wobble() * 0.5, roughOpts), color, settings);
        
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 4: EXTENSIBLE ARROWS
// ════════════════════════════════════════════════════════════════════════════════

function processExtensibleArrows() {
    let count = 0;
    const A = MASTER_SETTINGS.xarrow;
    
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
        
        const settings = { size: A.strokeSize };
        const roughOpts = { roughness: A.roughness, bowing: A.bowing, seed: Math.random() * 10000 };
        
        const midY = height / 2;
        const arrowSize = Math.min(height * A.arrowSizePercent, A.maxArrowSize);
        const isLeftArrow = svg.getAttribute('preserveAspectRatio')?.includes('xMin');
        
        if (isLeftArrow) {
            drawRoughShape(svg, generator.line(arrowSize + 3, midY, width - 2, midY, roughOpts), color, settings);
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(2, midY, arrowSize + 3, midY - arrowSize, roughOpts), color, settings);
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(2, midY, arrowSize + 3, midY + arrowSize, roughOpts), color, settings);
        } else {
            drawRoughShape(svg, generator.line(2, midY, width - arrowSize - 3, midY, roughOpts), color, settings);
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(width - 2, midY, width - arrowSize - 3, midY - arrowSize, roughOpts), color, settings);
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(width - 2, midY, width - arrowSize - 3, midY + arrowSize, roughOpts), color, settings);
        }
        
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 5: STRETCHY BRACES
// ════════════════════════════════════════════════════════════════════════════════

function processStretchyBraces() {
    let count = 0;
    const B = MASTER_SETTINGS.brace;
    
    document.querySelectorAll('.stretchy').forEach(el => {
        if (el.closest('.delimsizing') || el.classList.contains('sout') || el.dataset.hwk) return;
        
        const inMover = el.closest('.mover');
        const inMunder = el.closest('.munder');
        if (!inMover && !inMunder) return;
        
        el.dataset.hwk = 'stretchy';
        
        const rect = el.getBoundingClientRect();
        if (rect.width < 10) return;
        
        el.querySelectorAll('svg').forEach(s => s.style.opacity = '0');
        
        const svg = createOverlaySVG(rect.width, rect.height);
        const color = getColor(el);
        const roughOpts = { roughness: B.roughness, bowing: B.bowing, seed: Math.random() * 10000 };
        const settings = { size: Math.max(1.8, rect.height / B.sizeMultiplier) };
        
        const midX = rect.width / 2;
        const tipW = Math.min(rect.width * B.tipPercent, B.maxTip);
        
        if (inMunder) {
            const topY = 3, botY = rect.height - 2;
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(0, topY, midX - tipW, topY, roughOpts), color, settings);
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(midX - tipW, topY, midX, botY, roughOpts), color, settings);
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(midX, botY, midX + tipW, topY, roughOpts), color, settings);
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(midX + tipW, topY, rect.width, topY, roughOpts), color, settings);
        } else {
            const topY = 2, botY = rect.height - 3;
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(0, botY, midX - tipW, botY, roughOpts), color, settings);
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(midX - tipW, botY, midX, topY, roughOpts), color, settings);
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(midX, topY, midX + tipW, botY, roughOpts), color, settings);
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(midX + tipW, botY, rect.width, botY, roughOpts), color, settings);
        }
        
        el.style.position = 'relative';
        el.appendChild(svg);
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 6: WIDE ACCENTS
// ════════════════════════════════════════════════════════════════════════════════

function processWideAccents() {
    let count = 0;
    const W = MASTER_SETTINGS.wideAccent;
    
    document.querySelectorAll('.accent').forEach(accentEl => {
        const svg = accentEl.querySelector('svg');
        if (!svg || svg.dataset.hwk) return;
        if (svg.querySelector('line')) return; // Skip cancel
        if (svg.closest('.overlay')) return; // Skip \vec arrows
        
        const viewBox = svg.getAttribute('viewBox');
        if (!viewBox) return;
        
        // Skip small vec arrows (handled by processVectorArrows)
        if (viewBox.includes('471 714')) return;
        
        svg.dataset.hwk = 'wide-accent';
        
        const rect = svg.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        if (width < 5 || height < 3) return;
        
        const color = getColor(accentEl);
        
        clearSVG(svg);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        const settings = { size: W.strokeSize };
        const roughOpts = { roughness: W.roughness, bowing: W.bowing, seed: Math.random() * 10000 };
        
        // Draw widehat (^) shape
        const peakX = width * W.hatPeakPercent;
        const botY = height - 2;
        const topY = 2;
        
        drawRoughShape(svg, generator.line(2, botY, peakX, topY, roughOpts), color, settings);
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(peakX, topY, width - 2, botY, roughOpts), color, settings);
        
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 7: CANCEL
// ════════════════════════════════════════════════════════════════════════════════

function processCancel() {
    let count = 0;
    const C = MASTER_SETTINGS.cancel;
    
    document.querySelectorAll('.cancel-pad svg, .cancel svg').forEach(svg => {
        if (svg.dataset.hwk) return;
        
        const line = svg.querySelector('line');
        if (!line) return;
        
        svg.dataset.hwk = 'cancel';
        
        const rect = svg.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        const x1 = parseFloat(line.getAttribute('x1')) || 0;
        const y1 = parseFloat(line.getAttribute('y1')) || 0;
        const x2 = parseFloat(line.getAttribute('x2')) || width;
        const y2 = parseFloat(line.getAttribute('y2')) || height;
        
        const color = line.getAttribute('stroke') || getColor(svg);
        
        line.style.opacity = '0';
        
        const settings = { size: C.strokeSize };
        const roughOpts = { roughness: C.roughness, bowing: C.bowing, seed: Math.random() * 10000 };
        
        drawRoughShape(svg, generator.line(x1, y1, x2, y2, roughOpts), color, settings);
        
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 8: STRIKETHROUGH
// ════════════════════════════════════════════════════════════════════════════════

function processStrikethrough() {
    let count = 0;
    const S = MASTER_SETTINGS.strike;
    
    document.querySelectorAll('.stretchy.sout').forEach(el => {
        if (el.dataset.hwk) return;
        
        el.dataset.hwk = 'sout';
        
        const rect = el.getBoundingClientRect();
        if (rect.width < 3) return;
        
        const color = getComputedStyle(el).borderBottomColor || getColor(el);
        const svgHeight = 20;
        
        const svg = createOverlaySVG(rect.width, svgHeight);
        svg.style.top = '50%';
        svg.style.transform = 'translateY(-50%)';
        
        const settings = { size: S.strokeSize };
        const roughOpts = { roughness: S.roughness, bowing: S.bowing, seed: Math.random() * 10000 };
        
        drawRoughShape(svg, generator.line(0, svgHeight / 2, rect.width, svgHeight / 2, roughOpts), color, settings);
        
        el.style.position = 'relative';
        el.style.borderBottomColor = 'transparent';
        el.appendChild(svg);
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 9: BOXED
// ════════════════════════════════════════════════════════════════════════════════

function processBoxed() {
    let count = 0;
    const B = MASTER_SETTINGS.boxed;
    
    document.querySelectorAll('.boxed, .fbox').forEach(el => {
        if (el.dataset.hwk) return;
        
        el.dataset.hwk = 'boxed';
        
        const rect = el.getBoundingClientRect();
        if (rect.width < 5 || rect.height < 5) return;
        
        const color = getComputedStyle(el).borderColor || getColor(el);
        
        const svg = createOverlaySVG(rect.width, rect.height);
        const settings = { size: B.strokeSize };
        const roughOpts = { roughness: B.roughness, bowing: B.bowing, seed: Math.random() * 10000 };
        
        drawRoughShape(svg, generator.rectangle(B.padding, B.padding, rect.width - B.padding * 2, rect.height - B.padding * 2, roughOpts), color, settings);
        
        el.style.position = 'relative';
        el.style.border = 'none';
        el.appendChild(svg);
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 10: TABLE LINES
// ════════════════════════════════════════════════════════════════════════════════

function processTableLines() {
    let count = 0;
    const T = MASTER_SETTINGS.table;
    
    // Horizontal lines
    document.querySelectorAll('.hline').forEach(el => {
        if (el.dataset.hwk) return;
        
        const rect = el.getBoundingClientRect();
        if (rect.width < 3) return;
        
        el.dataset.hwk = 'table-hline';
        
        const color = getComputedStyle(el).borderBottomColor || getColor(el);
        const svgHeight = 12;
        
        const svg = createOverlaySVG(rect.width, svgHeight);
        svg.style.top = '50%';
        svg.style.transform = 'translateY(-50%)';
        
        const settings = { size: T.strokeSize };
        const roughOpts = { roughness: T.roughness, bowing: T.bowing, seed: Math.random() * 10000 };
        
        drawRoughShape(svg, generator.line(0, svgHeight / 2, rect.width, svgHeight / 2, roughOpts), color, settings);
        
        el.style.position = 'relative';
        el.style.borderBottomColor = 'transparent';
        el.appendChild(svg);
        count++;
    });
    
    // Vertical lines
    document.querySelectorAll('.vertical-separator').forEach(el => {
        if (el.dataset.hwk) return;
        
        const rect = el.getBoundingClientRect();
        if (rect.height < 3) return;
        
        el.dataset.hwk = 'table-vline';
        
        const color = getComputedStyle(el).borderRightColor || getColor(el);
        const svgWidth = 12;
        
        const svg = createOverlaySVG(svgWidth, rect.height);
        svg.style.top = '0';
        svg.style.left = '50%';
        svg.style.transform = 'translateX(-50%)';
        
        const settings = { size: T.strokeSize };
        const roughOpts = { roughness: T.roughness, bowing: T.bowing, seed: Math.random() * 10000 };
        
        drawRoughShape(svg, generator.line(svgWidth / 2, 0, svgWidth / 2, rect.height, roughOpts), color, settings);
        
        el.style.position = 'relative';
        el.style.borderRightColor = 'transparent';
        el.appendChild(svg);
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSOR 11: VECTOR ARROWS
// ════════════════════════════════════════════════════════════════════════════════

function processVectorArrows() {
    let count = 0;
    const V = MASTER_SETTINGS.vector;
    
    document.querySelectorAll('.overlay svg').forEach(svg => {
        if (svg.dataset.hwk) return;
        
        const viewBox = svg.getAttribute('viewBox');
        if (!viewBox || !viewBox.includes('471')) return;
        
        svg.dataset.hwk = 'vec-arrow';
        
        const rect = svg.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        if (width < 3 || height < 3) return;
        
        const color = getColor(svg);
        const settings = { size: V.strokeSize };
        
        clearSVG(svg);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        const roughOpts = { roughness: V.roughness, bowing: V.bowing, seed: Math.random() * 10000 };
        
        const midY = height * V.lineYPercent;
        const arrowTipX = width - 2;
        const arrowStartX = 2;
        const arrowSize = Math.min(height * V.arrowSizePercent, V.maxArrowSize);
        
        // Main line
        drawRoughShape(svg, generator.line(arrowStartX, midY, arrowTipX - 1, midY, roughOpts), color, settings);
        
        // Arrowhead
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(arrowTipX, midY, arrowTipX - arrowSize, midY - arrowSize, roughOpts), color, settings);
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(arrowTipX, midY, arrowTipX - arrowSize, midY + arrowSize, roughOpts), color, settings);
        
        count++;
    });
    
    return count;
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN API
// ════════════════════════════════════════════════════════════════════════════════

export async function applyHandwritingGeometry() {
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
        tableLines: processTableLines(),
        vectorArrows: processVectorArrows(),
    };
    
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log('[KaTeX-HWG v4.0] Applied to', total, 'elements:', counts);
    
    return counts;
}

export function clearHandwritingGeometry() {
    document.querySelectorAll('.hwk-overlay').forEach(svg => svg.remove());
    document.querySelectorAll('.hwk-path').forEach(path => path.remove());
    
    document.querySelectorAll('[data-hwk]').forEach(el => {
        el.removeAttribute('data-hwk');
        el.style.borderBottomColor = '';
        el.style.borderRightColor = '';
        el.style.opacity = '';
        el.style.border = '';
        el.style.visibility = '';
    });
    
    document.querySelectorAll('.stretchy svg, .delimsizinginner, .delimsizing svg').forEach(el => {
        el.style.opacity = '';
        el.style.visibility = '';
    });
    
    document.querySelectorAll('line').forEach(line => line.style.opacity = '');
    
    console.log('[KaTeX-HWG v4.0] Cleared all handwriting geometry');
}

// Export for use
export default { 
    initDependencies, 
    applyHandwritingGeometry, 
    clearHandwritingGeometry, 
    MASTER_SETTINGS 
};
