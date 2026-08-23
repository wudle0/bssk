import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecords } from "../context/RecordsContext";
import { useUser } from "../context/UserContext";
import { formatDate, isThisWeek, getMemberByKey, getLikeCount, getUserLike, getMVP } from "../utils/helpers";

export default function DetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { records, getRecord, deleteRecord, updateRecord } = useRecords();
	const { user } = useUser();

	const record = getRecord(id);

	// 사이드바 접기 상태
	const [sidebarCollapsed, setSidebarCollapsed] = useState(
		() => localStorage.getItem("sidebarCollapsed") === "true"
	);
	const toggleSidebar = () => {
		setSidebarCollapsed((prev) => {
			localStorage.setItem("sidebarCollapsed", !prev);
			return !prev;
		});
	};

	// 현재 활성 항목으로 사이드바 자동 스크롤
	useEffect(() => {
		if (!sidebarCollapsed) {
			const el = document.querySelector(".detail-sidebar__item--active");
			if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
		}
	}, [id, sidebarCollapsed]);

	// 사이드바용 정렬된 전체 기록
	const sortedRecords = [...records].sort((a, b) => {
		if (b.no !== a.no) return b.no - a.no;
		return new Date(b.createdAt) - new Date(a.createdAt);
	});
	const currentIdx = sortedRecords.findIndex((r) => r.id === id);
	const prevRecord = currentIdx < sortedRecords.length - 1 ? sortedRecords[currentIdx + 1] : null;
	const nextRecord = currentIdx > 0 ? sortedRecords[currentIdx - 1] : null;

	// 인라인 의견 수정 상태: { name, topicIdx }
	const [editing, setEditing] = useState(null);
	const [editText, setEditText] = useState("");

	if (!record) {
		return (
			<main className="page-content">
				<div className="container">
					<div className="empty-state">
						<div className="empty-state__icon">🔍</div>
						<p className="empty-state__text">기록을 찾을 수 없어요.</p>
						<button
							className="btn btn--secondary"
							style={{ marginTop: "1rem" }}
							onClick={() => navigate("/")}>
							목록으로 돌아가기
						</button>
					</div>
				</div>
			</main>
		);
	}

	const thisWeek = isThisWeek(record.discussionDate);

	const handleDelete = () => {
		if (window.confirm("이 기록을 삭제할까요?")) {
			deleteRecord(id);
			navigate("/");
		}
	};

	const topics = record.topics?.length ? record.topics : record.topic ? [record.topic] : [""];

	const startEdit = (name, topicIdx) => {
		setEditing({ name, topicIdx });
		const existing = record.opinions?.[name];
		setEditText(Array.isArray(existing) ? existing[topicIdx] || "" : existing || "");
	};

	const cancelEdit = () => {
		setEditing(null);
		setEditText("");
	};

	const saveOpinion = (name, topicIdx) => {
		const prev = record.opinions?.[name];
		const arr = Array.isArray(prev) ? [...prev] : prev ? [prev] : [];
		arr[topicIdx] = editText;
		updateRecord(id, {
			opinions: { ...record.opinions, [name]: arr },
		});
		setEditing(null);
		setEditText("");
	};

	const handleLike = (recipientKey, topicIdx) => {
		if (!user) return;
		if (user.key === recipientKey) return; // 자기 자신에게 불가
		const topicStr = String(topicIdx);
		const currentLikes = record.likes ?? {};
		const topicLikes = { ...(currentLikes[topicStr] ?? {}) };
		if (topicLikes[user.key] === recipientKey) {
			delete topicLikes[user.key]; // 이미 준 따봉 → 취소
		} else {
			topicLikes[user.key] = recipientKey; // 다른 사람 → 이동 or 새로 부여
		}
		updateRecord(id, { likes: { ...currentLikes, [topicStr]: topicLikes } });
	};

	const opinionsToShow = record.participants || [];
	const mvp = getMVP(record);

	return (
		<main className="page-content">
			<div className={`detail-layout${sidebarCollapsed ? ' detail-layout--collapsed' : ''}`}>
				{/* PC 사이드바 */}
				<aside className={`detail-sidebar${sidebarCollapsed ? ' detail-sidebar--collapsed' : ''}`}>
					{/* 헤더 (스크롤 안 됨) */}
					<div className="detail-sidebar__header">
						{!sidebarCollapsed && <span className="detail-sidebar__heading">전체 기록</span>}
						<button
							className="detail-sidebar__toggle"
							onClick={toggleSidebar}
							title={sidebarCollapsed ? '목록 펼치기' : '목록 접기'}
						>
							{sidebarCollapsed ? '›' : '‹'}
						</button>
					</div>

					{/* 스크롤 가능한 목록 */}
					<div className="detail-sidebar__inner">
						{sortedRecords.map((r) => {
							const isActive = r.id === id;
							const mvp = getMVP(r);
							return (
								<div
									key={r.id}
									className={`detail-sidebar__item${isActive ? ' detail-sidebar__item--active' : ''}`}
									onClick={() => !isActive && navigate(`/detail/${r.id}`)}
								>
									<span className="detail-sidebar__no">No.{r.no}</span>
									<span className="detail-sidebar__title">{r.book}</span>
									{mvp && <span className="detail-sidebar__mvp">🏆</span>}
								</div>
							);
						})}
					</div>
				</aside>

				{/* 메인 콘텐츠 */}
				<div className="detail-main">
					<div className="container">
						<div className="detail">
					{/* 상단 배너 */}
					<div className="detail__card">
						<div className="detail__banner">
							<div className="detail__cover-wrap">
								{record.coverUrl ? (
									<img
										className="detail__cover"
										src={record.coverUrl}
										alt={record.book}
										onError={(e) => {
											e.target.style.display = "none";
											e.target.nextSibling.style.display = "flex";
										}}
									/>
								) : null}
								<div
									className="detail__cover-placeholder"
									style={{ display: record.coverUrl ? "none" : "flex" }}>
									<span>📚</span>
								</div>
							</div>
							<div className="detail__no">No.{record.no}</div>
							{record.emoji && <div className="detail__emoji">{record.emoji}</div>}
							<h1 className="detail__title">{record.book}</h1>
							{record.chapter && (
								<div className="detail__chapter">
									<span className="detail__chapter-label">📖 챕터</span>
									<span className="detail__chapter-value">{record.chapter}</span>
								</div>
							)}
						<div className="detail__tags">
							{thisWeek && <span className="detail__tag">이번 주 토론</span>}
							{record.meetingType && <span className="detail__tag">{record.meetingType}</span>}
							{record.presenter && <span className="detail__tag">발제 · {record.presenter}</span>}
							{record.discussionDate && (
								<span className="detail__tag">{formatDate(record.discussionDate)}</span>
							)}
						</div>
						{mvp && (
							<div className="detail__mvp-banner">
								🏆 MVP
								{mvp.keys.map((k) => {
									const m = getMemberByKey(k);
									return (
										<span
											key={k}
											className="detail__mvp-name"
											style={m ? { backgroundColor: m.color } : undefined}
										>
											{k}
										</span>
									);
								})}
								<span className="detail__mvp-count">· {mvp.count}표</span>
							</div>
						)}
						</div>

						<div className="detail__body">
							{/* 화두 목록 */}
							{topics.filter((t) => t).length > 0 && (
								<div className="detail__topics">
									<div className="detail__topic-label">화두</div>
									{topics
										.filter((t) => t)
										.map((t, i) => (
											<div key={i} className="detail__topic-item">
												<span className="detail__topic-num">{i + 1}</span>
												<span className="detail__topic-text">{t}</span>
											</div>
										))}
								</div>
							)}

							{/* 정보 그리드 */}
							<div className="detail__info-grid">
								<div className="detail__info-item">
									<div className="detail__info-item-label">No</div>
									<div className="detail__info-item-value">{record.no}</div>
								</div>
								{record.author && (
									<div className="detail__info-item">
										<div className="detail__info-item-label">작가</div>
										<div className="detail__info-item-value">{record.author}</div>
									</div>
								)}
								{record.chapter && (
									<div className="detail__info-item">
										<div className="detail__info-item-label">챕터</div>
										<div className="detail__info-item-value">{record.chapter}</div>
									</div>
								)}
								<div className="detail__info-item">
									<div className="detail__info-item-label">회의유형</div>
									<div className="detail__info-item-value">{record.meetingType || "—"}</div>
								</div>
								<div className="detail__info-item">
									<div className="detail__info-item-label">발제자</div>
									<div className="detail__info-item-value">{record.presenter || "—"}</div>
								</div>
								<div className="detail__info-item">
									<div className="detail__info-item-label">토론 일시</div>
									<div className="detail__info-item-value">
										{record.discussionDate ? formatDate(record.discussionDate) : "—"}
									</div>
								</div>
								<div className="detail__info-item" style={{ gridColumn: "1 / -1" }}>
									<div className="detail__info-item-label">참가자</div>
									<div
										style={{
											display: "flex",
											flexWrap: "wrap",
											gap: "0.375rem",
											marginTop: "0.25rem",
										}}>
										{(record.participants || []).map((name) => {
											const member = getMemberByKey(name);
											return (
												<span
													key={name}
													className="participants-list__chip"
													style={member ? {
														backgroundColor: member.colorPale,
														color: member.color,
														borderColor: member.color + '44',
													} : undefined}
												>
													{name}
												</span>
											);
										})}
									</div>
								</div>
							</div>

							{/* 의견 섹션 — 화두별 */}
							{opinionsToShow.length > 0 &&
								topics.map((topic, topicIdx) => (
									<div key={topicIdx} className="detail__opinions">
										<div className="detail__opinions-title">
											{topics.length > 1 ? (
												<>
													<span className="detail__opinions-topic-num">{topicIdx + 1}</span>
													{topic || `화두 ${topicIdx + 1}`}
												</>
											) : (
												"그 날의 의견"
											)}
										</div>
										{opinionsToShow.map((name) => {
											const raw = record.opinions?.[name];
											const opinion = Array.isArray(raw)
												? raw[topicIdx]
												: topicIdx === 0
													? raw
													: "";
											const isEditing = editing?.name === name && editing?.topicIdx === topicIdx;
											const likeCount = getLikeCount(record.likes, topicIdx, name);
											const isLiked = user ? getUserLike(record.likes, topicIdx, user.key) === name : false;
											const isSelf = user?.key === name;
											const memberStyle = getMemberByKey(name);

											return (
												<div key={name} className="detail__opinion-item">
													<div className="detail__opinion-item-author">
														<div
															className="detail__opinion-item-author-avatar"
															style={memberStyle ? { backgroundColor: memberStyle.color } : undefined}
														>
															{name[0]}
														</div>
														<span className="detail__opinion-item-author-name">{name}</span>
														{!isSelf && (
															<button
																className={`like-btn${isLiked ? " like-btn--active" : ""}`}
																onClick={() => handleLike(name, topicIdx)}
																disabled={!user}
																title={user ? (isLiked ? "따봉 취소" : "따봉!") : "로그인 필요"}
															>
																👍 {likeCount > 0 && <span className="like-btn__count">{likeCount}</span>}
															</button>
														)}
														{!isEditing && (
															<button
																className="opinion-edit-btn"
																onClick={() => startEdit(name, topicIdx)}>
																{opinion ? "수정" : "작성"}
															</button>
														)}
													</div>
													{isEditing ? (
														<div className="opinion-editor">
															<textarea
																className="opinion-editor__textarea"
																value={editText}
																onChange={(e) => setEditText(e.target.value)}
																placeholder={`${name}의 의견을 적어주세요`}
																autoFocus
															/>
															<div className="opinion-editor__actions">
																<button className="btn btn--secondary btn--sm" onClick={cancelEdit}>
																	취소
																</button>
																<button
																	className="btn btn--primary btn--sm"
																	onClick={() => saveOpinion(name, topicIdx)}>
																	저장
																</button>
															</div>
														</div>
													) : (
														<p
															className={`detail__opinion-item-text${!opinion ? " detail__opinion-item-empty" : ""}`}>
															{opinion || "아직 의견이 없어요."}
														</p>
													)}
												</div>
											);
										})}
									</div>
								))}

							{/* 액션 버튼 */}
							<div className="detail__actions">
								<button className="btn btn--danger btn--sm" onClick={handleDelete}>
									삭제
								</button>
								<button className="btn btn--secondary btn--sm" onClick={() => navigate("/")}>
									목록
								</button>
								<button
									className="btn btn--primary btn--sm"
									onClick={() => navigate(`/edit/${id}`)}>
									기록 수정
								</button>
							</div>

						</div>{/* detail__body */}
					</div>{/* detail__card */}
				</div>{/* detail */}

				{/* 모바일 이전/다음 버튼 */}
				<div className="detail-prev-next">
					<button
						className="detail-prev-next__btn"
						onClick={() => prevRecord && navigate(`/detail/${prevRecord.id}`)}
						disabled={!prevRecord}
					>
						← {prevRecord ? `No.${prevRecord.no} ${prevRecord.book}` : '이전 글 없음'}
					</button>
					<button
						className="detail-prev-next__btn detail-prev-next__btn--next"
						onClick={() => nextRecord && navigate(`/detail/${nextRecord.id}`)}
						disabled={!nextRecord}
					>
						{nextRecord ? `No.${nextRecord.no} ${nextRecord.book}` : '다음 글 없음'} →
					</button>
				</div>
			</div>{/* container */}
		</div>{/* detail-main */}
	</div>{/* /detail-layout */}
</main>
	);
}
