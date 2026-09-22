import type { LevelSessionStats } from "../../lib/number-hunt/types";

type CompletionScreenProps = {
  level: number;
  stats: LevelSessionStats;
  isGameComplete?: boolean;
  onNext: () => void;
  onReplay: () => void;
  onHome: () => void;
};

export function CompletionScreen({ level, stats, isGameComplete = false, onNext, onReplay, onHome }: CompletionScreenProps) {
  const accuracy = Math.round((stats.firstTryCorrect / 10) * 100);

  return (
    <section className="completion-card" aria-live="polite">
      <div className="celebration-orbit" aria-hidden="true"><span>★</span><span>★</span><span>★</span></div>
      <p className="eyebrow">{isGameComplete ? "NUMBER HUNT COMPLETE" : `LEVEL ${level} COMPLETE`}</p>
      <h1>{isGameComplete ? "Amazing work!" : "Level Complete!"}</h1>
      <p className="completion-copy">
        {isGameComplete
          ? "You explored all ten Number Hunt levels. A short break is a great next step."
          : "You found every number in this level. Nice, steady learning."}
      </p>
      <div className="stats-grid">
        <div><strong>{stats.stars}</strong><span>Stars</span></div>
        <div><strong>10</strong><span>Questions</span></div>
        <div><strong>{accuracy}%</strong><span>Accuracy</span></div>
        <div><strong>{stats.attempts}</strong><span>Attempts</span></div>
      </div>
      <div className="completion-actions">
        {!isGameComplete ? <button className="primary-button" type="button" onClick={onNext}>Next Level</button> : null}
        <button className="secondary-button" type="button" onClick={onReplay}>Play Again</button>
        <button className="text-button" type="button" onClick={onHome}>Home</button>
      </div>
    </section>
  );
}
