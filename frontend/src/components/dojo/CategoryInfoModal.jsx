import { X } from "lucide-react";
import PropTypes from "prop-types";
import { CATEGORY_INFO } from "../../data/dojoChallenges";
import CategoryIcon, { CATEGORY_META } from "./CategoryIcon";

export default function CategoryInfoModal({ challenge, onClose }) {
  if (!challenge) return null;
  const info = CATEGORY_INFO[challenge.category];
  if (!info) return null;

  const meta = CATEGORY_META[challenge.category];
  const color = meta?.color || challenge.color || "var(--accent)";

  return (
    <div className="dojo-info-overlay" onClick={onClose}>
      <div className="dojo-info-modal" onClick={(e) => e.stopPropagation()}>
        <button className="dojo-info-close" onClick={onClose} type="button">
          <X size={18} />
        </button>
        <div className="dojo-info-header" style={{ "--cat-color": color }}>
          <span className="dojo-info-icon">
            <CategoryIcon category={challenge.category} size={24} />
          </span>
          <h3>{info.title}</h3>
        </div>
        <div className="dojo-info-body">
          <div className="dojo-info-section">
            <h4>What is this?</h4>
            <p>{info.description}</p>
          </div>
          <div className="dojo-info-section">
            <h4>What should you do?</h4>
            <p>{info.whatToDo}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

CategoryInfoModal.propTypes = {
  challenge: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
