import { gameStyles as ui } from "./styles";

type ProgressDotsProps = {
  current: number;
  total: number;
};

export function ProgressDots({ current, total }: ProgressDotsProps) {
  return (
    <div className={ui["progress-dots"]} role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={Math.min(current + 1, total)}>
      <span className={`sr-only`}>Question {Math.min(current + 1, total)} of {total}</span>
      {Array.from({ length: total }, (_, index) => (
        <span
          aria-hidden="true"
          className={`${ui["progress-dot"]} ${index < current ? "is-complete" : ""} ${index === current ? "is-current" : ""}`}
          key={index}
        />
      ))}
    </div>
  );
}
