import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";
import { ToastContext } from "../context/ToastContext";
import { formatPEN } from "../utils/formatPEN";
import ProductModal from "./ProductModal";

function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  const { isInWishlist, toggleWishlist, canManageWishlist } = useContext(WishlistContext);
  const { notify } = useContext(ToastContext);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const favorited = isInWishlist(product.id);
  const image = product.imagen || product.imagenes?.[0];

  const handleWishlist = () => {
    if (!canManageWishlist) {
      notify("Inicia sesión para guardar productos favoritos.", { type: "info" });
      navigate("/login");
      return;
    }
    const result = toggleWishlist(product.id);
    notify(result.status === "removed" ? "Producto quitado de favoritos." : "Producto guardado en favoritos.", {
      type: "success",
    });
  };

  return (
    <>
      <article className="product-card">
        <div className="product-card-header">
          <span className="product-category">{product.categoria}</span>
          <button
            type="button"
            className={`wishlist-button${favorited ? " is-active" : ""}`}
            onClick={handleWishlist}
            aria-pressed={favorited}
          >
            {favorited ? "Guardado" : "Favorito"}
          </button>
        </div>
        {image && <img src={image} alt={product.nombre} loading="lazy" />}
        <h3>{product.nombre}</h3>
        {product.descripcion && <p className="product-description">{product.descripcion}</p>}
        <p className="product-price">{formatPEN(product.precio)}</p>
        <p className={product.stock > 0 ? "stock-ok" : "stock-out"}>
          {product.stock > 0 ? `Disponible: ${product.stock}` : "Sin stock"}
        </p>
        {product.etiquetas?.length > 0 && (
          <div className="product-tags">
            {product.etiquetas.map((tag) => <span key={tag} className="product-tag">{tag}</span>)}
          </div>
        )}
        <div className="product-actions">
          <button type="button" className="secondary" onClick={() => setIsOpen(true)}>Ver detalle</button>
          <button type="button" disabled={product.stock <= 0} onClick={() => addToCart(product)}>
            {product.stock > 0 ? "Agregar al carrito" : "Sin stock"}
          </button>
        </div>
      </article>

      {isOpen && (
        <ProductModal
          product={product}
          onClose={() => setIsOpen(false)}
          onAddToCart={(item) => {
            addToCart(item);
            setIsOpen(false);
          }}
        />
      )}
    </>
  );
}

export default ProductCard;
