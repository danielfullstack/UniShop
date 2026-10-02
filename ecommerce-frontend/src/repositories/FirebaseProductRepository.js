import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { ProductAdapter } from "../adapters/ProductAdapter";

const productsCollection = collection(db, "productos");

export class FirebaseProductRepository {
  subscribe(onProducts, onError) {
    const productsQuery = query(productsCollection, orderBy("fechaCreacion", "desc"));
    return onSnapshot(
      productsQuery,
      (snapshot) => onProducts(snapshot.docs.map(ProductAdapter.fromFirestore)),
      onError
    );
  }

  async add(product) {
    return addDoc(productsCollection, {
      ...ProductAdapter.toFirestore(product),
      fechaCreacion: serverTimestamp(),
    });
  }

  async update(id, product) {
    return updateDoc(doc(db, "productos", String(id)), ProductAdapter.toFirestore(product));
  }

  async remove(id) {
    return deleteDoc(doc(db, "productos", String(id)));
  }

  async setStock(id, stock) {
    return updateDoc(doc(db, "productos", String(id)), {
      stock: Math.max(0, Number(stock) || 0),
    });
  }

  async decrementStocks(items) {
    const quantities = new Map();
    items.forEach((item) => {
      const id = String(item.id);
      quantities.set(id, (quantities.get(id) || 0) + Math.max(0, Number(item.cantidad) || 0));
    });
    const refs = [...quantities.keys()].map((id) => doc(db, "productos", id));

    return runTransaction(db, async (transaction) => {
      const snapshots = [];
      for (const ref of refs) snapshots.push(await transaction.get(ref));

      snapshots.forEach((snapshot, index) => {
        if (!snapshot.exists()) throw new Error("Uno de los productos ya no está disponible.");
        const requested = quantities.get(snapshot.id);
        const stock = Math.max(0, Number(snapshot.data().stock) || 0);
        if (requested > stock) {
          throw new Error(`Stock insuficiente para ${snapshot.data().nombre || "un producto"}.`);
        }
        transaction.update(refs[index], { stock: stock - requested });
      });
    });
  }
}

export const productRepository = new FirebaseProductRepository();
