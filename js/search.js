// ===================================
// BOOKFEATHER - SEARCH.JS
// Пошук з автопідказками, підсвічуванням, складом
// ===================================

let searchTimeout  = null;
let searchCache    = {};

// ===================================
// ІНІЦІАЛІЗАЦІЯ
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    initSearch();
});

function initSearch() {
    const searchInput   = document.getElementById('header-search');
    const suggestions   = document.getElementById('search-suggestions');

    if (!searchInput || !suggestions) return;

    // Введення тексту
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();

        if (query.length < 2) {
            hideSuggestions();
            return;
        }

        // Debounce 280ms
        searchTimeout = setTimeout(() => performSearch(query), 280);
    });

    // Enter → перехід до каталогу
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                hideSuggestions();
                window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
            }
        }

        // Escape → закрити
        if (e.key === 'Escape') {
            hideSuggestions();
            searchInput.blur();
        }
    });

    // Клік поза пошуком — закрити
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.header-search')) {
            hideSuggestions();
        }
    });

    // Фокус — якщо є текст, показати знову
    searchInput.addEventListener('focus', () => {
        const query = searchInput.value.trim();
        if (query.length >= 2) performSearch(query);
    });
}

// ===================================
// ПОШУК
// ===================================
async function performSearch(query) {
    // Кеш
    if (searchCache[query]) {
        displaySuggestions(searchCache[query], query);
        return;
    }

    // Потрібні книги
    await loadBooks();

    const q = query.toLowerCase();

    const results = books.filter(book => {
        const searchStr = [
            book.title,
            book.author,
            book.category,
            book.publisher || '',
            book.description || ''
        ].join(' ').toLowerCase();

        return searchStr.includes(q);
    });

    // Сортування: спочатку ті, де збіг у назві/авторі
    results.sort((a, b) => {
        const aTitle = (a.title + ' ' + a.author).toLowerCase().includes(q) ? 0 : 1;
        const bTitle = (b.title + ' ' + b.author).toLowerCase().includes(q) ? 0 : 1;
        return aTitle - bTitle;
    });

    const top5 = results.slice(0, 5);
    searchCache[query] = top5;
    displaySuggestions(top5, query);
}

// ===================================
// ВІДОБРАЖЕННЯ ПІДКАЗОК
// ===================================
function displaySuggestions(results, query) {
    const suggestions = document.getElementById('search-suggestions');
    if (!suggestions) return;

    if (results.length === 0) {
        suggestions.innerHTML = `
            <div style="padding:24px; text-align:center; color:var(--cinereous);">
                <div style="font-size:36px; margin-bottom:10px;">🔍</div>
                <div style="font-size:15px;">Нічого не знайдено за запитом <strong>"${escapeHtml(query)}"</strong></div>
                <a href="catalog.html" style="color:var(--blood-red); text-decoration:underline; margin-top:10px; display:inline-block; font-size:14px;">
                    Переглянути весь каталог →
                </a>
            </div>
        `;
    } else {
        const items = results.map(book => createSuggestionItem(book, query)).join('');
        const footer = results.length >= 5 ? `
            <a href="catalog.html?search=${encodeURIComponent(query)}"
               style="display:block; padding:12px 16px; text-align:center; color:var(--blood-red);
                      font-size:14px; font-weight:600; border-top:1px solid #f0e8d8;
                      transition:background 0.2s;"
               onmouseover="this.style.background='#fdf8ef'"
               onmouseout="this.style.background='transparent'">
                Показати всі результати →
            </a>
        ` : '';
        suggestions.innerHTML = items + footer;
    }

    showSuggestions();
}

// ===================================
// КАРТКА ПІДКАЗКИ
// ===================================
function createSuggestionItem(book, query) {
    const availableStock = (book.stock || 0) - (book.reserved || 0);
    const discountPrice  = book.discount > 0
        ? (book.price * (1 - book.discount / 100)).toFixed(0)
        : book.price;

    const titleHighlighted  = highlightText(book.title,  query);
    const authorHighlighted = highlightText(book.author, query);

    // Стан складу
    let stockHtml = '';
    if (availableStock <= 0) {
        stockHtml = '<span style="color:#dc3545; font-size:12px; font-weight:600;">❌ Немає в наявності</span>';
    } else if (availableStock <= 15) {
        stockHtml = `<span style="color:#c8860a; font-size:12px; font-weight:600;">⚠️ Останні ${availableStock} шт</span>`;
    } else {
        stockHtml = '<span style="color:#2d8a4e; font-size:12px;">✅ В наявності</span>';
    }

    // Ціна
    const priceHtml = book.discount > 0 ? `
        <div style="text-decoration:line-through; color:#aaa; font-size:13px;">${book.price} грн</div>
        <div style="color:var(--blood-red); font-weight:700; font-size:17px;">${discountPrice} грн</div>
    ` : `
        <div style="color:var(--blood-red); font-weight:700; font-size:17px;">${book.price} грн</div>
    `;

    const imgSrc = book.image || book.image_url || 'https://via.placeholder.com/44x62?text=📚';

    return `
        <div class="suggestion-item"
             onclick="window.location.href='book.html?id=${book.id}'"
             style="display:flex; align-items:center; gap:14px; padding:12px 16px;
                    cursor:pointer; border-bottom:1px solid #f5ede0; transition:background 0.2s;"
             onmouseover="this.style.background='#fdf8ef'"
             onmouseout="this.style.background='white'">

            <img src="${imgSrc}"
                 alt="${escapeHtml(book.title)}"
                 style="width:44px; height:62px; object-fit:cover; border-radius:4px; flex-shrink:0;"
                 onerror="this.src='https://via.placeholder.com/44x62?text=📚'">

            <div style="flex:1; min-width:0;">
                <div style="font-weight:600; font-size:14px; margin-bottom:3px;
                            white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${titleHighlighted}
                </div>
                <div style="font-size:13px; color:var(--cinereous); margin-bottom:4px;">
                    ${authorHighlighted}
                </div>
                ${stockHtml}
            </div>

            <div style="display:flex; flex-direction:column; align-items:flex-end; flex-shrink:0; gap:2px;">
                ${priceHtml}
            </div>
        </div>
    `;
}

// ===================================
// ПІДСВІЧУВАННЯ ТЕКСТУ
// ===================================
function highlightText(text, query) {
    if (!query || !text) return escapeHtml(text || '');
    const safe  = escapeHtml(text);
    const safeQ = escapeRegex(query);
    return safe.replace(
        new RegExp(`(${safeQ})`, 'gi'),
        '<mark style="background:#fff3b0; padding:1px 2px; border-radius:2px; font-weight:600;">$1</mark>'
    );
}

// ===================================
// ПОКАЗ / ПРИХОВАННЯ
// ===================================
function showSuggestions() {
    const el = document.getElementById('search-suggestions');
    if (el) el.classList.add('show');
}

function hideSuggestions() {
    const el = document.getElementById('search-suggestions');
    if (el) el.classList.remove('show');
}

// ===================================
// УТИЛІТИ
// ===================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Очистити кеш (при оновленні бібліотеки)
function clearSearchCache() {
    searchCache = {};
}

// ===================================
// ЕКСПОРТ
// ===================================
window.performSearch    = performSearch;
window.clearSearchCache = clearSearchCache;
window.hideSuggestions  = hideSuggestions;