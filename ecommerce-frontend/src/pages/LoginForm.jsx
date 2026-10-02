import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import "./Auth.css";

function LoginForm({ mode = "login", audience = "user" }) {
  const { user, isAdmin, login, register, loginWithGoogle } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isRegister = mode === "register" && audience !== "admin";
  const isAdminLogin = audience === "admin";

  useEffect(() => {
    if (!user) return;
    if (isAdmin) navigate("/admin", { replace: true });
    else if (!isAdminLogin) navigate(location.state?.from || "/", { replace: true });
  }, [user, isAdmin, isAdminLogin, location.state, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    setSubmitting(true);
    try {
      if (isRegister) await register(normalizedEmail, password, name.trim());
      else await login(normalizedEmail, password);
      navigate(isAdminLogin ? "/admin" : location.state?.from || "/", { replace: true });
    } catch (authError) {
      const messages = {
        "auth/invalid-email": "El correo electrónico no es válido.",
        "auth/user-not-found": "No existe una cuenta con ese correo electrónico.",
        "auth/wrong-password": "La contraseña no es correcta.",
        "auth/invalid-credential": "El correo o la contraseña no son correctos.",
        "auth/email-already-in-use": "Ya existe una cuenta con ese correo electrónico.",
        "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
        "auth/too-many-requests": "Hubo demasiados intentos. Espera un momento e inténtalo de nuevo.",
        "auth/network-request-failed": "No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.",
      };
      setError(messages[authError?.code] || "No se pudo completar el acceso. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate(isAdminLogin ? "/admin" : location.state?.from || "/", { replace: true });
    } catch (authError) {
      setError(authError?.code === "auth/popup-closed-by-user"
        ? "Se cerró la ventana de Google antes de completar el acceso."
        : "No se pudo iniciar sesión con Google.");
    } finally {
      setSubmitting(false);
    }
  };

  const title = isRegister
    ? "Crear cuenta"
    : isAdminLogin
      ? "Acceso administrativo"
      : "Iniciar sesión";

  return (
    <AuthLayout
      title={title}
      subtitle={isRegister
        ? "Regístrate para guardar tus favoritos y consultar tus pedidos."
        : isAdminLogin
          ? "Ingresa con la cuenta autorizada para administrar UniShop."
          : "Ingresa a tu cuenta para continuar en UniShop."}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {isRegister && (
          <label className="auth-field">
            <span>Nombre</span>
            <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
          </label>
        )}
        <label className="auth-field">
          <span>Correo electrónico</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <PasswordInput
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={isRegister ? "new-password" : "current-password"}
        />
        {!isRegister && (
          <div className="auth-form-links auth-form-links--right">
            <Link to="/recuperar-contrasena" state={{ email }}>¿Olvidaste tu contraseña?</Link>
          </div>
        )}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-primary-button" type="submit" disabled={submitting}>
          {submitting ? <><span className="loading-spinner" /> Procesando…</> : isRegister ? "Crear cuenta" : "Iniciar sesión"}
        </button>
      </form>

      {!isRegister && (
        <>
          <div className="auth-divider"><span>o</span></div>
          <button className="auth-google-button" type="button" onClick={handleGoogleLogin} disabled={submitting}>
            Continuar con Google
          </button>
        </>
      )}

      <div className="auth-form-links auth-form-links--center">
        {isRegister ? (
          <span>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></span>
        ) : isAdminLogin ? (
          <Link to="/login">Volver al acceso de usuario</Link>
        ) : (
          <>
            <span>¿No tienes cuenta? <Link to="/registro">Regístrate</Link></span>
            <Link to="/admin/login">Acceso de administrador</Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

export default LoginForm;
