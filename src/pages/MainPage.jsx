import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecords } from "../context/RecordsContext";
import BookCard from "../components/BookCard";
import BookCardHero from "../components/BookCardHero";
import GuidelineModal from "../components/GuidelineModal";
import {
	isThisWeek,
	isThisTwoWeeks,
	formatShortDate,
	getCurrentWeekLabel,
	getMVP,
	getMVPStats,
	getMemberByKey,
	MEMBERS,
} from "../utils/helpers";

export default function MainPage() {
	const navigate = useNavigate();
	const { records, loading } = useRecords();
	const [showGuideline, setShowGuideline] = useState(false);
	const [viewMode, setViewMode] = useState(() => localStorage.getItem("viewMode") || "list");

	const toggleView = (mode) => {
		setViewMode(mode);
		localStorage.setItem("viewMode", mode);
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

	const mvpStats = getMVPStats(records);

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
										<div className="hero__stat-num">{thisWeekRecords.length}</div>
										<div className="hero__stat-label">이번 주</div>
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
						{/* 이 주의 책 */}
						<section className="this-week">
							<div className="this-week__heading">
								<div className="this-week__label-group">
									<span className="this-week__badge">
										<span className="this-week__badge-dot" />
										최근 모임
									</span>
									<span className="this-week__week-label">{getCurrentWeekLabel()}</span>
								</div>
							</div>

							{thisWeekRecords.length === 0 ? (
								<div className="this-week__empty">
									<span className="this-week__empty-emoji">📚</span>
									최근 2주 내 토론 기록이 없어요.{" "}
									<span className="this-week__empty-link" onClick={() => navigate("/write")}>
										기록을 등록해보세요!
									</span>
								</div>
							) : (
								<div className="this-week__list">
									{thisWeekRecords.map((record) => (
										<BookCardHero key={record.id} record={record} />
									))}
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

							{sortedRecords.length === 0 ? (
								<div className="empty-state">
									<span className="empty-state__icon">📖</span>
									<p className="empty-state__text">아직 등록된 토론 기록이 없어요.</p>
									<p className="empty-state__sub">첫 번째 독서토론을 기록해보세요!</p>
								</div>
							) : viewMode === "grid" ? (
								<div className="record-grid">
									{sortedRecords.map((record) => (
										<BookCard key={record.id} record={record} />
									))}
								</div>
							) : (
								<div className="record-list">
									{sortedRecords.map((record) => (
										<RecordItem
											key={record.id}
											record={record}
											onClick={() => navigate(`/detail/${record.id}`)}
										/>
									))}
								</div>
							)}
						</section>
					</div>
				</div>
			</main>

			{showGuideline && <GuidelineModal onClose={() => setShowGuideline(false)} />}
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
