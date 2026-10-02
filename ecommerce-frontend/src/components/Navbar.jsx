import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { WishlistContext } from "../context/WishlistContext";
import { ProductContext } from "../context/ProductContext";
import "./Navbar.css";

function Navbar() {
  const { cartCount } = useContext(CartContext);
  const { user, isAuthenticated, isAdmin, logout } = useContext(AuthContext);
  const { wishlistCount } = useContext(WishlistContext);
  const { filters, updateFilters } = useContext(ProductContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.searchTerm);
  const navigate = useNavigate();

  useEffect(() => {
    setSearchValue(filters.searchTerm);
  }, [filters.searchTerm]);

  const toggleMenu = () => setMenuOpen((open) => !open);
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchValue(value);
    updateFilters({ searchTerm: value });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateFilters({ searchTerm: searchValue });
    navigate("/productos");
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link className="navbar-logo" to="/" onClick={closeMenu}>UniShop</Link>
        <button
          className="navbar-toggle"
          onClick={toggleMenu}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          type="button"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      <div className="navbar-actions">
        <form className="navbar-search" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder="Buscar por nombre o categoría"
            value={searchValue}
            onChange={handleSearchChange}
            aria-label="Buscar productos"
          />
          <button type="submit">Buscar</button>
        </form>
      </div>

      <ul className={`navbar-links ${menuOpen ? "active" : ""}`}>
        <li>
          <Link to="/" onClick={closeMenu}>
            Inicio
          </Link>
        </li>
        <li>
          <Link to="/productos" onClick={closeMenu}>
            Productos
          </Link>
        </li>
        <li>
          <Link to="/favoritos" onClick={closeMenu}>
            Favoritos
            <span className="count-badge">{wishlistCount}</span>
          </Link>
        </li>
        <li>
          <Link to="/carrito" onClick={closeMenu}>
            Carrito
            <span className="count-badge">{cartCount}</span>
          </Link>
        </li>
        {isAdmin && (
          <li>
            <Link to="/admin" onClick={closeMenu}>
              Administración
            </Link>
          </li>
        )}
        {isAuthenticated ? (
          <>
            <li>
              <Link to="/perfil" onClick={closeMenu}>
                Perfil
              </Link>
            </li>
            <li>
              <button className="logout-button" onClick={handleLogout} type="button">
                Salir {user?.email ? `(${user.email})` : ""}
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link to="/login" onClick={closeMenu}>
              Login
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
