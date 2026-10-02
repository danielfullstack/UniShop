import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "./AuthContext";
import { ToastContext } from "./ToastContext";
import { ProductContext } from "./ProductContext";

// eslint-disable-next-line react-refresh/only-export-components -- The context and its provider belong together.
export const CartContext = createContext();

const decodeCart = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readCartFromStorage = (key) => {
  try {
    const fromSession = sessionStorage.getItem(key);
    if (fromSession) return decodeCart(fromSession);
  } catch {
    /* ignore */
  }

  try {
    const fromLocal = localStorage.getItem(key);
    if (fromLocal) return decodeCart(fromLocal);
  } catch {
    /* ignore */
  }

  return [];
};

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { notify } = useContext(ToastContext);
  const { products } = useContext(ProductContext);

  const storageKey = useMemo(
    () => (user?.email ? `cart-${user.email}` : "cart-guest"),
    [user?.email]
  );

  const [cart, setCart] = useState(() => readCartFromStorage(storageKey));
  const previousStorageKey = useRef(storageKey);

  useEffect(() => {
    if (previousStorageKey.current !== storageKey) {
      setCart(readCartFromStorage(storageKey));
      previousStorageKey.current = storageKey;
    }
  }, [storageKey]);

  useEffect(() => {
    const payload = JSON.stringify(cart);
    try {
      localStorage.setItem(storageKey, payload);
    } catch {
      /* ignore */
    }
    try {
      sessionStorage.setItem(storageKey, payload);
    } catch {
      /* ignore */
    }
  }, [cart, storageKey]);

  const addToCart = (product) => {
    if (!product) return;
    const currentProduct = products.find((item) => String(item.id) === String(product.id)) || product;
    if (Number(currentProduct.stock) <= 0) {
      notify(`"${product.nombre}" no tiene stock disponible.`, { type: "warning" });
      return;
    }

    setCart((prevCart) => {
      const exists = prevCart.find((item) => String(item.id) === String(currentProduct.id));
      if ((exists?.cantidad || 0) + 1 > Number(currentProduct.stock)) {
        notify(`No hay más unidades disponibles de "${currentProduct.nombre}".`, { type: "warning" });
        return prevCart;
      }
      if (exists) {
        notify(`Cantidad de "${currentProduct.nombre}" actualizada en el carrito.`, {
          type: "info",
        });
        return prevCart.map((item) =>
          String(item.id) === String(currentProduct.id)
            ? { ...currentProduct, cantidad: item.cantidad + 1 }
            : item
        );
      }
      notify(`"${currentProduct.nombre}" agregado al carrito.`, { type: "success" });
      return [...prevCart, { ...currentProduct, cantidad: 1 }];
    });
  };

  const cartCount = cart.reduce((acc, item) => acc + item.cantidad, 0);

  const removeFromCart = (id) => {
    setCart((prevCart) => {
      const product = prevCart.find((item) => item.id === id);
      if (product) {
        notify(`"${product.nombre}" eliminado del carrito.`, { type: "info" });
      }
      return prevCart.filter((item) => item.id !== id);
    });
  };

  const updateQuantity = (id, cantidad) => {
    const product = products.find((item) => String(item.id) === String(id));
    const maximum = product ? Math.max(1, Number(product.stock)) : Infinity;
    const safeValue = Math.min(maximum, Math.max(1, Number(cantidad) || 1));
    setCart((prevCart) =>
      prevCart.map((item) => (String(item.id) === String(id) ? { ...item, cantidad: safeValue } : item))
    );
  };

  const clearCart = () => {
    if (cart.length > 0) {
      notify("Carrito vaciado", { type: "info" });
    }
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, cartCount, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};


