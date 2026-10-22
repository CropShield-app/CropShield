import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../db.js';

const SIZE = 5;
const TOTAL = SIZE * SIZE;
const MARK = ['', 'L', 'H']; // empty, low weeds, heavy weeds

// The field is split into squares. Tap a square to mark weeds. Spray only the marked squares.
export default function FieldGrid() {
  const { t } = useTranslation();
  const [cells, setCells] = useState(Array(TOTAL).fill(0));

  useEffect(() => { db.grid.get(1).then((g) => g && setCells(g.cells)); }, []);

  function save(next) {
    setCells(next);
    db.grid.put({ id: 1, cells: next });
  }
  const tap = (i) => save(cells.map((v, j) => (j === i ? (v + 1) % 3 : v)));

  const n = cells.filter((v) => v > 0).length;
  const percent = Math.round((1 - n / TOTAL) * 100);

  return (
    <section className="card">
      <p className="lbl">{t('grid.title')}</p>
      <p className="lbl">{t('grid.hint')}</p>
      <div className="grid">
        {cells.map((v, i) => (
          <button key={i} className={'sq lv' + v} onClick={() => tap(i)}
            aria-label={'Square ' + (i + 1) + ' ' + (MARK[v] || '-')}>{MARK[v]}</button>
        ))}
      </div>
      <p><b>{t('grid.summary', { n, total: TOTAL, percent })}</b></p>
      <button className="chip small" onClick={() => save(Array(TOTAL).fill(0))}>{t('grid.clear')}</button>
    </section>
  );
}
