import { Info } from "lucide-react";
import PropTypes from "prop-types";
import CategoryIcon, { CATEGORY_META } from "./CategoryIcon";

export default function CategoryBadge({ challenge, onInfoClick }) {
  if (!challenge) return null;
  const meta = CATEGORY_META[challenge.category];
  const color = meta?.color || challenge.color || "var(--accent)";

  return (
    <div className="dojo-cat-badge" style={{ "--cat-color": color }}>
      <span className="dojo-cat-icon">
        <CategoryIcon category={challenge.category} size={16} />
      </span>
      <div className="dojo-cat-info">
        <span className="dojo-cat-short">{meta?.short || challenge.categoryShort}</span>
        <span className="dojo-cat-full">{challenge.category}</span>
      </div>
      <button
        className="dojo-cat-info-btn"
        onClick={(e) => { e.stopPropagation(); onInfoClick?.(); }}
        title="What is this category?"
        type="button"
      >
        <Info size={14} />
      </button>
    </div>
  );
}

CategoryBadge.propTypes = {
  challenge: PropTypes.object,
  onInfoClick: PropTypes.func,
};
