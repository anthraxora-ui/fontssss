/**
 * HandwrittenKaTeX - Makes KaTeX geometry look hand-drawn
 * 
 * USAGE:
 * 1. Include Rough.js: <script src="https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.min.js"></script>
 * 2. Include this file after KaTeX
 * 3. After rendering KaTeX, call:
 *    const hwk = new HandwrittenKaTeX();
 *    hwk.processContainer(document.body); // or specific container
 * 
 * @author Claude (for Moon's tutoring web app)
 * @requires rough.js
 */

class HandwrittenKaTeX {
  constructor(options = {}) {
    this.options = {
      roughness: 1.5,        // How rough/sketchy (0-3)
      bowing: 1,             // How much lines curve (0-2)
      stroke: 'currentColor', // Use same color as text
      strokeWidth: 1.2,      // Line thickness
      seed: null,            // Set for consistent randomness, null for variation each time
      ...options
    };
    
    // Check if rough.js is available
    if (typeof rough === 'undefined') {
      console.error('HandwrittenKaTeX requires rough.js. Please include it before this script.');
    }
  }

  /**
   * Process all KaTeX elements in a container
   * Call this after KaTeX has rendered
   * @param {HTMLElement} container - The container with KaTeX elements
   */
  processContainer(container = document.body) {
    if (typeof rough === 'undefined') {
      console.error('rough.js not found');
      return;
    }
    
    // Wait for fonts and layout to settle
    requestAnimationFrame(() => {
      this.replaceFractionLines(container);
      this.replaceLines(container);
      this.replaceSqrtSVGs(container);
      this.replaceArrowSVGs(container);
      this.replaceDelimiterSVGs(container);
    });
  }

  /**
   * Replace CSS-drawn fraction lines with hand-drawn SVGs
   */
  replaceFractionLines(container) {
    const fracLines = container.querySelectorAll('.katex .frac-line');
    
    fracLines.forEach(line => {
      // Skip if already processed
      if (line.dataset.handwritten) return;
      line.dataset.handwritten = 'true';
      
      const rect = line.getBoundingClientRect();
      const width = rect.width || parseFloat(getComputedStyle(line).width) || 50;
      const height = Math.max(rect.height, 2);
      
      if (width < 2) return;
      
      // Get computed color
      const color = getComputedStyle(line).borderBottomColor || getComputedStyle(line).color || '#000';
      
      // Create SVG replacement
      const svg = this.createHandDrawnLine(width, height, color);
      
      // Style to match original positioning
      svg.style.position = 'absolute';
      svg.style.top = '-2px';
      svg.style.left = '0';
      svg.style.width = width + 'px';
      svg.style.height = (height + 4) + 'px';
      svg.style.overflow = 'visible';
      svg.style.pointerEvents = 'none';
      
      // Hide original border, insert SVG
      line.style.borderBottom = 'none';
      line.style.position = 'relative';
      line.appendChild(svg);
    });
  }

  /**
   * Replace overlines, underlines, and horizontal lines
   */
  replaceLines(container) {
    const selectors = [
      '.katex .overline-line',
      '.katex .underline-line',
      '.katex .hline',
      '.katex .hdashline',
      '.katex .sout' // strikethrough
    ];
    
    selectors.forEach(selector => {
      const lines = container.querySelectorAll(selector);
      lines.forEach(line => {
        if (line.dataset.handwritten) return;
        line.dataset.handwritten = 'true';
        
        const rect = line.getBoundingClientRect();
        const width = rect.width || parseFloat(getComputedStyle(line).width) || 50;
        
        if (width < 2) return;
        
        const color = getComputedStyle(line).borderBottomColor || getComputedStyle(line).color || '#000';
        const svg = this.createHandDrawnLine(width, 4, color);
        
        svg.style.position = 'absolute';
        svg.style.top = '-2px';
        svg.style.left = '0';
        svg.style.width = width + 'px';
        svg.style.height = '6px';
        svg.style.overflow = 'visible';
        svg.style.pointerEvents = 'none';
        
        line.style.borderBottom = 'none';
        line.style.position = 'relative';
        line.appendChild(svg);
      });
    });
  }

  /**
   * Create a hand-drawn horizontal line SVG
   */
  createHandDrawnLine(width, height, color = 'currentColor') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const svgHeight = height + 4;
    svg.setAttribute('width', width);
    svg.setAttribute('height', svgHeight);
    svg.setAttribute('viewBox', `0 0 ${width} ${svgHeight}`);
    svg.style.overflow = 'visible';
    
    const rc = rough.svg(svg);
    const y = svgHeight / 2;
    
    const lineEl = rc.line(0, y, width, y, {
      roughness: this.options.roughness,
      bowing: this.options.bowing,
      stroke: color === 'currentColor' ? this.options.stroke : color,
      strokeWidth: this.options.strokeWidth,
      seed: this.options.seed
    });
    
    svg.appendChild(lineEl);
    return svg;
  }

  /**
   * Replace square root SVGs with hand-drawn versions
   */
  replaceSqrtSVGs(container) {
    const sqrtContainers = container.querySelectorAll('.katex .sqrt');
    
    sqrtContainers.forEach(sqrtEl => {
      const svgs = sqrtEl.querySelectorAll(':scope > svg, :scope > .sqrt-line svg');
      
      svgs.forEach(originalSvg => {
        if (originalSvg.dataset.handwritten) return;
        
        const rect = originalSvg.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        if (width < 5 || height < 5) return;
        
        // Get color from parent
        const color = getComputedStyle(sqrtEl).color || '#000';
        
        // Create new hand-drawn sqrt
        const newSvg = this.createHandDrawnSqrt(width, height, color);
        
        // Copy positioning attributes
        newSvg.style.cssText = originalSvg.style.cssText;
        if (originalSvg.getAttribute('class')) {
          newSvg.setAttribute('class', originalSvg.getAttribute('class'));
        }
        newSvg.dataset.handwritten = 'true';
        
        // Replace
        if (originalSvg.parentNode) {
          originalSvg.parentNode.replaceChild(newSvg, originalSvg);
        }
      });
    });
  }

  /**
   * Create a hand-drawn square root symbol
   */
  createHandDrawnSqrt(width, height, color = '#000') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.overflow = 'visible';
    svg.setAttribute('preserveAspectRatio', 'none');
    
    const rc = rough.svg(svg);
    
    // Calculate proportions for the sqrt symbol
    const hookWidth = Math.max(width * 0.05, 8);
    const surdWidth = Math.max(width * 0.08, 12);
    const vinculumStart = hookWidth + surdWidth;
    const topPad = height * 0.05;
    
    // Draw the surd (the √ part) - the checkmark shape
    const surdPath = rc.path(
      `M ${hookWidth * 0.3} ${height * 0.65} 
       L ${hookWidth} ${height * 0.55}
       L ${vinculumStart - 2} ${height * 0.92}
       L ${vinculumStart} ${topPad + 2}`,
      {
        roughness: this.options.roughness * 0.8,
        bowing: this.options.bowing * 0.8,
        stroke: color,
        strokeWidth: this.options.strokeWidth * 1.3,
        seed: this.options.seed
      }
    );
    
    // Draw the vinculum (the top horizontal line extending right)
    const vinculum = rc.line(
      vinculumStart, topPad + 2,
      width - 1, topPad + 2,
      {
        roughness: this.options.roughness,
        bowing: this.options.bowing * 0.4,
        stroke: color,
        strokeWidth: this.options.strokeWidth,
        seed: this.options.seed ? this.options.seed + 1 : null
      }
    );
    
    svg.appendChild(surdPath);
    svg.appendChild(vinculum);
    
    return svg;
  }

  /**
   * Replace extensible arrow SVGs with hand-drawn versions
   */
  replaceArrowSVGs(container) {
    const arrowContainers = container.querySelectorAll('.katex .stretchy, .katex .x-arrow, .katex .mover svg, .katex .munder svg');
    
    arrowContainers.forEach(el => {
      const svgs = el.tagName === 'svg' ? [el] : el.querySelectorAll('svg');
      
      svgs.forEach(originalSvg => {
        if (originalSvg.dataset.handwritten) return;
        
        const rect = originalSvg.getBoundingClientRect();
        if (rect.width < 8 || rect.height < 3) return;
        
        const color = getComputedStyle(originalSvg.closest('.katex') || originalSvg).color || '#000';
        const arrowType = this.detectArrowType(originalSvg);
        
        if (!arrowType) return;
        
        const newSvg = this.createHandDrawnArrow(rect.width, rect.height, arrowType, color);
        
        newSvg.style.cssText = originalSvg.style.cssText;
        newSvg.dataset.handwritten = 'true';
        
        if (originalSvg.parentNode) {
          originalSvg.parentNode.replaceChild(newSvg, originalSvg);
        }
      });
    });
  }

  /**
   * Detect what type of arrow this is based on path data
   */
  detectArrowType(svg) {
    const paths = svg.querySelectorAll('path');
    let d = '';
    paths.forEach(p => d += ' ' + (p.getAttribute('d') || ''));
    
    // Check for common arrow patterns
    if (d.includes('doubleleftarrow') || d.includes('21D0')) return 'doubleleft';
    if (d.includes('doublerightarrow') || d.includes('21D2')) return 'doubleright';
    if (d.includes('leftarrow') || d.includes('2190') || d.includes('leftwardTeXArrow')) return 'left';
    if (d.includes('rightarrow') || d.includes('2192') || d.includes('rightwardTeXArrow')) return 'right';
    if (d.includes('leftrightarrow') || d.includes('2194')) return 'both';
    if (d.includes('Rightarrow') || d.includes('21D2')) return 'doubleright';
    if (d.includes('Leftarrow') || d.includes('21D0')) return 'doubleleft';
    
    // Check viewBox for horizontal arrows
    const viewBox = svg.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(' ').map(Number);
      if (parts[2] > parts[3] * 3) {
        // Wide and short = horizontal arrow
        return 'right';
      }
    }
    
    return null;
  }

  /**
   * Create a hand-drawn arrow
   */
  createHandDrawnArrow(width, height, type = 'right', color = '#000') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.overflow = 'visible';
    
    const rc = rough.svg(svg);
    const midY = height / 2;
    const arrowSize = Math.min(height * 0.35, 6);
    const padding = arrowSize + 3;
    
    const isDouble = type.includes('double');
    const hasLeft = type === 'left' || type === 'both' || type === 'doubleleft';
    const hasRight = type === 'right' || type === 'both' || type === 'doubleright';
    
    // Main line(s)
    const lineStart = hasLeft ? padding : 2;
    const lineEnd = hasRight ? width - padding : width - 2;
    
    if (isDouble) {
      // Double line arrow
      const gap = 2;
      const line1 = rc.line(lineStart, midY - gap, lineEnd, midY - gap, {
        roughness: this.options.roughness * 0.8,
        bowing: this.options.bowing * 0.3,
        stroke: color,
        strokeWidth: this.options.strokeWidth * 0.8,
        seed: this.options.seed
      });
      const line2 = rc.line(lineStart, midY + gap, lineEnd, midY + gap, {
        roughness: this.options.roughness * 0.8,
        bowing: this.options.bowing * 0.3,
        stroke: color,
        strokeWidth: this.options.strokeWidth * 0.8,
        seed: this.options.seed ? this.options.seed + 1 : null
      });
      svg.appendChild(line1);
      svg.appendChild(line2);
    } else {
      // Single line
      const line = rc.line(lineStart, midY, lineEnd, midY, {
        roughness: this.options.roughness,
        bowing: this.options.bowing * 0.4,
        stroke: color,
        strokeWidth: this.options.strokeWidth,
        seed: this.options.seed
      });
      svg.appendChild(line);
    }
    
    // Arrowheads
    const drawArrowhead = (x, direction) => {
      const dx = direction * arrowSize;
      const head = rc.path(
        `M ${x} ${midY} L ${x - dx} ${midY - arrowSize} M ${x} ${midY} L ${x - dx} ${midY + arrowSize}`,
        {
          roughness: this.options.roughness * 0.6,
          stroke: color,
          strokeWidth: this.options.strokeWidth,
          fill: 'none',
          seed: this.options.seed ? this.options.seed + 2 : null
        }
      );
      svg.appendChild(head);
    };
    
    if (hasRight) {
      drawArrowhead(width - 2, 1);
    }
    if (hasLeft) {
      drawArrowhead(2, -1);
    }
    
    return svg;
  }

  /**
   * Replace large delimiter SVGs (tall brackets, braces, parens)
   */
  replaceDelimiterSVGs(container) {
    const delimiters = container.querySelectorAll('.katex .delimsizing svg');
    
    delimiters.forEach(originalSvg => {
      if (originalSvg.dataset.handwritten) return;
      
      const rect = originalSvg.getBoundingClientRect();
      if (rect.height < 15) return;
      
      const color = getComputedStyle(originalSvg.closest('.katex') || originalSvg).color || '#000';
      const type = this.detectDelimiterType(originalSvg);
      
      if (!type) return;
      
      const newSvg = this.createHandDrawnDelimiter(rect.width, rect.height, type, color);
      
      if (newSvg) {
        newSvg.style.cssText = originalSvg.style.cssText;
        newSvg.dataset.handwritten = 'true';
        
        if (originalSvg.parentNode) {
          originalSvg.parentNode.replaceChild(newSvg, originalSvg);
        }
      }
    });
  }

  /**
   * Detect delimiter type from SVG path
   */
  detectDelimiterType(svg) {
    const paths = svg.querySelectorAll('path');
    let d = '';
    paths.forEach(p => d += ' ' + (p.getAttribute('d') || ''));
    
    // Check path patterns (these are from KaTeX's svgGeometry.js)
    if (d.includes('M145') && d.includes('c-.7')) return 'leftparen';
    if (d.includes('M76') || (d.includes('Q') && d.includes('58'))) return 'leftparen';
    if (d.includes('M30')) return 'rightparen';
    if (d.includes('M319') || d.includes('M247')) return 'leftbracket';
    if (d.includes('M263') || d.includes('M347')) return 'rightbracket';
    if (d.includes('M236') && d.includes('c-2')) return 'leftbrace';
    if (d.includes('M229')) return 'leftbrace';
    if (d.includes('M200') || d.includes('rightbrace')) return 'rightbrace';
    
    // Fallback based on rough shape analysis
    const viewBox = svg.getAttribute('viewBox');
    if (viewBox) {
      const [, , vbWidth] = viewBox.split(' ').map(Number);
      if (vbWidth < 400) return 'leftparen'; // narrow = parenthesis
    }
    
    return null;
  }

  /**
   * Create a hand-drawn delimiter (bracket, brace, or parenthesis)
   */
  createHandDrawnDelimiter(width, height, type, color = '#000') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.overflow = 'visible';
    
    const rc = rough.svg(svg);
    const midX = width / 2;
    const pad = 3;
    
    let path;
    const opts = {
      roughness: this.options.roughness,
      bowing: this.options.bowing,
      stroke: color,
      strokeWidth: this.options.strokeWidth,
      fill: 'none'
    };
    
    switch (type) {
      case 'leftparen':
        path = rc.path(
          `M ${width - pad} ${pad} 
           C ${pad} ${height * 0.25}, ${pad} ${height * 0.75}, ${width - pad} ${height - pad}`,
          opts
        );
        break;
        
      case 'rightparen':
        path = rc.path(
          `M ${pad} ${pad} 
           C ${width - pad} ${height * 0.25}, ${width - pad} ${height * 0.75}, ${pad} ${height - pad}`,
          opts
        );
        break;
        
      case 'leftbracket':
        path = rc.path(
          `M ${width - pad} ${pad} 
           L ${pad + 2} ${pad} 
           L ${pad + 2} ${height - pad} 
           L ${width - pad} ${height - pad}`,
          opts
        );
        break;
        
      case 'rightbracket':
        path = rc.path(
          `M ${pad} ${pad} 
           L ${width - pad - 2} ${pad} 
           L ${width - pad - 2} ${height - pad} 
           L ${pad} ${height - pad}`,
          opts
        );
        break;
        
      case 'leftbrace':
        path = rc.path(
          `M ${width - pad} ${pad} 
           C ${midX} ${pad}, ${midX} ${height * 0.35}, ${midX} ${height * 0.4}
           C ${midX} ${height * 0.45}, ${pad} ${height * 0.48}, ${pad} ${height / 2}
           C ${pad} ${height * 0.52}, ${midX} ${height * 0.55}, ${midX} ${height * 0.6}
           C ${midX} ${height * 0.65}, ${midX} ${height - pad}, ${width - pad} ${height - pad}`,
          opts
        );
        break;
        
      case 'rightbrace':
        path = rc.path(
          `M ${pad} ${pad} 
           C ${midX} ${pad}, ${midX} ${height * 0.35}, ${midX} ${height * 0.4}
           C ${midX} ${height * 0.45}, ${width - pad} ${height * 0.48}, ${width - pad} ${height / 2}
           C ${width - pad} ${height * 0.52}, ${midX} ${height * 0.55}, ${midX} ${height * 0.6}
           C ${midX} ${height * 0.65}, ${midX} ${height - pad}, ${pad} ${height - pad}`,
          opts
        );
        break;
        
      default:
        return null;
    }
    
    if (path) svg.appendChild(path);
    return svg;
  }
}

// Auto-export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HandwrittenKaTeX;
}
if (typeof window !== 'undefined') {
  window.HandwrittenKaTeX = HandwrittenKaTeX;
}
