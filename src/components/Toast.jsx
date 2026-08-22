import { useEffect, useState } from 'react';

export default function Toast({ message, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 2800);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${visible ? 'toast--visible' : ''}`}>
      <span className="toast__icon">✓</span>
      {message}
    </div>
  );
}
