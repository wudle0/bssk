import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarModal({ records, onClose }) {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  // discussionDate → dateKey → record[] 맵
  const dateMap = {};
  records.forEach((r) => {
    if (!r.discussionDate) return;
    const key = toDateKey(r.discussionDate);
    if (!dateMap[key]) dateMap[key] = [];
    dateMap[key].push(r);
  });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  // 달력 날짜 배열 생성
  const firstDay = new Date(year, month, 1).getDay(); // 0=일
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = toDateKey(today);

  const handleDayClick = (day) => {
    if (!day) return;
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const recs = dateMap[key];
    if (recs?.length === 1) {
      onClose();
      navigate(`/detail/${recs[0].id}`);
    }
  };

  return (
    <div className="cal-overlay" onClick={onClose}>
      <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="cal-modal__header">
          <button className="cal-modal__nav" onClick={prevMonth}>‹</button>
          <div className="cal-modal__title">
            <span className="cal-modal__year">{year}</span>
            <span className="cal-modal__month">{month + 1}월</span>
            <button className="cal-modal__today-btn" onClick={goToday}>오늘</button>
          </div>
          <button className="cal-modal__nav" onClick={nextMonth}>›</button>
          <button className="cal-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* 요일 헤더 */}
        <div className="cal-grid cal-grid--header">
          {WEEKDAYS.map((d) => (
            <div key={d} className={`cal-weekday${d === '일' ? ' cal-weekday--sun' : d === '토' ? ' cal-weekday--sat' : ''}`}>
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="cal-grid cal-grid--body">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="cal-cell cal-cell--empty" />;
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const recs = dateMap[key];
            const isToday = key === todayKey;
            const dow = (firstDay + day - 1) % 7;
            const isSun = dow === 0;
            const isSat = dow === 6;

            return (
              <div
                key={day}
                className={[
                  'cal-cell',
                  isToday ? 'cal-cell--today' : '',
                  recs ? 'cal-cell--has-record' : '',
                  isSun ? 'cal-cell--sun' : '',
                  isSat ? 'cal-cell--sat' : '',
                  recs ? 'cal-cell--clickable' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleDayClick(day)}
              >
                <span className="cal-cell__day">{day}</span>
                {recs && (
                  <span className="cal-cell__dot" title={recs.map(r => r.book).join(', ')} />
                )}
              </div>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="cal-modal__legend">
          <span className="cal-legend__dot" />
          <span className="cal-legend__label">독토 기록 있는 날 (클릭하면 상세)</span>
        </div>
      </div>
    </div>
  );
}
