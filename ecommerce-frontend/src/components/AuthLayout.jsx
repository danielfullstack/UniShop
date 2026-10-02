import { Link } from "react-router-dom";

function AuthLayout({ title, subtitle, children }) {
  return (
    <section className="auth-page">
      <div className="auth-brand-mark" aria-hidden="true">U</div>
      <div className="auth-card">
        <Link className="auth-brand" to="/">UniShop</Link>
        <h1>{title}</h1>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}

export default AuthLayout;
