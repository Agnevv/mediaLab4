'use strict';

const video = document.querySelector('#video');
const fxCanvas = document.querySelector('#fxCanvas');
const workCanvas = document.querySelector('#workCanvas');

const filterSelect = document.querySelector('#filter');
const snapshotButton = document.querySelector('#snapshot');
const clearShotsBtn = document.querySelector('#clearShots');

const sobelControl = document.querySelector('#sobelControl');
const thresholdSlider = document.querySelector('#threshold');
const thresholdValue = document.querySelector('#thresholdValue');

const shotsGrid = document.querySelector('#shotsGrid');
const shotCountEl = document.querySelector('#shotCount');

const fxCtx = fxCanvas.getContext('2d', { willReadFrequently: true });
const workCtx = workCanvas.getContext('2d', { willReadFrequently: true });

let sobelEnabled = false;
let sobelThreshold = Number(thresholdSlider.value);

thresholdValue.textContent = String(sobelThreshold);

// expose for console
window.video = video;
window.stream = null;

thresholdSlider.addEventListener('input', () => {
  sobelThreshold = Number(thresholdSlider.value);
  thresholdValue.textContent = String(sobelThreshold);
});

filterSelect.addEventListener('change', () => {
  const f = filterSelect.value;

  if (f === 'sobel') {
    sobelEnabled = true;
    video.style.display = 'none';
    fxCanvas.style.display = 'block';
    sobelControl.style.display = 'block';
  } else {
    sobelEnabled = false;
    fxCanvas.style.display = 'none';
    video.style.display = 'block';
    sobelControl.style.display = 'none';
    video.className = f; // CSS filter class
  }
});

snapshotButton.addEventListener('click', () => addSnapshot());

clearShotsBtn.addEventListener('click', () => {
  shotsGrid.innerHTML = '';
  updateShotCount();
});

const constraints = { audio: false, video: true };

navigator.mediaDevices.getUserMedia(constraints)
  .then((stream) => {
    window.stream = stream;
    video.srcObject = stream;
    video.play();
    requestAnimationFrame(tick);
  })
  .catch((err) => console.error('getUserMedia error:', err.name, err.message));

function tick() {
  if (sobelEnabled && video.readyState >= 2) {
    const w = fxCanvas.width;
    const h = fxCanvas.height;

    workCtx.drawImage(video, 0, 0, w, h);
    const frame = workCtx.getImageData(0, 0, w, h);
    const out = SobelEdge.apply(frame, sobelThreshold);
    fxCtx.putImageData(out, 0, 0);
  }

  requestAnimationFrame(tick);
}

function addSnapshot() {
  const thumb = document.createElement('canvas');
  thumb.width = 480;
  thumb.height = 360;

  const ctx = thumb.getContext('2d');

  if (sobelEnabled) {
    ctx.drawImage(fxCanvas, 0, 0, thumb.width, thumb.height);
  } else {
    const f = filterSelect.value;
    ctx.filter = cssFilterToCanvasFilter(f);
    ctx.drawImage(video, 0, 0, thumb.width, thumb.height);
    ctx.filter = 'none';
  }

  const card = document.createElement('div');
  card.className = 'shot';

  const meta = document.createElement('div');
  meta.className = 'shotMeta';

  const left = document.createElement('span');
  left.textContent = sobelEnabled ? `Sobel (T=${sobelThreshold})` : `CSS: ${filterSelect.value}`;

  const right = document.createElement('span');
  right.textContent = new Date().toLocaleTimeString();

  meta.appendChild(left);
  meta.appendChild(right);

  card.appendChild(thumb);
  card.appendChild(meta);

  shotsGrid.prepend(card);
  updateShotCount();
}

function updateShotCount() {
  shotCountEl.textContent = String(shotsGrid.children.length);
}

function cssFilterToCanvasFilter(name) {
  switch (name) {
    case 'blur': return 'blur(3px)';
    case 'grayscale': return 'grayscale(100%)';
    case 'invert': return 'invert(100%)';
    case 'sepia': return 'sepia(100%)';
    default: return 'none';
  }
}
