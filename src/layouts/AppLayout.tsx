import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { getChallengeDisplayText, getChallengeProgress } from "../utils/challenge";
import { formatLongDate } from "../utils/date";
import { useAuth } from "../hooks/useAuth";
import {
  getProfileImageDataUrl,
  profileImageChangedEvent,
} from "../services/challengeSettingsService";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/recipes", label: "Recipes" },
  { to: "/check-in", label: "Evening Check-In" },
  { to: "/installningar", label: "Inställningar" },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const challengeProgress = getChallengeProgress();
  const [profileImageDataUrl, setProfileImageDataUrl] = useState<string | null>(() =>
    getProfileImageDataUrl(),
  );

  const progressLabel = `${challengeProgress.percentage}% complete`;

  function handleLogout() {
    logout();
    window.location.hash = "#/login";
  }

  useEffect(() => {
    function handleProfileImageChanged(): void {
      setProfileImageDataUrl(getProfileImageDataUrl());
    }

    window.addEventListener(profileImageChangedEvent, handleProfileImageChanged);
    return () => {
      window.removeEventListener(profileImageChangedEvent, handleProfileImageChanged);
    };
  }, []);

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

        <div className="sidebar-profile-block" aria-label="Profilbild">
          {profileImageDataUrl ? (
            <img
              src={profileImageDataUrl}
              alt="Profilbild"
              className="sidebar-profile-image"
            />
          ) : (
            <div className="sidebar-profile-placeholder" aria-hidden="true">
              👤
            </div>
          )}
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
