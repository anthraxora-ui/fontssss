/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    HOLY GRAIL - KaTeX Handwriting Transform                  ║
 * ║                              Version 1.0.0                                   ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  Automatically transforms KaTeX math into hand-drawn style                   ║
 * ║                                                                              ║
 * ║  Pipeline: KaTeX → Capture → Skeleton → PF + Rough.js → Hand-drawn!         ║
 * ║                                                                              ║
 * ║  Usage:                                                                      ║
 * ║    <script type="module">                                                    ║
 * ║      import { holyGrail } from './holy-grail-katex.js';                     ║
 * ║      await holyGrail.transform();                                           ║
 * ║    </script>                                                                 ║
 * ║                                                                              ║
 * ║  Author: Moon                                                                ║
 * ║  License: MIT                                                                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// ════════════════════════════════════════════════════════════════════════════════
// SETTINGS - Customize these!
// ════════════════════════════════════════════════════════════════════════════════

export const SETTINGS = {
    // Resolution
    scale: 6,                    // Capture scale (4-10, higher = better quality)
    
    // Perfect-Freehand
    strokeSize: 2.5,             // Base stroke thickness
    thinning: 0.45,              // Pressure variation (0-0.8)
    smoothing: 0.4,              // Curve smoothness (0-1)
    streamline: 0.4,             // Path simplification (0-1)
    
    // Rough.js
    roughness: 1.2,              // Sketchiness (0.5-3)
    bowing: 1.0,                 // Line curve (0.5-3)
    
    // Waviness
    waveAmount: 1.0,             // Hand shake amount (0-3)
    
    // Colors
    strokeColor: null,           // null = auto-detect from KaTeX
    fillColor: null,             // null = same as stroke
    
    // Performance
    minPathLength: 5,            // Ignore paths shorter than this
    batchSize: 5,                // Process N equations at a time
    delay: 10,                   // Delay between batches (ms)
};

// ════════════════════════════════════════════════════════════════════════════════
// DEPENDENCY LOADER
// ════════════════════════════════════════════════════════════════════════════════

let getStroke = null;
let rough = null;
let html2canvas = null;
let depsLoaded = false;

async function loadDependencies() {
    if (depsLoaded) return;
    
    console.log('[HolyGrail] Loading dependencies...');
    
    try {
        // Load Perfect-Freehand
        const pfModule = await import('https://esm.sh/perfect-freehand@1.2.0');
        getStroke = pfModule.getStroke;
        
        // Load Rough.js
        const roughModule = await import('https://esm.sh/roughjs@4.6.6');
        rough = roughModule.default;
        
        // Load html2canvas (check if already loaded)
        if (typeof window.html2canvas === 'undefined') {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        html2canvas = window.html2canvas;
        
        depsLoaded = true;
        console.log('[HolyGrail] Dependencies loaded ✓');
    } catch (e) {
        console.error('[HolyGrail] Failed to load dependencies:', e);
        throw e;
    }
}

// ════════════════════════════════════════════════════════════════════════════════
// ZHANG-SUEN SKELETONIZATION
// ════════════════════════════════════════════════════════════════════════════════

function zhangSuen(binary, W, H) {
    const img = binary.map(r => [...r]);
    const get = (x, y) => (x < 0 || x >= W || y < 0 || y >= H) ? 0 : img[y][x];
    const neighbors = (x, y) => [
        get(x, y-1), get(x+1, y-1), get(x+1, y), get(x+1, y+1),
        get(x, y+1), get(x-1, y+1), get(x-1, y), get(x-1, y-1)
    ];
    const B = n => n.reduce((a, b) => a + b, 0);
    const A = n => {
        let c = 0;
        for (let i = 0; i < 8; i++) if (n[i] === 0 && n[(i+1) % 8] === 1) c++;
        return c;
    };
    
    let changed = true, iter = 0;
    while (changed && iter < 300) {
        changed = false;
        iter++;
        
        const rem1 = [];
        for (let y = 1; y < H-1; y++) {
            for (let x = 1; x < W-1; x++) {
                if (img[y][x] !== 1) continue;
                const n = neighbors(x, y), b = B(n), a = A(n);
                if (b >= 2 && b <= 6 && a === 1 && n[0]*n[2]*n[4] === 0 && n[2]*n[4]*n[6] === 0) {
                    rem1.push([x, y]);
                }
            }
        }
        for (const [x, y] of rem1) { img[y][x] = 0; changed = true; }
        
        const rem2 = [];
        for (let y = 1; y < H-1; y++) {
            for (let x = 1; x < W-1; x++) {
                if (img[y][x] !== 1) continue;
                const n = neighbors(x, y), b = B(n), a = A(n);
                if (b >= 2 && b <= 6 && a === 1 && n[0]*n[2]*n[6] === 0 && n[0]*n[4]*n[6] === 0) {
                    rem2.push([x, y]);
                }
            }
        }
        for (const [x, y] of rem2) { img[y][x] = 0; changed = true; }
    }
    
    return img;
}

// ════════════════════════════════════════════════════════════════════════════════
// PATH EXTRACTION
// ════════════════════════════════════════════════════════════════════════════════

function extractPaths(skeleton, W, H, minLength) {
    const visited = new Set();
    const key = (x, y) => `${x},${y}`;
    const paths = [];
    
    const pixels = [];
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (skeleton[y][x]) pixels.push([x, y]);
        }
    }
    
    if (pixels.length === 0) return [];
    
    const neighborCount = (x, y) => {
        let c = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < W && ny >= 0 && ny < H && skeleton[ny][nx]) c++;
            }
        }
        return c;
    };
    
    const endpoints = pixels.filter(([x, y]) => neighborCount(x, y) === 1);
    const startPoints = endpoints.length > 0 ? endpoints : [pixels[0]];
    
    const trace = (sx, sy) => {
        const path = [];
        let x = sx, y = sy;
        while (true) {
            const k = key(x, y);
            if (visited.has(k)) break;
            visited.add(k);
            path.push([x, y]);
            
            let found = false;
            const dirs = [[0,-1], [1,0], [0,1], [-1,0], [1,-1], [1,1], [-1,1], [-1,-1]];
            for (const [dx, dy] of dirs) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < W && ny >= 0 && ny < H && skeleton[ny][nx] && !visited.has(key(nx, ny))) {
                    x = nx; y = ny; found = true; break;
                }
            }
            if (!found) break;
        }
        return path;
    };
    
    for (const [sx, sy] of startPoints) {
        if (!visited.has(key(sx, sy))) {
            const p = trace(sx, sy);
            if (p.length >= minLength) paths.push(p);
        }
    }
    
    for (const [x, y] of pixels) {
        if (!visited.has(key(x, y))) {
            const p = trace(x, y);
            if (p.length >= minLength) paths.push(p);
        }
    }
    
    return paths;
}

// ════════════════════════════════════════════════════════════════════════════════
// WAVE EFFECT
// ════════════════════════════════════════════════════════════════════════════════

function addWave(points, amount) {
    if (amount === 0) return points;
    return points.map(([x, y, p], i) => {
        const wave1 = Math.sin(i * 0.4) * amount;
        const wave2 = Math.cos(i * 0.3) * amount * 0.7;
        const rand = (Math.random() - 0.5) * amount * 0.5;
        return [x + wave1 + rand, y + wave2 + rand, p];
    });
}

// ════════════════════════════════════════════════════════════════════════════════
// TRANSFORM SINGLE ELEMENT
// ════════════════════════════════════════════════════════════════════════════════

async function transformElement(element, settings = {}) {
    const opts = { ...SETTINGS, ...settings };
    
    // Get element dimensions
    const rect = element.getBoundingClientRect();
    if (rect.width < 5 || rect.height < 5) return null;
    
    // Detect color
    const computedColor = window.getComputedStyle(element).color || '#000000';
    const strokeColor = opts.strokeColor || computedColor;
    const fillColor = opts.fillColor || strokeColor;
    
    // Capture with html2canvas
    let captured;
    try {
        captured = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: opts.scale,
            logging: false,
        });
    } catch (e) {
        console.warn('[HolyGrail] Capture failed:', e);
        return null;
    }
    
    const W = captured.width, H = captured.height;
    if (W < 10 || H < 10) return null;
    
    // Convert to binary
    const ctx = captured.getContext('2d');
    const imgData = ctx.getImageData(0, 0, W, H);
    
    const binary = [];
    for (let y = 0; y < H; y++) {
        binary[y] = [];
        for (let x = 0; x < W; x++) {
            const idx = (y * W + x) * 4;
            const gray = (imgData.data[idx] + imgData.data[idx+1] + imgData.data[idx+2]) / 3;
            binary[y][x] = gray < 128 ? 1 : 0;
        }
    }
    
    // Skeletonize
    const skeleton = zhangSuen(binary, W, H);
    
    // Extract paths
    const paths = extractPaths(skeleton, W, H, opts.minPathLength);
    if (paths.length === 0) return null;
    
    // Create output canvas (same size as original)
    const outCanvas = document.createElement('canvas');
    outCanvas.width = rect.width;
    outCanvas.height = rect.height;
    const outCtx = outCanvas.getContext('2d');
    outCtx.fillStyle = 'transparent';
    outCtx.clearRect(0, 0, rect.width, rect.height);
    
    // Scale factors
    const sx = rect.width / W;
    const sy = rect.height / H;
    
    // Scale paths
    const scaledPaths = paths.map(p => p.map(([x, y]) => [x * sx, y * sy]));
    
    // Create rough.js canvas
    const rc = rough.canvas(outCanvas);
    
    // Process each path
    for (const path of scaledPaths) {
        if (path.length < 3) continue;
        
        // Add pressure
        let pts = path.map(([x, y], i) => {
            const t = i / path.length;
            const pressure = 0.3 + Math.sin(t * Math.PI) * 0.5;
            return [x, y, pressure];
        });
        
        // Add wave
        pts = addWave(pts, opts.waveAmount);
        
        try {
            // Get Perfect-Freehand stroke
            const stroke = getStroke(pts, {
                size: opts.strokeSize * 1.8,
                thinning: opts.thinning,
                smoothing: opts.smoothing,
                streamline: opts.streamline,
                simulatePressure: true,
                last: true,
            });
            
            if (stroke.length > 2) {
                // Draw with Rough.js
                const polyPoints = stroke.map(([x, y]) => [x, y]);
                rc.polygon(polyPoints, {
                    roughness: opts.roughness * 0.8,
                    bowing: opts.bowing * 0.6,
                    strokeWidth: 1,
                    stroke: strokeColor,
                    fill: fillColor,
                    fillStyle: 'solid',
                });
            }
        } catch (e) {
            // Fallback: simple line
            for (let i = 0; i < path.length - 1; i++) {
                rc.line(path[i][0], path[i][1], path[i+1][0], path[i+1][1], {
                    roughness: opts.roughness,
                    bowing: opts.bowing,
                    strokeWidth: opts.strokeSize,
                    stroke: strokeColor,
                });
            }
        }
    }
    
    return outCanvas;
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN TRANSFORM FUNCTION
// ════════════════════════════════════════════════════════════════════════════════

async function transform(container = document.body, settings = {}) {
    await loadDependencies();
    
    const opts = { ...SETTINGS, ...settings };
    
    // Find all KaTeX elements
    const katexElements = container.querySelectorAll('.katex');
    
    if (katexElements.length === 0) {
        console.log('[HolyGrail] No KaTeX elements found');
        return { processed: 0, failed: 0 };
    }
    
    console.log(`[HolyGrail] Found ${katexElements.length} KaTeX elements`);
    
    let processed = 0;
    let failed = 0;
    
    // Process in batches
    for (let i = 0; i < katexElements.length; i += opts.batchSize) {
        const batch = Array.from(katexElements).slice(i, i + opts.batchSize);
        
        await Promise.all(batch.map(async (element) => {
            try {
                const canvas = await transformElement(element, opts);
                
                if (canvas) {
                    // Create wrapper
                    const wrapper = document.createElement('span');
                    wrapper.className = 'holy-grail-transformed';
                    wrapper.style.cssText = 'display:inline-block;position:relative;';
                    
                    // Style canvas
                    canvas.style.cssText = 'display:block;';
                    
                    // Replace element
                    element.style.visibility = 'hidden';
                    element.style.position = 'absolute';
                    
                    wrapper.appendChild(canvas);
                    element.parentNode.insertBefore(wrapper, element);
                    wrapper.appendChild(element);
                    
                    processed++;
                } else {
                    failed++;
                }
            } catch (e) {
                console.warn('[HolyGrail] Transform failed:', e);
                failed++;
            }
        }));
        
        // Small delay between batches
        if (i + opts.batchSize < katexElements.length) {
            await new Promise(r => setTimeout(r, opts.delay));
        }
    }
    
    console.log(`[HolyGrail] Done! Processed: ${processed}, Failed: ${failed}`);
    return { processed, failed };
}

// ════════════════════════════════════════════════════════════════════════════════
// REVERT FUNCTION
// ════════════════════════════════════════════════════════════════════════════════

function revert(container = document.body) {
    const wrappers = container.querySelectorAll('.holy-grail-transformed');
    
    wrappers.forEach(wrapper => {
        const katex = wrapper.querySelector('.katex');
        if (katex) {
            katex.style.visibility = '';
            katex.style.position = '';
            wrapper.parentNode.insertBefore(katex, wrapper);
        }
        wrapper.remove();
    });
    
    console.log(`[HolyGrail] Reverted ${wrappers.length} elements`);
}

// ════════════════════════════════════════════════════════════════════════════════
// AUTO-INIT (Optional)
// ════════════════════════════════════════════════════════════════════════════════

function autoInit() {
    // Check for data attribute
    if (document.querySelector('[data-holy-grail-auto]')) {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => transform(), 500);
        });
    }
}

// Run auto-init check
autoInit();

// ════════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════════════════

export const holyGrail = {
    transform,
    transformElement,
    revert,
    loadDependencies,
    SETTINGS,
};

export default holyGrail;
