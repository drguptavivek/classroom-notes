'use client';
// Full-screen phrase cloud built on react-wordcloud (d3-cloud layout).
// Each typed response is one phrase — never split into separate words.
// Identical phrases (case/punctuation aside) merge and grow with repetition.
import { useMemo } from 'react';
import ReactWordCloud from 'react-wordcloud';

export interface CloudItem {
  text: string;
  response: number;
}

interface Phrase {
  display: string;      // first-seen phrasing
  count: number;
  responses: number[];  // response numbers that wrote it
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
  const phrases = useMemo(() => mergePhrases(items), [items]);
  const words = phrases.map((p) => ({
    text: p.count > 1 ? `${p.display} ×${p.count}` : p.display,
    value: p.count,
    title: 'Written by ' + p.count + ' student' + (p.count > 1 ? 's' : '')
      + ' (responses ' + p.responses.slice(0, 6).map(String).join(', ') + (p.responses.length > 6 ? ', …' : '') + ')',
  }));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--surface, #101014)', color: 'var(--fg, #eee)' }}>
      <div style={{
        position: 'absolute', top: 14, left: 18, right: 18, zIndex: 1,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span className="eyebrow">{items.length} RESPONSES · {phrases.length} DISTINCT PHRASES · ESC TO CLOSE</span>
        <button className="quiet" onClick={onClose}>Exit ✕</button>
      </div>
      <div style={{ position: 'absolute', inset: 0 }}>
        <ReactWordCloud
          words={words}
          options={{
            fontSizes: [14, 72],
            rotations: 0,               // keep phrases horizontal and readable in class
            scale: 'sqrt',
            spiral: 'archimedean',      // d3-cloud layout: no overlaps
            padding: 2,
            transitionDuration: 400,
            enableTooltip: true,
          }}
        />
      </div>
    </div>
  );
}
