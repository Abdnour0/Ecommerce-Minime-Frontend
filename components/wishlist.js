import { state } from './state.js';
import { showNotification } from './ui-utils.js';
import { SettingsManager } from './settings.js';
import { CartManager } from './cart.js';
import { openProductModal } from './products.js';

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export const WishlistManager = {
    init() {
        try {
            const storedWishlist = localStorage.getItem('wishlist');
            state.wishlist = storedWishlist ? JSON.parse(storedWishlist) : [];
            this.updateCounter();
        } catch (e) {
            console.error('Error loading wishlist:', e);
            state.wishlist = [];
        }
    },

    toggle(productId) {
        const strId = String(productId);
        const index = state.wishlist.indexOf(strId);
        if (index === -1) {
            state.wishlist.push(strId);
            showNotification('Added to wishlist!', 'success');
        } else {
            state.wishlist.splice(index, 1);
            showNotification('Removed from wishlist', 'info');
        }
        this.save();
        this.updateCounter();

        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: { wishlist: state.wishlist } }));
        
        // Re-render wishlist if page is active
        const wishlistPage = document.getElementById('wishlistPage');
        if (wishlistPage && wishlistPage.classList.contains('active')) {
            renderWishlist();
        }
    },

    isInWishlist(productId) {
        return state.wishlist.includes(String(productId));
    },

    save() {
        localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
    },

    updateCounter() {
        const count = state.wishlist.length;
        const wishlistCount = document.getElementById('wishlistCount');
        if (wishlistCount) {
            wishlistCount.textContent = count;
            wishlistCount.style.display = count > 0 ? 'flex' : 'none';
        }
    },

    getProducts(allProducts) {
        return allProducts.filter(p => state.wishlist.includes(String(p.id)));
    }
};

export function renderWishlist() {
    const container = document.getElementById('wishlistGrid');
    if (!container) return;

    const wishlistProducts = WishlistManager.getProducts(state.products);

    if (wishlistProducts.length === 0) {
        const emptyText = SettingsManager.getTranslation('wishlistEmpty') || 'Your wishlist is empty';
        const emptyDesc = SettingsManager.getTranslation('wishlistEmptyDesc') || 'Save items you love to find them easily later.';
        const browseText = SettingsManager.getTranslation('browseProducts') || 'Browse Products';
        
        container.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <h3>${escapeHtml(emptyText)}</h3>
                <p>${escapeHtml(emptyDesc)}</p>
                <button class="btn btn-primary" onclick="window.showHomePage()">${escapeHtml(browseText)}</button>
            </div>
        `;
        return;
    }

    const addToCartText = SettingsManager.getTranslation('addToCart') || 'Add to Cart';

    container.innerHTML = wishlistProducts.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${escapeHtml(product.name)}" onerror="this.src='https://via.placeholder.com/600x600?text=No+Image'">
                <button class="wishlist-toggle-btn active" onclick="event.stopPropagation(); window.WishlistManager.toggle('${product.id}')" aria-label="Remove from Wishlist">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent-color)" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            </div>
            <div class="product-info">
                <h3 class="product-name">${escapeHtml(product.name)}</h3>
                <div class="product-footer">
                    <span class="product-price">$${product.price}</span>
                    <button class="add-to-cart" onclick="event.stopPropagation(); window.CartManager.add('${product.id}')">${escapeHtml(addToCartText)}</button>
                </div>
            </div>
        </div>
    `).join('');

    // Add click handlers for product cards
    container.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.add-to-cart') && !e.target.closest('.wishlist-toggle-btn')) {
                const productId = card.dataset.productId;
                openProductModal(productId);
            }
        });
    });
}
