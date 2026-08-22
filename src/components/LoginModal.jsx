import { useState } from 'react';
import { useUser } from '../context/UserContext';

export default function LoginModal() {
  const { login } = useUser();
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleBirthdayChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setBirthday(val);
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('이름을 입력해주세요.'); return; }
    if (birthday.length !== 6) { setError('생년월일 6자리를 모두 입력해주세요.'); return; }

    const result = login(name.trim(), birthday);
    if (!result.success) {
      setError(result.message);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="login-overlay">
      <div className={`login-card${shake ? ' login-card--shake' : ''}`}>
        <div className="login-card__logo">
          <span className="login-card__logo-icon">📚</span>
          <span className="login-card__logo-title">Reading and Discussion</span>
          <span className="login-card__logo-sub">백 · 세 · 성 · 곽의 독서 모임</span>
        </div>

        <h2 className="login-card__title">누구세요?</h2>
        <p className="login-card__desc">이름과 생년월일 6자리로 확인할게요.</p>

        <form className="login-card__form" onSubmit={handleSubmit} noValidate>
          <div className="login-card__field">
            <label className="login-card__label">이름</label>
            <input
              className="login-card__input"
              type="text"
              placeholder="본명을 입력해주세요"
              value={name}
              onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
              autoFocus
            />
          </div>

          <div className="login-card__field">
            <label className="login-card__label">생년월일 6자리</label>
            <input
              className="login-card__input login-card__input--mono"
              type="text"
              inputMode="numeric"
              placeholder="예) 961012"
              maxLength={6}
              value={birthday}
              onChange={handleBirthdayChange}
            />
          </div>

          {error && <p className="login-card__error">{error}</p>}

          <button className="login-card__btn" type="submit">
            입장하기
          </button>
        </form>
      </div>
    </div>
  );
}
