import { useNavigate } from 'react-router-dom';
import { formatShortDate, getMVP, getMemberByKey } from '../utils/helpers';

const CARD_COLORS = 5;

function getCardColor(id) {
  let hash = 0;
  for (let i = 0; i < (id || '').length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % CARD_COLORS;
}

export default function BookCard({ record }) {
  const navigate = useNavigate();
  const colorIdx = getCardColor(record.id);
  const mvp = getMVP(record);

  return (
    <div
      className={`book-card fade-in-up book-card--color-${colorIdx}`}
      onClick={() => navigate(`/detail/${record.id}`)}
    >
      {/* 표지 */}
      <div className="book-card__cover-wrap">
        {record.coverUrl
          ? <img className="book-card__cover" src={record.coverUrl} alt={record.book}
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
          : null}
        <div className="book-card__cover-placeholder" style={{ display: record.coverUrl ? 'none' : 'flex' }}>
          <span>📚</span>
        </div>
      </div>

      {/* 정보 */}
      <div className="book-card__info">
        <div className="book-card__top">
          <span className="book-card__no">No.{record.no}</span>
          {record.emoji && <span className="book-card__emoji">{record.emoji}</span>}
        </div>
        <h3 className="book-card__title">{record.book}</h3>
        {record.chapter && (
          <p className="book-card__chapter">📖 {record.chapter}</p>
        )}
        {record.author && <p className="book-card__author">{record.author}</p>}
        {record.discussionDate && (
          <p className="book-card__date">{formatShortDate(record.discussionDate)}</p>
        )}
        {mvp && (
          <div className="book-card__mvp">
            {mvp.keys.map((k) => {
              const m = getMemberByKey(k);
              return (
                <span key={k} className="book-card__mvp-badge" style={m ? { backgroundColor: m.color } : undefined}>
                  🏆 {k}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
