import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createContest } from "../services/contestService";

const createTestCase = () => ({
  input: "",
  expectedOutput: "",
});

const createQuestion = () => ({
  title: "",
  prompt: "",
  timeLimitMs: 1000,
  testCases: [createTestCase()],
});

const createContestDraft = () => ({
  title: "",
  description: "",
  visibility: "public",
  durationMinutes: 120,
  questions: [createQuestion()],
});

function CreateContestPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(createContestDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdContest, setCreatedContest] = useState(null);
  const [basicsOpen, setBasicsOpen] = useState(true);
  const [questionsOpen, setQuestionsOpen] = useState(true);
  const [questionOpenStates, setQuestionOpenStates] = useState([true]);
  const [testcaseOpenStates, setTestcaseOpenStates] = useState([true]);

  const updateDraftField = (field) => (event) => {
    const value = field === "durationMinutes" ? Number(event.target.value) : event.target.value;

    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateQuestionField = (questionIndex, field) => (event) => {
    const value = field === "timeLimitMs" ? Number(event.target.value) : event.target.value;

    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex ? { ...question, [field]: value } : question
      ),
    }));
  };

  const updateTestCaseField = (questionIndex, testCaseIndex, field) => (event) => {
    const value = event.target.value;

    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) => {
        if (index !== questionIndex) {
          return question;
        }

        return {
          ...question,
          testCases: question.testCases.map((testCase, innerIndex) =>
            innerIndex === testCaseIndex ? { ...testCase, [field]: value } : testCase
          ),
        };
      }),
    }));
  };

  const addQuestion = () => {
    setDraft((current) => ({
      ...current,
      questions: [...current.questions, createQuestion()],
    }));
    setQuestionOpenStates((current) => [...current, true]);
    setTestcaseOpenStates((current) => [...current, true]);
  };

  const removeQuestion = (questionIndex) => {
    setDraft((current) => ({
      ...current,
      questions:
        current.questions.length === 1
          ? current.questions
          : current.questions.filter((_, index) => index !== questionIndex),
    }));
    setQuestionOpenStates((current) => (current.length === 1 ? current : current.filter((_, index) => index !== questionIndex)));
    setTestcaseOpenStates((current) => (current.length === 1 ? current : current.filter((_, index) => index !== questionIndex)));
  };

  const addTestCase = (questionIndex) => {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex
          ? { ...question, testCases: [...question.testCases, createTestCase()] }
          : question
      ),
    }));
  };

  const removeTestCase = (questionIndex, testCaseIndex) => {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) => {
        if (index !== questionIndex || question.testCases.length === 1) {
          return question;
        }

        return {
          ...question,
          testCases: question.testCases.filter((_, innerIndex) => innerIndex !== testCaseIndex),
        };
      }),
    }));
  };

  const submitContest = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const data = await createContest(draft);
      const contest = data.contest || null;

      if (contest?._id) {
        navigate(`/contests/${contest._id}`);
        return;
      }

      setCreatedContest(contest);
      setDraft(createContestDraft());
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Contest creation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-stack create-contest-page">
      <button type="button" className="back-button" onClick={() => navigate("/contests")}>
        <span aria-hidden="true">←</span>
        Back
      </button>

      {createdContest && (
        <section className="panel create-success-banner">
          <div>
            <span className="eyebrow">Contest created</span>
            <h2>{createdContest.title}</h2>
            <p>
              Room code: <strong>{createdContest.roomCode}</strong>. Keep it for private access or return to the
              contests page to review the room list.
            </p>
          </div>

          <div className="create-success-actions">
            <button type="button" className="ghost-button" onClick={() => navigate("/contests")}>
              Go to contests
            </button>
          </div>
        </section>
      )}

      <form className="panel create-form-shell" onSubmit={submitContest}>
        <details className="create-section" open={basicsOpen} onToggle={(event) => setBasicsOpen(event.currentTarget.open)}>
          <summary>
            <span>
              <strong>Contest basics</strong>
              <small>Title, visibility, and total contest time</small>
            </span>
            <span className="summary-chip">{basicsOpen ? "Hide" : "Expand"}</span>
          </summary>

          <div className="form-grid two-up create-grid">
            <label>
              Contest title
              <input value={draft.title} onChange={updateDraftField("title")} placeholder="June Sprint Challenge" />
            </label>

            <label>
              Visibility
              <select value={draft.visibility} onChange={updateDraftField("visibility")}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </label>

            <label>
              Total contest time (minutes)
              <input type="number" min="15" value={draft.durationMinutes} onChange={updateDraftField("durationMinutes")} />
            </label>

            <label>
              Contest description
              <textarea
                rows="4"
                value={draft.description}
                onChange={updateDraftField("description")}
                placeholder="Senior algorithmic round with clear scoring and runtime limits."
              />
            </label>
          </div>
        </details>

        <details
          className="create-section"
          open={questionsOpen}
          onToggle={(event) => setQuestionsOpen(event.currentTarget.open)}
        >
          <summary>
            <span>
              <strong>Question builder</strong>
              <small>Question prompt and per-question runtime</small>
            </span>
            <span className="summary-chip">{questionsOpen ? "Hide" : "Expand"}</span>
          </summary>

          <div className="question-list create-question-list">
            {draft.questions.map((question, questionIndex) => (
              <details
                className="question-card create-question-card"
                key={`question-${questionIndex}`}
                open={questionOpenStates[questionIndex] ?? questionIndex === 0}
                onToggle={(event) => {
                  const isOpen = event.currentTarget.open;
                  setQuestionOpenStates((current) =>
                    current.map((state, index) => (index === questionIndex ? isOpen : state))
                  );
                }}
              >
                <summary>
                  <span>
                    <strong>Question {questionIndex + 1}</strong>
                    <small>{question.title || "Untitled problem"}</small>
                  </span>
                  <button type="button" className="ghost-button" onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    removeQuestion(questionIndex);
                  }}>
                    Remove
                  </button>
                </summary>

                <div className="form-grid two-up create-grid">
                  <label>
                    Question title
                    <input
                      value={question.title}
                      onChange={updateQuestionField(questionIndex, "title")}
                      placeholder="Balanced parenthesis variants"
                    />
                  </label>

                  <label>
                    Per-question runtime limit (ms)
                    <input
                      type="number"
                      min="100"
                      value={question.timeLimitMs}
                      onChange={updateQuestionField(questionIndex, "timeLimitMs")}
                    />
                  </label>

                  <label className="span-two">
                    Problem statement
                    <textarea
                      rows="5"
                      value={question.prompt}
                      onChange={updateQuestionField(questionIndex, "prompt")}
                      placeholder="Describe the exact coding challenge and the expected output format."
                    />
                  </label>
                </div>

                <details
                  className="nested-section"
                  open={testcaseOpenStates[questionIndex] ?? true}
                  onToggle={(event) => {
                    const isOpen = event.currentTarget.open;
                    setTestcaseOpenStates((current) =>
                      current.map((state, index) => (index === questionIndex ? isOpen : state))
                    );
                  }}
                >
                  <summary>
                    <span>
                      <strong>Test cases</strong>
                      <small>Hide or expand to keep the form compact</small>
                    </span>
                    <span className="summary-chip subtle">
                      {testcaseOpenStates[questionIndex] ?? true ? "Hide" : "Expand"} · {question.testCases.length} cases
                    </span>
                  </summary>

                  <div className="testcase-list create-testcase-list">
                    {question.testCases.map((testCase, testCaseIndex) => (
                      <div className="testcase-card create-testcase-card" key={`question-${questionIndex}-case-${testCaseIndex}`}>
                        <div className="question-header compact">
                          <strong>Case {testCaseIndex + 1}</strong>
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => removeTestCase(questionIndex, testCaseIndex)}
                          >
                            Remove
                          </button>
                        </div>

                        <div className="form-grid two-up create-grid">
                          <label>
                            Input
                            <textarea
                              rows="3"
                              value={testCase.input}
                              onChange={updateTestCaseField(questionIndex, testCaseIndex, "input")}
                              placeholder="Sample input for the judge"
                            />
                          </label>

                          <label>
                            Expected output
                            <textarea
                              rows="3"
                              value={testCase.expectedOutput}
                              onChange={updateTestCaseField(questionIndex, testCaseIndex, "expectedOutput")}
                              placeholder="Expected output for the test case"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="section-actions compact-actions">
                    <button type="button" className="ghost-button" onClick={() => addTestCase(questionIndex)}>
                      Add test case
                    </button>
                  </div>
                </details>
              </details>
            ))}
          </div>

          <div className="section-actions">
            <button type="button" className="ghost-button" onClick={addQuestion}>
              Add another question
            </button>
          </div>
        </details>

        {error && <p className="status status-error">{error}</p>}

        <div className="create-footer">
          <span className="muted-copy">Everything stays collapsed until you need it.</span>
          <button type="submit" className="primary-button inline-button" disabled={isSubmitting}>
            {isSubmitting ? "Publishing contest..." : "Publish contest"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default CreateContestPage;