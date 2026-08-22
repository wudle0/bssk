import { useState, useEffect, useRef } from 'react';

async function searchBooks(query) {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    target: 'title',
    query,
    size: 8,
  });

  const res = await fetch(`/api/kakao-book?${params}`);
  if (!res.ok) throw new Error('API 오류');

  const json = await res.json();
  if (json.errorType) throw new Error(json.message ?? 'API 오류');

  return (json.documents ?? []).map((d) => ({
    title: d.title ?? '',
    author: (d.authors ?? []).join(', '),
    publisher: d.publisher ?? '',
    isbn: (d.isbn ?? '').split(' ').pop(), // ISBN-13
    subject: d.genre ?? '',
    coverUrl: d.thumbnail ?? '',
    publishDate: (d.datetime ?? '').slice(0, 10),
  }));
}

export function useBookSearch(query) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchBooks(query);
        setResults(data);
      } catch (e) {
        setError(e.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  return { results, loading, error };
}
