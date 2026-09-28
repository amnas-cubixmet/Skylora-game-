"use client";
import { useRef, useState, type PointerEvent } from "react";
import {
  STROKES,
  sampleStroke,
  follow,
  type Point,
} from "../../lib/world/strokes";
import type { Activity } from "../../lib/world/types";
export function TracingCanvas({
  activity,
  partial = false,
  disabled,
  onComplete,
  onSupport,
}: {
  activity: Activity;
  partial?: boolean;
  disabled: boolean;
  onComplete: (selfReviewed: boolean, supported: boolean) => void;
  onSupport: () => void;
}) {
  const strokes = STROKES[activity.trace ?? "A"] ?? STROKES.A,
    copy = activity.mechanic === "copy",
    start = partial ? strokes.length - 1 : 0;
  const [stroke, setStroke] = useState(start),
    [position, setPosition] = useState(0),
    [paths, setPaths] = useState<Point[][]>([]),
    [showModel, setShowModel] = useState(false),
    [message, setMessage] = useState("Start at the numbered dot."),
    [keyboard, setKeyboard] = useState(false);
  const svg = useRef<SVGSVGElement>(null),
    drag = useRef(false),
    index = useRef(0),
    activeStroke = useRef(start),
    points = useRef<Point[]>([]),
    complete = useRef(false);
  const supported = useRef(false),
    sample = sampleStroke(strokes[Math.min(stroke, strokes.length - 1)]),
    done = stroke >= strokes.length;
  function point(e: PointerEvent<SVGSVGElement>): Point {
    const canvas = e.currentTarget,
      matrix = canvas.getScreenCTM();
    if (!matrix) return [0, 0];
    const p = canvas.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const local = p.matrixTransform(matrix.inverse());
    return [
      Math.max(0, Math.min(100, local.x)),
      Math.max(0, Math.min(100, local.y)),
    ];
  }
  function move(p: Point) {
    if (disabled || complete.current) return;
    if (copy) {
      points.current = [...points.current, p].slice(-1500);
      setPaths((old) => [...old.slice(0, -1), points.current]);
      return;
    }
    const current = sampleStroke(strokes[activeStroke.current]);
    index.current = follow(current, index.current, p);
    setPosition(index.current);
    if (index.current >= current.length) {
      const next = activeStroke.current + 1;
      activeStroke.current = next;
      setStroke(next);
      index.current = 0;
      setPosition(0);
      drag.current = false;
      if (next === strokes.length) {
        complete.current = true;
        setMessage("Every stroke is complete.");
        onComplete(false, true);
      } else setMessage(`Now start stroke ${next + 1} at its numbered dot.`);
    }
  }
  const d = (path: Point[]) =>
    path.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  function keyboardStep() {
    if (!supported.current) onSupport();
    supported.current = true;
    setKeyboard(true);
    if (copy) {
      setShowModel(true);
      setMessage(
        "Use the model to practise on paper. Then confirm that you compared your letter.",
      );
      return;
    }
    const current = sampleStroke(strokes[activeStroke.current]);
    index.current = Math.min(current.length - 1, index.current + 3);
    move(current[index.current]);
  }
  return (
    <div className="world-tracing">
      <p className="world-note">
        {copy
          ? "Draw with a finger or mouse. Your drawing stays in this activity."
          : "Follow each stroke in order. Lift your finger between strokes."}
      </p>
      <svg
        ref={svg}
        data-trace-stroke={stroke}
        data-trace-position={position}
        viewBox="0 0 100 100"
        role="img"
        aria-label={`${copy ? "Drawing" : "Tracing"} area for ${activity.trace}. Keyboard practice controls are below.`}
        style={{ touchAction: "none", userSelect: "none" }}
        onPointerDown={(e) => {
          e.preventDefault();
          if (disabled || done) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = true;
          if (copy) {
            points.current = [point(e)];
            setPaths((old) => [...old, points.current]);
          } else move(point(e));
        }}
        onPointerMove={(e) => {
          e.preventDefault();
          if (drag.current) move(point(e));
        }}
        onPointerUp={() => {
          drag.current = false;
        }}
        onPointerCancel={() => {
          drag.current = false;
        }}
      >
        <path
          d="M5 15H95M5 50H95M5 85H95"
          stroke="#d8d4df"
          strokeWidth=".4"
          strokeDasharray="2 2"
        />
        {(!copy || showModel) &&
          strokes.map((path, i) => (
            <path
              key={i}
              d={d(path)}
              fill="none"
              stroke={i < stroke ? "#698d71" : "#cabddd"}
              strokeWidth={activity.guide === "faint" ? 1 : 4}
              strokeDasharray={activity.guide === "dotted" ? "1 5" : undefined}
              opacity={
                activity.guide === "none" && !showModel && i >= stroke
                  ? 0.12
                  : 1
              }
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        {!copy && !done && (
          <>
            <path
              d={d(sample.slice(0, position))}
              fill="none"
              stroke="#6551aa"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle
              cx={strokes[stroke][0][0]}
              cy={strokes[stroke][0][1]}
              r="5"
              fill="#6551aa"
            />
            <text
              x={strokes[stroke][0][0]}
              y={strokes[stroke][0][1] + 2}
              fontSize="6"
              fill="white"
              textAnchor="middle"
            >
              {stroke + 1}
            </text>
            <circle
              cx={sample[Math.min(position, sample.length - 1)][0]}
              cy={sample[Math.min(position, sample.length - 1)][1]}
              r="2.5"
              fill="#e3aa45"
            />
          </>
        )}
        {paths.map((path, i) => (
          <path
            key={i}
            d={d(path)}
            fill="none"
            stroke="#514578"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <p role="status" className="world-note">
        {message}
      </p>
      <div className="world-actions">
        {!done && (
          <button
            className="world-secondary"
            disabled={disabled}
            onClick={keyboardStep}
          >
            {copy
              ? "Practise on paper instead"
              : "Follow next path section with keyboard"}
          </button>
        )}
        {copy && (
          <>
            <button
              className="world-secondary"
              disabled={disabled}
              onClick={() => {
                setShowModel((v) => !v);
                if (!supported.current) onSupport();
                supported.current = true;
              }}
            >
              Compare with model
            </button>
            <button
              className="world-secondary"
              disabled={disabled}
              onClick={() => setPaths([])}
            >
              Clear drawing
            </button>
            <button
              className="world-primary"
              disabled={
                disabled ||
                (!keyboard && paths.reduce((n, p) => n + p.length, 0) < 8)
              }
              onClick={() => onComplete(true, true)}
            >
              I practised and compared my letter
            </button>
          </>
        )}
      </div>
      {keyboard && (
        <p className="world-note">
          This supported practice is recorded separately from independent
          writing.
        </p>
      )}
    </div>
  );
}
