// ===================================
// BOOKFEATHER - BOOK.JS
// Сторінка окремої книги: галерея, рейтинг, схожі книги
// ===================================

let currentBook       = null;
let currentImageIndex = 0;
let userRatings       = JSON.parse(localStorage.getItem('userRatings') || '{}');
let userRating        = 0;

// ===================================
// ІНІЦІАЛІЗАЦІЯ
// ===================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadBooks();
    displayBookDetails();
});


// ===================================
// ВІДОБРАЖЕННЯ КНИГИ
// ===================================
async function displayBookDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const rawId     = urlParams.get('id');
    const bookId    = parseInt(rawId);
    const container = document.getElementById('book-detail');

    if (!container) return;

    // Переконуємось що книги завантажені
    if (!books || books.length === 0) {
        await loadBooks();
    }

    // Шукаємо по числовому і рядковому id
    const book = books.find(b => b.id === bookId || b.id === rawId || String(b.id) === String(rawId));

    if (!book) {
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:80px 20px;">
                <div style="font-size:60px; margin-bottom:20px;">📚</div>
                <h2>Книгу не знайдено</h2>
                <p style="color:var(--cinereous); margin-bottom:24px;">Можливо, вона була видалена або посилання невірне</p>
                <a href="catalog.html" class="btn btn-primary">До каталогу</a>
            </div>
        `;
        return;
    }

    currentBook = book;
    addToRecentlyViewed(bookId);

    const images         = getBookImages(book);
    const isFavorite     = isInFavorites(book.id);
    userRating           = userRatings[bookId] || 0;
    const availableStock = (book.stock || 0) - (book.reserved || 0);

    // Ціна з урахуванням знижки
    const finalPrice = book.discount > 0
        ? (book.price * (1 - book.discount / 100)).toFixed(0)
        : book.price;

    const priceHtml = book.discount > 0 ? `
        <div class="book-detail-price">
            <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
                <span style="font-size:36px; font-weight:700; color:var(--blood-red);">${finalPrice} грн</span>
                <span style="text-decoration:line-through; font-size:20px; color:var(--cinereous);">${book.price} грн</span>
                <span style="background:var(--blood-red); color:white; padding:4px 10px;
                             border-radius:6px; font-size:15px; font-weight:700;">-${book.discount}%</span>
            </div>
        </div>
    ` : `<div class="book-detail-price" style="font-size:36px; font-weight:700; color:var(--blood-red); margin-bottom:16px;">${book.price} грн</div>`;

    // Стан складу
    let stockHtml = '';
    if (availableStock <= 0) {
        stockHtml = `<div style="background:#f8d7da; color:#721c24; padding:10px 16px; border-radius:8px; margin-bottom:20px; font-weight:600;">
            ❌ Немає в наявності
        </div>`;
    } else if (availableStock <= 20) {
        stockHtml = `<div style="background:#fff3cd; color:#856404; padding:10px 16px; border-radius:8px; margin-bottom:20px; font-weight:600;">
            ⚠️ Поспішайте! Залишилось лише ${availableStock} шт
        </div>`;
    } else {
        stockHtml = `<div style="background:#d4edda; color:#155724; padding:10px 16px; border-radius:8px; margin-bottom:20px; font-weight:600;">
            ✅ В наявності: ${availableStock} шт
        </div>`;
    }

    container.innerHTML = `
        <!-- ГАЛЕРЕЯ -->
        <div class="book-gallery">
            <div class="main-image-container">
                <img src="${images[0] || 'https://via.placeholder.com/380x520?text=📚'}"
                     alt="${book.title}"
                     class="main-image"
                     id="main-image"
                     onclick="openImageModal(this.src)"
                     title="Натисніть для збільшення">
                ${images.length > 1 ? `
                    <div class="gallery-nav">
                        <button onclick="changeImage(-1)" title="Попереднє">‹</button>
                        <button onclick="changeImage(1)"  title="Наступне">›</button>
                    </div>
                ` : ''}
            </div>
            ${images.length > 1 ? `
                <div class="gallery-thumbnails">
                    ${images.map((img, i) => `
                        <img src="${img}"
                             class="thumbnail ${i === 0 ? 'active' : ''}"
                             onclick="setImage(${i})"
                             alt="Фото ${i + 1}"
                             onerror="this.style.display='none'">
                    `).join('')}
                </div>
            ` : ''}
        </div>

        <!-- ІНФОРМАЦІЯ -->
        <div class="book-detail-info">
            <h1 class="page-title">${book.title}</h1>

            <div style="margin-bottom:16px;">
                <a href="catalog.html?author=${encodeURIComponent(book.author)}"
                   style="font-size:18px; font-weight:600; color:var(--blood-red);
                          text-decoration:none; font-family:var(--font-heading);">
                    ${book.author}
                </a>
                ${book.publisher ? `<span style="font-size:14px; color:var(--cinereous); margin-left:8px;">· ${book.publisher}</span>` : ''}
            </div>

            ${priceHtml}
            ${stockHtml}

            <!-- РЕЙТИНГ -->
            <div class="rating-interactive">
                <div class="current-rating">
                    <div class="stars-display">${generateStarsDisplay(book.rating || 0)}</div>
                    <span class="rating-info">
                        ${(book.rating || 0).toFixed(1)} / 10
                        · ${book.ratingCount || 0} оцінок
                    </span>
                </div>

                <div class="user-rating" style="margin-top:14px;">
                    <div class="user-rating-label">Ваша оцінка:</div>
                    <div class="rating-stars" id="rating-stars">
                        ${generateRatingStars()}
                    </div>
                    <div class="selected-rating" id="selected-rating">
                        ${userRating > 0 ? `Ви оцінили: ${userRating}/10` : 'Натисніть на зірку'}
                    </div>
                </div>
            </div>

            <!-- ХАРАКТЕРИСТИКИ -->
            <div class="book-meta" style="margin:24px 0;">
                ${metaRow('Оригінальна назва', book.originalTitle)}
                ${metaRow('Автор', book.author, () => `catalog.html?author=${encodeURIComponent(book.author)}`)}
                ${metaRow('Видавництво', book.publisher, book.publisher ? () => `catalog.html?publisher=${encodeURIComponent(book.publisher)}` : null)}
                ${metaRow('Категорія', getCategoryIcon(normalizeCategory(book.category)) + ' ' + getCategoryName(normalizeCategory(book.category)), () => `catalog.html?category=${encodeURIComponent(normalizeCategory(book.category))}`)}
                ${metaRow('Мова', book.language)}
                ${metaRow('Перекладач', book.translator)}
                ${metaRow('Обкладинка', book.cover)}
                ${metaRow('Кількість сторінок', book.pages)}
                ${metaRow('Рік видання', book.year)}
                ${metaRow('Розмір (мм)', book.size)}
                ${metaRow('Вага', book.weight ? `${book.weight} г` : null)}
                ${metaRow('ISBN', book.isbn)}
                ${metaRow('Штрих-код', book.barcode)}
                ${metaRow('Ілюстрації', book.illustrations)}
            </div>

            <!-- ОПИС -->
            <div style="margin-bottom:28px;">
                <h3 style="font-size:22px; margin-bottom:12px; color:var(--blood-red);">Про книгу</h3>
                <p style="line-height:1.9; font-size:16px; color:var(--black-bean);">${book.description || book.shortDescription || ''}</p>
            </div>

            <!-- КНОПКИ ДІЙ -->
            <div style="display:flex; gap:12px; flex-wrap:wrap;">
                ${availableStock > 0 ? `
                    <button class="btn btn-primary btn-large"
                            onclick="addToCart(${book.id})"
                            style="flex:2; min-width:160px;">
                        🛒 В кошик
                    </button>
                ` : `
                    <button class="btn btn-outline btn-large"
                            onclick="notifyWhenAvailable(${book.id})"
                            style="flex:2; min-width:160px;">
                        🔔 Повідомити про наявність
                    </button>
                `}
                <button class="fav-btn ${isFavorite ? 'active' : ''}"
                        id="detail-fav-btn"
                        onclick="toggleFavoriteDetail(${book.id})"
                        style="flex:1; min-width:60px; font-size:22px; padding:14px;"
                        title="${isFavorite ? 'Видалити з вподобань' : 'Додати до вподобань'}">
                    ♥
                </button>
            </div>

            <!-- ДІЛИТИСЬ -->
            <div style="margin-top:20px; padding-top:20px; border-top:1px solid #f0e8d8;">
                <button onclick="shareBook()" class="btn btn-outline btn-small">
                    🔗 Поділитись
                </button>
            </div>
        </div>
    `;

    attachRatingListeners(bookId);
    displaySimilarBooks(book);
}

// ===================================
// РЯДОК ХАРАКТЕРИСТИКИ
// ===================================
function metaRow(label, value, linkFn = null) {
    if (!value && value !== 0) return '';
    const isClickable = typeof linkFn === 'function';
    const href = isClickable ? linkFn() : null;
    const valueHtml = isClickable
        ? `<a href="${href}" style="color:var(--blood-red); text-decoration:underline;">${value}</a>`
        : `<span>${value}</span>`;

    return `
        <div class="meta-row">
            <span class="meta-label">${label}:</span>
            ${valueHtml}
        </div>
    `;
}

// ===================================
// ЗІРКИ ДЛЯ ВІДОБРАЖЕННЯ РЕЙТИНГУ
// ===================================
function generateStarsDisplay(rating) {
    const normalized = rating / 2; // з 10 → 5
    const full  = Math.floor(normalized);
    const half  = (normalized % 1) >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);

    let html = '';
    for (let i = 0; i < full;  i++) html += `<span style="color:#d4a017; font-size:22px;">★</span>`;
    if (half)                        html += `<span style="color:#d4a017; font-size:22px;">⯨</span>`;
    for (let i = 0; i < empty; i++) html += `<span style="color:#ddd; font-size:22px;">★</span>`;
    return html;
}

// ===================================
// ЗІРКИ ДЛЯ ВИБОРУ ОЦІНКИ (1-10)
// ===================================
function generateRatingStars() {
    return Array.from({ length: 10 }, (_, i) => {
        const n = i + 1;
        const filled = n <= userRating ? 'filled' : '';
        return `<span class="star ${filled}" data-rating="${n}" title="${n}/10">★</span>`;
    }).join('');
}

// ===================================
// СЛУХАЧІ РЕЙТИНГУ
// ===================================
function attachRatingListeners(bookId) {
    const stars         = document.querySelectorAll('#rating-stars .star');
    const selectedLabel = document.getElementById('selected-rating');
    if (!stars.length) return;

    // Hover
    stars.forEach((star, i) => {
        star.addEventListener('mouseenter', () => {
            stars.forEach((s, j) => s.classList.toggle('filled', j <= i));
        });

        star.addEventListener('click', () => {
            const rating = i + 1;
            setUserRating(bookId, rating);
            userRating = rating;
            stars.forEach((s, j) => s.classList.toggle('filled', j < rating));
            if (selectedLabel) selectedLabel.textContent = `Ви оцінили: ${rating}/10 ✓`;
            showNotification(`Дякуємо за оцінку ${rating}/10! ⭐`);
        });
    });

    // Повернення після hover
    document.getElementById('rating-stars')?.addEventListener('mouseleave', () => {
        stars.forEach((s, j) => s.classList.toggle('filled', j < userRating));
    });
}

// ===================================
// ЗБЕРЕЖЕННЯ ОЦІНКИ
// ===================================
function setUserRating(bookId, rating) {
    userRatings[bookId] = rating;
    localStorage.setItem('userRatings', JSON.stringify(userRatings));

    // Оновлюємо середній рейтинг книги
    const book = books.find(b => b.id === bookId);
    if (book) {
        const prevCount = book.ratingCount || 0;
        const prevTotal = (book.rating || 0) * prevCount;
        book.ratingCount = prevCount + 1;
        book.rating      = parseFloat(((prevTotal + rating) / book.ratingCount).toFixed(2));
        localStorage.setItem('books', JSON.stringify(books));
    }
}

// ===================================
// ГАЛЕРЕЯ
// ===================================
function getBookImages(book) {
    if (Array.isArray(book.images) && book.images.length > 0) {
        return book.images.filter(Boolean);
    }
    if (typeof book.images === 'string' && book.images.trim()) {
        return book.images.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (book.image_url) return [book.image_url];
    if (book.image)     return [book.image];
    return [];
}

function changeImage(direction) {
    const images = getBookImages(currentBook);
    currentImageIndex = (currentImageIndex + direction + images.length) % images.length;
    setImage(currentImageIndex);
}

function setImage(index) {
    const images = getBookImages(currentBook);
    currentImageIndex = index;

    const mainImg = document.getElementById('main-image');
    if (mainImg) {
        mainImg.style.opacity = '0';
        setTimeout(() => {
            mainImg.src = images[index];
            mainImg.style.opacity = '1';
        }, 150);
    }

    document.querySelectorAll('.thumbnail').forEach((t, i) => {
        t.classList.toggle('active', i === index);
    });
}

// ===================================
// МОДАЛЬНЕ ВІКНО ФОТО
// ===================================
function openImageModal(src) {
    let modal = document.getElementById('image-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'image-modal';
        modal.className = 'image-modal';
        modal.innerHTML = `
            <span class="modal-close" onclick="closeImageModal()">×</span>
            <img class="modal-image" id="modal-img" src="" alt="Фото книги">
        `;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeImageModal();
        });
        document.body.appendChild(modal);
    }

    document.getElementById('modal-img').src = src;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    const modal = document.getElementById('image-modal');
    if (modal) modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Закриття по Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeImageModal();
});

// ===================================
// ВПОДОБАННЯ НА СТОРІНЦІ КНИГИ
// ===================================
function toggleFavoriteDetail(bookId) {
    const btn = document.getElementById('detail-fav-btn');
    toggleFavorite(bookId, btn);

    // Оновлюємо title кнопки
    const nowFav = isInFavorites(bookId);
    if (btn) btn.title = nowFav ? 'Видалити з вподобань' : 'Додати до вподобань';
}

// ===================================
// ПОДІЛИТИСЬ
// ===================================
function shareBook() {
    if (navigator.share) {
        navigator.share({
            title: currentBook?.title || 'Книга',
            url:   window.location.href,
        }).catch(() => {});
    } else {
        navigator.clipboard?.writeText(window.location.href).then(() => {
            showNotification('Посилання скопійовано! 🔗');
        });
    }
}

// ===================================
// СХОЖІ КНИГИ
// ===================================
function displaySimilarBooks(book) {
    const container = document.getElementById('similar-books');
    if (!container) return;

    const cats = [book.category, ...(Array.isArray(book.categories) ? book.categories : [])];

    const similar = books
        .filter(b => b.id !== book.id &&
            cats.some(cat => b.category === cat ||
                (Array.isArray(b.categories) && b.categories.includes(cat))))
        .slice(0, 4);

    if (similar.length === 0) {
        container.innerHTML = '<p style="color:var(--cinereous); text-align:center;">Схожих книг не знайдено</p>';
        return;
    }

    container.innerHTML = similar.map(b => createBookCard(b)).join('');
    attachBookCardListeners();
}