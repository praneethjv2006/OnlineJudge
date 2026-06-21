import { useState } from "react";
import { Code2 } from "lucide-react";
import { simulateRun } from "../../data/dojoChallenges";

export default function PredictUI({ challenge, onResult }) {
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(null);

  const handleSubmit = () => {
    const result = simulateRun(challenge, userAnswer);
    setCorrect(result);
    setSubmitted(true);
    setTimeout(() => onResult(result), 1800);
  };

  return (
    <div className="dojo-predict-ui">
      <div className="dojo-predict-code">
        <div className="dojo-predict-code-header">
          <Code2 size={14} />
          <span>C++ Code to Analyze</span>
        </div>
        <pre className="dojo-predict-pre">{challenge.displayCode}</pre>
      </div>

      <div className="dojo-predict-answer">
        <label>Your predicted output (type exactly):</label>
        <textarea
          className="dojo-predict-textarea"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={submitted}
          placeholder={"Line 1\nLine 2"}
          rows={4}
          spellCheck={false}
        />
        {submitted && correct !== null && (
          <div className={`dojo-predict-verdict ${correct ? "pass" : "fail"}`}>
            {correct ? "✅ Correct!" : `❌ Wrong. Expected:\n${challenge.expectedOutput}`}
          </div>
        )}
        {!submitted && (
          <button
            className="dojo-action-btn"
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
          >
            Submit Prediction
          </button>
        )}
      </div>
    </div>
  );
}
