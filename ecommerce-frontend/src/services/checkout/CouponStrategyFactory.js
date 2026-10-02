class PercentageDiscountStrategy {
  constructor(value) { this.value = value; }
  calculate(subtotal) { return subtotal * this.value / 100; }
  shipping(baseShipping) { return baseShipping; }
}

class FlatDiscountStrategy {
  constructor(value) { this.value = value; }
  calculate(subtotal) { return Math.min(subtotal, this.value); }
  shipping(baseShipping) { return baseShipping; }
}

class FreeShippingStrategy {
  calculate() { return 0; }
  shipping() { return 0; }
}

const coupons = {
  DESCUENTO10: {
    type: "percent", value: 10, label: "10% de descuento",
    strategy: new PercentageDiscountStrategy(10),
  },
  ENVIOFREE: {
    type: "shipping", value: 0, label: "Envío gratis",
    strategy: new FreeShippingStrategy(),
  },
  BIENVENIDO20: {
    type: "flat", value: 20, label: "S/20 de descuento",
    strategy: new FlatDiscountStrategy(20),
  },
};

export const CouponStrategyFactory = {
  create(code) {
    const coupon = coupons[String(code || "").trim().toUpperCase()];
    return coupon ? { ...coupon, code: String(code).trim().toUpperCase() } : null;
  },
};
