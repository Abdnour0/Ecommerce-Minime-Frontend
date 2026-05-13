import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, User, Heart, Settings, Menu, X, Globe, Sun, Moon, LayoutGrid } from 'lucide-react';

const Navbar = ({ onShowCart, onShowAccount, cartCount = 0, wishlistCount = 0, onFilterChange, currentFilter }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const iconButtonClasses = "p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all active:scale-95 relative group";

  const navItems = [
    { label: 'MEN', filter: 'Men' },
    { label: 'WOMEN', filter: 'Women' },
    { label: 'SALE', filter: 'Sale' },
    { label: 'SUSTAINABILITY', filter: 'Sustainability' },
    { label: 'STORES', filter: 'Stores' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-shrink-0 flex items-center"
          >
            <button 
              onClick={() => onFilterChange('All')}
              className="text-3xl font-black tracking-tighter text-gray-900 hover:text-orange-500 transition-colors"
            >
              minime<span className="text-orange-500">.</span>
            </button>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-10">
            {navItems.map((item) => (
              <button 
                key={item.label} 
                onClick={() => onFilterChange(item.filter)}
                className={`text-xs font-bold tracking-[0.15em] transition-all hover:text-orange-500 ${
                  item.label === 'SALE' ? 'text-red-500 hover:text-red-600' : 'text-gray-900/60 hover:text-gray-900'
                } ${currentFilter === item.filter ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-1">
            <button 
              className={iconButtonClasses}
              title="Dashboard"
            >
              <LayoutGrid size={20} />
            </button>

            <div className="relative">
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`${iconButtonClasses} ${isSettingsOpen ? 'bg-gray-100 text-gray-900' : ''}`}
                title="Settings"
              >
                <Settings size={20} />
              </button>
              
              <AnimatePresence>
                {isSettingsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 overflow-hidden"
                    >
                      <div className="px-5 py-3 border-b border-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Language</p>
                        <div className="space-y-1">
                          <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors group">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">🇺🇸</span>
                              <span className="font-medium">English</span>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          </button>
                        </div>
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Appearance</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="flex items-center justify-center space-x-2 py-2.5 text-sm bg-gray-900 text-white rounded-xl">
                            <Sun size={14} />
                            <span className="font-bold">Light</span>
                          </button>
                          <button className="flex items-center justify-center space-x-2 py-2.5 text-sm text-gray-500 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                            <Moon size={14} />
                            <span className="font-bold">Dark</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button className={iconButtonClasses}>
              <Search size={20} />
            </button>
            
            <button 
              className={iconButtonClasses}
            >
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-[9px] font-black px-1.5 rounded-full min-w-[16px] h-[16px] flex items-center justify-center border-2 border-white">{wishlistCount}</span>
              )}
            </button>
            
            <button 
              onClick={onShowAccount}
              className={iconButtonClasses}
            >
              <User size={20} />
            </button>
            
            <button 
              onClick={onShowCart}
              className="ml-2 p-2.5 bg-gray-900 text-white hover:bg-orange-500 rounded-full transition-all active:scale-95 relative group shadow-lg shadow-gray-900/10 hover:shadow-orange-500/20"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-gray-900 text-[9px] font-black px-1.5 rounded-full min-w-[16px] h-[16px] flex items-center justify-center border-2 border-gray-900 group-hover:border-orange-500 transition-colors">{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-white z-50 shadow-2xl md:hidden p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-12">
                <span className="text-2xl font-black tracking-tighter">minime<span className="text-orange-500">.</span></span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X size={24} />
                </button>
              </div>
              <div className="flex flex-col space-y-6">
                {['MEN', 'WOMEN', 'SALE', 'SUSTAINABILITY', 'STORES'].map((item) => (
                  <a 
                    key={item} 
                    href="#" 
                    className={`text-xl font-extrabold tracking-tight ${
                      item === 'SALE' ? 'text-red-500' : 'text-gray-900'
                    }`}
                  >
                    {item}
                  </a>
                ))}
              </div>
              <div className="mt-auto pt-8 border-t border-gray-100">
                <button className="w-full py-4 bg-gray-50 text-gray-900 rounded-2xl font-bold mb-4 flex items-center justify-center space-x-3">
                  <User size={20} />
                  <span>My Account</span>
                </button>
                <button onClick={onShowCart} className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold flex items-center justify-center space-x-3 shadow-lg shadow-orange-500/20">
                  <ShoppingCart size={20} />
                  <span>View Cart</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
