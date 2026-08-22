import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function Header() {
	const navigate = useNavigate();
	const location = useLocation();
	const { user, logout } = useUser();
	const isHome = location.pathname === "/";
	const isEdit = location.pathname.startsWith("/edit/");
	const isDetail = location.pathname.startsWith("/detail/");
	const id = location.pathname.split("/")[2];

	return (
		<header className="header">
			<div className="container">
				<div className="header__inner">
					<div className="header__logo" onClick={() => navigate("/")}>
						<div className="header__logo-text">
							<span className="header__logo-title">Reading and Discussion</span>
							<span className="header__logo-sub">백 · 세 · 성 · 곽의 독서 모임</span>
						</div>
					</div>
					<nav className="header__nav">
						{!isHome && (
							<button className="header__btn header__btn--ghost" onClick={() => navigate("/")}>
								← 목록
							</button>
						)}
						{isEdit ? (
							<button type="submit" form="edit-form" className="header__btn header__btn--write">
								✅ 수정 완료
							</button>
						) : isDetail ? (
							<button
								className="header__btn header__btn--write"
								onClick={() => navigate(`/edit/${id}`)}>
								✏️ 기록 수정하기
							</button>
						) : (
							<button className="header__btn header__btn--write" onClick={() => navigate("/write")}>
								✏️ 기록 등록
							</button>
						)}
						{user && (
							<button
								className="header__user-badge"
								style={{ backgroundColor: user.color }}
								onClick={logout}
								title={`${user.displayName} · 클릭하면 로그아웃`}
							>
								{user.key}
							</button>
						)}
					</nav>
				</div>
			</div>
		</header>
	);
}
