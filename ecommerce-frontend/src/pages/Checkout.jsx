import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { ProductContext } from "../context/ProductContext";
import { formatPEN } from "../utils/formatPEN";
import { paymentOptions } from "../services/checkout/PaymentStrategyFactory";
import { CouponStrategyFactory } from "../services/checkout/CouponStrategyFactory";
import { checkoutFacade } from "../services/checkout/CheckoutFacade";
import "./Checkout.css";

const steps = ["Carrito", "Datos", "Pago", "Confirmacion"];

const emptyForm = {
  nombre: "",
  direccion: "",
  ciudad: "",
  telefono: "",
};

function Checkout() {
  const { cart, clearCart, addToCart } = useContext(CartContext);
  const { user, updateUserProfile } = useContext(AuthContext);
  const { products, decrementStocks } = useContext(ProductContext);
  const formatAmount = formatPEN;
  const [form, setForm] = useState(emptyForm);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponStatus, setCouponStatus] = useState("");

  useEffect(() => {
    if (!user) {
      setForm(emptyForm);
      return;
    }
    const hasData = Object.values(form).some((value) => value);
    if (hasData) return;
    const defaultAddress = user.defaultAddress || {};
    setForm({
      nombre: defaultAddress.nombre || user.displayName || "",
      direccion: defaultAddress.direccion || "",
      ciudad: defaultAddress.ciudad || "",
      telefono: defaultAddress.telefono || "",
    });
  }, [user, form]);

  const subtotal = useMemo(
    () => cart.reduce((sum, product) => sum + product.precio * product.cantidad, 0),
    [cart]
  );

  const baseShipping = subtotal >= 300 ? 0 : cart.length > 0 ? 25 : 0;

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.strategy.calculate(subtotal);
  }, [appliedCoupon, subtotal]);

  const cappedDiscount = Math.min(discountAmount, subtotal);
  const effectiveShipping = appliedCoupon
    ? appliedCoupon.strategy.shipping(baseShipping)
    : baseShipping;
  const totalToPay = Math.max(subtotal - cappedDiscount, 0) + effectiveShipping;

  const currentStep = order ? 4 : paymentMethod ? 3 : Object.values(form).some(Boolean) ? 2 : 1;

  const recommendedProducts = useMemo(() => {
    const available = products.filter((product) => product.stock > 0);
    if (order) {
      const purchasedIds = new Set(order.items.map((item) => item.id));
      return available.filter((product) => !purchasedIds.has(product.id)).slice(0, 3);
    }
    if (cart.length === 0) {
      return available.slice(0, 3);
    }
    const cartIds = new Set(cart.map((item) => item.id));
    return available.filter((product) => !cartIds.has(product.id)).slice(0, 3);
  }, [products, cart, order]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleApplyCoupon = (event) => {
    event.preventDefault();
    const rawCode = couponInput.trim().toUpperCase();
    if (!rawCode) {
      setCouponStatus("Ingresa un codigo de descuento.");
      return;
    }
    const coupon = CouponStrategyFactory.create(rawCode);
    if (!coupon) {
      setAppliedCoupon(null);
      setCouponStatus("Codigo invalido o no disponible.");
      return;
    }
    setAppliedCoupon(coupon);
    setCouponStatus("Cupon " + rawCode + " aplicado: " + coupon.label + ".");
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponStatus("Cupon eliminado.");
  };

  const processOrder = async () => {
    try {
      const createdOrder = await checkoutFacade.placeOrder({
        cart,
        form,
        user,
        paymentMethod,
        subtotal,
        shippingCost: effectiveShipping,
        discount: cappedDiscount,
        couponCode: appliedCoupon?.code,
        total: totalToPay,
        decrementStocks,
        updateUserProfile,
        formatAmount,
      });
      setOrder(createdOrder);
      clearCart();
      setForm({ ...emptyForm });
      setPaymentMethod("");
      setCouponInput("");
    } catch (processingError) {
      setError(processingError.message || "No se pudo completar el pedido. Intenta nuevamente.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (cart.length === 0) {
      setError("Tu carrito esta vacio.");
      return;
    }
    if (!paymentMethod) {
      setError("Selecciona un metodo de pago.");
      return;
    }
    if (!form.nombre || !form.direccion || !form.ciudad || !form.telefono) {
      setError("Completa todos los datos de envio.");
      return;
    }

    setProcessing(true);
    setError("");

    if (!paymentOptions.some((option) => option.id === paymentMethod)) {
      setProcessing(false);
      setError("Método de pago no válido.");
      return;
    }

    void processOrder();
  };

  const renderProgress = () => (
      <div className="checkout-progress">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const state =
          stepNumber < currentStep ? "completed" : stepNumber === currentStep ? "current" : "upcoming";
        return (
          <div key={label} className={`progress-step ${state}`}>
            <span className="step-index">{stepNumber}</span>
            <span className="step-label">{label}</span>
          </div>
        );
      })}
    </div>
  );

  const renderRecommendations = (title) =>
    recommendedProducts.length > 0 ? (
      <div className="recommendations">
        <h4>{title}</h4>
        <div className="recommendation-grid">
          {recommendedProducts.map((product) => (
            <article key={product.id} className="product-card suggestion-card">
              <img src={product.imagen} alt={product.nombre} />
              <h5>{product.nombre}</h5>
              <p>{formatAmount(product.precio)}</p>
              <button type="button" onClick={() => addToCart(product)}>
                Agregar al carrito
              </button>
            </article>
          ))}
        </div>
      </div>
    ) : null;

  const handleDownloadReceipt = () => {
    if (!order) return;
    const lines = [
      "UniShop - Comprobante simulado",
      "Pedido: " + order.id,
      "Token: " + (order.token || "-"),
      "Fecha: " + new Date(order.date).toLocaleString(),
      "Cliente: " + (user?.displayName || order.shipping.nombre || order.userEmail || ""),
      "Correo: " + (order.userEmail || "invitado"),
      " ",
      "Items:",
    ];
    order.items.forEach((item, index) => {
      lines.push((index + 1) + ". " + item.nombre + " x " + item.cantidad + " - " + formatAmount(item.precio * item.cantidad));
    });
    lines.push(" ");
    lines.push("Subtotal: " + formatAmount(order.subtotal));
    lines.push("Descuento: " + formatAmount(order.discount || 0));
    lines.push("Envio: " + formatAmount(order.shippingCost));
    lines.push("Total: " + formatAmount(order.total));
    lines.push("Estado: " + (order.status || "pendiente"));
    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = order.id + "-comprobante.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };


  if (order) {
    return (
      <div className="checkout">
        {renderProgress()}
        <div className="checkout-success">
          <h2>Pedido confirmado</h2>
          <p>
            Tu pedido <strong>{order.id}</strong> quedó registrado. El flujo de pago es una simulación.
          </p>
          <div className="success-details">
            <p>
              <strong>Referencia simulada:</strong> {order.payment.reference}
            </p>
            <p>
              <strong>Token de pedido:</strong> {order.token}
            </p>
            <p>
              <strong>Total registrado:</strong> {formatAmount(order.total)}
            </p>
            {order.discount > 0 && (
              <p>
                <strong>Descuento aplicado:</strong> -{formatAmount(order.discount)}
              </p>
            )}
            {user && (
              <p>
                <strong>Confirmación local:</strong> Se guardó un registro de correo simulado en el navegador.
              </p>
            )}
          </div>
          <div className="success-shipping">
            <h3>Envio a</h3>
            <p>{order.shipping.nombre}</p>
            <p>
              {order.shipping.direccion}, {order.shipping.ciudad}
            </p>
            <p>Tel: {order.shipping.telefono}</p>
          </div>
          <div className="success-actions">
            <button
              type="button"
              className="receipt-button"
              onClick={handleDownloadReceipt}
            >
              Descargar comprobante
            </button>
            <Link className="continue-link" to="/productos">
              Seguir comprando
            </Link>
          </div>
          {renderRecommendations("Quiza tambien te interese")}
        </div>
      </div>
    );
  }

  return (
    <div className="checkout">
      {renderProgress()}
      <h2>Checkout</h2>
      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <section className="form-section">
            <h3>Datos de envio</h3>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre completo"
              value={form.nombre}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="direccion"
              placeholder="Direccion"
              value={form.direccion}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="ciudad"
              placeholder="Ciudad"
              value={form.ciudad}
              onChange={handleChange}
              required
            />
            <input
              type="tel"
              name="telefono"
              placeholder="Telefono"
              value={form.telefono}
              onChange={handleChange}
              required
            />
          </section>

          <section className="form-section">
            <h3>Metodo de pago</h3>
            <div className="payment-methods">
              {paymentOptions.map((option) => (
                <label
                  key={option.id}
                  className={`payment-option ${
                    paymentMethod === option.id ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={option.id}
                    checked={paymentMethod === option.id}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                  <div>
                    <strong>{option.label}</strong>
                    <p>{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="form-section coupon-section">
            <h3>Tienes un cupon?</h3>
            <div className="coupon-form">
              <input
                type="text"
                placeholder="Ingresa tu codigo"
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value)}
              />
              <button type="button" onClick={handleApplyCoupon}>
                Aplicar
              </button>
              {appliedCoupon && (
                <button type="button" className="link-button" onClick={handleRemoveCoupon}>
                  Quitar
                </button>
              )}
            </div>
            {couponStatus && <p className="coupon-feedback">{couponStatus}</p>}
          </section>

          {error && <p className="checkout-error">{error}</p>}

          <button
            className="submit-button"
            type="submit"
            disabled={cart.length === 0 || processing}
          >
            {processing ? "Registrando pedido…" : "Confirmar pedido simulado · " + formatAmount(totalToPay)}
          </button>
        </form>

        <aside className="order-summary">
          <h3>Resumen de pedido</h3>
          {cart.length === 0 ? (
            <>
              <p>Tu carrito esta vacio.</p>
              {renderRecommendations("Explora estos productos")}
            </>
          ) : (
            <div className="summary-items">
              {cart.map((product) => (
                <div key={product.id} className="summary-item">
                  <div>
                    <strong>{product.nombre}</strong>
                    <span>Cant. {product.cantidad}</span>
                  </div>
                  <span>{formatAmount(product.precio * product.cantidad)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="summary-line">
            <span>Subtotal</span>
            <span>{formatAmount(subtotal)}</span>
          </div>
          {cappedDiscount > 0 && (
            <div className="summary-line discount">
              <span>Descuento {appliedCoupon?.code ? "(" + appliedCoupon.code + ")" : ""}</span>
              <span>- {formatAmount(cappedDiscount)}</span>
            </div>
          )}
          <div className="summary-line">
            <span>Envio</span>
            <span>{effectiveShipping === 0 ? "Gratis" : formatAmount(effectiveShipping)}</span>
          </div>
          <div className="summary-total">
            <span>Total a pagar</span>
            <span>{formatAmount(totalToPay)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Checkout;
