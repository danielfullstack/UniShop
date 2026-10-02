import React, { createContext, useEffect, useMemo, useState } from "react";
import { productRepository } from "../repositories/FirebaseProductRepository";

// eslint-disable-next-line react-refresh/only-export-components -- The context and its provider belong together.
export const ProductContext = createContext();

const normalizeTags = (value) => {
  const tags = Array.isArray(value) ? value : value ? String(value).split(",") : [];
  return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))];
};

const initialFilters = {
  searchTerm: "",
  category: "all",
  minPrice: "",
  maxPrice: "",
  tags: [],
  onlyAvailable: false,
};

const FILTERS_STORAGE_KEY = "productFiltersPEN";

const readFilters = () => {
  try {
    const stored = sessionStorage.getItem(FILTERS_STORAGE_KEY);
    if (!stored) return { ...initialFilters };
    const parsed = JSON.parse(stored);
    return { ...initialFilters, ...parsed, tags: normalizeTags(parsed.tags) };
  } catch {
    return { ...initialFilters };
  }
};

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState(readFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = productRepository.subscribe(
      (rows) => {
        setProducts(rows);
        setError("");
        setLoading(false);
      },
      (firebaseError) => {
        console.error("No se pudo cargar el catálogo de Firebase:", firebaseError);
        setError("No se pudo cargar el catálogo. Intenta actualizar la página.");
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // Los filtros siguen disponibles durante la sesión actual aunque storage esté bloqueado.
    }
  }, [filters]);

  const availableCategories = useMemo(() => {
    const values = new Set(products.map((product) => product.categoria).filter(Boolean));
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const availableTags = useMemo(() => {
    const values = new Set(products.flatMap((product) => product.etiquetas || []).filter(Boolean));
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = filters.searchTerm.trim().toLowerCase();
    const min = filters.minPrice === "" ? null : Number(filters.minPrice);
    const max = filters.maxPrice === "" ? null : Number(filters.maxPrice);
    const tags = filters.tags.map((tag) => tag.toLowerCase());

    return products.filter((product) => {
      const matchesTerm = !term || product.nombre.toLowerCase().includes(term) || product.categoria.toLowerCase().includes(term);
      if (!matchesTerm) return false;
      if (filters.category !== "all" && product.categoria !== filters.category) return false;
      if (min !== null && Number.isFinite(min) && product.precio < min) return false;
      if (max !== null && Number.isFinite(max) && product.precio > max) return false;
      if (filters.onlyAvailable && product.stock <= 0) return false;
      return tags.every((tag) => product.etiquetas.some((item) => item.toLowerCase() === tag));
    });
  }, [products, filters]);

  const updateFilters = (updates) => {
    setFilters((previous) => ({
      ...previous,
      ...updates,
      tags: updates.tags === undefined ? previous.tags : normalizeTags(updates.tags),
    }));
  };

  const toggleTagFilter = (tag) => {
    const value = String(tag || "").trim();
    if (!value) return;
    setFilters((previous) => {
      const exists = previous.tags.some((item) => item.toLowerCase() === value.toLowerCase());
      return {
        ...previous,
        tags: exists
          ? previous.tags.filter((item) => item.toLowerCase() !== value.toLowerCase())
          : [...previous.tags, value],
      };
    });
  };

  const resetFilters = () => setFilters({ ...initialFilters });
  const addProduct = (product) => productRepository.add(product);
  const updateProduct = (id, product) => productRepository.update(id, product);
  const removeProduct = (id) => productRepository.remove(id);
  const setStock = (id, stock) => productRepository.setStock(id, stock);
  const decrementStock = (id, quantity) => productRepository.decrementStocks([{ id, cantidad: quantity }]);
  const decrementStocks = (items) => productRepository.decrementStocks(items);

  const value = {
    products,
    filteredProducts,
    filters,
    updateFilters,
    resetFilters,
    toggleTagFilter,
    availableCategories,
    availableTags,
    addProduct,
    updateProduct,
    removeProduct,
    decrementStock,
    decrementStocks,
    setStock,
    loading,
    error,
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}
