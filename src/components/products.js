import { logger } from './logger.js';
import { state } from './state.js';
import { SettingsManager } from './settings.js';
import { WishlistManager } from './wishlist.js';
import { CartManager } from './cart.js';
import { escapeHtml, trapFocus } from './ui-utils.js';
import { loadAndRenderReviews } from './reviews.js';
import { API_CONFIG, apiFetch } from './api-config.js';
import { fallbackProducts } from './fallback-products.js';
import { RecentlyViewedManager } from './recently-viewed.js';

// Fetch products from Django Backend
export async function fetchProducts() {
    try {
        logger.log('Fetching products from Django backend...');
        const products = await apiFetch(API_CONFIG.ENDPOINTS.PRODUCTS);
        
        state.products = products.map(p => ({
            ...p,
            category: (p.category_name || '').toLowerCase(), // Map category_name (Men/Women) to category (men/women)
            image: p.images.find(img => img.is_primary)?.image_url || p.images[0]?.image_url || 'https://via.placeholder.com/600x600?text=No+Image',
            gallery: p.images.filter(img => !img.is_primary).map(img => img.image_url),
            colors: p.colors.map(c => ({ name: c.name, hex: c.hex_code })),
            sizes: p.sizes.map(s => s.name)
        }));
        
        logger.log(`Successfully fetched ${state.products.length} products from API`);
        return true;
    } catch (error) {
        logger.error('Failed to fetch products from API, falling back to local data...', error);
        state.products = fallbackProducts.map(p => ({
            ...p,
            id: p.id || p._id
        }));
        return false;
    }
}

export function renderProducts(container, filter = 'all') {
    if (!container) {
        logger.warn('renderProducts: Container not found');
        return;
    }

    if (!state.products || state.products.length === 0) {
        logger.warn('renderProducts: No products available');
        container.innerHTML = '<div class="no-products"><p>No products available at the moment.</p></div>';
        return;
    }

    let filteredProducts = state.products;

    if (filter === 'bestsellers') {
        filteredProducts = state.products.filter(p => p.badge === 'Bestseller').slice(0, 4);
    } else if (filter === 'men-all') {
        filteredProducts = state.products.filter(p => p.category === 'men');
    } else if (filter === 'men-shoes') {
        filteredProducts = state.products.filter(p => p.category === 'men' && p.type === 'shoes');
    } else if (filter === 'men-clothes') {
        filteredProducts = state.products.filter(p => p.category === 'men' && p.type === 'clothes');
    } else if (filter === 'women-all') {
        filteredProducts = state.products.filter(p => p.category === 'women');
    } else if (filter === 'women-shoes') {
        filteredProducts = state.products.filter(p => p.category === 'women' && p.type === 'shoes');
    } else if (filter === 'women-clothes') {
        filteredProducts = state.products.filter(p => p.category === 'women' && p.type === 'clothes');
    } else if (filter === 'sale') {
        filteredProducts = state.products.filter(p => p.onSale === true);
    } else if (filter === 'recently-viewed') {
        const viewedIds = RecentlyViewedManager.get();
        filteredProducts = viewedIds.map(id => state.products.find(p => String(p.id || p._id) === String(id))).filter(Boolean);
    } else if (filter === 'recommendations') {
        filteredProducts = state.recommendations || [];
    }

    if (filteredProducts.length === 0) {
        container.innerHTML = '<div class="no-products"><p>No products match this filter.</p></div>';
        return;
    }

    const addToCartText = SettingsManager.getTranslation('addToCart') || 'Add to Cart';

    container.innerHTML = filteredProducts.map(product => {
        let badgeText = product.badge;
        if (badgeText === 'Bestseller') {
            badgeText = state.currentLanguage === 'fr' ? 'Meilleure Vente' :
                state.currentLanguage === 'ar' ? 'الكثر مبيعاً' : 'Bestseller';
        } else if (badgeText === 'New') {
            badgeText = state.currentLanguage === 'fr' ? 'Nouveau' :
                state.currentLanguage === 'ar' ? 'جديد' : 'New';
        }

        const isWishlisted = WishlistManager.isInWishlist(product.id);

        return `
        <div class="product-card" role="listitem" data-product-id="${product.id}" tabindex="0">
            <div class="product-image">
                ${product.badge ? `<div class="product-badge">${escapeHtml(badgeText)}</div>` : ''}
                <img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async" onerror="this.src='https://via.placeholder.com/600x600?text=Image+Not+Available'">
                <button class="wishlist-toggle-btn ${isWishlisted ? 'active' : ''}" data-product-id="${product.id}" aria-label="Toggle Wishlist">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="${isWishlisted ? 'var(--accent-color)' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            </div>
            <div class="product-info">
                <h3 class="product-name">${escapeHtml(product.name)}</h3>
                <p class="product-description">${escapeHtml(product.description)}</p>
                <div class="product-footer">
                    <span class="product-price">${product.onSale && product.originalPrice ? `<span class="original-price">$${product.originalPrice}</span> ` : ''}$${product.price}</span>
                    <button class="add-to-cart" data-product-id="${product.id}" aria-label="${addToCartText} ${escapeHtml(product.name)}">${addToCartText}</button>
                </div>
            </div>
        </div>
    `}).join('');

    container.querySelectorAll('.wishlist-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.productId;
            WishlistManager.toggle(productId);
            const isWishlisted = WishlistManager.isInWishlist(productId);
            btn.classList.toggle('active', isWishlisted);
            const icon = btn.querySelector('svg');
            if (icon) icon.setAttribute('fill', isWishlisted ? 'var(--accent-color)' : 'none');
        });
    });

    container.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.add-to-cart') && !e.target.closest('.wishlist-toggle-btn')) {
                const productId = card.dataset.productId;
                openProductModal(productId);
            }
        });

        card.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.target.closest('.add-to-cart')) {
                const productId = card.dataset.productId;
                openProductModal(productId);
            }
        });
    });

    container.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const productId = btn.dataset.productId;
            if (!productId) {
                logger.error('Add to cart button missing product-id attribute');
                return;
            }
            CartManager.add(productId);
        });
    });
}

export function openProductModal(productId) {
    logger.log('openProductModal called with productId:', productId);
    logger.log('Available products:', state.products.length);
    RecentlyViewedManager.add(productId);

    // Find the product
    const product = state.products.find(p => {
        const pId = String(p.id || p._id);
        const searchId = String(productId);
        return pId === searchId;
    });

    if (!product) {
        logger.error('openProductModal: Product not found', {
            searchedId: productId,
            availableIds: state.products.map(p => p.id || p._id)
        });
        return;
    }

    // CRITICAL FIX: Set selectedProduct in state for addToCartFromModal
    state.selectedProduct = product;
    logger.log('state.selectedProduct set to:', product.name);

    // Query ALL required DOM elements at the start
    const productModal = document.getElementById('productModal');
    const productModalOverlay = document.getElementById('productModalOverlay');
    const modalImage = document.getElementById('modalImage');
    const modalName = document.getElementById('modalName');
    const modalDescription = document.getElementById('modalDescription');
    const modalPrice = document.getElementById('modalPrice');
    const modalBadge = document.getElementById('modalBadge');
    const modalGallery = document.getElementById('modalGallery');
    const modalMaterial = document.getElementById('modalMaterial');
    const modalWeight = document.getElementById('modalWeight');
    const modalOrigin = document.getElementById('modalOrigin');
    const modalCare = document.getElementById('modalCare');
    const modalClose = document.getElementById('modalClose');

    // Populate modal with product data
    if (modalImage) modalImage.src = product.image;
    if (modalName) modalName.textContent = product.name;
    if (modalDescription) modalDescription.textContent = product.description;
    if (modalPrice) {
        modalPrice.innerHTML = product.onSale && product.originalPrice ? `<span class="original-price">$${product.originalPrice}</span> $${product.price}` : `$${product.price}`;
    }
    
    // Update the Add to Cart button price
    const modalPriceBtn = document.getElementById('modalPriceBtn');
    if (modalPriceBtn) {
        modalPriceBtn.textContent = `$${product.price}`;
    }
    if (modalMaterial) modalMaterial.textContent = product.material;
    if (modalWeight) modalWeight.textContent = product.weight;
    if (modalOrigin) modalOrigin.textContent = product.origin;
    if (modalCare) modalCare.textContent = product.care;

    // Update rating from product data
    const ratingValue = product.rating || 4.5;
    const modalRating = document.querySelector('#productModal .modal-rating');
    if (modalRating) {
        const fullStars = Math.floor(ratingValue);
        const hasHalfStar = ratingValue % 1 >= 0.5;
        const starsStr = '★'.repeat(fullStars) + (hasHalfStar ? '★' : '') + '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
        modalRating.innerHTML = `<span class="stars" aria-label="${ratingValue} out of 5 stars">${starsStr}</span><span class="rating-text">${ratingValue} <span data-translate="outOf5">out of 5</span></span>`;
    }

    // Handle product images gallery
    if (modalGallery && product.images) {
        modalGallery.innerHTML = product.images.map((img, index) => `
            <img src="${img}" alt="${escapeHtml(product.name)} view ${index + 1}" 
                 class="gallery-thumb ${index === 0 ? 'active' : ''}"
                 data-image-src="${img}"
                 tabindex="0"
                 role="button"
                 aria-label="View image ${index + 1}">
        `).join('');

        modalGallery.querySelectorAll('.gallery-thumb').forEach(thumb => {
            thumb.addEventListener('click', function () {
                changeModalImage(this.dataset.imageSrc, this);
            });
            thumb.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    changeModalImage(this.dataset.imageSrc, this);
                }
            });
        });
    }

    // Handle Color buttons — render from product data
    const colorContainer = document.querySelector('#productModal .color-options');
    if (colorContainer && product.colors && product.colors.length > 0) {
        colorContainer.innerHTML = product.colors.map((color, index) => 
            `<button class="color-btn ${index === 0 ? 'selected' : ''}" style="background: ${color.hex};" title="${escapeHtml(color.name)}" aria-label="${escapeHtml(color.name)} color"></button>`
        ).join('');

        colorContainer.querySelectorAll('.color-btn').forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                colorContainer.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');

                // Try to map color index to image index
                if (product.images && product.images.length > 0) {
                    const mappedIndex = index < product.images.length ? index : 0;
                    const modalImage = document.getElementById('modalImage');
                    const galleryThumbs = document.querySelectorAll('#modalGallery .gallery-thumb');
                    const thumbEl = galleryThumbs[mappedIndex] || galleryThumbs[0];

                    if (thumbEl) {
                        changeModalImage(product.images[mappedIndex], thumbEl);
                    }
                }
            });
        });
    }

    // Handle Size buttons — render from product data
    const sizeContainer = document.querySelector('#productModal .size-options');
    if (sizeContainer && product.sizes && product.sizes.length > 0) {
        sizeContainer.innerHTML = product.sizes.map((size, index) => 
            `<button class="size-btn ${index === 1 ? 'selected' : ''}">${escapeHtml(size)}</button>`
        ).join('');

        const sizeBtns = sizeContainer.querySelectorAll('.size-btn');
        sizeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                sizeContainer.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    }

    // Handle badge translation
    if (modalBadge) {
        if (product.badge) {
            let badgeText = product.badge;
            if (badgeText === 'Bestseller') {
                badgeText = state.currentLanguage === 'fr' ? 'Meilleure Vente' :
                    state.currentLanguage === 'ar' ? 'الكثر مبيعاً' : 'Bestseller';
            } else if (badgeText === 'New') {
                badgeText = state.currentLanguage === 'fr' ? 'Nouveau' :
                    state.currentLanguage === 'ar' ? 'جديد' : 'New';
            }
            modalBadge.textContent = badgeText;
            modalBadge.style.display = 'inline-block';
        } else {
            modalBadge.style.display = 'none';
        }
    }

    // Handle wishlist toggle button
    const wishlistToggleModal = document.getElementById('modalWishlistToggle');
    if (wishlistToggleModal) {
        const isWishlisted = WishlistManager.isInWishlist(productId);
        wishlistToggleModal.classList.toggle('active', isWishlisted);

        // Remove old listener before adding new one
        wishlistToggleModal.onclick = null;
        wishlistToggleModal.onclick = (e) => {
            e.stopPropagation();
            WishlistManager.toggle(productId);
            const active = WishlistManager.isInWishlist(productId);
            wishlistToggleModal.classList.toggle('active', active);
            const icon = wishlistToggleModal.querySelector('svg');
            if (icon) icon.setAttribute('fill', active ? 'var(--accent-color)' : 'none');
        };
    }

    // Product Recommendations logic
    const recommendedProducts = state.products
        .filter(p => p.category === product.category && p.id !== product.id)
        .slice(0, 4);

    const recContainer = document.getElementById('modalRecommendations');
    const recGrid = document.getElementById('modalRecommendationsGrid');
    
    if (recommendedProducts.length > 0 && recContainer && recGrid) {
        state.recommendations = recommendedProducts;
        recContainer.style.display = 'block';
        renderProducts(recGrid, 'recommendations');
    } else if (recContainer) {
        recContainer.style.display = 'none';
        state.recommendations = [];
    }

    // Show the modal
    if (productModal) {
        productModal.classList.add('active');
        trapFocus(productModal);
    }
    if (productModalOverlay) productModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Setup close button - single event listener
    if (modalClose) {
        // Clone the node to remove all existing event listeners
        const newModalClose = modalClose.cloneNode(true);
        modalClose.parentNode.replaceChild(newModalClose, modalClose);

        // Add fresh event listener to the new node
        newModalClose.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            logger.log('Product modal close button clicked');
            closeProductModal();
        });

        logger.log('Product modal close button event listener attached');
    }

    // Load and render reviews for this product
    loadAndRenderReviews(productId);

    // Focus on close button for accessibility
    setTimeout(() => {
        const closeBtn = document.getElementById('modalClose');
        if (closeBtn) {
            closeBtn.focus();
            logger.log('Modal close button focused');
        }
    }, 100);
}

export function changeModalImage(imageSrc, thumbElement) {
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        modalImage.src = imageSrc;
    }

    // Update active thumb
    const galleryThumbs = document.querySelectorAll('.gallery-thumb');
    galleryThumbs.forEach(thumb => thumb.classList.remove('active'));
    if (thumbElement) {
        thumbElement.classList.add('active');
    }
}

export function closeProductModal() {
    logger.log('closeProductModal called');
    const productModal = document.getElementById('productModal');
    const productModalOverlay = document.getElementById('productModalOverlay');

    if (productModal) {
        productModal.classList.remove('active');
        logger.log('Product modal closed');
    } else {
        logger.warn('closeProductModal: productModal element not found');
    }

    if (productModalOverlay) {
        productModalOverlay.classList.remove('active');
    } else {
        logger.warn('closeProductModal: productModalOverlay element not found');
    }

    document.body.style.overflow = '';
}

export function renderSkeletons(container, count = 4) {
    if (!container) return;
    
    // Generate 'count' number of skeleton cards
    const skeletonHTML = Array(count).fill(0).map(() => `
        <div class="skeleton-card" role="presentation">
            <div class="skeleton-image"></div>
            <div class="product-info" style="padding: 1rem 0;">
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
                <div class="skeleton-text price"></div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = skeletonHTML;
}