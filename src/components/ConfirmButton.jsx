/**
 * Two-step destructive button: the first click asks for confirmation,
 * the second performs the action. Escape or Cancel backs out.
 */
import { useEffect, useRef, useState } from 'react';

export default function ConfirmButton({ label, confirmLabel = 'Yes, I’m sure', prompt = 'Are you sure?', onConfirm, className = 'btn btn-danger' }) {
  const [asking, setAsking] = useState(false);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (asking) cancelRef.current?.focus();
  }, [asking]);

  if (!asking) {
    return (
      <button type="button" className={className} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }
  return (
    <div className="confirm" role="group" aria-label={prompt} onKeyDown={(e) => e.key === 'Escape' && setAsking(false)}>
      <p className="confirm-prompt">{prompt}</p>
      <div className="btn-row">
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            setAsking(false);
            onConfirm();
          }}
        >
          {confirmLabel}
        </button>
        <button type="button" className="btn" ref={cancelRef} onClick={() => setAsking(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
