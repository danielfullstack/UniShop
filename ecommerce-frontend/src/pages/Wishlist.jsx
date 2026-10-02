import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { WishlistContext } from "../context/WishlistContext";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { formatPEN } from "../utils/formatPEN";
import "./Wishlist.css";

function Wishlist() {
  const { wishlist, removeFromWishlist } = useContext(WishlistContext);
  const { addToCart } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  if (!isAuthenticated) {
    return (
      <div className="wishlist-page">
        <h2>Tus favoritos</h2>
        <p className="wishlist-message">
          Inicia sesion para guardar y ver tus productos favoritos.
        </p>
        <Link className="wishlist-link" to="/login">
          Ir a login
        </Link>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="wishlist-page">
        <h2>Tus favoritos</h2>
        <p className="wishlist-message">Aun no guardas productos.</p>
        <Link className="wishlist-link" to="/productos">
          Explorar productos
        </Link>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <header className="wishlist-header">
        <div>
          <h2>Tus favoritos</h2>
          <p className="wishlist-subtitle">
            Guarda tus productos preferidos y agregalos al carrito cuando estes listo.
          </p>
        </div>
        <span className="wishlist-count">
          {wishlist.length} guardado{wishlist.length === 1 ? "" : "s"}
        </span>
      </header>
      <div className="wishlist-grid">
        {wishlist.map((product) => (
          <article key={product.id} className="wishlist-card">
            <img src={product.imagen} alt={product.nombre} />
            <div className="wishlist-info">
              <span className="wishlist-category">{product.categoria}</span>
              <h3>{product.nombre}</h3>
              <p className="wishlist-price">{formatPEN(product.precio)}</p>
              {product.descripcion && (
                <p className="wishlist-description">{product.descripcion}</p>
              )}
              {product.etiquetas.length > 0 && (
                <div className="wishlist-tags">
                  {product.etiquetas.map((tag) => (
                    <span key={tag} className="wishlist-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="wishlist-actions">
                <button
                  type="button"
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                >
                  {product.stock > 0 ? "Agregar al carrito" : "Sin stock"}
                </button>
                <button
                  type="button"
                  className="wishlist-remove"
                  onClick={() => removeFromWishlist(product.id)}
                >
                  Quitar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default Wishlist;
