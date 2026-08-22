import { useEffect } from 'react';

export default function GuidelineModal({ onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">운영지침</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">
          <div className="modal__item">
            <span className="modal__num">1</span>
            <p>토론은 <strong>일요일 오후 10시</strong>에 시작</p>
          </div>
          <div className="modal__item">
            <span className="modal__num">2</span>
            <p>
              <span className="modal__notice">※ 가족행사 / 건강 / 피치 못한 사정 (회사 일, 사건 사고, 말할 수 없는 개인적인 일) ※</span>
              을 제외, 불참인은 <strong>자필반성문 A4 20줄 이상</strong> 작성 혹은 <strong>스벅 아아 두 잔씩</strong> 보내기
              <span className="modal__emphasis">(무조건)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
