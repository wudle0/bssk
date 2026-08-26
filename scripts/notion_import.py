#!/usr/bin/env python3
"""
노션 HTML 내보내기 파일을 파싱해서 Supabase records 테이블을 업데이트합니다.
"""

import os, re, json, sys, time
import requests
from html.parser import HTMLParser

# ── 설정 ─────────────────────────────────────────────────────────────────────
NOTION_DIR = "/Users/wudle/Downloads/개인 페이지 & 공유된 페이지/Reading and Discussion"
SUPABASE_URL = "https://ckxvwklzqfjmvhwmyetn.supabase.co"
SUPABASE_KEY = "sb_publishable_ZUUh4NntfC9pnpaBqhdKqQ_udVnB9XG"

# 멤버 이름 → 키 매핑
MEMBER_ALIASES = {
    '곽': ['곽현진', 'hj', '현진', '곽'],
    '백': ['백소현', '소현 백', '모래', '소현', '백'],
    '성': ['우성민', 'wudle', '성민', '성'],
    '세': ['신세현', 'ella shin', 'ella', '세현', '세'],
}

def get_member_key(name: str):
    """이름 문자열에서 백/세/성/곽 키를 반환"""
    n = name.lower().strip()
    for key, aliases in MEMBER_ALIASES.items():
        for alias in aliases:
            if alias.lower() in n or n in alias.lower():
                return key
    return None

# ── HTML 파서 ─────────────────────────────────────────────────────────────────
class NotionPageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self._skip = False
        self._tag_stack = []

        # 속성 파싱 상태
        self._in_props = False
        self._in_th = False
        self._in_td = False
        self._cur_prop_label = None

        # 추출된 속성값
        self.no = None
        self.book = None
        self.topics_raw = []    # 화두 (여러 줄 가능)
        self.meeting_type = None
        self.presenter_key = None
        self.participants = []  # ['백','세','성','곽']
        self.discussion_date = None

        # 본문 파싱 상태
        self._in_body = False
        self.body_tokens = []   # 본문 텍스트 토큰 목록

    def handle_starttag(self, tag, attrs):
        if tag in ('style', 'script'):
            self._skip = True
            return
        self._tag_stack.append(tag)
        a = dict(attrs)
        cls = a.get('class', '')

        if 'properties' in cls:
            self._in_props = True
        if 'page-body' in cls:
            self._in_body = True
            self._in_props = False

        if self._in_props:
            if tag == 'tr':
                self._in_th = False
                self._in_td = False
                self._cur_prop_label = None
            elif tag == 'th':
                self._in_th = True
                self._in_td = False
            elif tag == 'td':
                self._in_td = True
                self._in_th = False

    def handle_endtag(self, tag):
        if tag in ('style', 'script'):
            self._skip = False
            return
        if self._tag_stack and self._tag_stack[-1] == tag:
            self._tag_stack.pop()
        if tag == 'table' and self._in_props:
            self._in_props = False
        if tag == 'th':
            self._in_th = False
        if tag == 'td':
            self._in_td = False

    def handle_data(self, data):
        if self._skip:
            return
        text = data.strip()
        if not text:
            return

        if self._in_props:
            if self._in_th:
                self._cur_prop_label = text
            elif self._in_td and self._cur_prop_label:
                self._ingest_property(self._cur_prop_label, text)
        elif self._in_body:
            self.body_tokens.append(text)

    def _ingest_property(self, label: str, value: str):
        if label == 'No':
            m = re.search(r'\d+', value)
            if m:
                self.no = int(m.group())
        elif label == '이 주의 책':
            m = re.match(r'\[(.+?)\]', value)
            self.book = m.group(1) if m else value.split('/')[0].strip()
        elif label == '화두':
            self.topics_raw.append(value.strip())
        elif label == '회의 유형':
            self.meeting_type = value
        elif label == '발제자':
            key = get_member_key(value)
            if key and not self.presenter_key:
                self.presenter_key = key
        elif label == '참가자':
            key = get_member_key(value)
            if key and key not in self.participants:
                self.participants.append(key)
        elif label == '토론 일시':
            self.discussion_date = value


def parse_topics(raw_list):
    """화두 속성 값 목록 → 화두 제목 목록"""
    topics = []
    for raw in raw_list:
        for line in raw.split('\n'):
            line = line.strip()
            cleaned = re.sub(r'^\d+[.)\-]\s*', '', line).strip()
            if cleaned:
                topics.append(cleaned)
    return topics if topics else ['']


def parse_opinions(body_tokens):
    """본문 토큰 목록 → opinions dict
    단일 화두: {'백': 'text', ...}
    복수 화두: {'백': ['text1','text2'], ...}
    """
    # 토큰을 (MEMBER | TEXT) 시퀀스로 분류
    segments = []       # [{member: key, lines: [...]}]
    inter_texts = []    # @이름 사이의 텍스트 (화두 제목 등)
    cur_member = None
    cur_lines = []

    for token in body_tokens:
        if token.startswith('@'):
            name = token[1:].strip()
            key = get_member_key(name)
            if key:
                if cur_member:
                    segments.append({'member': cur_member, 'text': '\n'.join(cur_lines).strip()})
                    cur_lines = []
                elif cur_lines:
                    inter_texts.append('\n'.join(cur_lines).strip())
                    cur_lines = []
                cur_member = key
                continue

        if cur_member:
            cur_lines.append(token)
        else:
            cur_lines.append(token)  # 화두 제목 등 (@ 이전 텍스트)

    if cur_member:
        segments.append({'member': cur_member, 'text': '\n'.join(cur_lines).strip()})

    if not segments:
        return {}

    # 화두별 그룹 분리: 같은 멤버가 두 번 나오면 새 화두
    topics = [{}]  # [{member: text}]
    for seg in segments:
        m = seg['member']
        if m in topics[-1]:          # 이미 이 멤버가 현재 화두에 있음 → 다음 화두
            topics.append({})
        topics[-1][m] = seg['text']

    # 결과 조립
    all_members = set()
    for t in topics:
        all_members.update(t.keys())

    if len(topics) == 1:
        return {m: topics[0].get(m, '') for m in all_members}
    else:
        return {m: [t.get(m, '') for t in topics] for m in all_members}


def parse_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"  읽기 오류: {e}")
        return None

    p = NotionPageParser()
    p.feed(content)

    if not p.no and not p.book:
        return None  # 독서토론 레코드가 아님

    topics = parse_topics(p.topics_raw)
    opinions = parse_opinions(p.body_tokens)

    return {
        'no': p.no,
        'book': p.book,
        'topics': topics,
        'opinions': opinions,
        'meetingType': p.meeting_type,
        'presenterKey': p.presenter_key,
        'participants': p.participants,
        'discussionDateRaw': p.discussion_date,
        '_file': os.path.basename(filepath),
    }


# ── Supabase 통신 ─────────────────────────────────────────────────────────────
HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
}

def fetch_all_records():
    url = f"{SUPABASE_URL}/rest/v1/records?select=id,no,book,opinions,topics,likes&limit=1000"
    r = requests.get(url, headers=HEADERS)
    if r.status_code != 200:
        print(f"[ERROR] Supabase 조회 실패: {r.status_code} {r.text}")
        sys.exit(1)
    return r.json()

def update_record(record_id, data):
    url = f"{SUPABASE_URL}/rest/v1/records?id=eq.{record_id}"
    r = requests.patch(url, headers=HEADERS, json=data)
    return r.status_code in (200, 204)

def opinions_empty(opinions):
    if not opinions:
        return True
    for v in opinions.values():
        if isinstance(v, list):
            if any(s.strip() for s in v):
                return False
        elif isinstance(v, str) and v.strip():
            return False
    return True


# ── 메인 ─────────────────────────────────────────────────────────────────────
def main():
    dry_run = '--dry-run' in sys.argv
    skip_existing = '--skip-existing' not in sys.argv   # 기본은 빈 의견만 채움

    print("▶ 노션 HTML 파일 파싱 중…")
    parsed = []
    html_files = [f for f in os.listdir(NOTION_DIR) if f.endswith('.html')]
    for fname in sorted(html_files):
        fpath = os.path.join(NOTION_DIR, fname)
        result = parse_file(fpath)
        if result and result.get('no'):
            parsed.append(result)

    print(f"  → {len(parsed)}개 독서토론 레코드 파싱 완료")

    print("\n▶ Supabase에서 기존 레코드 가져오는 중…")
    db_records = fetch_all_records()
    print(f"  → {len(db_records)}개 레코드 존재")

    # No 기준으로 DB 레코드 인덱싱
    db_by_no = {}
    for r in db_records:
        if r.get('no') is not None:
            db_by_no.setdefault(r['no'], []).append(r)

    print("\n▶ 매칭 및 업데이트 시작…")
    updated = 0
    skipped = 0
    not_found = []

    for item in parsed:
        no = item['no']
        matches = db_by_no.get(no, [])

        if not matches:
            not_found.append(f"No.{no} [{item['book']}]")
            continue

        # 같은 No에 여러 레코드 있으면 책 제목으로 좁히기
        if len(matches) > 1:
            title_matches = [r for r in matches if
                             item['book'] and (item['book'] in (r.get('book') or '') or
                             (r.get('book') or '') in item['book'])]
            if title_matches:
                matches = title_matches

        db_rec = matches[0]
        rec_id = db_rec['id']

        # 의견이 이미 있으면 스킵 (--force 없는 경우)
        if not opinions_empty(db_rec.get('opinions', {})) and skip_existing:
            skipped += 1
            continue

        # 업데이트할 데이터 구성
        update_data = {}

        # 의견
        if item['opinions']:
            update_data['opinions'] = item['opinions']

        # 화두 (DB에 없는 경우만)
        existing_topics = db_rec.get('topics') or []
        if item['topics'] and not any(t for t in existing_topics if t.strip()):
            update_data['topics'] = item['topics']

        if not update_data:
            skipped += 1
            continue

        if dry_run:
            print(f"  [DRY] No.{no} {db_rec.get('book','?')} → {list(update_data.keys())}")
        else:
            ok = update_record(rec_id, update_data)
            status = "✓" if ok else "✗"
            print(f"  {status} No.{no} {db_rec.get('book','?')}")
            if ok:
                updated += 1
            time.sleep(0.05)  # rate limit 방지

    print(f"\n── 결과 ───────────────────────────")
    print(f"  업데이트: {updated}건")
    print(f"  스킵    : {skipped}건 (의견 이미 존재)")
    if not_found:
        print(f"  DB 미매칭: {len(not_found)}건")
        for nf in not_found[:20]:
            print(f"    - {nf}")

    # 파싱 결과 JSON 저장 (검증용)
    out_path = os.path.join(os.path.dirname(__file__), 'notion_parsed.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(parsed, f, ensure_ascii=False, indent=2)
    print(f"\n  파싱 결과 저장: {out_path}")


if __name__ == '__main__':
    main()
