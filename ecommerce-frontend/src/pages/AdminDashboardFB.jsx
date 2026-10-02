import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { formatPEN } from "../utils/formatPEN";
import { db, storage } from "../firebase/firebaseConfig";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

function AdminDashboardFB() {
  const { user, isAuthenticated, isAdmin } = useContext(AuthContext);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: "", descripcion: "", precio: "", stock: "", imagenFile: null, imagenPreview: "" });
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const q = query(collection(db, "productos"), orderBy("fechaCreacion", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProductos(rows);
      setLoading(false);
    }, (err) => {
      console.error("Error al leer productos:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imagenFile" && files && files[0]) {
      const file = files[0];
      setForm((f) => ({ ...f, imagenFile: file }));
      const reader = new FileReader();
      reader.onload = () => setForm((f) => ({ ...f, imagenPreview: reader.result }));
      reader.readAsDataURL(file);
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const resetForm = () => setForm({ nombre: "", descripcion: "", precio: "", stock: "", imagenFile: null, imagenPreview: "" });

  const uploadImageIfAny = async () => {
    if (!form.imagenFile) return null;
    const file = form.imagenFile;
    const path = `productos/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  };

  const saveProducto = async (e) => {
    e.preventDefault();
    setStatus("");
    const precio = Number(form.precio);
    const stock = Number(form.stock);
    if (!form.nombre.trim()) return setStatus("El nombre es obligatorio.");
    if (!Number.isFinite(precio) || precio <= 0) return setStatus("El precio debe ser mayor a 0.");
    if (!Number.isFinite(stock) || stock < 0) return setStatus("El stock debe ser mayor o igual a 0.");
    try {
      let imagenUrl = null;
      if (form.imagenFile) imagenUrl = await uploadImageIfAny();
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        precio,
        stock,
        imagenUrl: imagenUrl || null,
        fechaCreacion: serverTimestamp(),
        creadoPor: user?.uid || null,
      };
      if (editingId) {
        await updateDoc(doc(db, "productos", editingId), payload);
        setStatus("Producto actualizado correctamente.");
      } else {
        await addDoc(collection(db, "productos"), payload);
        setStatus("Producto creado correctamente.");
      }
      resetForm();
      setEditingId(null);
    } catch (err) {
      console.error(err);
      setStatus("Ocurrió un error al guardar.");
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({ nombre: p.nombre || "", descripcion: p.descripcion || "", precio: String(p.precio ?? ""), stock: String(p.stock ?? ""), imagenFile: null, imagenPreview: p.imagenUrl || "" });
  };

  const removeProducto = async (id) => {
    if (!confirm("¿Eliminar este producto?")) return;
    try { await deleteDoc(doc(db, "productos", id)); setStatus("Producto eliminado."); } catch (err) { console.error(err); setStatus("No se pudo eliminar."); }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-dashboard">
        <h2>Panel de administración</h2>
        <p>Debes iniciar sesión para gestionar productos.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-dashboard">
        <h2>Panel de administración</h2>
        <p>No tienes permisos de administrador.</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <h2>Panel de administración (Firebase)</h2>
      <form className="admin-form" onSubmit={saveProducto}>
        <label>
          Nombre
          <input name="nombre" value={form.nombre} onChange={handleChange} required />
        </label>
        <label>
          Descripción
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} />
        </label>
        <div className="grid-2">
          <label>
            Precio
            <input name="precio" type="number" min="0" step="0.01" value={form.precio} onChange={handleChange} required />
          </label>
          <label>
            Stock
            <input name="stock" type="number" min="0" step="1" value={form.stock} onChange={handleChange} required />
          </label>
        </div>
        <label>
          Imagen
          <input name="imagenFile" type="file" accept="image/*" onChange={handleChange} />
        </label>
        {form.imagenPreview && (
          <div className="preview">
            <img src={form.imagenPreview} alt="Vista previa" />
          </div>
        )}
        <div className="actions">
          <button type="submit">{editingId ? "Actualizar" : "Guardar"} producto</button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); resetForm(); }}>Cancelar</button>
          )}
        </div>
        {status && <p className="status">{status}</p>}
      </form>

      <section className="admin-list">
        <h3>Productos</h3>
        {loading ? (
          <p>Cargando…</p>
        ) : productos.length === 0 ? (
          <p>No hay productos aún.</p>
        ) : (
          <ul className="items">
            {productos.map((p) => (
              <li key={p.id} className="item">
                <div className="item-media">
                  {p.imagenUrl ? <img src={p.imagenUrl} alt={p.nombre} /> : <div className="placeholder" />}
                </div>
                <div className="item-body">
                  <strong>{p.nombre}</strong>
                  <span>{formatPEN(p.precio)}</span>
                  <small>Stock: {p.stock ?? 0}</small>
                </div>
                <div className="item-actions">
                  <button onClick={() => startEdit(p)}>Editar</button>
                  <button onClick={() => removeProducto(p.id)}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default AdminDashboardFB;
