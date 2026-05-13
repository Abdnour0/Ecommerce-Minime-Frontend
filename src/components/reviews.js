import { AuthManager } from './auth.js';
import { logger } from './logger.js';
import { escapeHtml } from './ui-utils.js';
import { API_CONFIG, apiFetch } from './api-config.js';

export const ReviewManager = {
    async getProductReviews(productId) {
        try {
            // Fetch reviews for specific product from Django
            const reviews = await apiFetch(`${API_CONFIG.ENDPOINTS.REVIEWS}?product=${productId}`);
            return reviews.map(r => ({
                ...r,
                _id: r.id,
                userName: r.username,
                createdAt: r.created_at
            }));
        } catch (e) {
            logger.error('Error fetching reviews from API:', e);
            return [];
        }
    },

    async addReview(productId, rating, comment) {
        if (!AuthManager.isAuthenticated()) {
            return {
                success: false,
                error: 'You must be logged in to submit reviews.'
            };
        }

        try {
            const newReview = await apiFetch(API_CONFIG.ENDPOINTS.REVIEWS, {
                method: 'POST',
                body: JSON.stringify({
                    product: productId,
                    rating: rating,
                    comment: comment
                })
            });

            return { 
                success: true, 
                review: {
                    ...newReview,
                    _id: newReview.id,
                    userName: newReview.username,
                    createdAt: newReview.created_at
                } 
            };
        } catch (e) {
            logger.error('Error submitting review to API:', e);
            return {
                success: false,
                error: e.message || 'Failed to submit review.'
            };
        }
    }
};

export async function loadAndRenderReviews(productId) {
    const list = document.getElementById('productReviewsList');
    const countEl = document.getElementById('modalReviewCount');
    const avgRatingEl = document.getElementById('modalAvgRating');
    const avgStarsEl = document.getElementById('modalAvgStars');
    const form = document.getElementById('reviewForm');

    if (!list) return;

    // Reset UI
    list.innerHTML = `<div class="loading-spinner"></div>`;
    if (form) form.style.display = 'none';

    // Simulate network delay for realism
    await new Promise(r => setTimeout(r, 500));

    const reviews = await ReviewManager.getProductReviews(productId);

    // Update count and average
    const count = reviews.length;
    if (countEl) countEl.textContent = count;

    if (count > 0) {
        const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
        const avg = (sum / count).toFixed(1);
        if (avgRatingEl) avgRatingEl.textContent = avg;
        if (avgStarsEl) avgStarsEl.textContent = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
    } else {
        if (avgRatingEl) avgRatingEl.textContent = '0.0';
        if (avgStarsEl) avgStarsEl.textContent = '☆☆☆☆☆';
    }

    if (count === 0) {
        list.innerHTML = `<p class="empty-reviews" data-translate="noReviewsYet">No reviews yet. Be the first to review!</p>`;
        return;
    }

    list.innerHTML = reviews.map(rev => `
        <div class="review-item" id="review-${rev._id}">
            <div class="review-meta">
                <span class="review-user">${escapeHtml(rev.userName || 'Anonymous')}</span>
                <span class="review-date">${new Date(rev.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="stars">${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}</div>
            <p class="review-comment">${escapeHtml(rev.comment)}</p>
        </div>
    `).join('');
}
