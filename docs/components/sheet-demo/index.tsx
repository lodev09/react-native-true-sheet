'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const DETENTS = ['auto', 0.5, 1] as const;
const HEIGHTS = ['31%', '56%', '93%'];
const DIMS = [0, 0.28, 0.5];
const CYCLE_MS = 2800;
const RESUME_MS = 9000;

const PLACES = [
  { name: 'Ristretto Coffee', kind: 'Cafe', dist: '0.2 mi', hue: 214 },
  { name: 'Union Square Park', kind: 'Park', dist: '0.4 mi', hue: 150 },
  { name: 'Harbor Ferry', kind: 'Transit', dist: '0.6 mi', hue: 30 },
  { name: 'The Bookshop', kind: 'Books', dist: '0.7 mi', hue: 270 },
  { name: 'Night Market', kind: 'Food', dist: '1.1 mi', hue: 350 },
  { name: 'Bikes & Beans', kind: 'Rental', dist: '1.3 mi', hue: 190 },
];

type Log = { id: number; text: string };

export default function SheetDemo(): React.ReactElement {
  const [index, setIndex] = useState(0);
  const [presented, setPresented] = useState(false);
  const [log, setLog] = useState<Log>({ id: 0, text: 'await sheet.current?.present()' });
  const pausedUntil = useRef(0);
  const reduced = useRef(false);

  const emit = useCallback((text: string) => {
    setLog((prev) => ({ id: prev.id + 1, text }));
  }, []);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => {
      setPresented(true);
      emit('onDidPresent({ index: 0, detent: "auto" })');
    }, 600);
    return () => clearTimeout(t);
  }, [emit]);

  useEffect(() => {
    if (!presented || reduced.current) return;
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      setIndex((i) => {
        const next = (i + 1) % DETENTS.length;
        emit(`onDetentChange({ index: ${next}, detent: ${JSON.stringify(DETENTS[next])} })`);
        return next;
      });
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [presented, emit]);

  const jumpTo = (i: number) => {
    pausedUntil.current = Date.now() + RESUME_MS;
    if (!presented) {
      setPresented(true);
      setIndex(i);
      emit(`onDidPresent({ index: ${i}, detent: ${JSON.stringify(DETENTS[i])} })`);
      return;
    }
    if (i === index) return;
    setIndex(i);
    emit(`await sheet.current?.resize(${i})`);
  };

  const dismiss = () => {
    if (!presented) return;
    pausedUntil.current = Date.now() + RESUME_MS;
    setPresented(false);
    emit('onDidDismiss()');
    setTimeout(() => {
      setPresented(true);
      setIndex(0);
      emit('onDidPresent({ index: 0, detent: "auto" })');
    }, 1800);
  };

  return (
    <div className={styles.stage}>
      <div className={styles.phone} aria-hidden="true">
        <div className={styles.screen}>
          <div className={styles.statusBar}>
            <span>9:41</span>
            <span className={styles.statusIcons}>
              <i /> <i /> <b />
            </span>
          </div>

          <svg
            className={styles.map}
            viewBox="0 0 280 600"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
          >
            <g className={styles.mapBlocks}>
              <rect x="-20" y="40" width="120" height="90" rx="10" />
              <rect x="130" y="20" width="180" height="110" rx="10" />
              <rect x="-20" y="170" width="150" height="120" rx="10" />
              <rect x="170" y="170" width="140" height="120" rx="10" />
              <rect x="-20" y="330" width="100" height="140" rx="10" />
              <rect x="120" y="330" width="190" height="80" rx="10" />
              <rect x="120" y="450" width="190" height="180" rx="10" />
              <rect x="-20" y="510" width="100" height="140" rx="10" />
            </g>
            <g className={styles.mapRoads}>
              <path d="M110 -10 C 112 120, 100 240, 120 310 S 150 440, 100 620" />
              <path d="M-10 150 C 60 148, 160 160, 300 150" />
              <path d="M-10 310 C 80 300, 180 320, 300 305" />
              <path d="M-10 480 C 90 470, 200 500, 300 440" />
              <path d="M150 -10 C 160 100, 250 140, 300 160" />
            </g>
            <g className={styles.mapWater}>
              <path d="M200 380 C 240 360, 300 380, 320 420 L 320 640 L 200 640 C 180 560, 170 460, 200 380 Z" />
            </g>
            <g className={styles.pin}>
              <circle cx="138" cy="238" r="18" className={styles.pinHalo} />
              <circle cx="138" cy="238" r="7" />
            </g>
          </svg>

          <div className={styles.searchBar}>
            <span className={styles.searchGlyph} />
            <span>Search here</span>
          </div>

          <button
            type="button"
            tabIndex={-1}
            className={styles.dim}
            style={{ opacity: presented ? DIMS[index] : 0 }}
            onClick={dismiss}
            aria-label="Dismiss sheet"
          />

          <div
            className={styles.sheet}
            data-presented={presented}
            style={{ height: HEIGHTS[index] }}
          >
            <div className={styles.grabber} />
            <div className={styles.sheetHeader}>
              <div>
                <div className={styles.sheetTitle}>Nearby</div>
                <div className={styles.sheetSubtitle}>6 places within 2 miles</div>
              </div>
              <span className={styles.closeGlyph} />
            </div>
            <ul className={styles.list}>
              {PLACES.map((p) => (
                <li key={p.name} className={styles.row}>
                  <span
                    className={styles.rowIcon}
                    style={{ '--hue': p.hue } as React.CSSProperties}
                  />
                  <span className={styles.rowText}>
                    <span className={styles.rowName}>{p.name}</span>
                    <span className={styles.rowKind}>{p.kind}</span>
                  </span>
                  <span className={styles.rowDist}>{p.dist}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <pre className={styles.code}>
          <span className={styles.tag}>{'<TrueSheet'}</span>
          {'\n  '}
          <span className={styles.attr}>ref</span>
          {'={'}
          <span className={styles.ident}>sheet</span>
          {'}'}
          {'\n  '}
          <span className={styles.attr}>detents</span>
          {'={['}
          {DETENTS.map((d, i) => (
            <React.Fragment key={String(d)}>
              {i > 0 && ', '}
              <button
                type="button"
                className={clsx(styles.detent, presented && i === index && styles.detentActive)}
                onClick={() => jumpTo(i)}
                aria-pressed={presented && i === index}
                aria-label={`Resize sheet to detent ${JSON.stringify(d)}`}
              >
                {typeof d === 'string' ? (
                  <span className={styles.str}>{`'${d}'`}</span>
                ) : (
                  <span className={styles.num}>{d}</span>
                )}
              </button>
            </React.Fragment>
          ))}
          {']}'}
          {'\n  '}
          <span className={styles.attr}>cornerRadius</span>
          {'={'}
          <span className={styles.num}>24</span>
          {'}'}
          {'\n  '}
          <span className={styles.attr}>grabber</span>
          {'\n  '}
          <span className={styles.attr}>onDetentChange</span>
          {'={'}
          <span className={styles.ident}>onChange</span>
          {'}'}
          {'\n'}
          <span className={styles.tag}>{'>'}</span>
        </pre>
        <div className={styles.log} aria-live="polite">
          <span key={log.id} className={styles.logLine}>
            {log.text}
          </span>
        </div>
        <p className={styles.hint}>Tap a detent. Tap the dim to dismiss.</p>
      </div>
    </div>
  );
}
