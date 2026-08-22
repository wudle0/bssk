import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { generateId } from "../utils/helpers";

const RecordsContext = createContext(null);

// DB 컬럼(snake_case) ↔ 앱 필드(camelCase) 변환

// opinions 하위호환: 구형 { name: "text" } → { name: ["text"] }
function normalizeOpinions(opinions) {
	if (!opinions || typeof opinions !== "object") return {};
	return Object.fromEntries(
		Object.entries(opinions).map(([k, v]) => [k, Array.isArray(v) ? v : [v]]),
	);
}

function toApp(row) {
	// 구형 topic(string) → topics(array) 하위호환
	let topics = row.topics ?? [];
	if (!Array.isArray(topics) || topics.length === 0) {
		topics = row.topic ? [row.topic] : [""];
	}

	return {
		id: row.id,
		no: row.no,
		book: row.book,
		author: row.author ?? "",
		chapter: row.chapter ?? "",
		topics,
		emoji: row.emoji ?? "",
		coverUrl: row.cover_url ?? "",
		meetingType: row.meeting_type ?? "",
		presenter: row.presenter ?? "",
		participants: row.participants ?? [],
		discussionDate: row.discussion_date ?? "",
		opinions: normalizeOpinions(row.opinions),
		likes: row.likes ?? {},
		createdAt: row.created_at,
		updatedAt: row.updated_at ?? null,
	};
}

function toDB(data) {
	return {
		id: data.id,
		no: data.no,
		book: data.book,
		author: data.author ?? "",
		chapter: data.chapter ?? "",
		topics: data.topics ?? [""],
		emoji: data.emoji ?? "",
		cover_url: data.coverUrl ?? "",
		meeting_type: data.meetingType ?? "",
		presenter: data.presenter ?? "",
		participants: data.participants ?? [],
		discussion_date: data.discussionDate || null,
		opinions: data.opinions ?? {},
		likes: data.likes ?? {},
		created_at: data.createdAt ?? new Date().toISOString(),
		updated_at: data.updatedAt ?? null,
	};
}

export function RecordsProvider({ children }) {
	const [records, setRecords] = useState([]);
	const [loading, setLoading] = useState(true);

	// 초기 데이터 로드
	useEffect(() => {
		supabase
			.from("records")
			.select("*")
			.order("no", { ascending: false })
			.then(({ data, error }) => {
				if (error) {
					console.error("[supabase] fetch error:", error.message);
				} else {
					setRecords((data ?? []).map(toApp));
				}
				setLoading(false);
			});
	}, []);

	// 실시간 구독 — 다른 멤버가 수정해도 즉시 반영
	useEffect(() => {
		const channel = supabase
			.channel("records-realtime")
			.on("postgres_changes", { event: "*", schema: "public", table: "records" }, (payload) => {
				const { eventType, new: newRow, old: oldRow } = payload;

				if (eventType === "INSERT") {
					setRecords((prev) => [toApp(newRow), ...prev]);
				} else if (eventType === "UPDATE") {
					setRecords((prev) => prev.map((r) => (r.id === newRow.id ? toApp(newRow) : r)));
				} else if (eventType === "DELETE") {
					setRecords((prev) => prev.filter((r) => r.id !== oldRow.id));
				}
			})
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, []);

	const addRecord = useCallback(async (data) => {
		const newRecord = { ...data, id: generateId(), createdAt: new Date().toISOString() };
		const { error } = await supabase.from("records").insert(toDB(newRecord));
		if (error) {
			console.error("[supabase] insert error:", error.message);
			throw new Error(error.message);
		}
		return newRecord.id;
	}, []);

	const updateRecord = useCallback(
		async (id, data) => {
			const current = records.find((r) => r.id === id);
			if (!current) return;
			const merged = { ...current, ...data, updatedAt: new Date().toISOString() };
			// 낙관적 업데이트 — UI를 즉시 반영
			setRecords((prev) => prev.map((r) => (r.id === id ? merged : r)));
			const { error } = await supabase.from("records").update(toDB(merged)).eq("id", id);
			if (error) {
				// 실패 시 원본으로 롤백
				setRecords((prev) => prev.map((r) => (r.id === id ? current : r)));
				console.error("[supabase] update error:", error.message);
				throw new Error(error.message);
			}
		},
		[records],
	);

	const deleteRecord = useCallback(async (id) => {
		const { error } = await supabase.from("records").delete().eq("id", id);
		if (error) console.error("[supabase] delete error:", error.message);
	}, []);

	const getRecord = useCallback((id) => records.find((r) => r.id === id), [records]);

	return (
		<RecordsContext.Provider
			value={{ records, loading, addRecord, updateRecord, deleteRecord, getRecord }}>
			{children}
		</RecordsContext.Provider>
	);
}

export function useRecords() {
	const ctx = useContext(RecordsContext);
	if (!ctx) throw new Error("useRecords must be used within RecordsProvider");
	return ctx;
}
