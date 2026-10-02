import { Link, Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useContext(AuthContext);
  const location = useLocation();
  if (loading) return <div className="route-loading" role="status">Cargando sesión…</div>;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) {
    return (
      <div className="admin-locked">
        <h2>Acceso administrativo</h2>
        <p>La cuenta autenticada no tiene permisos de administrador.</p>
        <Link to="/">Volver a UniShop</Link>
      </div>
    );
  }
  return children;
}

export default AdminRoute;
