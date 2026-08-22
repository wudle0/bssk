export const MEMBERS = ['백', '세', '성', '곽'];

export const MEMBER_PROFILES = [
  { key: '백', fullName: '백소현', birthday: '961012', color: '#3d5a90', colorPale: '#eef1f8' },
  { key: '세', fullName: '신세현', birthday: '960913', color: '#d96b52', colorPale: '#fdf0ed' },
  { key: '성', fullName: '우성민', birthday: '950801', color: '#2a9d6f', colorPale: '#e6f7f1' },
  { key: '곽', fullName: '곽현진', birthday: '960427', color: '#7c3aed', colorPale: '#f0ebff' },
];

export function getMemberByBirthday(birthday) {
  return MEMBER_PROFILES.find((m) => m.birthday === birthday) ?? null;
}

export function getMemberByKey(key) {
  return MEMBER_PROFILES.find((m) => m.key === key) ?? null;
}

// ─── Likes / MVP ──────────────────────────────────────────────────────────────

// 특정 화두에서 특정 수신자가 받은 따봉 수
export function getLikeCount(likes, topicIdx, recipientKey) {
  const topicLikes = likes?.[String(topicIdx)] ?? {};
  return Object.values(topicLikes).filter((v) => v === recipientKey).length;
}

// 특정 화두에서 giverKey가 준 따봉의 수신자 key (없으면 null)
export function getUserLike(likes, topicIdx, giverKey) {
  return likes?.[String(topicIdx)]?.[giverKey] ?? null;
}

// 기록 하나의 MVP 계산 { keys: string[], count: number } | null
export function getMVP(record) {
  if (!record.likes || !record.participants?.length) return null;
  const counts = {};
  record.participants.forEach((p) => { counts[p] = 0; });
  Object.values(record.likes).forEach((topicLikes) => {
    Object.values(topicLikes).forEach((recipient) => {
      if (counts[recipient] !== undefined) counts[recipient]++;
    });
  });
  const max = Math.max(...Object.values(counts));
  if (max === 0) return null;
  const mvpKeys = Object.entries(counts)
    .filter(([, v]) => v === max)
    .map(([k]) => k);
  return { keys: mvpKeys, count: max };
}

// 전체 기록에서 멤버별 MVP 달성 횟수 { 백: 2, 세: 1, ... }
export function getMVPStats(records) {
  const stats = {};
  MEMBERS.forEach((m) => { stats[m] = 0; });
  records.forEach((record) => {
    const mvp = getMVP(record);
    if (mvp) mvp.keys.forEach((k) => { if (stats[k] !== undefined) stats[k]++; });
  });
  return stats;
}

export const MEETING_TYPES = [
  '독서토론',
  '임시회의',
  '파티',
  '독서발표회',
];

export function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  // 월요일 시작 기준
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

export function isThisWeek(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const { start, end } = getWeekRange();
  return date >= start && date <= end;
}

export function isThisTwoWeeks(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const { start, end } = getWeekRange();
  // 이번 주 + 지난 주 (총 2주)
  const twoWeeksStart = new Date(start);
  twoWeeksStart.setDate(start.getDate() - 7);
  return date >= twoWeeksStart && date <= end;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const timeStr = minutes > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}`
    : `${hours}시`;
  return `${year}.${month}.${day} (${weekday}) ${timeStr}`;
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${year}. ${month}/${day} (${weekday})`;
}

export function getCurrentWeekLabel() {
  const { start, end } = getWeekRange();
  const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(start)} ~ ${fmt(end)}`;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
