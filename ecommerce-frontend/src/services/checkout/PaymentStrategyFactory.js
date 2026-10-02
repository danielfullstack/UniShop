const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

class SimulatedPaymentStrategy {
  constructor({ id, label, referencePrefix }) {
    this.id = id;
    this.label = label;
    this.referencePrefix = referencePrefix;
  }

  async process({ total }) {
    await wait(700);
    const number = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
    return {
      method: this.id,
      label: this.label,
      reference: `${this.referencePrefix}-${number}`,
      status: "simulado",
      amount: Number(total.toFixed(2)),
    };
  }
}

const strategies = {
  stripe: () => new SimulatedPaymentStrategy({ id: "stripe", label: "Tarjeta (Stripe simulado)", referencePrefix: "CARD" }),
  paypal: () => new SimulatedPaymentStrategy({ id: "paypal", label: "PayPal simulado", referencePrefix: "PAYPAL" }),
  yape: () => new SimulatedPaymentStrategy({ id: "yape", label: "Yape simulado", referencePrefix: "YAPE" }),
};

export const paymentOptions = [
  { id: "stripe", label: "Tarjeta (Stripe simulado)", description: "Pago de demostración; no se procesa ningún cargo." },
  { id: "paypal", label: "PayPal simulado", description: "Selecciona esta opción para una referencia de pago ficticia." },
  { id: "yape", label: "Yape simulado", description: "Selecciona esta opción para una referencia de transferencia ficticia." },
];

export const PaymentStrategyFactory = {
  create(id) {
    const createStrategy = strategies[id];
    if (!createStrategy) throw new Error("Método de pago no válido.");
    return createStrategy();
  },
};
