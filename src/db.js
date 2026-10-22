import Dexie from 'dexie';

// Everything is saved on the phone (IndexedDB), so nothing needs the internet.
export const db = new Dexie('cropshield');
db.version(1).stores({
  scans: '++id,label,time',
  farm: 'id',
  grid: 'id',
  packs: 'code'
});
db.version(2).stores({
  scans: '++id,label,time',
  farm: 'id',
  grid: 'id',
  packs: 'code',
  jobs: '++id,date,mine', // labor jobs: mine = 1 (I posted it) or 0 (I received it)
  weather: 'id'           // the last forecast we saved
});
