import { sendSimulatedEmail } from "../../utils/emailSimulator";
import { localOrderRepository } from "../../repositories/LocalOrderRepository";
import { PaymentStrategyFactory } from "./PaymentStrategyFactory";

const makeToken = () => {
  const randomPart = () => Math.random().toString(36).slice(2, 10).padEnd(8, "0");
  const existing = new Set(localOrderRepository.list().map((order) => order.token));
  let token;
  do { token = `tok_${randomPart()}`; } while (existing.has(token));
  return token;
};

export class CheckoutFacade {
  constructor({ orderRepository = localOrderRepository, paymentFactory = PaymentStrategyFactory } = {}) {
    this.orderRepository = orderRepository;
    this.paymentFactory = paymentFactory;
  }

  async placeOrder({
    cart, form, user, paymentMethod, subtotal, shippingCost, discount, couponCode,
    total, decrementStocks, updateUserProfile, formatAmount,
  }) {
    const paymentStrategy = this.paymentFactory.create(paymentMethod);
    const id = `ORD-${Date.now()}`;
    const payment = await paymentStrategy.process({ total });
    const order = {
      id,
      token: makeToken(),
      date: new Date().toISOString(),
      items: cart.map((item) => ({ ...item })),
      subtotal: Number(subtotal.toFixed(2)),
      shippingCost: Number(shippingCost.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      coupon: couponCode || null,
      total: Number(total.toFixed(2)),
      userEmail: user?.email || "invitado",
      shipping: { ...form },
      status: "pendiente",
      payment,
    };

    this.orderRepository.save(order);
    try {
      await decrementStocks(order.items);
    } catch (error) {
      try { this.orderRepository.remove(id); } catch (rollbackError) {
        console.error("No se pudo revertir el registro local del pedido:", rollbackError);
      }
      throw error;
    }

    if (user) {
      try {
        await updateUserProfile({
          lastOrderAt: order.date,
          defaultAddress: {
            nombre: form.nombre,
            direccion: form.direccion,
            ciudad: form.ciudad,
            telefono: form.telefono,
          },
        });
      } catch (error) {
        console.warn("El pedido quedó registrado, pero no se pudo actualizar el perfil:", error);
      }
      sendSimulatedEmail({
        to: user.email,
        subject: `Confirmación de pedido ${id}`,
        body: `Hola ${user.displayName || form.nombre || ""}, tu pedido ${id} se registró por ${formatAmount(order.total)}. El pago es simulado. Gracias por comprar en UniShop.`,
      });
    }

    return order;
  }
}

export const checkoutFacade = new CheckoutFacade();
