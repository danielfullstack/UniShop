import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ProductContext } from "../context/ProductContext";
import ProductCard from "../components/ProductCard";
import "./Home.css";

function Home() {
  const { products, availableCategories, updateFilters, loading, error } = useContext(ProductContext);
  const navigate = useNavigate();
  const featuredProducts = products.slice(0, 4);

  const openCategory = (category) => {
    updateFilters({ category, searchTerm: "" });
    navigate("/productos");
  };

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="home-kicker">UNISHOP · TECNOLOGÍA</span>
          <h1>Encuentra lo que necesitas para estudiar, crear y jugar.</h1>
          <p>Explora el catálogo de UniShop y elige entre productos disponibles para ti.</p>
          <Link className="home-primary-link" to="/productos">Ver productos</Link>
        </div>
        <div className="home-hero-art" aria-hidden="true">
          <div className="home-orbit home-orbit--outer" />
          <div className="home-orbit home-orbit--inner" />
          <span className="home-hero-symbol">U</span>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-heading">
          <div><span className="home-kicker">EXPLORA</span><h2>Compra por categoría</h2></div>
          <Link to="/productos">Ver catálogo</Link>
        </div>
        {loading ? <p role="status">Cargando categorías…</p> : error ? <p role="alert">{error}</p> : availableCategories.length === 0 ? (
          <p className="home-empty">Las categorías aparecerán cuando haya productos publicados.</p>
        ) : (
          <div className="home-category-grid">
            {availableCategories.slice(0, 8).map((category, index) => (
              <button type="button" key={category} onClick={() => openCategory(category)}>
                <span className={`home-category-icon home-category-icon--${index % 4}`} aria-hidden="true">{category.charAt(0).toUpperCase()}</span>
                <span>{category}</span>
                <span className="home-category-arrow">→</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="home-section home-featured-section">
        <div className="home-section-heading">
          <div><span className="home-kicker">CATÁLOGO</span><h2>Productos destacados</h2></div>
          <Link to="/productos">Ver todos</Link>
        </div>
        {loading ? <p role="status">Cargando productos…</p> : error ? <p role="alert">{error}</p> : featuredProducts.length === 0 ? (
          <p className="home-empty">Todavía no hay productos publicados en el catálogo.</p>
        ) : (
          <div className="home-product-grid">
            {featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
