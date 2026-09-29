"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import styles from "./EnglishJourney.module.css";

type Point = { x: number; y: number };

export function TracePad({ letter, onComplete }: { letter: string; onComplete: () => void }) {
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [drawing, setDrawing] = useState(false);
  const [done, setDone] = useState(false);
  const distanceRef = useRef(0);
  const lastRef = useRef<Point | null>(null);

  const paths = useMemo(
    () => strokes.filter((stroke) => stroke.length > 1).map((stroke) => stroke.map((point) => `${point.x},${point.y}`).join(" ")),
    [strokes],
  );

  function point(event: PointerEvent<SVGSVGElement>): Point {
    const box = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * 300,
      y: ((event.clientY - box.top) / box.height) * 300,
    };
  }

  function start(event: PointerEvent<SVGSVGElement>) {
    if (done) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const next = point(event);
    lastRef.current = next;
    setDrawing(true);
    setStrokes((current) => [...current, [next]]);
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    if (!drawing || done) return;
    const next = point(event);
    const last = lastRef.current;
    if (last) distanceRef.current += Math.hypot(next.x - last.x, next.y - last.y);
    lastRef.current = next;
    setStrokes((current) => {
      if (!current.length) return current;
      const copy = [...current];
      copy[copy.length - 1] = [...copy[copy.length - 1], next];
      return copy;
    });
  }

  function finish() {
    if (!drawing) return;
    setDrawing(false);
    lastRef.current = null;
    if (!done && distanceRef.current >= 420) {
      setDone(true);
      window.setTimeout(onComplete, 420);
    }
  }

  function clear() {
    distanceRef.current = 0;
    lastRef.current = null;
    setStrokes([]);
    setDone(false);
    setDrawing(false);
  }

  return (
    <div className={styles.traceWrap}>
      <svg
        viewBox="0 0 300 300"
        className={done ? `${styles.tracePad} ${styles.traceDone}` : styles.tracePad}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        onPointerLeave={finish}
        role="img"
        aria-label={`Trace the letter ${letter}`}
      >
        <rect x="2" y="2" width="296" height="296" rx="34" className={styles.tracePaper} />
        <line x1="28" y1="232" x2="272" y2="232" className={styles.traceBaseline} />
        <text x="150" y="224" textAnchor="middle" className={styles.traceGuide}>{letter}</text>
        {paths.map((points, index) => <polyline key={index} points={points} className={styles.traceStroke} />)}
      </svg>
      <button type="button" className={styles.clearTrace} onClick={clear}>Clear</button>
    </div>
  );
}
