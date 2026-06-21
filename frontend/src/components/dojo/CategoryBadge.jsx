import { Info } from "lucide-react";

export default function CategoryBadge({ challenge, onInfoClick }) {
  return (
    <div className="dojo-cat-badge" style={{ "--cat-color": challenge.color }}>
      <span className="dojo-cat-icon">{challenge.icon}</span>
      <div className="dojo-cat-info">
        <span className="dojo-cat-short">{challenge.categoryShort}</span>
        <span className="dojo-cat-full">{challenge.category}</span>
      </div>
      <button
        className="dojo-cat-info-btn"
        onClick={(e) => { e.stopPropagation(); onInfoClick?.(); }}
        title="What is this category?"
      >
        <Info size={14} />
      </button>
    </div>
  );
}
