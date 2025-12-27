import { state } from './state.js';
import { AuthManager } from './auth.js';
import { escapeHtml } from './ui-utils.js';

export const ReviewManager = {
    async getProductReviews(productId) {
        try {
            const allReviews = JSON.parse(localStorage.getItem('reviews')) || [];
            return allReviews.filter(r => String(r.productId) === String(productId));
        } catch (e) {
            console.error('Error fetching reviews:', e);
            return [];
        }
    },

    async addReview(productId, rating, comment) {
        // Check if user has valid authentication
        if (!state.currentUser) {
            return {
                success: false,
                error: 'You must be logged in with a valid account to submit reviews. Please log in and try again.'
            };
        }

        try {
            const newReview = {
                _id: 'rev_' + Date.now(),
                productId: String(productId),
                userId: state.currentUser.email, // using email as id for local
                userName: `${state.currentUser.firstName} ${state.currentUser.lastName}`,
                rating: rating,
                comment: comment,
                createdAt: new Date().toISOString()
            };

            const allReviews = JSON.parse(localStorage.getItem('reviews')) || [];
            allReviews.push(newReview);
            localStorage.setItem('reviews', JSON.stringify(allReviews));

            return { success: true, review: newReview };
        } catch (e) {
            console.error('Error submitting review:', e);
            return {
                success: false,
                error: `Unable to save review. Please try again.`
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
