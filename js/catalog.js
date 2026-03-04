// ===================================
// BOOKFEATHER - CATALOG.JS ПОВНА ВЕРСІЯ
// Каталог з фільтрами, складом, повідомленнями про наявність
// ===================================

let filteredBooks = [];

// ІНІЦІАЛІЗАЦІЯ
document.addEventListener('DOMContentLoaded', () => {
    loadBooks().then(() => {
        loadCategoryFilter();
        applyUrlFilters();
        filterBooks();
    });
});

// ЗАВАНТАЖЕННЯ КАТЕГОРІЙ В ФІЛЬТР
// Показує всі категорії системи (не тільки ті що є в книгах)
function loadCategoryFilter() {
    const select = document.getElementById('category-filter');
    if (!select) return;

    const allCats = getAllCategories();
    const usedCatIds = new Set(books.map(b => b.category).filter(Boolean));

    const used  = allCats.filter(c => usedCatIds.has(c.id));
    const other = allCats.filter(c => !usedCatIds.has(c.id));

    let html = '<option value="">Всі категорії</option>';

    if (used.length) {
        html += '<optgroup label="── Є в каталозі ──">';
        html += used.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
        html += '</optgroup>';
    }
    if (other.length) {
        html += '<optgroup label="── Інші жанри ──">';
        html += other.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
        html += '</optgroup>';
    }

    select.innerHTML = html;

    // Відновлюємо вибране значення з URL
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    if (cat) select.value = cat;
}

// ЗАСТОСУВАННЯ ФІЛЬТРІВ З URL
function applyUrlFilters() {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    const author = params.get('author');
    const publisher = params.get('publisher');

    if (search) {
        const input = document.getElementById('search-input');
        if (input) input.value = search;
    }

    if (author) {
        const input = document.getElementById('search-input');
        if (input) input.value = author;
    }
}

// ФІЛЬТРАЦІЯ КНИГ
function filterBooks() {
    const categoryFilter  = document.getElementById('category-filter')?.value  || '';
    const sortFilter      = document.getElementById('sort-filter')?.value       || 'popular';
    const languageFilter  = document.getElementById('language-filter')?.value  || '';
    const searchQuery     = document.getElementById('search-input')?.value.toLowerCase().trim() || '';
    const priceMin        = parseFloat(document.getElementById('price-min')?.value)  || 0;
    const priceMax        = parseFloat(document.getElementById('price-max')?.value)  || Infinity;
    const onlyInStock     = document.getElementById('in-stock-filter')?.checked  || false;
    const onlyDiscount    = document.getElementById('discount-filter')?.checked  || false;
    const onlyNew         = document.getElementById('new-filter')?.checked       || false;

    filteredBooks = books.filter(book => {
        // Категорія
        if (categoryFilter && book.category !== categoryFilter) return false;
        // Мова
        if (languageFilter && book.language !== languageFilter) return false;
        // Пошук
        if (searchQuery) {
            const str = `${book.title} ${book.author} ${book.description || ''} ${book.publisher || ''}`.toLowerCase();
            if (!str.includes(searchQuery)) return false;
        }
        // Ціна
        const finalPrice = book.discount > 0
            ? book.price * (1 - book.discount / 100)
            : book.price;
        if (finalPrice < priceMin) return false;
        if (priceMax !== Infinity && finalPrice > priceMax) return false;
        // Наявність
        if (onlyInStock) {
            const avail = (book.stock || 0) - (book.reserved || 0);
            if (avail <= 0) return false;
        }
        // Знижка
        if (onlyDiscount && !(book.discount > 0)) return false;
        // Новинки
        if (onlyNew && !book.isNew) return false;

        return true;
    });

    // Сортування
    switch (sortFilter) {
        case 'new':
            filteredBooks.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
            break;
        case 'price-low':
            filteredBooks.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredBooks.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            filteredBooks.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'discount':
            filteredBooks.sort((a, b) => (b.discount || 0) - (a.discount || 0));
            break;
        case 'popular':
        default:
            filteredBooks.sort((a, b) => (b.isTop ? 1 : 0) - (a.isTop ? 1 : 0));
            break;
    }

    displayBooks();
}

// ВІДОБРАЖЕННЯ КНИГ
function displayBooks() {
    const container = document.getElementById('books-container');
    if (!container) return;
    
    if (filteredBooks.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
                <div style="font-size: 60px; margin-bottom: 20px;">😔</div>
                <h3>Нічого не знайдено</h3>
                <p style="color: var(--cinereous); margin-bottom: 30px;">Спробуйте змінити фільтри або пошуковий запит</p>
                <button class="btn btn-primary" onclick="resetFilters()">Скинути фільтри</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredBooks.map(book => createBookCard(book)).join('');
}

// СТВОРЕННЯ КАРТКИ КНИГИ
function createBookCard(book) {
    const availableStock = (book.stock || 0) - (book.reserved || 0);
    const discountPrice = book.discount > 0 ? book.price * (1 - book.discount / 100) : book.price;
    const isFavorite = isInFavorites(book.id);
    
    let stockBadge = '';
    if (availableStock <= 0) {
        stockBadge = '<div class="stock-badge out-of-stock">❌ Немає</div>';
    } else if (availableStock <= 15) {
        stockBadge = `<div class="stock-badge low-stock">⚠️ Останні ${availableStock} шт</div>`;
    }
    
    let badges = '';
    if (book.isNew) badges += '<span class="badge badge-new">Новинка</span>';
    if (book.isTop) badges += '<span class="badge badge-top">Топ</span>';
    if (book.discount > 0) badges += `<span class="badge badge-discount">-${book.discount}%</span>`;
    
    return `
        <div class="book-card">
            ${stockBadge}
            <a href="book.html?id=${book.id}">
                <img src="${book.image || book.image_url || 'https://via.placeholder.com/250x350'}" 
                     alt="${book.title}" 
                     class="book-image">
            </a>
            <div class="book-badges">${badges}</div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.author}</p>
                <div class="book-rating">
                    ${'⭐'.repeat(Math.round(book.rating || 4))} 
                    <span class="rating-count">(${book.ratingCount || 0})</span>
                </div>
                <div class="book-footer">
                    <div class="book-price">
                        ${book.discount > 0 ? `
                            <span class="price-old">${book.price} грн</span>
                            <span class="price-current">${discountPrice.toFixed(0)} грн</span>
                        ` : `
                            <span class="price-current">${book.price} грн</span>
                        `}
                    </div>
                    <div class="book-actions">
                        <button class="btn-icon ${isFavorite ? 'active' : ''}" 
                                onclick="toggleFavorite(${book.id}); event.stopPropagation();" 
                                title="Вподобання">♥</button>
                        ${availableStock > 0 ? `
                            <button class="btn btn-primary btn-small" 
                                    onclick="addToCart(${book.id}); event.stopPropagation();">В кошик</button>
                        ` : `
                            <button class="btn btn-outline btn-small" 
                                    onclick="notifyWhenAvailable(${book.id}); event.stopPropagation();">🔔 Повідомити</button>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// СКИДАННЯ ФІЛЬТРІВ
function resetFilters() {
    const ids = ['category-filter','sort-filter','language-filter','search-input','price-min','price-max'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

    const checks = ['in-stock-filter','discount-filter','new-filter'];
    checks.forEach(id => { const el = document.getElementById(id); if (el) el.checked = false; });

    document.getElementById('sort-filter').value = 'popular';
    window.history.pushState({}, '', 'catalog.html');
    filterBooks();
}

// ПОВІДОМЛЕННЯ ПРО НАЯВНІСТЬ
function notifyWhenAvailable(bookId) {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        if (confirm('Щоб отримати повідомлення, потрібно увійти в систему. Перейти до входу?')) {
            window.location.href = 'login.html?redirect=catalog.html';
        }
        return;
    }
    
    let notifications = JSON.parse(localStorage.getItem('stockNotifications') || '[]');
    const exists = notifications.find(n => n.bookId === bookId && n.email === currentUser.email);
    
    if (exists) {
        showNotification('Ви вже підписані на повідомлення про цю книгу', 'info');
        return;
    }
    
    notifications.push({
        bookId: bookId,
        email: currentUser.email,
        createdAt: new Date().toISOString()
    });
    
    localStorage.setItem('stockNotifications', JSON.stringify(notifications));
    showNotification('Ми повідомимо вас, коли книга з\'явиться в наявності!', 'success');
}

window.filterBooks = filterBooks;
window.resetFilters = resetFilters;
window.notifyWhenAvailable = notifyWhenAvailable;