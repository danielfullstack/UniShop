import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { formatPEN } from "../utils/formatPEN";
import "./UserProfile.css";

const ORDER_STATUSES = ["pendiente", "preparando", "enviado", "entregado"];
const ORDERS_PER_PAGE = 5;

const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

function UserProfile() {
  const { user, logout, updateUserProfile } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    nombreEnvio: "",
    direccion: "",
    ciudad: "",
    telefono: "",
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      displayName: user.displayName || "",
      nombreEnvio: user.defaultAddress?.nombre || user.displayName || "",
      direccion: user.defaultAddress?.direccion || "",
      ciudad: user.defaultAddress?.ciudad || "",
      telefono: user.defaultAddress?.telefono || "",
    });
  }, [user]);

  const allOrders = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("orders")) || [];
    } catch {
      return [];
    }
  }, []);

  const myOrders = useMemo(() => {
    if (!user) return [];
    return allOrders.filter((order) => order.userEmail === user.email);
  }, [allOrders, user]);

  const emailHistory = useMemo(() => {
    if (!user) return [];
    try {
      const stored = JSON.parse(localStorage.getItem("sentEmails") || "[]");
      return stored
        .filter((email) => email.to === user.email)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    } catch {
      return [];
    }
  }, [user]);

  const filteredOrders = useMemo(() => {
    const term = orderSearch.trim().toLowerCase();
    return myOrders.filter((order) => {
      const currentStatus = order.status || "pendiente";
      const matchesStatus = statusFilter === "all" || currentStatus === statusFilter;
      const matchesTerm =
        term.length === 0 ||
        order.id.toLowerCase().includes(term) ||
        (order.token || "").toLowerCase().includes(term) ||
        order.items.some((item) => item.nombre.toLowerCase().includes(term));
      return matchesStatus && matchesTerm;
    });
  }, [myOrders, statusFilter, orderSearch]);

  const totalGastado = filteredOrders.reduce((acc, order) => acc + (order.total || 0), 0);
  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));

  useEffect(() => {
    setOrderPage(1);
  }, [statusFilter, orderSearch]);

  useEffect(() => {
    setOrderPage((page) => Math.min(page, totalOrderPages));
  }, [totalOrderPages]);

  const paginatedOrders = useMemo(() => {
    const start = (orderPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [filteredOrders, orderPage]);

  if (!user) return <p>Debes iniciar sesion para ver tu perfil.</p>;

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    try {
      await updateUserProfile({
        displayName: profileForm.displayName.trim() || user.displayName || "",
        defaultAddress: {
          nombre:
            profileForm.nombreEnvio.trim() || profileForm.displayName.trim() || user.displayName || "",
          direccion: profileForm.direccion.trim(),
          ciudad: profileForm.ciudad.trim(),
          telefono: profileForm.telefono.trim(),
        },
      });
      setFeedback("Perfil actualizado correctamente.");
      setEditing(false);
    } catch (error) {
      setFeedback(error.message || "No se pudo actualizar el perfil.");
      return;
    }
    setTimeout(() => setFeedback(""), 3000);
  };

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div>
          <h2>Perfil de usuario</h2>
          <p className="profile-email">{user.email}</p>
        </div>
        <button className="logout-button" onClick={logout}>
          Cerrar sesion
        </button>
      </div>

      <section className="profile-card">
        <div className="profile-meta">
          <div>
            <span>Ultimo inicio:</span>
            <strong>{formatDate(user.lastLogin)}</strong>
          </div>
          <div>
            <span>Ultimo pedido:</span>
            <strong>{formatDate(user.lastOrderAt)}</strong>
          </div>
          <div>
            <span>Total filtrado:</span>
            <strong>{formatPEN(totalGastado)}</strong>
          </div>
        </div>
        <div className="profile-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? "Cancelar" : "Editar perfil"}
          </button>
        </div>
        {feedback && <p className="profile-feedback">{feedback}</p>}
        {editing && (
          <form className="profile-form" onSubmit={handleSaveProfile}>
            <label>
              Nombre para mostrar
              <input
                type="text"
                name="displayName"
                value={profileForm.displayName}
                onChange={handleProfileChange}
              />
            </label>
            <label>
              Nombre de envio
              <input
                type="text"
                name="nombreEnvio"
                value={profileForm.nombreEnvio}
                onChange={handleProfileChange}
              />
            </label>
            <label>
              Direccion
              <input
                type="text"
                name="direccion"
                value={profileForm.direccion}
                onChange={handleProfileChange}
              />
            </label>
            <label>
              Ciudad
              <input
                type="text"
                name="ciudad"
                value={profileForm.ciudad}
                onChange={handleProfileChange}
              />
            </label>
            <label>
              Telefono
              <input
                type="text"
                name="telefono"
                value={profileForm.telefono}
                onChange={handleProfileChange}
              />
            </label>
            <button type="submit" className="primary-button">
              Guardar cambios
            </button>
          </form>
        )}
      </section>

      <section className="profile-card">
        <div className="profile-card-header">
          <h3>Historial de compras</h3>
          <div className="filter-group">
            <label>
              Estado
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">Todos</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Buscar
              <input
                type="text"
                placeholder="ID, token o producto"
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
              />
            </label>
          </div>
        </div>
        {paginatedOrders.length === 0 ? (
          <p>No hay pedidos que coincidan con el filtro.</p>
        ) : (
          <>
            <ul className="orders-list">
              {paginatedOrders.map((order) => (
                <li key={order.id}>
                  <div className="order-header">
                    <strong>{order.id}</strong>
                    <span className="order-status">{order.status || "pendiente"}</span>
                  </div>
                  <div className="order-meta">
                    <span>Fecha: {formatDate(order.date)}</span>
                    <span>Total: {formatPEN(order.total || 0)}</span>
                    {order.token && <span>Token: {order.token}</span>}
                    {order.coupon && <span>Cupon: {order.coupon}</span>}
                  </div>
                  <details>
                    <summary>Ver productos</summary>
                    <ul>
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.nombre} x {item.cantidad} - {formatPEN(item.precio * item.cantidad)}
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
            {totalOrderPages > 1 && (
              <div className="orders-pagination">
                <button
                  type="button"
                  onClick={() => setOrderPage((page) => Math.max(1, page - 1))}
                  disabled={orderPage === 1}
                >
                  Anterior
                </button>
                <span>
                  Pagina {orderPage} de {totalOrderPages}
                </span>
                <button
                  type="button"
                  onClick={() => setOrderPage((page) => Math.min(totalOrderPages, page + 1))}
                  disabled={orderPage === totalOrderPages}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="profile-card">
        <h3>Correos enviados</h3>
        {emailHistory.length === 0 ? (
          <p>No hay correos registrados.</p>
        ) : (
          <ul className="emails-list">
            {emailHistory.map((email) => (
              <li key={email.date + email.subject}>
                <div className="email-header">
                  <strong>{email.subject}</strong>
                  <span>{formatDate(email.date)}</span>
                </div>
                <p>{email.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default UserProfile;
