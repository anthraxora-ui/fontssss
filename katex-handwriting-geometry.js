/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    KATEX HANDWRITING GEOMETRY v3.2                          ║
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

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                                                                              ║
// ║                    ★★★ MASTER SETTINGS - TWEAK HERE! ★★★                   ║
// ║                                                                              ║
// ║  Adjust these numbers to change the hand-drawn appearance                   ║
// ║  Each setting has a recommended range in comments                           ║
// ║                                                                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const MASTER_SETTINGS = {
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PERFECT-FREEHAND SETTINGS (stroke appearance)
    // ═══════════════════════════════════════════════════════════════════════════
    
    strokeSize: 3.0,          // Base stroke thickness [1.5 - 5.0] bigger = thicker lines
    thinning: 0.25,           // Pressure variation [-0.1 - 0.5] higher = more thin/thick variation
    smoothing: 0.4,           // Curve smoothing [0 - 1] lower = more sketchy
    streamline: 0.1,          // Path simplification [0 - 1] lower = more wobbly
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ROUGH.JS SETTINGS (hand-drawn feel)
    // ═══════════════════════════════════════════════════════════════════════════
    
    roughness: 3.0,           // Line roughness [0.5 - 3.5] higher = more wobbly/sketchy
    bowing: 1.4,              // Line bowing [0.3 - 3.0] higher = more curved lines
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RANDOMIZATION (natural variation)
    // ═══════════════════════════════════════════════════════════════════════════
    
    sizeVariance: 1.0,        // Stroke size randomness [0 - 2.0]
    thinningVariance: 0.2,    // Thinning randomness [0 - 0.3]
    roughnessVariance: 0.6,   // Roughness randomness [0 - 1.0]
    bowingVariance: 0.5,      // Bowing randomness [0 - 1.0]
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SQUARE ROOT SPECIFIC (extra rough for √ symbols)
    // ═══════════════════════════════════════════════════════════════════════════
    
    sqrt: {
        roughness: 3.5,       // Extra rough for square roots [2.0 - 4.0]
        bowing: 3.0,          // Extra bowing [1.5 - 4.0]
        thinning: 0.4,        // More pressure variation [0.2 - 0.5]
        smoothing: 0.2,       // Less smooth = more rough [0.1 - 0.4]
        streamline: 0.2,      // Less streamline = more wobbly [0.1 - 0.4]
        wobblePercent: 0.06,  // Position wobble as % of height [0.02 - 0.10]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // OVERBRACE / UNDERBRACE SPECIFIC
    // ═══════════════════════════════════════════════════════════════════════════
    
    brace: {
        roughness: 2.5,       // Brace roughness [1.5 - 3.5]
        bowing: 1.8,          // Brace bowing [1.0 - 2.5]
        sizeMultiplier: 5,    // Divide thin dimension by this [3 - 8] smaller = thicker
        tipPercent: 0.1,      // Tip size as % of length [0.05 - 0.15]
        maxTip: 10,           // Maximum tip size in pixels [5 - 20]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // DELIMITER SPECIFIC (parentheses, brackets)
    // ═══════════════════════════════════════════════════════════════════════════
    
    delimiter: {
        bowPercent: 0.75,     // How much the arc curves [0.5 - 0.9]
        wobble: 25,           // Random X wobble in viewBox units [10 - 40]
        sizeMultiplier: 55,   // Divide height by this for stroke [40 - 70]
        minSize: 18,          // Minimum stroke size [12 - 25]
    },
    
    // ═══════════════════════════════════════════════════════════════════════════
    // LINE INTERPOLATION (waviness of all lines)
    // ═══════════════════════════════════════════════════════════════════════════
    
    line: {
        waveAmount: 0.015,    // Sine wave amplitude [0.005 - 0.025]
        wobbleAmount: 0.02,   // Random wobble amplitude [0.01 - 0.03]
        waveFrequency: 3,     // Sine wave frequency [2 - 5]
        minSteps: 15,         // Minimum interpolation steps [10 - 25]
        stepDivisor: 2.5,     // Distance per step [1.5 - 4.0]
    },
};

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
// CONFIGURATION (uses MASTER_SETTINGS)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Base settings derived from MASTER_SETTINGS
 * These are applied with randomization for natural variation
 */
const CONFIG = {
    size: MASTER_SETTINGS.strokeSize,
    thinning: MASTER_SETTINGS.thinning,
    smoothing: MASTER_SETTINGS.smoothing,
    streamline: MASTER_SETTINGS.streamline,
    roughness: MASTER_SETTINGS.roughness,
    bowing: MASTER_SETTINGS.bowing,
    sizeVariance: MASTER_SETTINGS.sizeVariance,
    thinningVariance: MASTER_SETTINGS.thinningVariance,
    roughnessVariance: MASTER_SETTINGS.roughnessVariance,
    bowingVariance: MASTER_SETTINGS.bowingVariance,
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
        roughness: clamp(rand(CONFIG.roughness, CONFIG.roughnessVariance), 1.0, 3.5), 
        bowing: clamp(rand(CONFIG.bowing, CONFIG.bowingVariance), 0.5, 2.5), 
        disableMultiStroke: true, 
        seed: Math.floor(Math.random() * 10000) 
    };
}

// ════════════════════════════════════════════════════════════════════════════════
// DRAWING UTILITIES
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Interpolate points along a line for hand-drawn effect
 * Includes wave pattern and random wobble for sketchy look
 */
function interpolateLine(p0, p1) {
    const points = [];
    const distance = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const steps = Math.max(MASTER_SETTINGS.line.minSteps, Math.ceil(distance / MASTER_SETTINGS.line.stepDivisor));
    
    // Calculate perpendicular direction for wobble
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const len = Math.hypot(dx, dy) || 1;
    const perpX = -dy / len;
    const perpY = dx / len;
    
    for (let i = 0; i <= steps; i++) { 
        const t = i / steps;
        let x = p0[0] + (p1[0] - p0[0]) * t;
        let y = p0[1] + (p1[1] - p0[1]) * t;
        
        // Add WAVY wobble perpendicular to line direction (uses MASTER_SETTINGS)
        const waveAmount = Math.sin(t * Math.PI * MASTER_SETTINGS.line.waveFrequency) * distance * MASTER_SETTINGS.line.waveAmount;
        const randomWobble = (Math.random() - 0.5) * distance * MASTER_SETTINGS.line.wobbleAmount;
        x += perpX * (waveAmount + randomWobble);
        y += perpY * (waveAmount + randomWobble);
        
        const pressure = 0.25 + Math.sin(t * Math.PI) * 0.45 + Math.random() * 0.15;
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
// Target: .delimsizing svg (with viewBox) AND stacked braces (.delimsizing.mult)
// Handles: ( ) [ ] { } | || ⟨ ⟩ ⌊ ⌋ ⌈ ⌉
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Draw vertical curly brace { or }
 * SAME LOGIC AS OVERBRACE - JUST ROTATED 90°!
 */
function drawVerticalCurlyBrace(svg, width, height, isOpen, color) {
    const roughOpts = { 
        roughness: MASTER_SETTINGS.brace.roughness, 
        bowing: MASTER_SETTINGS.brace.bowing, 
        seed: Math.random() * 10000 
    };
    const braceSettings = { 
        size: Math.max(1.8, width / MASTER_SETTINGS.brace.sizeMultiplier) 
    };
    
    const midY = height / 2;
    const tipW = Math.min(height * MASTER_SETTINGS.brace.tipPercent, MASTER_SETTINGS.brace.maxTip);
    
    if (isOpen) {
        // Opening brace { - tip points LEFT
        // Same as UNDERBRACE rotated 90° counterclockwise
        const rightX = width - 3;
        const leftX = 2;
        
        // Line 1: Top vertical (like overbrace left horizontal)
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(rightX, 0, rightX, midY - tipW, roughOpts), color, braceSettings);
        
        // Line 2: Diagonal to tip (like overbrace diagonal down)
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(rightX, midY - tipW, leftX, midY, roughOpts), color, braceSettings);
        
        // Line 3: Diagonal from tip (like overbrace diagonal up)
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(leftX, midY, rightX, midY + tipW, roughOpts), color, braceSettings);
        
        // Line 4: Bottom vertical (like overbrace right horizontal)
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(rightX, midY + tipW, rightX, height, roughOpts), color, braceSettings);
        
    } else {
        // Closing brace } - tip points RIGHT
        const rightX = width - 2;
        const leftX = 3;
        
        // Line 1: Top vertical
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(leftX, 0, leftX, midY - tipW, roughOpts), color, braceSettings);
        
        // Line 2: Diagonal to tip
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(leftX, midY - tipW, rightX, midY, roughOpts), color, braceSettings);
        
        // Line 3: Diagonal from tip
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(rightX, midY, leftX, midY + tipW, roughOpts), color, braceSettings);
        
        // Line 4: Bottom vertical
        roughOpts.seed = Math.random() * 10000;
        drawRoughShape(svg, generator.line(leftX, midY + tipW, leftX, height, roughOpts), color, braceSettings);
    }
}

function processDelimiters() {
    let count = 0;
    
    document.querySelectorAll('.delimsizing').forEach(delimEl => {
        if (delimEl.dataset.hwk) return;
        
        const rect = delimEl.getBoundingClientRect();
        const color = getColor(delimEl);
        const isOpen = delimEl.closest('.mopen') !== null;
        const width = rect.width;
        const height = rect.height;
        
        // Check for stacked curly brace (mult class with delimsizinginner)
        const hasMultClass = delimEl.classList.contains('mult');
        const delimInner = delimEl.querySelectorAll('.delimsizinginner');
        const svgs = delimEl.querySelectorAll('svg');
        
        // ═══════════════════════════════════════════════════════════════
        // TYPE 1: STACKED CURLY BRACE (mult + delimsizinginner)
        // Has ⎧⎨⎩ characters + SVG extenders - draw unified brace
        // ═══════════════════════════════════════════════════════════════
        if (hasMultClass && delimInner.length > 0) {
            delimEl.dataset.hwk = 'stacked-brace';
            
            // Hide the original parts
            delimInner.forEach(el => el.style.visibility = 'hidden');
            svgs.forEach(svg => svg.style.visibility = 'hidden');
            
            // Create overlay and draw curly brace
            delimEl.style.position = 'relative';
            const overlay = createOverlaySVG(width, height);
            drawVerticalCurlyBrace(overlay, width, height, isOpen, color);
            delimEl.appendChild(overlay);
            count++;
            return; // Skip to next element
        }
        
        // ═══════════════════════════════════════════════════════════════
        // TYPE 2: SVG-BASED DELIMITER (parenthesis, bracket, etc)
        // ═══════════════════════════════════════════════════════════════
        const svg = delimEl.querySelector('svg');
        if (!svg || svg.dataset.hwk) return;
        
        const viewBox = svg.getAttribute('viewBox');
        if (!viewBox) return;
        
        svg.dataset.hwk = 'delimiter';
        delimEl.dataset.hwk = 'svg-delim';
        
        const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
        
        const settings = getSettings();
        settings.size = Math.max(
            MASTER_SETTINGS.delimiter.minSize, 
            Math.min(55, vbHeight / MASTER_SETTINGS.delimiter.sizeMultiplier)
        );
        
        clearSVG(svg);
        
        // Generate smooth parenthesis arc
        const points = [];
        const numPoints = 45;
        const paddingY = vbHeight * 0.015;
        const bowAmount = vbWidth * MASTER_SETTINGS.delimiter.bowPercent;
        
        for (let i = 0; i <= numPoints; i++) { 
            const t = i / numPoints;
            const y = paddingY + t * (vbHeight - paddingY * 2);
            const arcAmount = Math.sin(t * Math.PI);
            
            let x;
            if (isOpen) {
                x = vbWidth - 40 - arcAmount * bowAmount;
            } else {
                x = 40 + arcAmount * bowAmount;
            }
            
            x += (Math.random() - 0.5) * MASTER_SETTINGS.delimiter.wobble;
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
        
        // Use MASTER_SETTINGS for sqrt - very sketchy and wavy!
        const roughOpts = {
            roughness: MASTER_SETTINGS.sqrt.roughness,
            bowing: MASTER_SETTINGS.sqrt.bowing,
            seed: Math.floor(Math.random() * 10000),
            disableMultiStroke: false,
            strokeWidth: 1,
        };
        
        // Perfect-freehand settings for sqrt - more variation
        const sqrtSettings = {
            ...settings,
            thinning: MASTER_SETTINGS.sqrt.thinning,
            smoothing: MASTER_SETTINGS.sqrt.smoothing,
            streamline: MASTER_SETTINGS.sqrt.streamline,
        };
        
        // Square root shape with wobble for wavy look
        const wobble = () => (Math.random() - 0.5) * vbHeight * MASTER_SETTINGS.sqrt.wobblePercent;
        const surdWidth = Math.min(vbHeight * 0.85, 850);
        const topY = vbHeight * 0.04 + wobble();
        const bottomY = vbHeight * 0.96 + wobble();
        const midY = vbHeight * 0.42 + wobble();
        
        // Draw sqrt shape: small hook, down stroke, up stroke, vinculum (top bar)
        // Each segment gets fresh seed for natural variation
        
        // Hook
        roughOpts.seed = Math.floor(Math.random() * 10000);
        drawRoughShape(svg, generator.line(0, midY + vbHeight * 0.06, surdWidth * 0.32 + wobble(), midY, roughOpts), color, sqrtSettings);
        
        // Down stroke
        roughOpts.seed = Math.floor(Math.random() * 10000);
        drawRoughShape(svg, generator.line(surdWidth * 0.32, midY, surdWidth * 0.52 + wobble(), bottomY, roughOpts), color, sqrtSettings);
        
        // Up stroke (the main diagonal)
        roughOpts.seed = Math.floor(Math.random() * 10000);
        drawRoughShape(svg, generator.line(surdWidth * 0.52, bottomY, surdWidth + wobble(), topY, roughOpts), color, sqrtSettings);
        
        // Vinculum (top bar)
        roughOpts.seed = Math.floor(Math.random() * 10000);
        drawRoughShape(svg, generator.line(surdWidth - 25, topY, vbWidth, topY + wobble() * 0.5, roughOpts), color, sqrtSettings);
        
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
        
        // Use MASTER_SETTINGS for brace
        const roughOpts = {
            roughness: MASTER_SETTINGS.brace.roughness,
            bowing: MASTER_SETTINGS.brace.bowing,
            seed: Math.random() * 10000,
        };
        const settings = {
            size: Math.max(1.8, height / MASTER_SETTINGS.brace.sizeMultiplier),
        };
        
        // Hide original SVGs
        stretchyEl.querySelectorAll('svg').forEach(svg => svg.style.opacity = '0');
        
        // Create overlay
        const svg = createOverlaySVG(width, height);
        
        const isUnderbrace = inMunder !== null;
        const midX = width / 2;
        const tipWidth = Math.min(width * MASTER_SETTINGS.brace.tipPercent, MASTER_SETTINGS.brace.maxTip);
        
        if (isUnderbrace) {
            // Underbrace ⏟ - tip points DOWN
            const topY = 3;
            const bottomY = height - 2;
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(0, topY, midX - tipWidth, topY, roughOpts), color, settings);
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(midX - tipWidth, topY, midX, bottomY, roughOpts), color, settings);
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(midX, bottomY, midX + tipWidth, topY, roughOpts), color, settings);
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(midX + tipWidth, topY, width, topY, roughOpts), color, settings);
        } else {
            // Overbrace ⏞ - tip points UP
            const topY = 2;
            const bottomY = height - 3;
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(0, bottomY, midX - tipWidth, bottomY, roughOpts), color, settings);
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(midX - tipWidth, bottomY, midX, topY, roughOpts), color, settings);
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(midX, topY, midX + tipWidth, bottomY, roughOpts), color, settings);
            roughOpts.seed = Math.random() * 10000;
            drawRoughShape(svg, generator.line(midX + tipWidth, bottomY, width, bottomY, roughOpts), color, settings);
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
