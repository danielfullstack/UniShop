const toImageList = (data = {}) => {
  const images = Array.isArray(data.imagenes) ? data.imagenes : [];
  const primary = data.imagenUrl || data.imagen || "";
  return [...new Set([primary, ...images].filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];
};

const toTags = (value) => {
  const tags = Array.isArray(value) ? value : value ? String(value).split(",") : [];
  return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))];
};

export const ProductAdapter = {
  fromFirestore(snapshot) {
    const data = snapshot.data();
    const images = toImageList(data);
    return {
      id: snapshot.id,
      nombre: String(data.nombre || "Producto sin nombre").trim(),
      precio: Number(data.precio) || 0,
      stock: Math.max(0, Number(data.stock) || 0),
      categoria: String(data.categoria || "General").trim(),
      etiquetas: toTags(data.etiquetas),
      descripcion: String(data.descripcion || "").trim(),
      imagen: images[0] || "",
      imagenes: images,
      fechaCreacion: data.fechaCreacion || null,
    };
  },

  toFirestore(product) {
    const images = toImageList(product);
    return {
      nombre: String(product.nombre || "").trim(),
      precio: Number(product.precio) || 0,
      stock: Math.max(0, Number(product.stock) || 0),
      categoria: String(product.categoria || "General").trim(),
      etiquetas: toTags(product.etiquetas),
      descripcion: String(product.descripcion || "").trim(),
      imagenUrl: images[0] || "",
      imagenes: images,
    };
  },
};
