"use client";
import { useState } from "react";
import { Picture } from "../english/Art";
import { STROKES } from "../../lib/world/strokes";
import type { Activity, Session } from "../../lib/world/types";
import { TracingCanvas } from "./TracingCanvas";
function WritingSequence({
  q,
  disabled,
  onAnswer,
  onHint,
}: {
  q: Activity;
  disabled: boolean;
  onAnswer: (
    value: string,
    supported?: boolean,
    selfReviewed?: boolean,
  ) => void;
  onHint: () => void;
}) {
  const [index, setIndex] = useState(0),
    [supported, setSupported] = useState(false);
  const letters =
    q.trace && q.trace.length > 1 && /^[A-Z]+$/.test(q.trace)
      ? q.trace.split("")
      : [q.trace ?? "A"];
  return (
    <>
      <p className="world-note">
        {letters.length > 1
          ? `Letter ${index + 1} of ${letters.length}: ${letters[index]}`
          : ""}
      </p>
      <TracingCanvas
        key={`${q.id}:${index}`}
        activity={{ ...q, trace: letters[index] }}
        partial={q.id.startsWith("W07")}
        disabled={disabled}
        onComplete={(self, support) => {
          if (index < letters.length - 1) {
            setSupported(supported || support);
            setIndex(index + 1);
          } else onAnswer(q.answer, supported || support, self);
        }}
        onSupport={onHint}
      />
    </>
  );
}

export function Objects({
  count,
  label = "objects",
  interactive = false,
}: {
  count: number;
  label?: string;
  interactive?: boolean;
}) {
  const [touched, setTouched] = useState<number[]>([]);
  return (
    <div
      className="world-objects"
      role="group"
      aria-label={`${count} ${label}`}
    >
      {Array.from({ length: count }, (_, i) =>
        interactive ? (
          <button
            key={i}
            className={touched.includes(i) ? "counted" : ""}
            aria-label={`Count object ${i + 1}`}
            aria-pressed={touched.includes(i)}
            onClick={() => setTouched((p) => (p.includes(i) ? p : [...p, i]))}
          >
            {touched.includes(i) ? touched.indexOf(i) + 1 : "●"}
          </button>
        ) : (
          <span key={i} aria-hidden="true">
            ●
          </span>
        ),
      )}
      {count === 0 && <span className="world-note">An empty group</span>}
    </div>
  );
}
export function ActivityArea({
  q,
  session,
  disabled,
  visualSupport,
  onAnswer,
  onTile,
  onUndo,
  onBuild,
  onHint,
}: {
  q: Activity;
  session: Session;
  disabled: boolean;
  visualSupport: boolean;
  onAnswer: (
    value: string,
    supported?: boolean,
    selfReviewed?: boolean,
  ) => void;
  onTile: (index: string) => void;
  onUndo: () => void;
  onBuild: (value: number) => void;
  onHint: () => void;
}) {
  const hint = session.hints,
    glow = hint >= 2 || session.attempts >= 3;
  return (
    <div className="world-activity-area">
      {q.picture && (
        <Picture value={q.picture} className="world-target-picture" />
      )}
      {q.prompt && (
        <p className={`world-prompt ${q.prompt.length > 18 ? "long" : ""}`}>
          {q.prompt}
        </p>
      )}
      {typeof q.quantity === "number" && (
        <Objects key={`${q.id}:quantity`} count={q.quantity} interactive />
      )}
      {visualSupport && !q.prompt && !q.picture && q.mechanic === "choice" && (
        <p className="world-visual-clue">
          Visual clue: {q.options.find((o) => o.id === q.answer)?.label}
        </p>
      )}
      {q.mechanic === "choice" && (
        <div
          className={`world-choices ${q.id.startsWith("R02") ? "letter-meadow" : ""}`}
        >
          {q.options.map((o, i) => (
            <button
              key={o.id}
              data-testid="world-choice"
              data-choice={o.id}
              aria-label={o.label}
              disabled={disabled}
              className={`world-choice ${glow && o.id === q.answer ? "hint-glow" : ""} ${hint >= 3 && o.id !== q.answer && i === q.options.findIndex((x) => x.id !== q.answer) ? "choice-dim" : ""}`}
              onClick={() => onAnswer(o.id, visualSupport)}
            >
              {o.picture ? (
                <Picture value={o.picture} className="world-option-picture" />
              ) : typeof o.quantity === "number" ? (
                <Objects count={o.quantity} />
              ) : (
                <span className={o.label.length > 5 ? "word" : "letter"}>
                  {o.label}
                </span>
              )}
              {o.picture && (
                <span className="world-choice-label">{o.label}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {q.mechanic === "order" && q.tokens && (
        <>
          <div
            className="world-letter-slots"
            role="group"
            aria-label="Your word or sentence"
          >
            {q.tokens.map((_, i) => (
              <span key={i}>
                {session.selection[i] !== undefined
                  ? q.tokens![Number(session.selection[i])]
                  : "·"}
              </span>
            ))}
          </div>
          <div className="world-tiles">
            {q.tokens.map((token, i) => (
              <button
                className={`world-tile ${glow && q.answer.split("|")[session.selection.length] === token ? "hint-glow" : ""}`}
                aria-label={`${token}, tile ${i + 1}`}
                key={i}
                disabled={disabled || session.selection.includes(String(i))}
                onClick={() => onTile(String(i))}
              >
                {token}
              </button>
            ))}
          </div>
          <div className="world-actions">
            <button
              className="world-secondary"
              onClick={onUndo}
              disabled={disabled || !session.selection.length}
            >
              Undo last tile
            </button>
            <button
              className="world-primary"
              disabled={
                disabled || session.selection.length !== q.tokens.length
              }
              onClick={() =>
                onAnswer(
                  session.selection.map((i) => q.tokens![Number(i)]).join("|"),
                )
              }
            >
              Check my{" "}
              {q.tokens.some((t) => t.length > 1) ? "sentence" : "word"}
            </button>
          </div>
        </>
      )}
      {(q.mechanic === "trace" || q.mechanic === "copy") && (
        <WritingSequence
          key={q.id}
          q={q}
          disabled={disabled}
          onAnswer={onAnswer}
          onHint={onHint}
        />
      )}
      {q.mechanic === "start" && (
        <div className="world-start-area">
          <svg
            viewBox="0 0 100 100"
            aria-label={`Letter ${q.trace}`}
            role="img"
          >
            {STROKES[q.trace!].map((path, i) => (
              <polyline
                key={i}
                points={path.map((p) => p.join(",")).join(" ")}
                fill="none"
                stroke="#c5b8da"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ))}
          </svg>
          {q.options.map((o, index) => {
            const strokes = STROKES[q.trace!],
              point = o.id === "start" ? strokes[0][0] : strokes[0].at(-1)!;
            return (
              <button
                className={`world-start-dot ${glow && o.id === "start" ? "hint-glow" : ""}`}
                key={o.id}
                disabled={disabled}
                style={{ left: `${point[0]}%`, top: `${point[1]}%` }}
                aria-label={`Point ${index + 1}, near ${point[1] < 50 ? "top" : "bottom"} of letter`}
                onClick={() => onAnswer(o.id)}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      )}
      {q.mechanic === "build" && (
        <>
          <p className="world-note">
            {q.id.startsWith("M11")
              ? "Add or remove pretend ₹1 coins. No real purchases."
              : "Tap to add or remove objects. Count them at your own pace."}
          </p>
          <Objects
            key={`${q.id}:${session.built}`}
            count={session.built}
            label={q.id.startsWith("M11") ? "pretend coins" : "objects"}
            interactive
          />
          <div className="world-build-count" aria-live="polite">
            {session.built}
            {q.id.startsWith("M08")
              ? ` added · ${session.built + (q.start ?? 0)} altogether`
              : q.id.startsWith("M11")
                ? " rupees"
                : ""}
          </div>
          <div className="world-actions">
            <button
              className="world-secondary"
              disabled={disabled || session.built === 0}
              onClick={() => onBuild(session.built - 1)}
            >
              − Remove one
            </button>
            <button
              className="world-secondary"
              disabled={disabled || session.built === (q.limit ?? 10)}
              onClick={() => onBuild(session.built + 1)}
            >
              + Add one
            </button>
            <button
              className="world-primary"
              disabled={disabled}
              onClick={() => onAnswer(String(session.built))}
            >
              Check my group
            </button>
          </div>
        </>
      )}
      {q.mechanic === "line" && (
        <>
          <p className="world-note">
            Move one space at a time. Then check where you landed.
          </p>
          <svg
            viewBox="0 0 660 130"
            role="img"
            aria-label={`Number line from 0 to 10. You are at ${session.built}.`}
            className="world-line-scene"
          >
            <path d="M30 70H630" stroke="#b5a2c8" strokeWidth="5" />
            {Array.from({ length: 11 }, (_, i) => (
              <g key={i}>
                <circle
                  cx={30 + i * 60}
                  cy="70"
                  r="6"
                  fill={i === q.start ? "#c89a42" : "#867099"}
                />
                <text
                  x={30 + i * 60}
                  y="112"
                  fontSize="25"
                  textAnchor="middle"
                  fill="#4d405b"
                >
                  {i}
                </text>
              </g>
            ))}
            <g transform={`translate(${30 + session.built * 60},35)`}>
              <circle r="19" fill="#705994" />
              <text y="7" textAnchor="middle" fontSize="20" fill="white">
                {session.built}
              </text>
            </g>
          </svg>
          <p aria-live="polite" className="world-build-count">
            You are at {session.built}
          </p>
          <div className="world-actions">
            <button
              className="world-secondary"
              disabled={disabled || session.built === 0}
              onClick={() => onBuild(session.built - 1)}
            >
              ← Back one
            </button>
            <button
              className="world-secondary"
              disabled={disabled || session.built === 10}
              onClick={() => onBuild(session.built + 1)}
            >
              Jump one →
            </button>
            <button
              className="world-primary"
              disabled={disabled}
              onClick={() => onAnswer(String(session.built))}
            >
              Check my landing
            </button>
          </div>
        </>
      )}
    </div>
  );
}
