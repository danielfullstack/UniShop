import React, { useEffect, useState } from "react";
import { formatPEN } from "../utils/formatPEN";
import "./ProductModal.css";

function ProductModal({ product, onClose, onAddToCart }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const images = Array.isArray(product.imagenes) && product.imagenes.length > 0
    ? product.imagenes
    : [product.imagen];

  const prev = (e) => {
    e.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  };
  const next = (e) => {
    e.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("product-modal-overlay")) onClose();
  };

  return (
    <div className="product-modal-overlay" onClick={handleOverlayClick}>
      <div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <button className="product-modal__close" onClick={onClose} aria-label="Cerrar">×</button>

        <div className="product-modal__content">
          <div className="product-modal__media">
            <button className="carousel-btn carousel-btn--prev" onClick={prev} aria-label="Anterior">‹</button>
            <img
              className="product-modal__image"
              src={images[index]}
              alt={`${product.nombre} (${index + 1}/${images.length})`}
            />
            <button className="carousel-btn carousel-btn--next" onClick={next} aria-label="Siguiente">›</button>

            {images.length > 1 && (
              <div className="product-modal__thumbs">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    className={`thumb ${i === index ? "thumb--active" : ""}`}
                    onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                    aria-label={`Ver imagen ${i + 1}`}
                  >
                    <img src={src} alt={`${product.nombre} miniatura ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-modal__details">
            <h3 id="product-modal-title" className="product-modal__title">{product.nombre}</h3>
            {product.descripcion && (
              <p className="product-modal__desc">{product.descripcion}</p>
            )}
            <div className="product-modal__meta">
              <span className="price">{formatPEN(product.precio)}</span>
              <span className={`stock ${product.stock > 0 ? "stock--ok" : "stock--out"}`}>
                {product.stock > 0 ? `Stock: ${product.stock}` : "Sin stock"}
              </span>
            </div>
            <div className="product-modal__actions">
              <button
                className="btn btn--primary"
                onClick={() => onAddToCart(product)}
                disabled={product.stock <= 0}
              >
                Agregar al carrito
              </button>
              <button className="btn" onClick={onClose}>Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;

