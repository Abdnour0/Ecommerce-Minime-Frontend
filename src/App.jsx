import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import { API_CONFIG, apiFetch } from './components/api-config';
import { AuthManager } from './components/auth';
import { ArrowRight, Leaf, ShieldCheck, Truck, X, ShoppingBag, Search, Filter, Star, Heart, User, ChevronRight, Mail, Lock, UserPlus, LogIn, AlertCircle, Eye, Minus, Plus } from 'lucide-react';

// Progressive Image Component
const ProgressiveImage = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
};

// Quick View Modal
const QuickViewModal = ({ product, onClose, onAddToCart }) => {
  const [selectedSize, setSelectedSize] = useState('M');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-[2.5rem] max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row"
        onClick={e => e.stopPropagation()}
      >
        <div className="md:w-1/2 aspect-square md:aspect-auto">
          <ProgressiveImage src={product.images?.[0]?.image_url} alt={product.name} className="w-full h-full" />
        </div>
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col">
          <button onClick={onClose} className="self-end p-2 hover:bg-gray-100 rounded-full mb-4">
            <X size={24} />
          </button>
          <div className="flex-grow">
            <span className="text-orange-500 font-bold text-sm tracking-widest uppercase mb-2 block">{product.category_name}</span>
            <h2 className="text-3xl font-black mb-4">{product.name}</h2>
            <div className="flex items-center space-x-2 mb-6">
              <div className="flex text-orange-400">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} />)}
              </div>
              <span className="text-sm font-bold text-gray-400">({product.rating} Reviews)</span>
            </div>
            <p className="text-2xl font-black text-gray-900 mb-8">${product.price}</p>
            <p className="text-gray-500 leading-relaxed mb-8">{product.description}</p>
            
            <div className="space-y-6 mb-8">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-gray-400 block mb-3">Select Size</span>
                <div className="flex gap-2">
                  {['S', 'M', 'L', 'XL'].map(size => (
                    <button 
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-xl font-bold transition-all ${selectedSize === size ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => { onAddToCart(product); onClose(); }}
            className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-orange-500 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-gray-900/10"
          >
            <ShoppingBag size={20} />
            <span>Add to Cart</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Reusable Notification Component
const Notification = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, x: '-50%' }}
    animate={{ opacity: 1, y: 0, x: '-50%' }}
    exit={{ opacity: 0, y: 50, x: '-50%' }}
    className={`fixed bottom-8 left-1/2 z-[300] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 min-w-[320px] ${
      type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-500 text-white'
    }`}
  >
    <p className="text-sm font-bold">{message}</p>
    <button onClick={onClose} className="ml-auto p-1 hover:bg-white/10 rounded-full transition-colors">
      <X size={16} />
    </button>
  </motion.div>
);

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modern E-commerce States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [subCategory, setSubCategory] = useState('All');
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);
  const [notification, setNotification] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // UI States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authForm, setAuthForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    AuthManager.init();
    const user = localStorage.getItem('currentUser');
    if (user) setCurrentUser(JSON.parse(user));
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        let endpoint = API_CONFIG.ENDPOINTS.PRODUCTS;
        const params = new URLSearchParams();

        if (selectedCategory === 'Sale') {
          params.append('on_sale', 'True'); // Django Filter uses capitalized True/False
        } else if (selectedCategory !== 'All' && selectedCategory !== 'Sustainability' && selectedCategory !== 'Stores') {
          // Normalize category name to match backend exactly
          params.append('category__name', selectedCategory);
        }
        
        const queryString = params.toString();
        const finalUrl = queryString ? `${endpoint}?${queryString}` : endpoint;
        console.log('Fetching products from:', finalUrl);
        
        const data = await apiFetch(finalUrl);
        setProducts(data.results || data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please check if the backend is running.');
        setLoading(false);
      }
    };

    loadProducts();
    setSubCategory('All'); // Reset sub-category when main category changes
  }, [selectedCategory]);

  // Client-side Search & Sub-filtering (Broadened to include more product keywords)
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const name = (product.name || '').toLowerCase();
      const desc = (product.description || '').toLowerCase();
      const cat = (product.category_name || '').toLowerCase();
      
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || 
                           desc.includes(searchQuery.toLowerCase());
      
      let matchesSub = true;
      if (subCategory === 'Shoes') {
        const shoeKeywords = ['shoe', 'runner', 'sneaker', 'boot', 'slipper', 'glider', 'dasher', 'cruiser', 'lounger', 'mizzle', 'piper', 'trail', 'fly', 'slip', 'sole'];
        matchesSub = shoeKeywords.some(keyword => name.includes(keyword) || cat.includes(keyword));
      } else if (subCategory === 'Apparel') {
        const shoeKeywords = ['shoe', 'runner', 'sneaker', 'boot', 'slipper', 'glider', 'dasher', 'cruiser', 'lounger', 'mizzle', 'piper', 'trail', 'fly', 'slip', 'sole'];
        matchesSub = !shoeKeywords.some(keyword => name.includes(keyword) || cat.includes(keyword));
      }

      return matchesSearch && matchesSub;
    });
  }, [products, searchQuery, subCategory]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      let result;
      if (authMode === 'login') {
        result = await AuthManager.login(authForm.email, authForm.password);
      } else {
        result = await AuthManager.signup(authForm);
      }

      if (result.success) {
        setCurrentUser(result.user);
        setIsAccountOpen(false);
        showNotification(authMode === 'login' ? 'Welcome back!' : 'Account created successfully!');
      } else {
        setAuthError(result.error);
      }
    } catch (err) {
      setAuthError('An unexpected error occurred.');
    }
  };

  const handleLogout = () => {
    AuthManager.logout();
    setCurrentUser(null);
    showNotification('Logged out successfully');
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        showNotification('Removed from wishlist');
        return prev.filter(p => p.id !== product.id);
      }
      showNotification('Added to wishlist!');
      return [...prev, product];
    });
  };

  const addToCart = (product) => {
    setCart(prev => [...prev, product]);
    showNotification(`Added ${product.name} to cart!`);
  };

  const openQuickView = (product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  const freeShippingThreshold = 100;
  const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
  const shippingProgress = Math.min((cartTotal / freeShippingThreshold) * 100, 100);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        type: 'spring', 
        stiffness: 80,
        damping: 12
      } 
    }
  };

  const heroTextVariants = {
    hidden: { x: -40, opacity: 0 },
    visible: (i) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: 0.5 + (i * 0.15),
        duration: 1,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-gray-900 selection:bg-orange-500/10 selection:text-orange-600">
      <Navbar 
        onShowCart={() => setIsCartOpen(true)} 
        onShowAccount={() => setIsAccountOpen(true)}
        cartCount={cart.length}
        wishlistCount={wishlist.length}
        onFilterChange={setSelectedCategory}
        currentFilter={selectedCategory}
      />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden bg-gray-900 pt-32">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=80" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
        </motion.div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            <motion.div
              variants={heroTextVariants}
              custom={0}
              initial="hidden"
              animate="visible"
            >
              <span className="inline-block px-5 py-2 bg-orange-500 text-white text-[11px] font-black tracking-[0.3em] uppercase rounded-full mb-10 shadow-xl shadow-orange-500/20">
                New Collection 2026
              </span>
            </motion.div>
            
            <motion.h1 
              variants={heroTextVariants}
              custom={1}
              initial="hidden"
              animate="visible"
              className="text-7xl md:text-9xl font-black text-white tracking-tighter mb-10 leading-[0.85]"
            >
              Naturally <br />
              <span className="text-orange-500 italic">Comfortable</span>
            </motion.h1>
            
            <motion.p 
              variants={heroTextVariants}
              custom={2}
              initial="hidden"
              animate="visible"
              className="text-xl text-gray-300 mb-12 leading-relaxed max-w-xl font-medium"
            >
              Experience the next level of sustainable footwear. Made with eco-friendly materials that don't compromise on style or performance.
            </motion.p>
            
            <motion.div 
              variants={heroTextVariants}
              custom={3}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8"
            >
              <button 
                onClick={() => document.getElementById('shop').scrollIntoView({ behavior: 'smooth' })}
                className="px-12 py-5 bg-white text-gray-900 font-black rounded-2xl hover:bg-orange-500 hover:text-white transition-all duration-500 flex items-center justify-center group shadow-2xl hover:shadow-orange-500/30 active:scale-95"
              >
                Shop Collection
                <ArrowRight size={24} className="ml-3 group-hover:translate-x-2 transition-transform duration-500" />
              </button>
            </motion.div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Product Section */}
      <main id="shop" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight mb-6"
          >
            {selectedCategory === 'All' ? 'Our Collection' : `${selectedCategory}'s`}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-gray-500 text-lg mb-10 max-w-2xl mx-auto"
          >
            Comfortable, sustainable footwear and apparel for every day
          </motion.p>
          
          {/* Sub-category Filter (Matching user image) */}
          <div className="flex justify-center gap-4 mb-12">
            {['All', 'Shoes', 'Apparel'].map((sub) => (
              <button 
                key={sub}
                onClick={() => setSubCategory(sub)}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${
                  subCategory === sub 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                  : 'bg-white text-gray-500 hover:text-gray-900 border border-gray-100'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="relative max-w-md mx-auto"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search our shop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all outline-none text-sm font-medium shadow-sm"
            />
          </motion.div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-[4/5] rounded-3xl mb-6" />
                <div className="h-5 bg-gray-200 rounded-full w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded-full w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <p className="text-gray-500 mb-8 font-medium">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-10 py-4 bg-gray-900 text-white rounded-xl font-bold hover:scale-105 transition-transform"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-gray-100">
            <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or category filter</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12"
          >
            {filteredProducts.map(product => (
              <motion.div key={product.id} variants={itemVariants} layout>
                <ProductCard 
                  product={product} 
                  onAddToCart={() => addToCart(product)}
                  onToggleWishlist={() => toggleWishlist(product)}
                  onQuickView={() => openQuickView(product)}
                  isWishlisted={wishlist.some(p => p.id === product.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Recommendations Section */}
        {filteredProducts.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-32 pt-24 border-t border-gray-100"
          >
            <div className="flex justify-between items-end mb-12">
              <div>
                <span className="text-orange-500 font-bold text-sm tracking-widest uppercase mb-4 block">Personalized</span>
                <h2 className="text-4xl font-black tracking-tight">You Might Also Like</h2>
              </div>
              <button className="text-gray-900 font-bold flex items-center hover:text-orange-500 transition-colors">
                View All <ChevronRight size={20} className="ml-1" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.slice(0, 4).map(product => (
                <ProductCard 
                  key={`rec-${product.id}`} 
                  product={product} 
                  onAddToCart={() => addToCart(product)}
                  onToggleWishlist={() => toggleWishlist(product)}
                  onQuickView={() => openQuickView(product)}
                  isWishlisted={wishlist.some(p => p.id === product.id)}
                />
              ))}
            </div>
          </motion.section>
        )}
      </main>

      {/* Account Modal */}
      <AnimatePresence>
        {isAccountOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAccountOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[130]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white z-[140] shadow-2xl rounded-[2.5rem] overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black tracking-tight">
                    {currentUser ? 'Your Account' : (authMode === 'login' ? 'Welcome Back' : 'Join minime.')}
                  </h3>
                  <button onClick={() => setIsAccountOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {currentUser ? (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl">
                      <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                        {currentUser.first_name?.[0] || currentUser.email?.[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{currentUser.first_name} {currentUser.last_name}</p>
                        <p className="text-sm text-gray-500">{currentUser.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-red-500 transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {authError && (
                      <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center">
                        <AlertCircle size={16} className="mr-2" />
                        {authError}
                      </div>
                    )}
                    
                    {authMode === 'signup' && (
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          type="text"
                          placeholder="First Name"
                          className="w-full px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500"
                          value={authForm.firstName}
                          onChange={(e) => setAuthForm({...authForm, firstName: e.target.value})}
                          required
                        />
                        <input 
                          type="text"
                          placeholder="Last Name"
                          className="w-full px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500"
                          value={authForm.lastName}
                          onChange={(e) => setAuthForm({...authForm, lastName: e.target.value})}
                          required
                        />
                      </div>
                    )}
                    
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="email"
                        placeholder="Email Address"
                        className="w-full pl-12 pr-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500"
                        value={authForm.email}
                        onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="password"
                        placeholder="Password"
                        className="w-full pl-12 pr-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500"
                        value={authForm.password}
                        onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                        required
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-orange-500 transition-colors shadow-lg shadow-gray-900/10"
                    >
                      {authMode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>

                    <p className="text-center text-sm text-gray-500 mt-6">
                      {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
                      <button 
                        type="button"
                        onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                        className="ml-2 text-orange-500 font-bold hover:underline"
                      >
                        {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                      </button>
                    </p>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center">
                  <ShoppingBag className="mr-2" size={24} />
                  Your Cart ({cart.length})
                </h3>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto p-6">
                {/* Shipping Progress */}
                {cart.length > 0 && (
                  <div className="mb-8 p-4 bg-gray-50 rounded-2xl">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-3">
                      <span>{shippingProgress < 100 ? `Add $${(freeShippingThreshold - cartTotal).toFixed(2)} more for free shipping` : 'You qualify for free shipping!'}</span>
                      <span className="text-orange-500">{Math.round(shippingProgress)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${shippingProgress}%` }}
                        className="h-full bg-orange-500"
                      />
                    </div>
                  </div>
                )}
                
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                      <ShoppingBag size={40} className="text-gray-300" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h4>
                    <p className="text-gray-500 mb-8">Start adding some items!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map((item, i) => (
                      <div key={i} className="flex space-x-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={item.images?.[0]?.image_url} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow">
                          <h5 className="font-bold text-sm mb-1">{item.name}</h5>
                          <p className="text-orange-500 font-bold text-sm">${item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-100 space-y-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span>${cart.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2)}</span>
                  </div>
                  <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-orange-500 transition-colors shadow-xl shadow-gray-900/10 flex items-center justify-center group">
                    Checkout Now
                    <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <Notification 
            message={notification.message} 
            type={notification.type} 
            onClose={() => setNotification(null)} 
          />
        )}

        {isQuickViewOpen && selectedProduct && (
          <QuickViewModal 
            product={selectedProduct} 
            onClose={() => setIsQuickViewOpen(false)} 
            onAddToCart={addToCart} 
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <h2 className="text-2xl font-bold tracking-tighter mb-6">minime<span className="text-orange-500">.</span></h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Redefining footwear through nature. Our mission is to provide the most comfortable and sustainable shoes on the planet.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase text-xs tracking-widest">Shop</h4>
              <ul className="space-y-4 text-sm text-gray-500 font-medium">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Men's Shoes</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Women's Shoes</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">New Arrivals</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Sale</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase text-xs tracking-widest">Company</h4>
              <ul className="space-y-4 text-sm text-gray-500 font-medium">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Our Story</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Sustainability</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Stores</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase text-xs tracking-widest">Support</h4>
              <ul className="space-y-4 text-sm text-gray-500 font-medium">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Shipping & Returns</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 font-medium">
            <p>© 2026 MINIME. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-gray-900">Privacy Policy</a>
              <a href="#" className="hover:text-gray-900">Terms of Service</a>
              <a href="#" className="hover:text-gray-900">Cookie Settings</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
