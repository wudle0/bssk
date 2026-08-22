import { useEffect, useRef } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

export default function EmojiPicker({ value, onChange, onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSelect = (emojiData) => {
    onChange(emojiData.native);
    onClose();
  };

  return (
    <div
      className="emoji-modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="emoji-modal">
        <Picker
          data={data}
          onEmojiSelect={handleSelect}
          locale="ko"
          theme="light"
          previewPosition="none"
          skinTonePosition="search"
          autoFocus
        />
      </div>
    </div>
  );
}
