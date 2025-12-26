/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║   KATEX GEOMETRY HACK - ROUGH.JS EDITION                                     ║
 * ║   (Matches Excalidraw/Excalifont style)                                      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// Note: This assumes rough is loaded globally via <script>
// or accessible via window.rough

const ROUGH_CONFIG = {
    roughness: 2,       // How "messy" it looks
    bowing: 1.5,        // How much lines curve
    strokeWidth: 2,     // Thickness
    stroke: 'currentColor' // Uses the text color
};

function createSVG(w, h) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;overflow:visible;';
    svg.classList.add('hwk-overlay'); 
    return svg;
}

// ════════════════════════════════════════════════════════════════════════════════
// PROCESSORS (Using Rough.js API)
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
        const svg = createSVG(w, 8);
        svg.style.top = '50%';
        svg.style.transform = 'translateY(-50%)';
        
        // ROUGH.JS MAGIC HERE
        const rc = rough.svg(svg); 
        const node = rc.line(0, 4, w, 4, {
            ...ROUGH_CONFIG,
            stroke: color
        });
        svg.appendChild(node);
        
        el.style.position = 'relative';
        el.style.borderBottomColor = 'transparent';
        el.appendChild(svg);
    });
}

function processSqrt() {
    // (Same sqrt finding logic as before...)
    const allSqrts = Array.from(document.querySelectorAll('.sqrt'));
    const sqrtToSvg = new Map();
    
    allSqrts.forEach(sqrtEl => {
        const allSvgs = sqrtEl.querySelectorAll('svg');
        for (const svg of allSvgs) {
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
        const w = rect.width; 
        const h = rect.height;
        const color = getComputedStyle(sqrtEl).color || '#000';
        
        const svg = createSVG(w, h);
        const rc = rough.svg(svg);
        
        // Auto-scaling
        const surdW = Math.max(4, Math.min(14, h * 0.17));
        const midY = h * 0.45;
        const topY = 2;
        const botY = h - 2;

        // Draw the checkmark part
        const node1 = rc.path(`M 0 ${midY} L ${surdW*0.4} ${botY} L ${surdW} ${topY}`, {
            ...ROUGH_CONFIG,
            stroke: color
        });
        
        // Draw the top bar
        const node2 = rc.line(surdW, topY, w, topY, {
            ...ROUGH_CONFIG,
            stroke: color
        });

        svg.appendChild(node1);
        svg.appendChild(node2);
        
        origSvg.style.opacity = '0';
        origSvg.parentElement.style.position = 'relative';
        origSvg.parentElement.appendChild(svg);
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
        const rc = rough.svg(svg);
        
        // Rough.js makes boxes super easy
        const node = rc.rectangle(1, 1, w-2, h-2, {
            ...ROUGH_CONFIG,
            stroke: color
        });
        
        svg.appendChild(node);
        
        el.style.position = 'relative';
        el.style.border = 'none';
        el.appendChild(svg);
    });
}

function processDelimiters() {
    document.querySelectorAll('.delimsizing').forEach(el => {
        if (el.dataset.hwk) return;
        const isLeft = el.closest('.mopen');
        const isRight = el.closest('.mclose');
        if (!isLeft && !isRight) return;
        const origSvg = el.querySelector('svg');
        if (!origSvg) return;
        const pathEl = origSvg.querySelector('path');
        if (!pathEl || !/[QCSAqcsa]/.test(pathEl.getAttribute('d'))) return;

        el.dataset.hwk = '1';
        const rect = el.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        const color = getComputedStyle(el).color || '#000';
        
        const svg = createSVG(w, h);
        const rc = rough.svg(svg);
        
        // Draw Curve
        let d = '';
        if (isLeft) {
            d = `M ${w-2} 0 Q ${-w/2} ${h/2} ${w-2} ${h}`;
        } else {
            d = `M 2 0 Q ${w+w/2} ${h/2} 2 ${h}`;
        }
        
        const node = rc.path(d, {
            ...ROUGH_CONFIG,
            stroke: color,
            roughness: 1.5 // slightly less rough for curves
        });
        
        svg.appendChild(node);
        origSvg.style.opacity = '0';
        el.style.position = 'relative';
        el.appendChild(svg);
    });
}

// ════════════════════════════════════════════════════════════════════════════════
// RUN
// ════════════════════════════════════════════════════════════════════════════════

function applyHandwritingGeometry() {
    // Check if rough is loaded
    if (typeof rough === 'undefined') {
        console.error("Rough.js not loaded! Add the script tag.");
        return;
    }
    processHorizontalLines();
    processSqrt();
    processBoxed();
    processDelimiters();
}

window.applyHandwritingGeometry = applyHandwritingGeometry;