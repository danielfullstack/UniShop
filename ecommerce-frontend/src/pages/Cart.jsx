import { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { ProductContext } from "../context/ProductContext";
import { formatPEN } from "../utils/formatPEN";
import "./Cart.css";

function Cart() {
  const { cart, removeFromCart, updateQuantity, addToCart } = useContext(CartContext);
  const { products } = useContext(ProductContext);
  const total = cart.reduce((sum, product) => sum + product.precio * product.cantidad, 0);

  const suggestions = useMemo(() => {
    const available = products.filter((product) => product.stock > 0);
    const cartIds = new Set(cart.map((item) => item.id));
    return available.filter((product) => !cartIds.has(product.id)).slice(0, 4);
  }, [products, cart]);

  const handleQuantityChange = (id, value) => {
    const parsed = parseInt(value, 10);
    updateQuantity(id, Number.isNaN(parsed) ? 1 : Math.max(1, parsed));
  };

  const renderSuggestions = () =>
    suggestions.length > 0 ? (
      <div className="cart-suggestions">
        <h3>Quiza te interese</h3>
        <div className="suggestion-grid">
          {suggestions.map((product) => (
            <article key={product.id} className="product-card suggestion-card">
              <img src={product.imagen} alt={product.nombre} />
              <h4>{product.nombre}</h4>
              <p>{formatPEN(product.precio)}</p>
              <button type="button" onClick={() => addToCart(product)}>
                Agregar al carrito
              </button>
            </article>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="cart">
      <h2>Tu Carrito</h2>
      {cart.length === 0 ? (
        <div className="cart-empty">
          <p>El carrito esta vacio.</p>
          {renderSuggestions()}
        </div>
      ) : (
        <>
          <ul className="cart-list">
            {cart.map((product) => (
              <li key={product.id} className="cart-item">
                <div className="cart-item-info">
                  <h3>{product.nombre}</h3>
                  <p>Precio: {formatPEN(product.precio)}</p>
                </div>
                <div className="cart-item-actions">
                  <label>
                    Cantidad
                    <input
                      className="quantity-input"
                      type="number"
                      value={product.cantidad}
                      min="1"
                      onChange={(event) => handleQuantityChange(product.id, event.target.value)}
                    />
                  </label>
                  <button className="remove-button" onClick={() => removeFromCart(product.id)}>
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="cart-actions">
            <Link className="checkout-link" to="/checkout">
              Continuar al pago
            </Link>
          </div>
        </>
      )}
      <h3 className="cart-total">Total: {formatPEN(total)}</h3>
      {cart.length > 0 && renderSuggestions()}
    </div>
  );
}

export default Cart;
