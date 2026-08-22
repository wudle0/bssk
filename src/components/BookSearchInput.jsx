import { useState, useRef, useEffect } from 'react';
import { useBookSearch } from '../hooks/useBookSearch';

export default function BookSearchInput({ value, onChange, onSelect, error }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const { results, loading } = useBookSearch(value);
  const hasKey = !!import.meta.env.VITE_KAKAO_API_KEY;

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handler = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (book) => {
    onSelect(book);
    setOpen(false);
  };

  return (
    <div className="book-search" ref={wrapRef}>
      <div className="book-search__input-wrap">
        <input
          type="text"
          className={`form__input book-search__input ${error ? 'form__input--error' : ''}`}
          placeholder="책 제목을 입력하면 자동으로 검색됩니다"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => { if (value.length >= 2) setOpen(true); }}
          autoComplete="off"
        />
        {loading && <span className="book-search__spinner" />}
      </div>

      {open && results.length > 0 && (
        <ul className="book-search__dropdown">
          {results.map((book, i) => (
            <li
              key={i}
              className="book-search__item"
              onMouseDown={() => handleSelect(book)}
            >
              <div className="book-search__cover">
                {book.coverUrl
                  ? <img src={book.coverUrl} alt={book.title} onError={(e) => { e.target.style.display='none'; }} />
                  : <span>📚</span>}
              </div>
              <div className="book-search__info">
                <span className="book-search__title">{book.title}</span>
                <span className="book-search__meta">{book.author} · {book.publisher}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!hasKey && value.length > 0 && (
        <p className="book-search__hint">
          💡 자동완성을 쓰려면 .env.local에 <code>VITE_KAKAO_API_KEY</code>를 추가하세요.
        </p>
      )}
    </div>
  );
}
