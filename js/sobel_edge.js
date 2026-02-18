'use strict';

/**
 * Custom filter: Sobel Edge + threshold slider
 */
const SobelEdge = (() => {
  function apply(imageData, threshold) {
    const { data, width: w, height: h } = imageData;

    // grayscale buffer
    const gray = new Uint8ClampedArray(w * h);

    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      gray[p] = (0.2126 * r + 0.7152 * g + 0.0722 * b) | 0;
    }

    const out = new ImageData(w, h);
    const o = out.data;

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;

        const tl = gray[idx - w - 1];
        const tc = gray[idx - w];
        const tr = gray[idx - w + 1];
        const ml = gray[idx - 1];
        const mr = gray[idx + 1];
        const bl = gray[idx + w - 1];
        const bc = gray[idx + w];
        const br = gray[idx + w + 1];

        const gx = (-tl + tr) + (-2 * ml + 2 * mr) + (-bl + br);
        const gy = (tl + 2 * tc + tr) + (-bl - 2 * bc - br);

        // magnitude approximation (faster than sqrt)
        const mag = (Math.abs(gx) + Math.abs(gy)) >> 1;
        const v = mag >= threshold ? 255 : 0;

        const oi = idx * 4;
        o[oi] = v;
        o[oi + 1] = v;
        o[oi + 2] = v;
        o[oi + 3] = 255;
      }
    }

    paintBorderBlack(o, w, h);
    return out;
  }

  function paintBorderBlack(o, w, h) {
    for (let x = 0; x < w; x++) {
      setPixel(o, x, 0, w, 0);
      setPixel(o, x, h - 1, w, 0);
    }
    for (let y = 0; y < h; y++) {
      setPixel(o, 0, y, w, 0);
      setPixel(o, w - 1, y, w, 0);
    }
  }

  function setPixel(o, x, y, w, v) {
    const i = (y * w + x) * 4;
    o[i] = v; o[i + 1] = v; o[i + 2] = v; o[i + 3] = 255;
  }

  return { apply };
})();
