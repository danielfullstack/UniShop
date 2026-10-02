import { useState } from "react";

function PasswordInput({ value, onChange, required = true, autoComplete = "current-password" }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="auth-field">
      <span>Contraseña</span>
      <span className="password-input-wrap">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          minLength={6}
        />
        <button type="button" className="password-toggle" onClick={() => setVisible((show) => !show)}>
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </span>
    </label>
  );
}

export default PasswordInput;
