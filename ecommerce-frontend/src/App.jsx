import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Cart from "./pages/Cart";
import Products from "./pages/Products";
import { analytics } from "./firebase/firebaseConfig";
import LoginForm from "./pages/LoginForm";
import UserProfile from "./pages/UserProfile";
import Checkout from "./pages/Checkout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDashboardFB from "./pages/AdminDashboardFB";
import Wishlist from "./pages/Wishlist";
import Home from "./pages/Home";
import PasswordReset from "./pages/PasswordReset";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  useEffect(() => {
    if (analytics) {
      console.log("Firebase Analytics inicializado:", analytics);
    } else {
      console.log("Firebase Analytics no disponible (faltan credenciales o entorno no compatible)");
    }
  }, []);
  return (
    <Router>
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<Products />} />
          <Route path="/favoritos" element={<Wishlist />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/registro" element={<LoginForm mode="register" />} />
          <Route path="/recuperar-contrasena" element={<PasswordReset />} />
          <Route path="/admin/login" element={<LoginForm audience="admin" />} />
          <Route path="/perfil" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin-fb" element={<AdminRoute><AdminDashboardFB /></AdminRoute>} />
          <Route path="*" element={<h2>Página no encontrada</h2>} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
