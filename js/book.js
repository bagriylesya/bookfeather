// ===================================
// BOOKFEATHER - BOOK.JS
// Сторінка окремої книги: галерея, рейтинг, схожі книги
// ===================================

let currentBook       = null;
let currentImageIndex = 0;
let userRatings       = JSON.parse(localStorage.getItem('userRatings') || '{}');
let userRating        = 0;
let sessionVoted      = JSON.parse(sessionStorage.getItem('sessionVoted') || '{}');

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
    // Ключ в localStorage завжди рядок — використовуємо String()
    userRating           = userRatings[String(bookId)] || userRatings[bookId] || 0;
    const availableStock = (book.stock || 0) - (book.reserved || 0);

    // Ціна з урахуванням знижки
    const finalPrice = book.discount > 0
        ? (book.price * (1 - book.discount / 100)).toFixed(0)
        : book.price;

    const priceHtml = book.discount > 0 ? `
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin:4px 0 0;">
            <span style="font-size:32px; font-weight:700; color:var(--blood-red); font-family:var(--font-heading);">${finalPrice} грн</span>
            <span style="text-decoration:line-through; font-size:17px; color:var(--cinereous);">${book.price} грн</span>
            <span style="background:var(--blood-red); color:white; padding:3px 9px;
                         border-radius:6px; font-size:13px; font-weight:700;">-${book.discount}%</span>
        </div>
    ` : `<span style="font-size:32px; font-weight:700; color:var(--blood-red); font-family:var(--font-heading);">${book.price} грн</span>`;

    // Стан складу — показуємо тільки якщо немає або мало (≤15)
    let stockHtml = '';
    if (availableStock <= 0) {
        stockHtml = `<div style="background:#f8d7da; color:#721c24; padding:10px 16px; border-radius:8px; margin:14px 0; font-weight:600;">
            ❌ Немає в наявності
        </div>`;
    } else if (availableStock <= 15) {
        stockHtml = `<div style="background:#fff3cd; color:#856404; padding:10px 16px; border-radius:8px; margin:14px 0; font-weight:600;">
            ⚠️ Поспішайте! Залишилось лише ${availableStock} шт
        </div>`;
    }
    // Якщо > 15 — нічого не показуємо

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
                    <div style="position:absolute; top:50%; left:10px; transform:translateY(-50%); z-index:10;">
                        <button onclick="changeImage(-1)" title="Попереднє"
                            style="width:42px; height:42px; background:rgba(116,7,14,0.88); color:white;
                                   border:2px solid rgba(255,255,255,0.7); border-radius:50%; font-size:24px;
                                   font-weight:700; cursor:pointer; display:flex; align-items:center;
                                   justify-content:center; box-shadow:0 2px 10px rgba(0,0,0,0.4);
                                   transition:background 0.2s, transform 0.2s;"
                            onmouseover="this.style.background='rgba(116,7,14,1)';this.style.transform='translateY(0) scale(1.1)'"
                            onmouseout="this.style.background='rgba(116,7,14,0.88)';this.style.transform='translateY(0) scale(1)'">‹</button>
                    </div>
                    <div style="position:absolute; top:50%; right:10px; transform:translateY(-50%); z-index:10;">
                        <button onclick="changeImage(1)" title="Наступне"
                            style="width:42px; height:42px; background:rgba(116,7,14,0.88); color:white;
                                   border:2px solid rgba(255,255,255,0.7); border-radius:50%; font-size:24px;
                                   font-weight:700; cursor:pointer; display:flex; align-items:center;
                                   justify-content:center; box-shadow:0 2px 10px rgba(0,0,0,0.4);
                                   transition:background 0.2s, transform 0.2s;"
                            onmouseover="this.style.background='rgba(116,7,14,1)';this.style.transform='translateY(0) scale(1.1)'"
                            onmouseout="this.style.background='rgba(116,7,14,0.88)';this.style.transform='translateY(0) scale(1)'">›</button>
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

            <!-- ЗАГОЛОВОК + АВТОР + ЦІНА — одна компактна картка -->
            <div style="background:#fff8ee; border-radius:14px; padding:22px 26px;
                        box-shadow:0 2px 12px rgba(49,14,16,0.08); border:1px solid #eedfc8; margin-bottom:16px;">
                <h1 class="page-title" style="font-size:28px; margin-bottom:8px; line-height:1.3;">${book.title}</h1>
                <a href="catalog.html?author=${encodeURIComponent(book.author)}"
                   style="font-size:16px; font-weight:600; color:var(--blood-red);
                          text-decoration:none; font-family:var(--font-heading); display:block; margin-bottom:14px;">
                    ${book.author}
                </a>
                <div style="border-top:1px solid #eedfc8; padding-top:14px;">
                    ${priceHtml}
                </div>
            </div>

            ${stockHtml}

            <!-- РЕЙТИНГ -->
            <div class="rating-interactive" style="box-shadow:0 3px 16px rgba(49,14,16,0.11);">

                <!-- Середній рейтинг -->
                <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;
                            padding-bottom:12px; margin-bottom:12px; border-bottom:1px solid #f0e8d8;">
                    <div class="stars-display" id="avg-stars" style="overflow:visible;">
                        ${generateStarsDisplay(book.rating || 0)}
                    </div>
                    <div>
                        <span style="font-size:22px; font-weight:700; color:var(--black-bean);"
                              id="avg-rating-num">${(book.rating||0).toFixed(1)}</span>
                        <span style="color:var(--cinereous); font-size:15px;"> / 10</span>
                        <div style="font-size:13px; color:var(--cinereous); margin-top:2px;"
                             id="rating-count-lbl">
                            ${book.ratingCount > 0
                                ? nPlural(book.ratingCount, '1 оцінка', `${book.ratingCount} оцінки`, `${book.ratingCount} оцінок`)
                                : 'Ще немає оцінок'}
                        </div>
                    </div>
                </div>

                <!-- Зірки користувача -->
                <div>
                    <div id="rating-user-label"
                         style="font-size:13px; font-weight:600; color:var(--cinereous); margin-bottom:8px;">
                        ${userRating > 0
                            ? `✅ Ваша оцінка: \${userRating}/10 &nbsp;·&nbsp;
                              <span style="color:var(--blood-red); cursor:pointer; text-decoration:underline;"
                                    onclick="askChangeRating(\${book.id})">Змінити</span>`
                            : '⭐ Ваша оцінка:'}
                    </div>
                    <div class="rating-stars" id="rating-stars">${generateRatingStars()}</div>
                    <div class="selected-rating" id="selected-rating"
                         style="font-size:13px; color:var(--cinereous); margin-top:6px; min-height:18px;">
                        ${userRating > 0 ? '' : 'Натисніть на зірку щоб оцінити'}
                    </div>
                </div>
            </div>

            <!-- GOODREADS -->
            ${book.goodreadsUrl ? `
            <a href="\${book.goodreadsUrl}" target="_blank" rel="noopener"
               style="display:flex; align-items:center; gap:12px; background:linear-gradient(135deg,#f4f1ea,#e8e0d0);
                      border-radius:12px; padding:14px 18px; margin-bottom:16px; text-decoration:none;
                      box-shadow:0 2px 8px rgba(0,0,0,0.07); transition:opacity 0.2s;"
               onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
                <span style="font-size:26px;">📗</span>
                <div style="flex:1;">
                    <div style="font-weight:700; font-size:14px; color:#372213;">Goodreads</div>
                    <div style="font-size:12px; color:#7a6a5a;">Переглянути відгуки зі всього світу →</div>
                </div>
            </a>` : ''}

            <!-- ХАРАКТЕРИСТИКИ -->
            <div class="book-meta" style="margin:24px 0;">
                ${metaRow('Оригінальна назва', book.originalTitle)}
                ${metaRow('Автор', book.author, () => `catalog.html?author=${encodeURIComponent(book.author)}`)}
                ${metaRow('Видавництво', book.publisher, (book.publisher && book.publisher.trim()) ? () => `catalog.html?publisher=${encodeURIComponent(book.publisher.trim())}` : null)}
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
                ${book.shortDescription ? `
                    <p style="line-height:1.8; font-size:16px; color:var(--black-bean);
                               font-weight:600; margin-bottom:12px; padding:12px 16px;
                               background:#fff8ee; border-left:4px solid var(--blood-red);
                               border-radius:0 8px 8px 0;">
                        ${book.shortDescription}
                    </p>
                ` : ''}
                ${book.description ? `
                    <p style="line-height:1.9; font-size:15px; color:#444;">${book.description}</p>
                ` : ''}
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
    const normalized = rating / 2;
    const full  = Math.floor(normalized);
    const half  = (normalized % 1) >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    let html = '<span style="display:inline-flex;gap:2px;line-height:1;overflow:visible;padding-right:4px;">';
    for (let i = 0; i < full;  i++) html += '<span style="color:#d4a017;font-size:22px;flex-shrink:0;">&#9733;</span>';
    if (half)                        html += '<span style="color:#d4a017;font-size:22px;flex-shrink:0;">&#9733;</span>';
    for (let i = 0; i < empty; i++) html += '<span style="color:#ccc;font-size:22px;flex-shrink:0;">&#9733;</span>';
    html += '</span>';
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
            const key = String(bookId);
            if (sessionVoted[key]) {
                askChangeRating(bookId);
                return;
            }
            const rating = i + 1;
            setUserRating(bookId, rating);
            userRating = rating;
            stars.forEach((s, j) => s.classList.toggle('filled', j < rating));
            if (selectedLabel) selectedLabel.textContent = '';
            const lbl = document.getElementById('rating-user-label');
            if (lbl) lbl.innerHTML = `✅ Ваша оцінка: \${rating}/10 &nbsp;·&nbsp;
                <span style="color:var(--blood-red);cursor:pointer;text-decoration:underline;"
                      onclick="askChangeRating(\${bookId})">Змінити</span>`;
            showNotification(`Дякуємо за оцінку \${rating}/10! ⭐`);
        });
    });

    // Повернення після hover
    document.getElementById('rating-stars')?.addEventListener('mouseleave', () => {
        stars.forEach((s, j) => s.classList.toggle('filled', j < userRating));
    });
}

// ===================================
// ВІДМІНЮВАННЯ
// ===================================
function nPlural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if ([2,3,4].includes(m10) && ![12,13,14].includes(m100)) return few;
    return many;
}

// ===================================
// ЗАПИТ НА ЗМІНУ ОЦІНКИ
// ===================================
function askChangeRating(bookId) {
    if (!confirm(`Ви вже оцінили книгу на ${userRating}/10.\nХочете змінити оцінку?`)) return;
    const key = String(bookId);
    delete sessionVoted[key];
    sessionStorage.setItem('sessionVoted', JSON.stringify(sessionVoted));
    const starsBlock = document.getElementById('rating-stars');
    if (starsBlock) { starsBlock.style.opacity='1'; starsBlock.style.pointerEvents='auto'; }
    const lbl = document.getElementById('rating-user-label');
    if (lbl) lbl.innerHTML = '⭐ Оберіть нову оцінку:';
    showNotification('Оберіть нову оцінку', 'info');
}
window.askChangeRating = askChangeRating;

// ===================================
// ЗБЕРЕЖЕННЯ ОЦІНКИ
// ===================================
function setUserRating(bookId, rating) {
    const key = String(bookId);
    const prevUserRating = userRatings[key] || 0;

    // Записуємо в localStorage (постійно) і sessionStorage (захист від спаму)
    userRatings[key] = rating;
    sessionVoted[key] = rating;
    localStorage.setItem('userRatings', JSON.stringify(userRatings));
    sessionStorage.setItem('sessionVoted', JSON.stringify(sessionVoted));

    // Оновлюємо середній рейтинг книги
    const book = books.find(b => b.id === bookId || String(b.id) === key);
    if (book) {
        const prevCount = book.ratingCount || 0;

        if (prevUserRating > 0) {
            // Змінює стару оцінку — ratingCount не змінюємо
            const prevTotal = (book.rating || 0) * prevCount;
            book.rating = prevCount > 0
                ? parseFloat(((prevTotal - prevUserRating + rating) / prevCount).toFixed(2))
                : rating;
        } else {
            // Нова оцінка — збільшуємо лічильник
            const prevTotal = (book.rating || 0) * prevCount;
            book.ratingCount = prevCount + 1;
            book.rating = parseFloat(((prevTotal + rating) / book.ratingCount).toFixed(2));
        }

        // Зберігаємо
        localStorage.setItem('books', JSON.stringify(books));
        // Зберігаємо і в admin overrides
        try {
            const ov = JSON.parse(localStorage.getItem('books_admin_overrides') || 'null');
            if (ov) {
                const idx = ov.findIndex(b => String(b.id) === key);
                if (idx !== -1) {
                    ov[idx].rating      = book.rating;
                    ov[idx].ratingCount = book.ratingCount;
                    localStorage.setItem('books_admin_overrides', JSON.stringify(ov));
                }
            }
        } catch(e) {}

        // Оновлюємо UI без перезавантаження
        const avgNum = document.getElementById('avg-rating-num');
        if (avgNum) avgNum.textContent = book.rating.toFixed(1);
        const avgStars = document.getElementById('avg-stars');
        if (avgStars) avgStars.innerHTML = generateStarsDisplay(book.rating);
        const lbl = document.getElementById('rating-count-lbl');
        if (lbl) lbl.textContent = nPlural(
            book.ratingCount,
            '1 оцінка',
            `${book.ratingCount} оцінки`,
            `${book.ratingCount} оцінок`
        );
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