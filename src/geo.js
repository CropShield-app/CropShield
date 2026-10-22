// GPS works with no internet. This waits a few seconds and keeps the most accurate reading.
export function getFix(ms = 4000) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('no-gps'));
    let best = null;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        if (!best || p.coords.accuracy < best.accuracy) {
          best = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
        }
      },
      (e) => { navigator.geolocation.clearWatch(id); reject(e); },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
    const finish = () => {
      navigator.geolocation.clearWatch(id);
      best ? resolve(best) : reject(new Error('no-fix'));
    };
    setTimeout(() => (best ? finish() : setTimeout(finish, 8000)), ms);
  });
}

// Area of a field from its corner points (in order around the edge), in square metres.
export function areaSqM(points) {
  if (points.length < 3) return 0;
  const lat0 = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng0 = points.reduce((s, p) => s + p.lng, 0) / points.length;
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180); // metres per degree of longitude here
  const ky = 110540;                                    // metres per degree of latitude
  const xy = points.map((p) => [(p.lng - lng0) * kx, (p.lat - lat0) * ky]);
  let sum = 0;
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i];
    const [x2, y2] = xy[(i + 1) % xy.length];
    sum += x1 * y2 - x2 * y1; // the "shoelace" formula
  }
  return Math.abs(sum) / 2;
}

export const toAcres = (sqm) => sqm / 4046.856;
