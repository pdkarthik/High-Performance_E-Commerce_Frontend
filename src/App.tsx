import { useEffect, useMemo, useState } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArrowLeft, Heart, Menu, Minus, Plus, Search, ShieldCheck, ShoppingCart, Star, Trash2, Truck, UserRound } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { categories, products, type Product } from "./products";

const queryClient = new QueryClient();

const categorySlug = (value: string) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const formatPrice = (price: number) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: price % 1 ? 2 : 0,
  maximumFractionDigits: price % 1 ? 2 : 0,
}).format(price);

const getCategoryProducts = (category: string) => products.filter((product) => product.category === category);
const getCategoryCover = (category: string) => getCategoryProducts(category)[0];
const featured = [products[0], products[12], products[24], products[36], products[48], products[60]].filter(Boolean);

function Header({ cartCount, query, setQuery }: { cartCount: number; query: string; setQuery: (query: string) => void }) {
  const [location, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim() && location !== "/") {
      setLocation("/");
    }
  };

  return (
    <header className="site-header">
      <div className="header-main">
        <Link href="/" className="logo" onClick={() => setQuery("")}>
          <span>E</span>
          <strong>E-Mart</strong>
        </Link>
        <div className="searchbar">
          <Search size={19} />
          <input
            value={query}
            onChange={(event) => handleSearch(event.target.value)}
            onFocus={() => {
              if (query.trim() && location !== "/") setLocation("/");
            }}
            placeholder={isMobile ? "Search..." : "Search for products, brands and more"}
          />
        </div>
        <div className="header-actions">
          <button><UserRound size={18} /> Login</button>
          <Link href="/cart" className="cart-link"><ShoppingCart size={19} /> Cart <b>{cartCount}</b></Link>
        </div>
      </div>
      <nav className="category-menu">
        <Menu size={18} />
        {categories.map((category) => {
          const href = `/category/${categorySlug(category)}`;
          return (
            <Link key={category} href={href} className={location.startsWith(href) ? "active" : ""} onClick={() => setQuery("")}>
              {category}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

function Rating({ product }: { product: Product }) {
  return (
    <span className="rating-badge">
      {product.rating} <Star size={11} fill="currentColor" />
    </span>
  );
}

function ProductImage({ product }: { product: Product }) {
  return (
    <div className={`image-box ${categorySlug(product.category)}-image`}>
      <img src={product.image} alt={product.name} loading="lazy" />
      {product.discount > 0 && <span className="discount-tag">{product.discount}% off</span>}
    </div>
  );
}

function ProductCard({ product, addToCart }: { product: Product; addToCart: (product: Product) => void }) {
  const originalPrice = product.price / (1 - product.discount / 100);

  return (
    <article className="product-card">
      <button className="heart-button" aria-label="Add to wishlist"><Heart size={17} /></button>
      <Link href={`/product/${product.slug}`} className="product-link">
        <ProductImage product={product} />
        <div className="product-info">
          <p>{product.brand}</p>
          <h3>{product.model}</h3>
          <div className="meta-line">
            <Rating product={product} />
            <small>({product.reviews})</small>
          </div>
          <div className="price-row">
            <strong>{formatPrice(product.price)}</strong>
            <s>{formatPrice(originalPrice)}</s>
          </div>
          <span className={product.stock === "Limited stock" ? "stock warning" : "stock"}>{product.stock}</span>
        </div>
      </Link>
      <button className="add-cart" onClick={() => addToCart(product)}>Add to Cart</button>
    </article>
  );
}

function CategoryTile({ category }: { category: string }) {
  const cover = getCategoryCover(category);

  return (
    <Link href={`/category/${categorySlug(category)}`} className="category-tile">
      {cover && <img src={cover.image} alt={category} loading="lazy" />}
      <span>{category}</span>
    </Link>
  );
}

function PromoBanner() {
  return (
    <section className="promo-banner">
      <div>
        <span>Big Savings Week</span>
        <h1>Real products. Better shopping layout.</h1>
        <p>Browse the original E-Mart catalog with actual images, practical shelves, deals and cart flow.</p>
        <Link href="/category/mobiles">Shop Mobiles</Link>
      </div>
      <div className="banner-products">
        {featured.slice(0, 3).map((product) => (
          <Link key={product.id} href={`/product/${product.slug}`}>
            <img src={product.image} alt={product.name} />
            <strong>{formatPrice(product.price)}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductShelf({ title, category, addToCart }: { title: string; category: string; addToCart: (product: Product) => void }) {
  const shelfProducts = getCategoryProducts(category).slice(0, 6);

  return (
    <section className="product-shelf">
      <div className="shelf-head">
        <div>
          <h2>{title}</h2>
          <p>{shelfProducts.length} popular picks</p>
        </div>
        <Link href={`/category/${categorySlug(category)}?section=products`}>View all</Link>
      </div>
      <div className="shelf-grid">
        {shelfProducts.map((product) => (
          <ProductCard key={product.id} product={product} addToCart={addToCart} />
        ))}
      </div>
    </section>
  );
}

function HomePage({ addToCart, query }: { addToCart: (product: Product) => void; query: string }) {
  const searchedProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return products.filter((product) => `${product.name} ${product.model} ${product.category} ${product.brand} ${product.description}`.toLowerCase().includes(normalized)).slice(0, 24);
  }, [query]);

  return (
    <main className="page home-page">
      <section className="category-strip">
        {categories.map((category) => <CategoryTile key={category} category={category} />)}
      </section>

      {query.trim() ? (
        <section className="product-shelf search-results">
          <div className="shelf-head">
            <div>
              <h2>Search results</h2>
              <p>{searchedProducts.length} products for “{query}”</p>
            </div>
          </div>
          <div className="shelf-grid full-grid">
            {searchedProducts.map((product) => <ProductCard key={product.id} product={product} addToCart={addToCart} />)}
          </div>
          {!searchedProducts.length && (
            <div className="empty-search">
              <h3>No products found</h3>
              <p>Try searching mobiles, computers, furniture, watches, books, speakers or TV.</p>
            </div>
          )}
        </section>
      ) : (
        <>
          <PromoBanner />
          <ProductShelf title="Best of Mobiles" category="Mobiles" addToCart={addToCart} />
          <ProductShelf title="Top Computers" category="Computers" addToCart={addToCart} />
          <ProductShelf title="Fashion Deals" category="Mens Wear" addToCart={addToCart} />
          <ProductShelf title="Home & Furniture" category="Furniture" addToCart={addToCart} />
          <ProductShelf title="Kitchen Essentials" category="Kitchen" addToCart={addToCart} />
          <ProductShelf title="Books, Speakers & TV" category="Books" addToCart={addToCart} />
        </>
      )}
    </main>
  );
}

function CategoryPage({ addToCart }: { addToCart: (product: Product) => void }) {
  const [location] = useLocation();
  const path = location.split("?")[0];
  const slug = path.split("/").pop() || "";
  const category = categories.find((item) => categorySlug(item) === slug);
  const [brand, setBrand] = useState("All Brands");
  const [sort, setSort] = useState("popularity");

  if (!category) return <NotFound />;

  const categoryProducts = getCategoryProducts(category);
  const brands = ["All Brands", ...Array.from(new Set(categoryProducts.map((product) => product.brand)))];
  const filteredProducts = brand === "All Brands" ? categoryProducts : categoryProducts.filter((product) => product.brand === brand);
  const sortedProducts = [...filteredProducts].sort((first, second) => {
    if (sort === "price-low") return first.price - second.price;
    if (sort === "price-high") return second.price - first.price;
    return second.reviews - first.reviews;
  });

  return (
    <main className="page category-page">
      <Link href="/" className="back-link"><ArrowLeft size={17} /> Back to Home</Link>
      <section className="category-header-card">
        <div>
          <span>{categoryProducts.length} products</span>
          <h1>{category}</h1>
          <p>Everything you need, delivered straight to your door. Start exploring below.</p>
        </div>
        <div>
          {categoryProducts.slice(0, 4).map((product) => <img key={product.id} src={product.image} alt={product.name} />)}
        </div>
      </section>
      <section className="listing-layout">
        <aside className="filter-card">
          <h2>Filters</h2>
          <label>
            Brand
            <select value={brand} onChange={(event) => setBrand(event.target.value)}>
              {brands.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <div className="trust-box"><Truck size={18} /> Fast delivery available</div>
          <div className="trust-box"><ShieldCheck size={18} /> Secure shopping</div>
        </aside>
        <section className="product-shelf listing-shelf" id="category-products">
          <div className="shelf-head">
            <div>
              <h2>{category}</h2>
              <p>Showing {filteredProducts.length} products</p>
            </div>
            <select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="popularity">Sort by popularity</option>
              <option value="price-low">Price low to high</option>
              <option value="price-high">Price high to low</option>
            </select>
          </div>
          <div className="shelf-grid full-grid" key={`${category}-${brand}-${sort}`}>
            {sortedProducts.map((product) => <ProductCard key={product.id} product={product} addToCart={addToCart} />)}
          </div>
        </section>
      </section>
    </main>
  );
}

function ProductPage({ addToCart }: { addToCart: (product: Product) => void }) {
  const [location] = useLocation();
  const slug = location.split("/").pop() || "";
  const product = products.find((item) => item.slug === slug);

  if (!product) return <NotFound />;

  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 6);
  const originalPrice = product.price / (1 - product.discount / 100);

  return (
    <main className="page product-page">
      <Link href={`/category/${categorySlug(product.category)}`} className="back-link"><ArrowLeft size={17} /> Back to {product.category}</Link>
      <section className="product-detail-card">
        <div className="detail-image">
          <ProductImage product={product} />
        </div>
        <div className="detail-copy">
          <p className="breadcrumb">Home / {product.category} / {product.brand}</p>
          <h1>{product.name}</h1>
          <div className="meta-line"><Rating product={product} /><small>{product.reviews} reviews</small></div>
          <p className="description">{product.description}</p>
          <div className="detail-price-row">
            <strong>{formatPrice(product.price)}</strong>
            <s>{formatPrice(originalPrice)}</s>
            <span>{product.discount}% off</span>
          </div>
          <div className="service-list">
            <div><Truck size={19} /> Free delivery by tomorrow</div>
            <div><ShieldCheck size={19} /> Secure checkout and easy returns</div>
          </div>
          <div className="detail-buttons">
            <button onClick={() => addToCart(product)}>Add to Cart</button>
            <button onClick={() => addToCart(product)}>Buy Now</button>
          </div>
        </div>
      </section>
      <ProductShelf title="You may also like" category={product.category} addToCart={addToCart} />
    </main>
  );
}

function CartPage({ cartItems, addToCart, removeFromCart }: { cartItems: Product[]; addToCart: (product: Product) => void; removeFromCart: (product: Product) => void }) {
  const groupedItems = cartItems.reduce<Array<{ product: Product; quantity: number }>>((groups, product) => {
    const existing = groups.find((group) => group.product.id === product.id);
    if (existing) existing.quantity += 1;
    else groups.push({ product, quantity: 1 });
    return groups;
  }, []);

  const subtotal = cartItems.reduce((sum, product) => sum + product.price, 0);
  const discount = subtotal * 0.08;
  const total = Math.max(0, subtotal - discount);

  return (
    <main className="page cart-page">
      <Link href="/" className="back-link"><ArrowLeft size={17} /> Continue Shopping</Link>
      <section className="cart-layout">
        <div className="cart-card">
          <h1>My Cart</h1>
          {groupedItems.length === 0 ? (
            <div className="empty-cart">
              <ShoppingCart size={46} />
              <h2>Your cart is empty</h2>
              <p>Add items from the catalog to checkout.</p>
              <Link href="/">Shop Now</Link>
            </div>
          ) : groupedItems.map(({ product, quantity }) => (
            <article key={product.id} className="cart-row">
              <img src={product.image} alt={product.name} />
              <div>
                <p>{product.brand}</p>
                <h3>{product.model}</h3>
                <span>{product.stock}</span>
              </div>
              <div className="quantity-box">
                <button onClick={() => removeFromCart(product)}><Minus size={15} /></button>
                <strong>{quantity}</strong>
                <button onClick={() => addToCart(product)}><Plus size={15} /></button>
              </div>
              <strong>{formatPrice(product.price * quantity)}</strong>
              <button className="remove-button" onClick={() => removeFromCart(product)}><Trash2 size={17} /></button>
            </article>
          ))}
        </div>
        <aside className="summary-card">
          <h2>Price Details</h2>
          <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
          <div><span>Discount</span><strong>-{formatPrice(discount)}</strong></div>
          <div><span>Delivery</span><strong>Free</strong></div>
          <div className="total-line"><span>Total Amount</span><strong>{formatPrice(total)}</strong></div>
          <button disabled={!cartItems.length}>Place Order</button>
        </aside>
      </section>
    </main>
  );
}

function Router() {
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const addToCart = (product: Product) => setCartItems((items) => [...items, product]);
  const removeFromCart = (product: Product) => {
    setCartItems((items) => {
      const index = items.findIndex((item) => item.id === product.id);
      if (index < 0) return items;
      return [...items.slice(0, index), ...items.slice(index + 1)];
    });
  };

  return (
    <div className="app-shell">
      <Header cartCount={cartItems.length} query={query} setQuery={setQuery} />
      <Switch>
        <Route path="/" component={() => <HomePage addToCart={addToCart} query={query} />} />
        <Route path="/category/:slug" component={() => <CategoryPage addToCart={addToCart} />} />
        <Route path="/product/:slug" component={() => <ProductPage addToCart={addToCart} />} />
        <Route path="/cart" component={() => <CartPage cartItems={cartItems} addToCart={addToCart} removeFromCart={removeFromCart} />} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </div>
  );
}

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    if (location.includes("section=products") || window.location.search.includes("section=products")) {
      window.setTimeout(() => {
        const productsSection = document.getElementById("category-products");
        if (!productsSection) return;
        const headerOffset = 128;
        const targetTop = productsSection.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: Math.max(0, targetTop), left: 0, behavior: "auto" });
      }, 120);
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ScrollToTop />
          <Router />
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
