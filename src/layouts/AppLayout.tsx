import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getChallengeDisplayText, getChallengeProgress } from "../utils/challenge";
import { formatLongDate } from "../utils/date";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/recipes", label: "Recipes" },
  { to: "/check-in", label: "Evening Check-In" },
  { to: "/installningar", label: "Inställningar" },
];

export function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const challengeProgress = getChallengeProgress();

  const progressLabel = `${challengeProgress.percentage}% complete`;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Main navigation">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            90
          </div>
          <div>
            <h1 className="brand-title">LifeOS</h1>
            <p className="brand-subtitle">Ebba&apos;s Challenge</p>
          </div>
        </div>

        <nav className="main-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button type="button" className="nav-link nav-button" onClick={handleLogout}>
            Log Out
          </button>
        </nav>

        <section className="sidebar-footer" aria-label="Challenge details">
          <h2>{user?.name ?? "Ebba"}</h2>
          <p>{getChallengeDisplayText()}</p>
          <p>{progressLabel}</p>
          <p>{formatLongDate(new Date())}</p>
        </section>
      </aside>

      <div className="main-panel">
        <header className="mobile-topbar">
          <div>
            <p className="mobile-user">{user?.name ?? "Ebba"}</p>
            <p className="mobile-progress">{getChallengeDisplayText()}</p>
          </div>
          <button type="button" className="logout-compact" onClick={handleLogout}>
            Log Out
          </button>
        </header>

        <main className="content-area">
          <Outlet />
        </main>

        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "mobile-nav-link mobile-nav-link-active" : "mobile-nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
