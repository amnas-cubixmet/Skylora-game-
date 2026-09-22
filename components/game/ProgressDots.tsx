type ProgressDotsProps = {
  current: number;
  total: number;
};

export function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <div className="progress-dots" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1}>
      <span className="sr-only">Question {Math.min(current + 1, total)} of {total}</span>
      {Array.from({ length: total }, (_, index) => (
        <span
          aria-hidden="true"
          className={`progress-dot ${index < current ? "is-complete" : ""} ${index === current ? "is-current" : ""}`}
          key={index}
        />
      ))}
    </div>
  );
}
