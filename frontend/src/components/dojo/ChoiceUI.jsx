import { useState } from "react";

export default function ChoiceUI({ challenge, onResult }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selections, setSelections] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const question = challenge.questions[currentQ];

  const toggleChoice = (id) => {
    if (submitted) return;
    setSelections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmitQ = () => {
    setSubmitted(true);
    setRevealed(true);
    const correct = question.correct.sort().join(",");
    const given = [...selections].sort().join(",");
    if (correct === given) {
      if (currentQ < challenge.questions.length - 1) {
        setTimeout(() => {
          setCurrentQ((q) => q + 1);
          setSelections([]);
          setSubmitted(false);
          setRevealed(false);
        }, 2000);
      } else {
        setTimeout(() => onResult(true), 2000);
      }
    } else {
      setTimeout(() => onResult(false), 2000);
    }
  };

  return (
    <div className="dojo-choices-ui">
      <div className="dojo-question-header">
        <span className="dojo-q-counter">
          Question {currentQ + 1} / {challenge.questions.length}
        </span>
        <p className="dojo-q-text">{question.q}</p>
      </div>

      <div className="dojo-choice-list">
        {challenge.choices.map((c) => {
          const isSelected = selections.includes(c.id);
          const isCorrect = question.correct.includes(c.id);
          let state = "";
          if (revealed) {
            state = isSelected && isCorrect ? "correct" : isSelected && !isCorrect ? "wrong" : isCorrect ? "missed" : "neutral";
          } else if (isSelected) {
            state = "selected";
          }

          return (
            <button
              key={c.id}
              className={`dojo-choice-item dojo-choice-${state}`}
              onClick={() => toggleChoice(c.id)}
              disabled={submitted}
            >
              <div className="dojo-choice-letter">{c.id}</div>
              <div className="dojo-choice-body">
                <strong>{c.label}</strong>
                <span>{c.detail}</span>
                {revealed && isCorrect && (
                  <div className="dojo-choice-reason">{c.reason}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!submitted && (
        <button
          className="dojo-action-btn"
          onClick={handleSubmitQ}
          disabled={selections.length === 0}
        >
          Submit Answer
        </button>
      )}
    </div>
  );
}
