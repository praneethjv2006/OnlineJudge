import { useEffect, useState } from "react";
import { X } from "lucide-react";
import PropTypes from "prop-types";

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setIsRendered(false), 200);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  return (
    <div className={`modal-root-wrapper ${isOpen ? "is-open" : ""}`}>
      {/* Backdrop */}
      <div 
        className="modal-backdrop-overlay" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="modal-content-container">
        
        {/* Header */}
        <div className="modal-header-container">
          <h3 className="modal-title-text">{title}</h3>
          <button
            onClick={onClose}
            className="modal-close-button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body-container">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="modal-footer-container">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  footer: PropTypes.node,
};

export default Modal;
