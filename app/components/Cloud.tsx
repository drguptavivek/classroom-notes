'use client';
// Full-screen phrase cloud powered by d3-cloud (the standard word-cloud
// layout engine). Each typed response stays one phrase — never split into
// words. Identical phrases (case/punctuation aside) merge and grow with
// repetition; the layout engine guarantees no overlaps.
import { useEffect, useMemo, useRef, useState } from 'react';
import cloud from 'd3-cloud';

export interface CloudItem {
  text: string;
  response: number;
}

interface Phrase {
  display: string;      // first-seen phrasing
  count: number;        // how many students wrote it
  responses: number[];
}

interface Word {
  text: string;
  size: number;
  count: number;
  responses: number[];
  x?: number;
  y?: number;
  rotate?: number;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
}

function mergePhrases(items: CloudItem[]): Phrase[] {
  const byPhrase = new Map<string, Phrase>();
  for (const it of items) {
    const key = normalize(it.text);
    if (!key) continue;
    const found = byPhrase.get(key);
    if (found) {
      found.count++;
      if (!found.responses.includes(it.response)) found.responses.push(it.response);
    } else {
      byPhrase.set(key, { display: it.text, count: 1, responses: [it.response] });
    }
  }
  return [...byPhrase.values()];
}

export default function Cloud({ items, onClose }: { items: CloudItem[]; onClose(): void }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [words, setWords] = useState<Word[]>([]);
  const phrases = useMemo(() => mergePhrases(items), [items]);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const W = area.clientWidth, H = area.clientHeight;
    if (!W || !H) return;

    const maxSize = Math.min(72, Math.max(20, Math.floor(H / 10)));
    const minSize = 13;
    const layout = cloud<Word>()
      .size([W, H - 40])
      .padding(14)
      .rotate(() => 0)   // phrases stay horizontal for classroom readability
      .spiral('archimedean')
      .font('system-ui, -apple-system, "Segoe UI", Roboto, sans-serif')
      .words(phrases.map((p) => ({
        // The ×count suffix is part of the rendered text so d3-cloud
        // reserves width for it — otherwise counted phrases overlap.
        text: p.count > 1 ? `${p.display} ×${p.count}` : p.display,
        count: p.count,
        responses: p.responses,
        size: Math.max(minSize, Math.min(
          64,
          (1800 / Math.max(8, p.display.length)) * Math.max(1, p.count) ** 0.3,
        )),
      })))
      .fontSize((d) => d.size)
      .on('end', (placed) => setWords(placed));
    layout.start();

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      layout.stop();
      window.removeEventListener('keydown', onKey);
    };
  }, [phrases, items.length, onClose]);

  return (
    <div ref={areaRef} style={{
      position: 'fixed', inset: 0, zIndex: 60, overflow: 'hidden',
      background: 'var(--surface, #101014)', color: 'var(--fg, #eee)',
    }}>
      <div style={{
        position: 'absolute', top: 14, left: 18, right: 18, zIndex: 1,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span className="eyebrow">{items.length} RESPONSES · {phrases.length} DISTINCT PHRASES · ESC TO CLOSE</span>
        <button className="quiet" onClick={onClose}>Exit ✕</button>
      </div>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} role="img"
        aria-label={'Word cloud of ' + items.length + ' student responses'}>
        <g transform={`translate(${(areaRef.current?.clientWidth || 0) / 2},${(areaRef.current?.clientHeight || 0) / 2})`}>
          {words.map((w, i) => (
            <text key={i} textAnchor="middle"
              transform={`translate(${w.x},${w.y}) rotate(${w.rotate || 0})`}
              style={{ fontSize: w.size, fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', fill: 'currentColor' }}
              opacity={0.6 + 0.4 * Math.min(1, w.size / maxSizeOf(words))}>
              {w.text}
            </text>
          ))}
        </g>
      </svg>
      {!words.length && <div className="empty">Laying out responses…</div>}
    </div>
  );
}

function maxSizeOf(words: Word[]): number {
  return words.reduce((m, w) => Math.max(m, w.size), 1);
}
