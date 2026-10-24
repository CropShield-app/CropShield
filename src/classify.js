import * as tf from '@tensorflow/tfjs';

// Model files live in public/model/: model.json, every group1-shard...bin, labels.json, model_info.json.
let cache = null;
let lastError = '';

// Used only if model_info.json is missing. 'minus1to1' matches the training notebook.
const PIXEL_SCALE = 'minus1to1';
function scalePixels(x, mode) {
  if (mode === 'raw') return x;
  if (mode === 'zero_to_one') return x.div(255);
  return x.div(127.5).sub(1);
}

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ' returned ' + r.status);
  if ((r.headers.get('content-type') || '').includes('text/html')) {
    throw new Error(url + ' is missing (the server sent a web page instead of the file)');
  }
  return r.json();
}

async function loadModel() {
  if (cache) return cache;
  try {
    const base = import.meta.env.BASE_URL + 'model/';
    const labels = await getJson(base + 'labels.json');
    const info = await getJson(base + 'model.json');
    // Keras models are "layers" models. TensorFlow SavedModel conversions are "graph" models.
    const model = info.format === 'graph-model'
      ? await tf.loadGraphModel(base + 'model.json')
      : await tf.loadLayersModel(base + 'model.json');
    let scale = PIXEL_SCALE;
    try {
      const mi = await getJson(base + 'model_info.json');
      if (mi.pixelScale) scale = mi.pixelScale;
    } catch (e) {}
    lastError = '';
    cache = { model, labels, scale };
    return cache;
  } catch (e) {
    lastError = String((e && e.message) || e);
    console.error('CropShield: the model did not load:', e);
    return { model: null, labels: [], scale: PIXEL_SCALE }; // not remembered, so the next scan tries again
  }
}

export async function modelStatus() {
  const m = await loadModel();
  return { ok: !!m.model, error: lastError, labels: m.labels, scale: m.scale };
}

// Draw the photo, video picture or canvas onto a clean square, the same way the training notebook shrank photos.
// (Reading pixels straight from an <img> can use its on-screen size, which would squash the picture differently.)
function toSquare(el, size) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(el, 0, 0, size, size);
  return c;
}

// Returns { label, confidence, top: [{label, confidence} x3] } or { demo: true, error }
export async function classify(el) {
  const { model, labels, scale } = await loadModel();
  if (!model) return { demo: true, error: lastError };

  const wanted = model.inputs[0].shape[1];
  const size = wanted > 0 ? wanted : 224;
  const canvas = toSquare(el, size);
  const out = tf.tidy(() => {
    const x = scalePixels(tf.browser.fromPixels(canvas).toFloat(), scale).expandDims(0);
    const y = model.predict(x);
    return Array.isArray(y) ? y[0] : y;
  });
  const probs = await out.data();
  out.dispose();

  if (probs.length !== labels.length) {
    return { demo: true, error: 'labels.json has ' + labels.length + ' names but the model gives ' + probs.length + ' answers' };
  }
  const order = Array.from(probs.keys()).sort((a, b) => probs[b] - probs[a]);
  const top = order.slice(0, 3).map((i) => ({ label: labels[i], confidence: probs[i] }));
  return { label: top[0].label, confidence: top[0].confidence, top };
}