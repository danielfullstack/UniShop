import { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import "./Auth.css";

function PasswordReset() {
  const { resetPassword } = useContext(AuthContext);
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("El correo electrónico es obligatorio.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(normalizedEmail);
      setMessage("Si existe una cuenta con ese correo, Firebase enviará un enlace para restablecer la contraseña.");
    } catch (resetError) {
      setError(resetError.message || "No se pudo enviar el correo de recuperación.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Ingresa el correo asociado a tu cuenta y te enviaremos instrucciones para restablecerla."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Correo electrónico</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onInvalid={(event) => {
              event.preventDefault();
              setError(email.trim() ? "Ingresa un correo electrónico válido." : "El correo electrónico es obligatorio.");
            }}
            autoComplete="email"
            required
          />
        </label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-success" role="status">{message}</p>}
        <button className="auth-primary-button" type="submit" disabled={submitting}>
          {submitting ? <><span className="loading-spinner" /> Enviando…</> : "Enviar enlace"}
        </button>
      </form>
      <div className="auth-form-links auth-form-links--center">
        <Link to="/login">Volver a iniciar sesión</Link>
      </div>
    </AuthLayout>
  );
}

export default PasswordReset;
