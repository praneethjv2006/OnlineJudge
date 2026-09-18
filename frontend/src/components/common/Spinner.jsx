import PropTypes from "prop-types";

/**
 * Reusable animated loading spinner.
 * Usage: <Spinner size={32} /> or <Spinner text="Loading problems..." />
 */
export default function Spinner({ size = 36, text = "" }) {
  return (
    <div className="spinner-wrapper">
      <div className="spinner-ring" style={{ width: size, height: size }}>
        <svg viewBox="0 0 50 50" className="spinner-svg">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="80 120"
            className="spinner-track"
          />
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="80 120"
            className="spinner-arc"
          />
        </svg>
      </div>
      {text && <span className="spinner-text">{text}</span>}
    </div>
  );
}

Spinner.propTypes = {
  size: PropTypes.number,
  text: PropTypes.string,
};
