import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecords } from "../context/RecordsContext";
import { useToast } from "../App";
import ParticipantSelector from "../components/ParticipantSelector";
import EmojiPicker from "../components/EmojiPicker";
import BookSearchInput from "../components/BookSearchInput";
import { MEMBERS, MEETING_TYPES } from "../utils/helpers";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function buildISO(date, hour) {
	if (!date) return "";
	const h = hour !== "" ? String(hour).padStart(2, "0") : "00";
	return new Date(`${date}T${h}:00:00`).toISOString();
}

export default function WritePage() {
	const navigate = useNavigate();
	const { records, addRecord } = useRecords();
	const showToast = useToast();

	const nextNo = records.length > 0 ? Math.max(...records.map((r) => r.no || 0)) + 1 : 1;

	function parseDate(isoStr) {
		if (!isoStr) return { date: "", hour: "" };
		const d = new Date(isoStr);
		const pad = (n) => String(n).padStart(2, "0");
		const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
		const hour = d.getHours() === 0 && d.getMinutes() === 0 ? "" : String(d.getHours());
		return { date, hour };
	}

	const [form, setForm] = useState({
		no: nextNo,
		book: "",
		author: "",
		chapter: "",
		topics: [""],
		emoji: "",
		coverUrl: "",
		meetingType: MEETING_TYPES[0],
		presenter: MEMBERS[0],
		participants: [...MEMBERS],
		opinions: {},
	});

	const [dateStr, setDateStr] = useState("");
	const [hour, setHour] = useState("");
	const dateInitialized = useRef(false);

	// records 로딩 완료 후 최신 기록 기반으로 날짜·발제자 기본값 설정
	useEffect(() => {
		if (dateInitialized.current || records.length === 0) return;
		const latest = records.reduce((a, b) => (a.no > b.no ? a : b));

		// 날짜 기본값
		if (latest?.discussionDate) {
			const { date, hour } = parseDate(latest.discussionDate);
			setDateStr(date);
			setHour(hour);
		}

		// 발제자 기본값: 이전 발제자의 다음 순서
		if (latest?.presenter) {
			const idx = MEMBERS.indexOf(latest.presenter);
			const nextPresenter = idx >= 0 ? MEMBERS[(idx + 1) % MEMBERS.length] : MEMBERS[0];
			setForm((prev) => ({ ...prev, presenter: nextPresenter }));
		}

		dateInitialized.current = true;
	}, [records]);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [errors, setErrors] = useState({});
	const dateRef = useRef(null);

	const set = (key, value) => {
		setForm((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
	};

	const validate = () => {
		const errs = {};
		if (!form.book.trim()) errs.book = "이 주의 책을 입력해주세요.";
		if (!dateStr) errs.discussionDate = "토론 날짜를 선택해주세요.";
		if (form.participants.length === 0) errs.participants = "참가자를 1명 이상 선택해주세요.";
		setErrors(errs);
		return Object.keys(errs).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validate()) return;

		try {
			await addRecord({
				...form,
				no: Number(form.no),
				discussionDate: buildISO(dateStr, hour),
			});
			showToast("기록이 등록되었습니다!");
			navigate("/");
		} catch (err) {
			showToast(`저장 실패: ${err.message}`);
		}
	};

	return (
		<>
			<main className="page-content">
				<div className="container">
					<div className="page-header">
						<h1 className="page-header__title">토론 기록 등록</h1>
						<p className="page-header__sub">이번 주의 독서토론을 기록해보세요.</p>
					</div>

					<form className="form" onSubmit={handleSubmit} noValidate>
						<div className="form__grid">
							{/* No */}
							<div className="form__field">
								<label className="form__label">
									No <span className="form__label-required">*</span>
								</label>
								<input
									type="number"
									className="form__input"
									value={form.no}
									min={1}
									onChange={(e) => set("no", e.target.value)}
								/>
							</div>

							{/* 회의 유형 */}
							<div className="form__field">
								<label className="form__label">회의유형</label>
								<select
									className="form__select"
									value={form.meetingType}
									onChange={(e) => set("meetingType", e.target.value)}>
									{MEETING_TYPES.map((t) => (
										<option key={t} value={t}>
											{t}
										</option>
									))}
								</select>
							</div>

							{/* 이모지 */}
							<div className="form__field form__field--full">
								<label className="form__label">
									이모지 <span style={{ color: "#9488b0", fontWeight: 400 }}>(선택)</span>
								</label>
								<div className="emoji-trigger-row">
									<button
										type="button"
										className={`emoji-trigger ${form.emoji ? "emoji-trigger--filled" : ""}`}
										onClick={() => setShowEmojiPicker(true)}>
										{form.emoji ? (
											<span>{form.emoji}</span>
										) : (
											<span className="emoji-trigger__placeholder">🙂 이모지 선택</span>
										)}
									</button>
									{form.emoji && (
										<button
											type="button"
											className="emoji-trigger__clear"
											onClick={() => set("emoji", "")}>
											제거
										</button>
									)}
								</div>
							</div>

							{/* 이 주의 책 */}
							<div className="form__field form__field--full">
								<label className="form__label">
									이 주의 책 <span className="form__label-required">*</span>
								</label>
								<div className="book-field">
									<div className="book-field__cover">
										{form.coverUrl ? (
											<img
												src={form.coverUrl}
												alt={form.book}
												onError={(e) => {
													e.target.style.display = "none";
													e.target.nextSibling.style.display = "flex";
												}}
											/>
										) : null}
										<div
											className="book-field__cover-placeholder"
											style={{ display: form.coverUrl ? "none" : "flex" }}>
											<span>📚</span>
										</div>
									</div>
									<div className="book-field__fields">
										<div className="book-field__row">
											<label className="book-field__label">
												제목 <span className="form__label-required">*</span>
											</label>
											<BookSearchInput
												value={form.book}
												onChange={(v) => {
													set("book", v);
													if (!v) {
														set("coverUrl", "");
														set("author", "");
													}
												}}
												onSelect={(book) => {
													set("book", book.title);
													set("author", book.author || "");
													set("coverUrl", book.coverUrl || "");
												}}
												error={errors.book}
											/>
											{errors.book && <span className="form__error">{errors.book}</span>}
										</div>
										<div className="book-field__row">
											<label className="book-field__label">작가</label>
											<input
												type="text"
												className="form__input"
												placeholder="저자명"
												value={form.author}
												onChange={(e) => set("author", e.target.value)}
											/>
										</div>
										<div className="book-field__row">
											<label className="book-field__label">
												챕터 <span className="book-field__optional">(선택)</span>
											</label>
											<input
												type="text"
												className="form__input"
												placeholder="예) 1~3장, Part 1"
												value={form.chapter}
												onChange={(e) => set("chapter", e.target.value)}
											/>
										</div>
									</div>
								</div>
							</div>

							{/* 화두 */}
							<div className="form__field form__field--full">
								<label className="form__label">화두</label>
								<div className="topics-list">
									{form.topics.map((t, i) => (
										<div key={i} className="topics-list__row">
											<span className="topics-list__num">{i + 1}</span>
											<input
												type="text"
												className="form__input"
												placeholder="이번 모임의 핵심 주제나 질문"
												value={t}
												onChange={(e) => {
													const next = [...form.topics];
													next[i] = e.target.value;
													set("topics", next);
												}}
											/>
											{form.topics.length > 1 && (
												<button
													type="button"
													className="topics-list__remove"
													onClick={() =>
														set(
															"topics",
															form.topics.filter((_, idx) => idx !== i),
														)
													}>
													✕
												</button>
											)}
										</div>
									))}
									<button
										type="button"
										className="topics-list__add"
										onClick={() => set("topics", [...form.topics, ""])}>
										+ 화두 추가
									</button>
								</div>
							</div>

							{/* 발제자 */}
							<div className="form__field">
								<label className="form__label">발제자</label>
								<select
									className="form__select"
									value={form.presenter}
									onChange={(e) => set("presenter", e.target.value)}>
									{MEMBERS.map((m) => (
										<option key={m} value={m}>
											{m}
										</option>
									))}
								</select>
							</div>

							{/* 토론 날짜 */}
							<div className="form__field">
								<label className="form__label">
									토론 날짜 <span className="form__label-required">*</span>
								</label>
								<input
									ref={dateRef}
									type="date"
									className="form__input form__input--date"
									value={dateStr}
									onChange={(e) => {
										setDateStr(e.target.value);
										if (errors.discussionDate)
											setErrors((prev) => ({ ...prev, discussionDate: "" }));
									}}
									onClick={() => dateRef.current?.showPicker?.()}
								/>
								{errors.discussionDate && (
									<span style={{ fontSize: "0.8rem", color: "#e53e3e" }}>
										{errors.discussionDate}
									</span>
								)}
							</div>

							{/* 시작 시간 (선택) */}
							<div className="form__field">
								<label className="form__label">
									시작 시간 <span style={{ color: "#9488b0", fontWeight: 400 }}>(선택)</span>
								</label>
								<select
									className="form__select"
									value={hour}
									onChange={(e) => setHour(e.target.value)}>
									<option value="">시간 미정</option>
									{HOURS.map((h) => (
										<option key={h} value={h}>
											{String(h).padStart(2, "0")}시
										</option>
									))}
								</select>
							</div>

							{/* 참가자 */}
							<div className="form__field form__field--full">
								<label className="form__label">
									참가자 <span className="form__label-required">*</span>
								</label>
								<ParticipantSelector
									value={form.participants}
									onChange={(v) => set("participants", v)}
								/>
								{errors.participants && (
									<span style={{ fontSize: "0.8rem", color: "#e53e3e" }}>
										{errors.participants}
									</span>
								)}
							</div>
						</div>

						<div className="form__actions">
							<button type="button" className="btn btn--secondary" onClick={() => navigate("/")}>
								취소
							</button>
							<button type="submit" className="btn btn--primary">
								기록 등록
							</button>
						</div>
					</form>
				</div>
			</main>
			{showEmojiPicker && (
				<EmojiPicker
					value={form.emoji}
					onChange={(v) => set("emoji", v)}
					onClose={() => setShowEmojiPicker(false)}
				/>
			)}
		</>
	);
}
