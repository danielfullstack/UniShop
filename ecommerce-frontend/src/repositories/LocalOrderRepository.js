const ORDERS_KEY = "orders";

const readOrders = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export class LocalOrderRepository {
  list() { return readOrders(); }

  save(order) {
    const orders = readOrders();
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify([...orders, order]));
    } catch {
      throw new Error("No se pudo guardar el pedido en el almacenamiento local.");
    }
    return order;
  }

  remove(id) {
    const orders = readOrders().filter((order) => order.id !== id);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
}

export const localOrderRepository = new LocalOrderRepository();
