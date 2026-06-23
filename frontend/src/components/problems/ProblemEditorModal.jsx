import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  ArrowLeft,
  ArrowRight,
  Beaker,
  BookOpen,
  Check,
  Code2,
  Eye,
  FileText,
  Gauge,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { createProblem, updateProblem } from "../../services/problemService";
import { toast } from "../common/Toast";
import ProblemText from "./ProblemText";

const EMPTY_EXAMPLE = { input: "", output: "", explanation: "" };
const EMPTY_TEST_CASE = { input: "", expectedOutput: "" };

const createEmptyForm = () => ({
  title: "",
  difficulty: "easy",
  tags: "",
  category: "Coding",
  cognitiveCategories: [],
  topics: "",
  timeLimit: 2000,
  memoryLimit: 256,
  timeComplexity: "",
  spaceComplexity: "",
  problemStory: "",
  formalStatement: "",
  inputFormat: "",
  outputFormat: "",
  constraints: "",
  notes: "",
  examples: [{ ...EMPTY_EXAMPLE }],
  testCases: [{ ...EMPTY_TEST_CASE }],
});

const toEditorForm = (problem) => {
  if (!problem) return createEmptyForm();

  const fallbackExamples = (problem.testCases || []).slice(0, 3).map((testCase) => ({
    input: testCase.input || "",
    output: testCase.expectedOutput || "",
    explanation: "",
  }));

  return {
    title: problem.title || "",
    difficulty: problem.difficulty || "easy",
    tags: Array.isArray(problem.tags) ? problem.tags.join(", ") : "",
    category: problem.category || "Coding",
    cognitiveCategories: Array.isArray(problem.cognitiveCategories) ? problem.cognitiveCategories : [],
    topics: Array.isArray(problem.topics) ? problem.topics.join(", ") : "",
    timeLimit: problem.timeLimit || 2000,
    memoryLimit: problem.memoryLimit || 256,
    timeComplexity: problem.timeComplexity || "",
    spaceComplexity: problem.spaceComplexity || "",
    problemStory: problem.problemStory || "",
    formalStatement: problem.formalStatement || problem.statement || "",
    inputFormat: problem.inputFormat || "",
    outputFormat: problem.outputFormat || "",
    constraints: problem.constraints || "",
    notes: problem.notes || "",
    examples:
      problem.examples?.length > 0
        ? problem.examples.map((example) => ({
            input: example.input || "",
            output: example.output || "",
            explanation: example.explanation || "",
          }))
        : fallbackExamples.length > 0
          ? fallbackExamples
          : [{ ...EMPTY_EXAMPLE }],
    testCases:
      problem.testCases?.length > 0
        ? problem.testCases.map((testCase) => ({
            input: testCase.input || "",
            expectedOutput: testCase.expectedOutput || "",
          }))
        : [{ ...EMPTY_TEST_CASE }],
  };
};

const STEPS = [
  { label: "Details", icon: Gauge },
  { label: "Statement", icon: FileText },
  { label: "Examples & tests", icon: Beaker },
  { label: "Review", icon: Eye },
];

function Field({ label, hint, required, children }) {
  return (
    <label className="problem-editor-field">
      <span className="problem-editor-label">
        {label}
        {required && <em>Required</em>}
      </span>
      {hint && <small>{hint}</small>}
      {children}
    </label>
  );
}

function RichTextEditor({
  label,
  hint,
  required,
  value,
  onChange,
  placeholder,
  rows = 8,
}) {
  const textareaRef = useRef(null);
  const [mode, setMode] = useState("write");

  const applyFormat = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);

    const selectedOrPlaceholder = selected || "text";
    let replacement = selectedOrPlaceholder;

    if (type === "bold") replacement = `**${selectedOrPlaceholder}**`;
    if (type === "code") replacement = `\`${selectedOrPlaceholder}\``;
    if (type === "codeBlock") replacement = `\`\`\`\n${selected || "code here"}\n\`\`\``;
    if (type === "bullet") {
      const target = selected || "first point\nsecond point";
      replacement = target
        .split("\n")
        .map((line) => (line.trim() ? `- ${line.replace(/^[-*•]\s+/, "")}` : line))
        .join("\n");
    }
    if (type === "numbered") {
      const target = selected || "first step\nsecond step";
      replacement = target
        .split("\n")
        .map((line, index) =>
          line.trim() ? `${index + 1}. ${line.replace(/^\d+[.)]\s+/, "")}` : line
        )
        .join("\n");
    }

    onChange(`${before}${replacement}${after}`);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + replacement.length);
    });
  };

  return (
    <div className="problem-rich-editor-field">
      <div className="problem-rich-editor-heading">
        <div>
          <span className="problem-editor-label">
            {label}
            {required && <em>Required</em>}
          </span>
          {hint && <small>{hint}</small>}
        </div>
        <div className="problem-rich-editor-tabs">
          <button
            type="button"
            className={mode === "write" ? "active" : ""}
            onClick={() => setMode("write")}
          >
            Write
          </button>
          <button
            type="button"
            className={mode === "preview" ? "active" : ""}
            onClick={() => setMode("preview")}
          >
            Preview
          </button>
        </div>
      </div>

      {mode === "write" ? (
        <>
          <div className="problem-rich-toolbar" aria-label={`${label} formatting`}>
            <button type="button" onClick={() => applyFormat("bold")}>Bold</button>
            <button type="button" onClick={() => applyFormat("code")}>Inline code</button>
            <button type="button" onClick={() => applyFormat("bullet")}>Bullets</button>
            <button type="button" onClick={() => applyFormat("numbered")}>Numbered</button>
            <button type="button" onClick={() => applyFormat("codeBlock")}>Code block</button>
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            rows={rows}
          />
        </>
      ) : (
        <div className="problem-rich-preview">
          {value.trim() ? (
            <ProblemText text={value} />
          ) : (
            <p className="problem-rich-preview-empty">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  required: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

RichTextEditor.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  required: PropTypes.bool,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  rows: PropTypes.number,
};

function ProblemEditorModal({ problem, onClose, onSaved }) {
  const isEditing = Boolean(problem?._id);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => toEditorForm(problem));
  const [isSaving, setIsSaving] = useState(false);
  const [stepError, setStepError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const completedFields = useMemo(() => {
    const requiredValues = [
      form.title,
      form.formalStatement,
      form.inputFormat,
      form.outputFormat,
      form.constraints,
      form.examples[0]?.input,
      form.examples[0]?.output,
      form.testCases[0]?.input,
      form.testCases[0]?.expectedOutput,
    ];
    return requiredValues.filter((value) => String(value || "").trim()).length;
  }, [form]);

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setStepError("");
  };

  const updateListItem = (listName, index, field, value) => {
    setForm((current) => ({
      ...current,
      [listName]: current[listName].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
    setStepError("");
  };

  const addListItem = (listName, emptyValue) => {
    setForm((current) => ({
      ...current,
      [listName]: [...current[listName], { ...emptyValue }],
    }));
  };

  const removeListItem = (listName, index) => {
    setForm((current) => ({
      ...current,
      [listName]:
        current[listName].length === 1
          ? current[listName]
          : current[listName].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const validateStep = (stepIndex) => {
    if (stepIndex === 0) {
      if (!form.title.trim()) return "Add a clear problem title.";
      if (Number(form.timeLimit) < 100) return "Time limit must be at least 100 ms.";
      if (Number(form.memoryLimit) < 16) return "Memory limit must be at least 16 MB.";
    }

    if (stepIndex === 1) {
      if (!form.formalStatement.trim()) return "Write the formal problem statement.";
      if (!form.inputFormat.trim()) return "Describe the input format.";
      if (!form.outputFormat.trim()) return "Describe the output format.";
      if (!form.constraints.trim()) return "Add the problem constraints.";
    }

    if (stepIndex === 2) {
      const invalidExample = form.examples.some(
        (example) => !example.input.trim() || !example.output.trim()
      );
      if (invalidExample) return "Every public example needs both input and output.";

      const invalidTest = form.testCases.some(
        (testCase) => !testCase.input.trim() || !testCase.expectedOutput.trim()
      );
      if (invalidTest) return "Every judge test case needs input and expected output.";
    }

    return "";
  };

  const goToStep = (nextStep) => {
    if (nextStep > step) {
      const validationError = validateStep(step);
      if (validationError) {
        setStepError(validationError);
        return;
      }
    }
    setStepError("");
    setStep(nextStep);
  };

  const handleSubmit = async () => {
    for (let index = 0; index < 3; index += 1) {
      const validationError = validateStep(index);
      if (validationError) {
        setStep(index);
        setStepError(validationError);
        return;
      }
    }

    const payload = {
      ...form,
      statement: form.formalStatement,
      timeLimit: Number(form.timeLimit),
      memoryLimit: Number(form.memoryLimit),
      tags: form.tags
        ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      topics: form.topics
        ? form.topics.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    };

    setIsSaving(true);
    try {
      const savedProblem = isEditing
        ? await updateProblem(problem._id, payload)
        : await createProblem(payload);
      toast.success(isEditing ? "Problem updated successfully." : "Problem created successfully.");
      onSaved(savedProblem);
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      const message =
        error.response?.status === 404 && !serverMessage
          ? "The deployed backend does not support problem editing yet. Redeploy Railway first."
          : serverMessage || "Unable to save the problem.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="problem-editor-overlay" role="dialog" aria-modal="true">
      <div className="problem-editor-modal">
        <header className="problem-editor-header">
          <div>
            <span className="problem-editor-eyebrow">
              {isEditing ? "Author tools" : "Problem authoring"}
            </span>
            <h2>{isEditing ? `Edit ${problem.title}` : "Create a new problem"}</h2>
            <p>Use the same structure contestants expect on professional coding platforms.</p>
          </div>
          <button className="problem-editor-close" onClick={onClose} aria-label="Close editor">
            <X size={20} />
          </button>
        </header>

        <nav className="problem-editor-steps" aria-label="Problem editor steps">
          {STEPS.map(({ label, icon: Icon }, index) => (
            <button
              type="button"
              key={label}
              className={`${step === index ? "active" : ""} ${step > index ? "complete" : ""}`}
              onClick={() => goToStep(index)}
            >
              <span>{step > index ? <Check size={15} /> : <Icon size={15} />}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="problem-editor-progress">
          <span style={{ width: `${(completedFields / 9) * 100}%` }} />
        </div>

        <main className="problem-editor-body">
          {step === 0 && (
            <section className="problem-editor-step">
              <div className="problem-editor-section-heading">
                <Gauge size={20} />
                <div>
                  <h3>Problem details</h3>
                  <p>Identify the challenge and define its execution limits.</p>
                </div>
              </div>

              <div className="problem-editor-grid two">
                <Field label="Problem title" required>
                  <input
                    value={form.title}
                    onChange={(event) => setField("title", event.target.value)}
                    placeholder="Example: Minimum Cost to Connect Cities"
                  />
                </Field>
                <Field label="Difficulty" required>
                  <select
                    value={form.difficulty}
                    onChange={(event) => setField("difficulty", event.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </Field>
              </div>

              <Field label="Tags" hint="Comma-separated topics used for discovery.">
                <input
                  value={form.tags}
                  onChange={(event) => setField("tags", event.target.value)}
                  placeholder="graphs, shortest path, dijkstra"
                />
              </Field>

              <div className="problem-editor-grid two">
                <Field label="General Category" required>
                  <select
                    value={form.category}
                    onChange={(event) => setField("category", event.target.value)}
                  >
                    <option value="Coding">Coding</option>
                    <option value="Debugging">Debugging</option>
                    <option value="Concept">Concept</option>
                    <option value="Speedrun">Speedrun</option>
                  </select>
                </Field>
                <Field label="Topics" hint="Comma-separated topics (e.g. Arrays, Strings, DP)">
                  <input
                    value={form.topics}
                    onChange={(event) => setField("topics", event.target.value)}
                    placeholder="Arrays, Dynamic Programming, Graphs"
                  />
                </Field>
              </div>

              <div className="problem-editor-field" style={{ marginBottom: "20px" }}>
                <span className="problem-editor-label">Cognitive Traits tested by this challenge</span>
                <small>Select one or more cognitive abilities (ratings will update upon solving)</small>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                  {["Pattern Recognition", "Optimization Ability", "Mathematical Reasoning", "Logic Flow & Debugging", "Memory & Complexity"].map((cat) => {
                    const isSelected = form.cognitiveCategories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "0.85rem",
                          fontWeight: "500",
                          border: isSelected ? "1px solid #00b4d8" : "1px solid var(--border)",
                          backgroundColor: isSelected ? "rgba(0, 180, 216, 0.15)" : "rgba(255, 255, 255, 0.05)",
                          color: isSelected ? "#00b4d8" : "var(--muted)",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                        onClick={() => {
                          const current = [...form.cognitiveCategories];
                          if (current.includes(cat)) {
                            setField("cognitiveCategories", current.filter((c) => c !== cat));
                          } else {
                            setField("cognitiveCategories", [...current, cat]);
                          }
                        }}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="problem-editor-grid four">
                <Field label="Time limit" hint="Milliseconds">
                  <input
                    type="number"
                    min="100"
                    max="60000"
                    value={form.timeLimit}
                    onChange={(event) => setField("timeLimit", event.target.value)}
                  />
                </Field>
                <Field label="Memory limit" hint="Megabytes">
                  <input
                    type="number"
                    min="16"
                    max="4096"
                    value={form.memoryLimit}
                    onChange={(event) => setField("memoryLimit", event.target.value)}
                  />
                </Field>
                <Field label="Expected time">
                  <input
                    value={form.timeComplexity}
                    onChange={(event) => setField("timeComplexity", event.target.value)}
                    placeholder="O(N log N)"
                  />
                </Field>
                <Field label="Expected space">
                  <input
                    value={form.spaceComplexity}
                    onChange={(event) => setField("spaceComplexity", event.target.value)}
                    placeholder="O(N)"
                  />
                </Field>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="problem-editor-step">
              <div className="problem-editor-section-heading">
                <BookOpen size={20} />
                <div>
                  <h3>Write the statement</h3>
                  <p>Keep each concept in its own field; the problem page formats it automatically.</p>
                </div>
              </div>

              <RichTextEditor
                label="Problem story"
                hint="Optional motivation or narrative. Supports bullets, bold, inline code, and code blocks."
                value={form.problemStory}
                onChange={(value) => setField("problemStory", value)}
                placeholder={"Inside the dojo...\n\n- Chamber values are positive\n- Smoke walls split the corridor"}
                rows={6}
              />

              <RichTextEditor
                label="Formal problem statement"
                hint="Define the task precisely. Use the toolbar or markdown-style text: - bullets, 1. steps, **bold**, `code`."
                required
                value={form.formalStatement}
                onChange={(value) => setField("formalStatement", value)}
                placeholder={"You are given ...\n\nYour task is to ...\n\n- Explain the first rule\n- Explain the second rule"}
                rows={10}
              />

              <div className="problem-editor-grid two">
                <Field label="Input format" required>
                  <textarea
                    value={form.inputFormat}
                    onChange={(event) => setField("inputFormat", event.target.value)}
                    placeholder={"The first line contains N and M.\nThe next M lines contain u, v, and w."}
                    rows={6}
                  />
                </Field>
                <Field label="Output format" required>
                  <textarea
                    value={form.outputFormat}
                    onChange={(event) => setField("outputFormat", event.target.value)}
                    placeholder="Print the minimum total cost, or -1 if no solution exists."
                    rows={6}
                  />
                </Field>
              </div>

              <div className="problem-editor-grid two">
                <Field
                  label="Constraints"
                  hint="Put one constraint on each line."
                  required
                >
                  <textarea
                    value={form.constraints}
                    onChange={(event) => setField("constraints", event.target.value)}
                    placeholder={"1 ≤ N ≤ 2 × 10⁵\n1 ≤ M ≤ 2 × 10⁵\n1 ≤ w ≤ 10⁹"}
                    rows={6}
                  />
                </Field>
                <RichTextEditor
                  label="Notes or hints"
                  hint="Optional clarifications; avoid revealing the solution."
                  value={form.notes}
                  onChange={(value) => setField("notes", value)}
                  placeholder={"- The graph may contain parallel edges.\n- The answer fits in 64-bit signed integer."}
                  rows={6}
                />
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="problem-editor-step">
              <div className="problem-editor-section-heading">
                <Beaker size={20} />
                <div>
                  <h3>Examples and judge tests</h3>
                  <p>Examples are public. Judge tests remain separate and are used for evaluation.</p>
                </div>
              </div>

              <div className="problem-case-group">
                <div className="problem-case-group-header">
                  <div>
                    <h4><Eye size={17} /> Public examples</h4>
                    <p>Show two or three representative cases with a useful explanation.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addListItem("examples", EMPTY_EXAMPLE)}
                  >
                    <Plus size={15} /> Add example
                  </button>
                </div>

                {form.examples.map((example, index) => (
                  <article className="problem-case-editor" key={`example-${index}`}>
                    <div className="problem-case-title">
                      <strong>Example {index + 1}</strong>
                      {form.examples.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeListItem("examples", index)}
                          aria-label={`Remove example ${index + 1}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                    <div className="problem-editor-grid two">
                      <Field label="Input" required>
                        <textarea
                          className="code-input"
                          value={example.input}
                          onChange={(event) =>
                            updateListItem("examples", index, "input", event.target.value)
                          }
                          rows={4}
                        />
                      </Field>
                      <Field label="Output" required>
                        <textarea
                          className="code-input"
                          value={example.output}
                          onChange={(event) =>
                            updateListItem("examples", index, "output", event.target.value)
                          }
                          rows={4}
                        />
                      </Field>
                    </div>
                    <RichTextEditor
                      label="Explanation"
                      hint="Shown as a collapsible section on the problem page."
                      value={example.explanation}
                      onChange={(value) =>
                        updateListItem("examples", index, "explanation", value)
                      }
                      placeholder={"Explain how the output is obtained.\n\n- Key step one\n- Key step two"}
                      rows={5}
                    />
                  </article>
                ))}
              </div>

              <div className="problem-case-group judge-tests">
                <div className="problem-case-group-header">
                  <div>
                    <h4><ShieldCheck size={17} /> Judge test cases</h4>
                    <p>Include edge cases and large cases. These are not displayed as examples.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addListItem("testCases", EMPTY_TEST_CASE)}
                  >
                    <Plus size={15} /> Add test
                  </button>
                </div>

                {form.testCases.map((testCase, index) => (
                  <article className="problem-case-editor" key={`test-${index}`}>
                    <div className="problem-case-title">
                      <strong>Judge case {index + 1}</strong>
                      {form.testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeListItem("testCases", index)}
                          aria-label={`Remove judge case ${index + 1}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                    <div className="problem-editor-grid two">
                      <Field label="Input" required>
                        <textarea
                          className="code-input"
                          value={testCase.input}
                          onChange={(event) =>
                            updateListItem("testCases", index, "input", event.target.value)
                          }
                          rows={4}
                        />
                      </Field>
                      <Field label="Expected output" required>
                        <textarea
                          className="code-input"
                          value={testCase.expectedOutput}
                          onChange={(event) =>
                            updateListItem("testCases", index, "expectedOutput", event.target.value)
                          }
                          rows={4}
                        />
                      </Field>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="problem-editor-step review-step">
              <div className="problem-editor-section-heading">
                <Eye size={20} />
                <div>
                  <h3>Review before publishing</h3>
                  <p>Check that a contestant can understand the task without guessing.</p>
                </div>
              </div>

              <div className="problem-review-hero">
                <div>
                  <span>{form.difficulty}</span>
                  <h3>{form.title || "Untitled problem"}</h3>
                  <p>{form.tags || "No tags added"}</p>
                </div>
                <div className="problem-review-limits">
                  <span>{form.timeLimit} ms</span>
                  <span>{form.memoryLimit} MB</span>
                </div>
              </div>

              <div className="problem-review-grid">
                {[
                  ["Formal statement", form.formalStatement],
                  ["Input format", form.inputFormat],
                  ["Output format", form.outputFormat],
                  ["Constraints", form.constraints],
                ].map(([label, value]) => (
                  <article key={label}>
                    <Check size={16} />
                    <div>
                      <strong>{label}</strong>
                      {value ? <ProblemText text={value} /> : <p>Missing</p>}
                    </div>
                  </article>
                ))}
              </div>

              <div className="problem-review-summary">
                <span><Eye size={16} /> {form.examples.length} public example(s)</span>
                <span><ShieldCheck size={16} /> {form.testCases.length} judge case(s)</span>
                <span><Code2 size={16} /> {form.timeComplexity || "No target complexity"}</span>
              </div>
            </section>
          )}
        </main>

        <footer className="problem-editor-footer">
          <div>
            {stepError && <p className="problem-editor-error">{stepError}</p>}
          </div>
          <div className="problem-editor-actions">
            <button type="button" className="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            {step > 0 && (
              <button type="button" className="secondary" onClick={() => goToStep(step - 1)}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" className="primary" onClick={() => goToStep(step + 1)}>
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" className="primary" onClick={handleSubmit} disabled={isSaving}>
                <Save size={16} />
                {isSaving ? "Saving..." : isEditing ? "Save changes" : "Publish problem"}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

ProblemEditorModal.propTypes = {
  problem: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
};

export default ProblemEditorModal;
