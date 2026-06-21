import PropTypes from "prop-types";

const renderInlineText = (text) =>
  text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });

function ProblemText({ text }) {
  const blocks = String(text || "")
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="problem-rich-text">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const isBulletList = lines.every((line) => /^[-*•]\s+/.test(line));
        const isNumberedList = lines.every((line) => /^\d+[.)]\s+/.test(line));

        if (isBulletList) {
          return (
            <ul key={`block-${blockIndex}`}>
              {lines.map((line, lineIndex) => (
                <li key={`line-${lineIndex}`}>
                  {renderInlineText(line.replace(/^[-*•]\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol key={`block-${blockIndex}`}>
              {lines.map((line, lineIndex) => (
                <li key={`line-${lineIndex}`}>
                  {renderInlineText(line.replace(/^\d+[.)]\s+/, ""))}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={`block-${blockIndex}`}>
            {lines.map((line, lineIndex) => (
              <span key={`line-${lineIndex}`}>
                {renderInlineText(line)}
                {lineIndex < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

ProblemText.propTypes = {
  text: PropTypes.string,
};

export default ProblemText;
