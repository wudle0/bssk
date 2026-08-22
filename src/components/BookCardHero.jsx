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

export default function BookCardHero({ record }) {
  const navigate = useNavigate();
  const colorIdx = getCardColor(record.id);
  const mvp = getMVP(record);

  return (
    <div
      className={`book-card-hero fade-in-up book-card-hero--color-${colorIdx}`}
      onClick={() => navigate(`/detail/${record.id}`)}
    >
      <div className="book-card-hero__stripe" />

      <div className="book-card-hero__cover-wrap">
        {record.coverUrl
          ? <img className="book-card-hero__cover" src={record.coverUrl} alt={record.book}
              onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
          : null}
        <div className="book-card-hero__cover-placeholder" style={{ display: record.coverUrl ? 'none' : 'flex' }}>
          <span>📚</span>
        </div>
      </div>

      <div className="book-card-hero__body">
        <div className="book-card-hero__top">
          <span className="book-card-hero__no">No.{record.no}</span>
          {record.emoji && <span className="book-card-hero__emoji">{record.emoji}</span>}
        </div>
        <h3 className="book-card-hero__title">{record.book}</h3>
        {record.chapter && (
          <div className="book-card-hero__chapter">📖 {record.chapter}</div>
        )}
        {mvp && (
          <div className="book-card-hero__mvp">
            {mvp.keys.map((k) => {
              const m = getMemberByKey(k);
              return (
                <span key={k} className="book-card-hero__mvp-badge" style={m ? { backgroundColor: m.color } : undefined}>
                  🏆 {k}
                </span>
              );
            })}
          </div>
        )}

        {record.topic && (
          <div className="book-card-hero__topic">
            <span className="book-card-hero__topic-label">화두</span>
            {record.topic}
          </div>
        )}

        <div className="book-card-hero__footer">
          {record.meetingType && (
            <span className="book-card-hero__tag">{record.meetingType}</span>
          )}
          {record.presenter && (
            <span className="book-card-hero__tag">발제 {record.presenter}</span>
          )}
          {record.participants?.length > 0 && (
            <span className="book-card-hero__tag">
              {record.participants.join(' · ')}
            </span>
          )}
          {record.discussionDate && (
            <span className="book-card-hero__tag book-card-hero__tag--date">
              {formatShortDate(record.discussionDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
