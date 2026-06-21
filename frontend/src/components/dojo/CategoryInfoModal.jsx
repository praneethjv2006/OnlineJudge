import { X } from "lucide-react";
import { CATEGORY_INFO } from "../../data/dojoChallenges";

export default function CategoryInfoModal({ challenge, onClose }) {
  const info = CATEGORY_INFO[challenge.category];
  if (!info) return null;

  return (
    <div className="dojo-info-overlay" onClick={onClose}>
      <div className="dojo-info-modal" onClick={(e) => e.stopPropagation()}>
        <button className="dojo-info-close" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="dojo-info-header" style={{ "--cat-color": challenge.color }}>
          <span className="dojo-info-icon">{challenge.icon}</span>
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
