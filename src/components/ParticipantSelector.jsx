import { useState } from 'react';
import { MEMBERS } from '../utils/helpers';

export default function ParticipantSelector({ value, onChange }) {
  const [customInput, setCustomInput] = useState('');

  const toggle = (name) => {
    if (value.includes(name)) {
      onChange(value.filter((v) => v !== name));
    } else {
      onChange([...value, name]);
    }
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setCustomInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div className="participant-selector">
        {MEMBERS.map((name) => (
          <button
            key={name}
            type="button"
            className={`participant-selector__chip${value.includes(name) ? ' participant-selector__chip--active' : ''}`}
            onClick={() => toggle(name)}
          >
            {name}
            {value.includes(name) && (
              <span className="participant-selector__chip-remove">✕</span>
            )}
          </button>
        ))}
        {value
          .filter((v) => !MEMBERS.includes(v))
          .map((name) => (
            <button
              key={name}
              type="button"
              className="participant-selector__chip participant-selector__chip--active"
              onClick={() => toggle(name)}
            >
              {name}
              <span className="participant-selector__chip-remove">✕</span>
            </button>
          ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          className="form__input"
          style={{ flex: 1, fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
          placeholder="직접 입력 후 추가"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
        />
        <button type="button" className="btn btn--secondary btn--sm" onClick={addCustom}>
          추가
        </button>
      </div>
    </div>
  );
}
