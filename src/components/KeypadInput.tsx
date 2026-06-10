interface KeypadInputProps {
  value: string;
  onChange: (raw: string) => void;
}

export default function KeypadInput({ value, onChange }: KeypadInputProps) {
  const display = value
    ? Number(value).toLocaleString("id-ID")
    : "";

  const press = (key: string) => {
    if (key === "C") { onChange(""); return; }
    if (key === "⌫") { onChange(value.slice(0, -1)); return; }
    onChange(value + key);
  };

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["C", "0", "⌫"],
  ];

  return (
    <div className="space-y-4">
      {/* Display */}
      <div className="text-center py-2">
        <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
          Jumlah (Rp)
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className="text-2xl font-extrabold text-on-surface-variant/30">Rp</span>
          <span className="text-4xl font-extrabold text-on-surface tracking-tight">
            {display || "0"}
          </span>
        </div>
      </div>

      {/* Keypad */}
      <div className="bg-surface-container-lowest rounded-2xl p-3 space-y-2">
        {keys.map((row, ri) => (
          <div key={ri} className="flex gap-2">
            {row.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => press(key)}
                className={`flex-1 h-14 rounded-xl font-bold text-lg transition-all active:scale-95 ${
                  key === "C"
                    ? "bg-error-container text-on-error-container hover:bg-error hover:text-on-error"
                    : key === "⌫"
                    ? "bg-surface-container text-on-surface-variant hover:bg-secondary-container"
                    : "bg-surface-container text-on-surface hover:bg-primary-container hover:text-on-primary-container"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
