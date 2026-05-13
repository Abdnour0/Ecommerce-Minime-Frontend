import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star, ArrowUpRight, Eye } from 'lucide-react';

// Progressive Image Component (Shared or local)
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

const ProductCard = ({ product, onAddToCart, onToggleWishlist, onQuickView, isWishlisted }) => {
  const { name, price, original_price, rating, on_sale, badge, images, colors } = product;
  const [selectedColor, setSelectedColor] = useState(colors?.[0] || null);
  
  const primaryImage = images?.find(img => img.is_primary)?.image_url || images?.[0]?.image_url;

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="group relative flex flex-col bg-white rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100/50"
    >
      {/* Badge */}
      {badge && (
        <div className="absolute top-5 left-5 z-10">
          <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] bg-orange-500 text-white rounded-full shadow-lg shadow-orange-500/20">
            {badge}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute top-5 right-5 z-10 flex flex-col space-y-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onToggleWishlist(); }}
          className={`p-3 backdrop-blur-md rounded-full transition-colors shadow-sm border border-gray-100 ${
            isWishlisted ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/90 text-gray-400 hover:text-red-500'
          }`}
        >
          <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onQuickView(); }}
          className="p-3 bg-white/90 backdrop-blur-md rounded-full text-gray-400 hover:text-gray-900 transition-colors shadow-sm border border-gray-100"
        >
          <Eye size={18} />
        </motion.button>
      </div>

      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-50/50">
        <ProgressiveImage
          src={primaryImage}
          alt={name}
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        
        {/* Color Swatches (Interactive Micro-interaction) */}
        {colors && colors.length > 0 && (
          <div className="absolute bottom-24 left-5 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75">
            {colors.map(color => (
              <button 
                key={color} 
                onClick={(e) => { e.stopPropagation(); setSelectedColor(color); }}
                className={`w-4 h-4 rounded-full border-2 shadow-sm transition-transform hover:scale-125 ${selectedColor === color ? 'border-orange-500 scale-110' : 'border-white/50'}`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}
        
        {/* Quick Add Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
        
        <div className="absolute inset-x-5 bottom-5 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
          <button 
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-sm shadow-2xl shadow-gray-900/20 flex items-center justify-center space-x-2 hover:bg-orange-500 transition-colors active:scale-95"
          >
            <ShoppingBag size={18} />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow bg-white">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-base font-bold text-gray-900 line-clamp-1 group-hover:text-orange-500 transition-colors cursor-pointer">{name}</h3>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <div className="flex text-orange-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} fill={i < Math.floor(rating) ? "currentColor" : "none"} />
            ))}
          </div>
          <span className="text-xs font-bold text-gray-400">({rating})</span>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-gray-900">${price}</span>
            {on_sale && original_price && (
              <span className="text-sm text-gray-400 line-through font-medium">${original_price}</span>
            )}
          </div>
          
          <motion.div 
            whileHover={{ x: 3, y: -3 }}
            className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all cursor-pointer"
          >
            <ArrowUpRight size={18} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
