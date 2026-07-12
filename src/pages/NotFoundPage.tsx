import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="page-section">
      <article className="placeholder-card">
        <p className="eyebrow">404</p>
        <h2>Page not found</h2>
        <p>The page you requested does not exist.</p>
        <Link className="primary-button inline-button" to="/dashboard">
          Go to dashboard
        </Link>
      </article>
    </section>
  );
}
