import { useState, useRef } from "react";
import { Zap } from "lucide-react";

export default function InteractiveUI({ onResult }) {
  const secretRef = useRef(Math.floor(Math.random() * 1024) + 1);
  const [low, setLow] = useState(1);
  const [high, setHigh] = useState(1024);
  const [queryValue, setQueryValue] = useState(512);
  const [queriesLeft, setQueriesLeft] = useState(10);
  const [log, setLog] = useState([]);
  const [phase, setPhase] = useState("query"); // query | guess
  const [guess, setGuess] = useState("");
  const [ended, setEnded] = useState(false);

  const askQuery = () => {
    if (queriesLeft <= 0 || ended) return;
    const x = parseInt(queryValue);
    const answer = x >= secretRef.current ? "YES" : "NO";
    const newLog = [...log, { q: `Is the seal ≤ ${x}?`, a: answer }];
    setLog(newLog);
    setQueriesLeft((q) => q - 1);

    if (answer === "YES") setHigh(x);
    else setLow(x + 1);

    if (queriesLeft - 1 === 0) setPhase("guess");
  };

  const makeGuess = () => {
    const g = parseInt(guess);
    const correct = g === secretRef.current;
    setEnded(true);
    setLog((l) => [
      ...l,
      {
        q: `Final guess: ${g}`,
        a: correct ? `✅ CORRECT! The seal was ${secretRef.current}.` : `❌ WRONG. The seal was ${secretRef.current}.`,
      },
    ]);
    setTimeout(() => onResult(correct), 1500);
  };

  const midpoint = Math.floor((low + high) / 2);

  return (
    <div className="dojo-interactive-ui">
      <div className="dojo-interactive-header">
        <div className="dojo-query-counter">
          <Zap size={14} />
          {queriesLeft} probes remaining
        </div>
        <div className="dojo-range-hint">
          Search range: [{low}, {high}]
        </div>
      </div>

      <div className="dojo-log">
        {log.map((entry, i) => (
          <div key={i} className="dojo-log-entry">
            <span className="dojo-log-q">❓ {entry.q}</span>
            <span className={`dojo-log-a ${entry.a.startsWith("YES") || entry.a.startsWith("✅") ? "yes" : "no"}`}>
              {entry.a}
            </span>
          </div>
        ))}
      </div>

      {!ended && phase === "query" && (
        <div className="dojo-query-form">
          <label>Probe: Is the seal ≤</label>
          <div className="dojo-query-input-row">
            <input
              type="number"
              min={low}
              max={high}
              value={queryValue}
              onChange={(e) => setQueryValue(e.target.value)}
              className="dojo-query-input"
            />
            <button className="dojo-action-btn small" onClick={() => setQueryValue(midpoint)}>
              Midpoint ({midpoint})
            </button>
            <button className="dojo-action-btn" onClick={askQuery} disabled={queriesLeft === 0}>
              Ask
            </button>
          </div>
        </div>
      )}

      {!ended && phase === "guess" && (
        <div className="dojo-guess-form">
          <p className="dojo-guess-label">No more probes! Make your final guess:</p>
          <div className="dojo-query-input-row">
            <input
              type="number"
              min={1}
              max={1024}
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              className="dojo-query-input"
            />
            <button className="dojo-action-btn" onClick={makeGuess}>
              Guess!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
