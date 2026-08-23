import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecords } from "../context/RecordsContext";
import BookCard from "../components/BookCard";
import BookCardHero from "../components/BookCardHero";
import GuidelineModal from "../components/GuidelineModal";
import CalendarModal from "../components/CalendarModal";
import {
	isThisTwoWeeks,
	formatShortDate,
	getMVP,
	getMVPStats,
	getMemberByKey,
	MEMBERS,
} from "../utils/helpers";

export default function MainPage() {
	const navigate = useNavigate();
	const { records, loading } = useRecords();
	const [showGuideline, setShowGuideline] = useState(false);
	const [showCalendar, setShowCalendar] = useState(false);
	const [viewMode, setViewMode] = useState(() => localStorage.getItem("viewMode") || "list");
	const [pageSize, setPageSize] = useState(() => Number(localStorage.getItem("pageSize")) || 50);
	const [currentPage, setCurrentPage] = useState(() => Number(sessionStorage.getItem("currentPage")) || 1);

	const goToPage = (page) => {
		setCurrentPage(page);
		sessionStorage.setItem("currentPage", page);
	};

	const toggleView = (mode) => {
		setViewMode(mode);
		localStorage.setItem("viewMode", mode);
		goToPage(1);
	};

	const changePageSize = (size) => {
		setPageSize(size);
		localStorage.setItem("pageSize", size);
		goToPage(1);
	};

	// No 내림차순, 같은 No면 등록일 내림차순
	const sortedRecords = [...records].sort((a, b) => {
		if (b.no !== a.no) return b.no - a.no;
		return new Date(b.createdAt) - new Date(a.createdAt);
	});

	// 첫 모임 날짜부터 오늘까지 경과 일수
	const daysTogetherCount = (() => {
		const dates = records
			.map((r) => r.discussionDate)
			.filter(Boolean)
			.map((d) => new Date(d));
		if (dates.length === 0) return 0;
		const firstDate = new Date(Math.min(...dates));
		firstDate.setHours(0, 0, 0, 0);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return Math.floor((today - firstDate) / (1000 * 60 * 60 * 24)) + 1;
	})();

	const thisWeekRecords = records
		.filter((r) => isThisTwoWeeks(r.discussionDate))
		.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

	// 다음 모임 — 오늘 이후 날짜 중 가장 가까운 1건
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const nextMeetingRecord = records
		.filter((r) => r.discussionDate && new Date(r.discussionDate) >= now)
		.sort((a, b) => new Date(a.discussionDate) - new Date(b.discussionDate))[0] ?? null;

	const mvpStats = getMVPStats(records);

	const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
	const pagedRecords = sortedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

	if (loading) {
		return (
			<main className="page-content">
				<div
					className="container"
					style={{ paddingTop: "4rem", textAlign: "center", color: "#9488b0" }}>
					<div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📚</div>
					<p>기록을 불러오는 중...</p>
				</div>
			</main>
		);
	}

	return (
		<>
			<main className="page-content">
				{/* 히어로 */}
				<section className="hero">
					<div className="container">
						<div className="hero__inner">
							<div className="hero__content">
								<p className="hero__eyebrow">📚 Book Club Record</p>
								<h1 className="hero__title">
									매주 일요일의
									<br />
									독서 토론회
								</h1>
								<p className="hero__desc">
									백·세·성·곽이 함께 읽고,
									<br />
									이야기하고, 기록합니다.
								</p>
								<div className="hero__actions">
									<button
										className="hero__cta hero__cta--primary"
										onClick={() => navigate("/write")}>
										✏️ 기록 등록하기
									</button>
									<button
										className="hero__cta hero__cta--secondary"
										onClick={() => setShowGuideline(true)}>
										📋 운영지침
									</button>
								</div>
								<div className="hero__stats">
									<div className="hero__stat">
										<div className="hero__stat-num">{records.length}</div>
										<div className="hero__stat-label">총 기록</div>
									</div>
								<div className="hero__stat">
									<div className="hero__stat-num">{nextMeetingRecord ? "D-" + Math.floor((new Date(nextMeetingRecord.discussionDate) - new Date().setHours(0,0,0,0)) / (1000*60*60*24)) : "—"}</div>
									<div className="hero__stat-label">다음 모임</div>
								</div>
									<div className="hero__stat">
										<div className="hero__stat-num">4</div>
										<div className="hero__stat-label">멤버</div>
									</div>
								</div>
								<div className="hero__mvp-stats">
									<span className="hero__mvp-stats-label">🏆 MVP 달성 횟수</span>
									<div className="hero__mvp-chips">
										{MEMBERS.map((key) => {
											const member = getMemberByKey(key);
											return (
												<div key={key} className="hero__mvp-chip">
													<span
														className="hero__mvp-chip-name"
														style={member ? { backgroundColor: member.color } : undefined}>
														{key}
													</span>
													<span className="hero__mvp-chip-count">{mvpStats[key]}회</span>
												</div>
											);
										})}
									</div>
									{daysTogetherCount > 0 && (
										<p className="hero__days-together">
											함께한 지 <strong>{daysTogetherCount.toLocaleString()}</strong>일째 🌱
										</p>
									)}
								</div>
							</div>
						</div>
					</div>
				</section>

				<div className="container">
					<div className="main-sections">
					{/* 다음 모임 */}
					<section className="this-week">
						<div className="this-week__heading" style={{ justifyContent: 'space-between' }}>
							<div className="this-week__label-group">
								<span className="this-week__badge">
									<span className="this-week__badge-dot" />
									다음 모임
									{nextMeetingRecord && (() => {
										const today = new Date(); today.setHours(0,0,0,0);
										const meet = new Date(nextMeetingRecord.discussionDate); meet.setHours(0,0,0,0);
										const diff = Math.floor((meet - today) / (1000*60*60*24));
										return (
											<>
												<span className="this-week__badge-sep">·</span>
												<span className="this-week__badge-date">
													{formatShortDate(nextMeetingRecord.discussionDate)}
												</span>
												<span className="this-week__badge-dday">
													{diff === 0 ? 'D-Day' : `D-${diff}`}
												</span>
											</>
										);
									})()}
								</span>
							</div>
							<button
								className="cal-open-btn"
								onClick={() => setShowCalendar(true)}
								title="캘린더 보기">
								📅
							</button>
						</div>

						{!nextMeetingRecord ? (
							<div className="this-week__empty">
								<span className="this-week__empty-emoji">📅</span>
								예정된 다음 모임이 없어요.{" "}
								<span className="this-week__empty-link" onClick={() => navigate("/write")}>
									기록을 등록해보세요!
								</span>
							</div>
						) : (
							<div className="this-week__list">
								<BookCardHero record={nextMeetingRecord} />
							</div>
						)}
						</section>

						<div className="section-divider" />

						{/* 전체 기록 */}
						<section>
							<div className="record-section__title">
								<div className="record-section__title-left">
									전체 기록
									<span className="record-section__count">{sortedRecords.length}편</span>
								</div>
								<div className="record-section__controls">
									<select
										className="page-size-select"
										value={pageSize}
										onChange={(e) => changePageSize(Number(e.target.value))}>
										{[10, 20, 30, 50, 100].map((n) => (
											<option key={n} value={n}>{n}개씩 보기</option>
										))}
									</select>
									<div className="view-toggle">
										<button
											className={`view-toggle__btn ${viewMode === "list" ? "view-toggle__btn--active" : ""}`}
											onClick={() => toggleView("list")}
											title="리스트 보기">
											☰
										</button>
										<button
											className={`view-toggle__btn ${viewMode === "grid" ? "view-toggle__btn--active" : ""}`}
											onClick={() => toggleView("grid")}
											title="바둑판 보기">
											⊞
										</button>
									</div>
								</div>
							</div>

							{sortedRecords.length === 0 ? (
								<div className="empty-state">
									<span className="empty-state__icon">📖</span>
									<p className="empty-state__text">아직 등록된 토론 기록이 없어요.</p>
									<p className="empty-state__sub">첫 번째 독서토론을 기록해보세요!</p>
								</div>
							) : viewMode === "grid" ? (
								<div className="record-grid">
									{pagedRecords.map((record) => (
										<BookCard key={record.id} record={record} />
									))}
								</div>
							) : (
								<div className="record-list">
									{pagedRecords.map((record) => (
										<RecordItem
											key={record.id}
											record={record}
											onClick={() => navigate(`/detail/${record.id}`)}
										/>
									))}
								</div>
							)}

							{/* 페이지네이션 */}
							{totalPages > 1 && (
								<div className="pagination">
								<button
									className="pagination__btn"
									onClick={() => goToPage(1)}
									disabled={currentPage === 1}>
									«
								</button>
								<button
									className="pagination__btn"
									onClick={() => goToPage(Math.max(1, currentPage - 1))}
									disabled={currentPage === 1}>
									‹
								</button>
								{Array.from({ length: totalPages }, (_, i) => i + 1)
									.filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
									.reduce((acc, p, idx, arr) => {
										if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
										acc.push(p);
										return acc;
									}, [])
									.map((p, i) =>
										p === '…' ? (
											<span key={`ellipsis-${i}`} className="pagination__ellipsis">…</span>
										) : (
											<button
												key={p}
												className={`pagination__btn${currentPage === p ? ' pagination__btn--active' : ''}`}
												onClick={() => goToPage(p)}>
												{p}
											</button>
										)
									)}
								<button
									className="pagination__btn"
									onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
									disabled={currentPage === totalPages}>
									›
								</button>
								<button
									className="pagination__btn"
									onClick={() => goToPage(totalPages)}
									disabled={currentPage === totalPages}>
									»
								</button>
								</div>
							)}
						</section>
					</div>
				</div>
			</main>

			{showGuideline && <GuidelineModal onClose={() => setShowGuideline(false)} />}
		{showCalendar && <CalendarModal records={records} onClose={() => setShowCalendar(false)} />}
		</>
	);
}

function RecordItem({ record, onClick }) {
	const thisWeek = isThisTwoWeeks(record.discussionDate);
	const mvp = getMVP(record);
	return (
		<div className="record-item" onClick={onClick}>
			<div className="record-item__no">
				<span>No.{record.no}</span>
				{record.emoji && <span className="record-item__emoji">{record.emoji}</span>}
			</div>
			<div className="record-item__body">
				<div className="record-item__title">
					{thisWeek && <span className="this-week-badge-inline">최근</span>}
					{record.book}
				</div>
				{record.chapter && <span className="record-item__chapter">📖 {record.chapter}</span>}
				<div className="record-item__sub">
					<span>{record.meetingType}</span>
					{record.presenter && (
						<>
							<span>·</span>
							<span>발제 {record.presenter}</span>
						</>
					)}
					{record.participants?.length > 0 && (
						<>
							<span>·</span>
							<span>{record.participants.join(", ")}</span>
						</>
					)}
				</div>
			</div>
			<div className="record-item__right">
				{mvp && (
					<div className="record-item__mvp">
						{mvp.keys.map((k) => {
							const m = getMemberByKey(k);
							return (
								<span
									key={k}
									className="record-item__mvp-badge"
									style={m ? { backgroundColor: m.color } : undefined}>
									🏆 {k}
								</span>
							);
						})}
					</div>
				)}
				{record.discussionDate && (
					<span className="record-item__date">{formatShortDate(record.discussionDate)}</span>
				)}
				<span className="record-item__arrow">›</span>
			</div>
		</div>
	);
}
