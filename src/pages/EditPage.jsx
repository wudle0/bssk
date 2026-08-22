import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRecords } from "../context/RecordsContext";
import { useToast } from "../App";
import ParticipantSelector from "../components/ParticipantSelector";
import EmojiPicker from "../components/EmojiPicker";
import BookSearchInput from "../components/BookSearchInput";
import { MEMBERS, MEETING_TYPES } from "../utils/helpers";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function parseISO(isoStr) {
	if (!isoStr) return { date: "", hour: "" };
	const d = new Date(isoStr);
	const pad = (n) => String(n).padStart(2, "0");
	const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	// 00시 00분이면 시간 미정으로 취급
	const hour = d.getHours() === 0 && d.getMinutes() === 0 ? "" : String(d.getHours());
	return { date, hour };
}

function buildISO(date, hour) {
	if (!date) return "";
	const h = hour !== "" ? String(hour).padStart(2, "0") : "00";
	return new Date(`${date}T${h}:00:00`).toISOString();
}

export default function EditPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { getRecord, updateRecord, loading } = useRecords();
	const showToast = useToast();

	const record = getRecord(id);

	const [form, setForm] = useState(null);
	const [dateStr, setDateStr] = useState("");
	const [hour, setHour] = useState("");
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [errors, setErrors] = useState({});
	const dateRef = useRef(null);
	const initialized = useRef(false);

	useEffect(() => {
		if (record && !initialized.current) {
			initialized.current = true;
			const parts = parseISO(record.discussionDate);
			setForm({
				...record,
				author: record.author || "",
				chapter: record.chapter || "",
				topics: record.topics?.length ? record.topics : [""],
				emoji: record.emoji || "",
				coverUrl: record.coverUrl || "",
				opinions: record.opinions || {},
			});
			setDateStr(parts.date);
			setHour(parts.hour);
		}
	}, [record]);

	// 로딩 중이거나, 데이터는 있는데 form 초기화가 아직 안 된 경우
	if (loading || (record && !form)) {
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

	// 로딩 완료 후에도 record가 없으면 진짜 없는 것
	if (!record || !form) {
		return (
			<main className="page-content">
				<div className="container">
					<div className="empty-state">
						<div className="empty-state__icon">🔍</div>
						<p className="empty-state__text">기록을 찾을 수 없어요.</p>
					</div>
				</div>
			</main>
		);
	}

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
			await updateRecord(id, {
				...form,
				no: Number(form.no),
				discussionDate: buildISO(dateStr, hour),
			});
			showToast("기록이 수정되었습니다!");
			navigate(`/detail/${id}`);
		} catch (err) {
			showToast(`저장 실패: ${err.message}`);
		}
	};

	return (
		<>
			<main className="page-content">
				<div className="container">
					<div className="page-header">
						<h1 className="page-header__title">토론 기록 수정</h1>
						<p className="page-header__sub">
							No.{record.no} · {record.book}
						</p>
					</div>

					<form id="edit-form" className="form" onSubmit={handleSubmit} noValidate>
						<div className="form__grid">
							<div className="form__field">
								<label className="form__label">No</label>
								<input
									type="number"
									className="form__input"
									value={form.no}
									min={1}
									onChange={(e) => set("no", e.target.value)}
								/>
							</div>

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
										if (errors.discussionDate) setErrors((p) => ({ ...p, discussionDate: "" }));
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
							<button
								type="button"
								className="btn btn--secondary"
								onClick={() => navigate(`/detail/${id}`)}>
								취소
							</button>
							<button type="submit" className="btn btn--primary">
								수정 완료
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
