/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║   KATEX GEOMETRY HACK - Handwritten Math Lines v1.2 (FIXED)                  ║
 * ║   - Fixed: Parentheses detection now uses CSS classes instead of text        ║
 * ║   - Fixed: Square brackets [] remain straight, only () become curvy          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { getStroke } from 'https://esm.sh/perfect-freehand@1.2.0';

// ════════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════════════════════════════════════════

const BASE_SETTINGS = {
    size: 1.4,
    thinning: -0.5,
    smoothing: 0.7,
    streamline: 0.6,
    wobble: 0.5,
    wobbleScale: 50,
    pressureMin: 0.4,
    pressureVar: 0.3,
    minPoints: 4,
    maxPoints: 25,
    pointSpacing: 3
};

function getRandomizedSettings() {
    const rand = (base, variance) => base + (Math.random() - 0.5) * 2 * variance;
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
    
    return {
        size: clamp(rand(BASE_SETTINGS.size, 0.3), 0.8, 2.0),
        thinning: clamp(rand(BASE_SETTINGS.thinning, 0.15), -0.8, 0.2),
        smoothing: clamp(rand(BASE_SETTINGS.smoothing, 0.15), 0.3, 1.0),
        streamline: clamp(rand(BASE_SETTINGS.streamline, 0.15), 0.2, 0.9),
        wobble: clamp(rand(BASE_SETTINGS.wobble, 0.2), 0.1, 1.0),
        wobbleScale: clamp(rand(BASE_SETTINGS.wobbleScale, 15), 20, 80),
        pressureMin: clamp(rand(BASE_SETTINGS.pressureMin, 0.1), 0.2, 0.6),
        pressureVar: clamp(rand(BASE_SETTINGS.pressureVar, 0.1), 0.1, 0.5),
        pointSpacing: clamp(rand(BASE_SETTINGS.pointSpacing, 1), 1.5, 5),
        phaseOffset: Math.random() * Math.PI * 2,
        pressureCurve: Math.floor(Math.random() * 3),
        minPoints: BASE_SETTINGS.minPoints,
        maxPoints: BASE_SETTINGS.maxPoints
    };
}

// ════════════════════════════════════════════════════════════════════════════════
// DRAWING ENGINE
// ════════════════════════════════════════════════════════════════════════════════

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

function createSVG(w, h) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;overflow:visible;';
    svg.classList.add('hwk-overlay'); 
    return svg;
}

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
// GEOMETRY GENERATORS (Lines & Curves)
// ════════════════════════════════════════════════════════════════════════════════

function handLine(x1, y1, x2, y2, settings) {
    const length = Math.hypot(x2 - x1, y2 - y1);
    const points = [];
    const numPoints = Math.max(
        settings.minPoints,
        Math.min(settings.maxPoints, Math.ceil(length / settings.pointSpacing))
    );
    const wobbleAmount = Math.min(settings.wobble, length / settings.wobbleScale);
    
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        let x = x1 + (x2 - x1) * t;
        let y = y1 + (y2 - y1) * t;
        
        const wobblePhase = t * Math.PI + settings.phaseOffset;
        const w = Math.sin(wobblePhase) * wobbleAmount * (Math.random() - 0.5) * 2;
        const angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
        x += Math.cos(angle) * w;
        y += Math.sin(angle) * w;
        
        let pressure = settings.pressureMin + settings.pressureVar * Math.sin(t * Math.PI);
        points.push([x, y, pressure]);
    }
    return points;
}

function getBezierPoints(p0, p1, p2, settings) {
    const points = [];
    const segments = Math.max(settings.minPoints * 2, settings.maxPoints);
    
    const dist = Math.hypot(p2[0]-p0[0], p2[1]-p0[1]);
    const wobbleAmount = Math.min(settings.wobble, dist / settings.wobbleScale);

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const invT = 1 - t;
        
        let x = invT * invT * p0[0] + 2 * invT * t * p1[0] + t * t * p2[0];
        let y = invT * invT * p0[1] + 2 * invT * t * p1[1] + t * t * p2[1];

        if (i > 0 && i < segments) {
            x += (Math.random() - 0.5) * wobbleAmount;
            y += (Math.random() - 0.5) * wobbleAmount;
        }

        const pressure = settings.pressureMin + settings.pressureVar * Math.sin(t * Math.PI);
        points.push([x, y, pressure]);
    }
    return points;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSORS
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
        const h = 8;
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

function processSqrt() {
    const allSqrts = Array.from(document.querySelectorAll('.sqrt'));
    const sqrtToSvg = new Map();
    
    allSqrts.forEach(sqrtEl => {
        const allSvgs = sqrtEl.querySelectorAll('svg');
        for (const svg of allSvgs) {
            let el = svg.parentElement;
            let belongsToNested = false;
            while (el && el !== sqrtEl) {
                if (el.classList?.contains('sqrt')) { belongsToNested = true; break; }
                el = el.parentElement;
            }
            if (belongsToNested) continue;
            
            const hideTail = svg.closest('.hide-tail');
            if (hideTail && hideTail.closest('.sqrt') === sqrtEl) {
                sqrtToSvg.set(sqrtEl, svg);
                break;
            }
        }
    });
    
    sqrtToSvg.forEach((origSvg, sqrtEl) => {
        if (origSvg.dataset.hwk) return;
        origSvg.dataset.hwk = '1';
        
        const rect = origSvg.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        if (w < 5 || h < 5) return;
        
        const color = getComputedStyle(sqrtEl).color || '#000';
        const surdW = Math.max(4, Math.min(14, h * 0.17));
        const sizeScale = Math.max(0.6, Math.min(1.2, h / 40));
        const settings = getRandomizedSettings();
        settings.size *= sizeScale;
        
        const svg = createSVG(w, h);
        const topY = 2, bottomY = h - 2, midY = h * 0.42;
        
        const s1 = getRandomizedSettings(); s1.size *= sizeScale * 0.7;
        drawPath(svg, handLine(1, midY + 2, surdW * 0.38, midY, s1), s1, color);
        const s2 = getRandomizedSettings(); s2.size *= sizeScale * 1.1;
        drawPath(svg, handLine(surdW * 0.38, midY, surdW * 0.62, bottomY, s2), s2, color);
        const s3 = getRandomizedSettings(); s3.size *= sizeScale * 1.1;
        drawPath(svg, handLine(surdW * 0.62, bottomY, surdW, topY, s3), s3, color);
        const s4 = getRandomizedSettings(); s4.size *= sizeScale;
        drawPath(svg, handLine(surdW - 1, topY, w - 1, topY, s4), s4, color);
        
        origSvg.style.opacity = '0';
        origSvg.parentElement.style.position = 'relative';
        origSvg.parentElement.appendChild(svg);
    });
}

function processArrows() {
    document.querySelectorAll('.x-arrow, .stretchy').forEach(el => {
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
        const settings = getRandomizedSettings();
        
        const svg = createSVG(w, h);
        
        drawPath(svg, handLine(3, midY, w - arrowSize - 2, midY, settings), settings, color);
        const s2 = getRandomizedSettings(); s2.size *= 0.9;
        drawPath(svg, handLine(w - arrowSize - 2, midY - arrowSize, w - 2, midY, s2), s2, color);
        const s3 = getRandomizedSettings(); s3.size *= 0.9;
        drawPath(svg, handLine(w - arrowSize - 2, midY + arrowSize, w - 2, midY, s3), s3, color);
        
        origSvg.style.opacity = '0';
        el.style.position = 'relative';
        el.appendChild(svg);
    });
}

function processCancel() {
    document.querySelectorAll('.cancel-pad, .cancel').forEach(el => {
        const origSvg = el.querySelector('svg');
        if (!origSvg || origSvg.dataset.hwk) return;
        origSvg.dataset.hwk = '1';
        const rect = el.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        const color = getComputedStyle(el).color || '#000';
        const settings = getRandomizedSettings();
        const svg = createSVG(w, h);
        
        drawPath(svg, handLine(2, h - 2, w - 2, 2, settings), settings, color);
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
        const color = getComputedStyle(el).borderColor || getComputedStyle(el).color || '#000';
        
        const svg = createSVG(w, h);
        const pad = 1;
        const s1 = getRandomizedSettings(); s1.size *= 0.8;
        const s2 = getRandomizedSettings(); s2.size *= 0.8;
        const s3 = getRandomizedSettings(); s3.size *= 0.8;
        const s4 = getRandomizedSettings(); s4.size *= 0.8;
        
        drawPath(svg, handLine(pad, pad, w - pad, pad, s1), s1, color);
        drawPath(svg, handLine(w - pad, pad, w - pad, h - pad, s2), s2, color);
        drawPath(svg, handLine(w - pad, h - pad, pad, h - pad, s3), s3, color);
        drawPath(svg, handLine(pad, h - pad, pad, pad, s4), s4, color);
        
        el.style.position = 'relative';
        el.style.border = 'none';
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
        const isUnder = svg.closest('.munder') !== null;
        const midX = w / 2;
        
        const s1 = getRandomizedSettings(); s1.size *= 0.7;
        const s2 = getRandomizedSettings(); s2.size *= 0.7;
        const s3 = getRandomizedSettings(); s3.size *= 0.7;
        const s4 = getRandomizedSettings(); s4.size *= 0.7;
        const yBase = isUnder ? 2 : h-2;
        const yTip = isUnder ? h-2 : 2;
        
        drawPath(overlaySvg, handLine(2, yBase, midX - 5, yBase, s1), s1, color);
        drawPath(overlaySvg, handLine(midX - 5, yBase, midX, yTip, s2), s2, color);
        drawPath(overlaySvg, handLine(midX, yTip, midX + 5, yBase, s3), s3, color);
        drawPath(overlaySvg, handLine(midX + 5, yBase, w - 2, yBase, s4), s4, color);
        
        svg.style.opacity = '0';
        parent.style.position = 'relative';
        parent.appendChild(overlaySvg);
    });
}

/**
 * 🆕 PROCESSOR: Handle Curved Delimiters (Parentheses)
 * FIXED: Now checks class names and SVG paths instead of text content
 */
function processDelimiters() {
    document.querySelectorAll('.delimsizing').forEach(el => {
        if (el.dataset.hwk) return;

        // 1. Detect if it is Left or Right based on parent class
        const isLeft = el.closest('.mopen');
        const isRight = el.closest('.mclose');
        
        // If it's neither, we can't safely replace it
        if (!isLeft && !isRight) return;

        const origSvg = el.querySelector('svg');
        if (!origSvg) return;

        // 2. DETECT SHAPE: Check if it is a Curve () or a Line []
        const pathEl = origSvg.querySelector('path');
        if (!pathEl) return;
        const d = pathEl.getAttribute('d') || '';

        // Regex: If path contains Q, C, S, A (curves), it's a Paren. 
        // If it only contains M, L, H, V (lines), it's a Bracket.
        // We only want to replace Curves.
        if (!/[QCSAqcsa]/.test(d)) return;

        el.dataset.hwk = '1';
        const rect = el.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const color = getComputedStyle(el).color || '#000';
        
        const svg = createSVG(w, h);
        const settings = getRandomizedSettings();
        settings.size *= 0.8; // Curves look better slightly thinner

        if (isLeft) {
            // ( Curve: Top-Right -> Left-Center -> Bottom-Right
            const p0 = [w - 2, 0];       
            const p1 = [-w * 0.8, h / 2]; // Control point pulls left
            const p2 = [w - 2, h];       
            drawPath(svg, getBezierPoints(p0, p1, p2, settings), settings, color);
        } else {
            // ) Curve: Top-Left -> Right-Center -> Bottom-Left
            const p0 = [2, 0];           
            const p1 = [w + w * 0.8, h / 2]; // Control point pulls right
            const p2 = [2, h];           
            drawPath(svg, getBezierPoints(p0, p1, p2, settings), settings, color);
        }

        origSvg.style.opacity = '0';
        el.style.position = 'relative';
        el.appendChild(svg);
    });
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════════════════

function applyHandwritingGeometry() {
    processHorizontalLines();
    processSqrt();
    processArrows();
    processCancel();
    processBoxed();
    processBraces();
    processDelimiters(); // <--- This will now work
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

export { applyHandwritingGeometry, clearHandwritingGeometry };