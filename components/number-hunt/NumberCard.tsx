type NumberCardProps = {
  value: number;
  isTarget: boolean;
  showSuccess: boolean;
  isSelectedWrong: boolean;
  hintStage: 0 | 1 | 2;
  disabled: boolean;
  onSelect: (value: number) => void;
};

export function NumberCard({
  value,
  isTarget,
  showSuccess,
  isSelectedWrong,
  hintStage,
  disabled,
  onSelect,
}: NumberCardProps) {
  const hinted = isTarget && hintStage >= 1 && !showSuccess;
  const deemphasized = hintStage >= 2 && !isTarget && !showSuccess;

  return (
    <button
      className={`number-card ${showSuccess && isTarget ? "is-correct" : ""} ${isSelectedWrong ? "was-tried" : ""} ${hinted ? "is-hinted" : ""} ${deemphasized ? "is-deemphasized" : ""}`}
      type="button"
      onClick={() => onSelect(value)}
      disabled={disabled}
      aria-label={`Number ${value}${hinted ? ", hint" : ""}`}
    >
      <span className="number-value">{value}</span>
      {showSuccess && isTarget ? <span className="number-badge">Great!</span> : null}
      {hinted ? <span className="hint-label">Look here</span> : null}
    </button>
  );
}
