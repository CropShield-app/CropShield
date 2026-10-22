import * as tf from '@tensorflow/tfjs';

// Person 1 puts model.json, the .bin file(s) and labels.json in public/model/.
let cache = null;

async function loadModel() {
  if (cache) return cache;
  try {
    const base = import.meta.env.BASE_URL + 'model/';
    const labels = await (await fetch(base + 'labels.json')).json();
    const model = await tf.loadLayersModel(base + 'model.json');
    cache = { model, labels };
  } catch (e) {
    cache = { model: null, labels: [] }; // no model yet: demo mode
  }
  return cache;
}

// imgEl is the <img> element shown on screen. Returns { label, confidence } or { demo: true }.
export async function classify(imgEl) {
  const { model, labels } = await loadModel();
  if (!model) return { demo: true };

  const size = model.inputs[0].shape[1] || 224;
  const out = tf.tidy(() => {
    // Scales pixels to -1..1 (what MobileNet and Teachable Machine expect).
    // Person 1: this MUST match how the model was trained.
    const x = tf.browser.fromPixels(imgEl).resizeBilinear([size, size]).toFloat().div(127.5).sub(1).expandDims(0);
    return model.predict(x);
  });
  const probs = await out.data();
  out.dispose();

  let best = 0;
  probs.forEach((p, i) => { if (p > probs[best]) best = i; });
  return { label: labels[best], confidence: probs[best] };
}
