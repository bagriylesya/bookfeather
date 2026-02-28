// ====== SEARCH.JS - ПОШУК З АВТОПІДКАЗКАМИ ======
// Цей файл відповідає за пошук книг в header з автопідказками

let searchTimeout;
let searchCache = {};

// ====== ІНІЦІАЛІЗАЦІЯ ПОШУКУ ======
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('header-search');
    const suggestions = document.getElementById('search-suggestions');
    
    if (!searchInput || !suggestions) return;
    
    // Обробка введення тексту
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            hideSuggestions();
            return;
        }
        
        // Затримка перед пошуком (debounce)
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
    
    // Закрити підказки при кліку поза пошуком
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.header-search')) {
            hideSuggestions();
        }
    });
    
    // Обробка Enter
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
            }
        }
    });
});

// ====== ВИКОНАННЯ ПОШУКУ ======
async function performSearch(query) {
    const suggestions = document.getElementById('search-suggestions');
    
    // Перевірка кешу
    if (searchCache[query]) {
        displaySuggestions(searchCache[query], query);
        return;
    }
    
    // Завантаження книг
    await loadBooks();
    
    // Пошук по назві, автору, опису
    const results = books.filter(book => {
        const searchStr = `${book.title} ${book.author} ${book.description || ''}`.toLowerCase();
        return searchStr.includes(query.toLowerCase());
    }).slice(0, 5); // Максимум 5 результатів
    
    // Збереження в кеш
    searchCache[query] = results;
    
    displaySuggestions(results, query);
}

// ====== ВІДОБРАЖЕННЯ ПІДКАЗОК ======
function displaySuggestions(results, query) {
    const suggestions = document.getElementById('search-suggestions');
    
    if (results.length === 0) {
        suggestions.innerHTML = `
            <div style="padding: 20px; text-align: center; color: var(--cinereous);">
                <div style="font-size: 40px; margin-bottom: 10px;">🔍</div>
                <div>Нічого не знайдено за запитом "${query}"</div>
                <a href="catalog.html" style="color: var(--blood-red); text-decoration: underline; margin-top: 10px; display: inline-block;">
                    Переглянути весь каталог
                </a>
            </div>
        `;
    } else {
        suggestions.innerHTML = results.map(book => createSuggestionItem(book, query)).join('');
    }
    
    showSuggestions();
}

// ====== СТВОРЕННЯ ЕЛЕМЕНТУ ПІДКАЗКИ ======
function createSuggestionItem(book, query) {
    const availableStock = (book.stock || 0) - (book.reserved || 0);
    const discountPrice = book.discount > 0 ? book.price * (1 - book.discount / 100) : book.price;
    
    // Підсвічування знайденого тексту
    const highlightedTitle = highlightText(book.title, query);
    const highlightedAuthor = highlightText(book.author, query);
    
    let stockBadge = '';
    if (availableStock <= 0) {
        stockBadge = '<span style="color: #dc3545; font-size: 12px;">Немає в наявності</span>';
    } else if (availableStock <= 15) {
        stockBadge = `<span style="color: #ffc107; font-size: 12px;">⚠️ ${availableStock} шт</span>`;
    }
    
    return `
        <div class="suggestion-item" onclick="window.location.href='book.html?id=${book.id}'">
            <img src="${book.image}" alt="${book.title}" class="suggestion-image">
            <div class="suggestion-info">
                <div class="suggestion-title">${highlightedTitle}</div>
                <div class="suggestion-author">${highlightedAuthor}</div>
                ${stockBadge}
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 5px;">
                ${book.discount > 0 ? `
                    <div style="text-decoration: line-through; color: #999; font-size: 14px;">${book.price} грн</div>
                    <div style="color: var(--blood-red); font-weight: bold; font-size: 18px;">${discountPrice.toFixed(0)} грн</div>
                ` : `
                    <div style="color: var(--blood-red); font-weight: bold; font-size: 18px;">${book.price} грн</div>
                `}
            </div>
        </div>
    `;
}

// ====== ПІДСВІЧУВАННЯ ТЕКСТУ ======
function highlightText(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark style="background-color: #fff3cd; padding: 2px 4px; border-radius: 3px;">$1</mark>');
}

// ====== ЕКРАНУВАННЯ REGEX ======
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ====== ПОКАЗАТИ ПІДКАЗКИ ======
function showSuggestions() {
    const suggestions = document.getElementById('search-suggestions');
    if (suggestions) {
        suggestions.classList.add('show');
    }
}

// ====== СХОВАТИ ПІДКАЗКИ ======
function hideSuggestions() {
    const suggestions = document.getElementById('search-suggestions');
    if (suggestions) {
        suggestions.classList.remove('show');
    }
}

// ====== ОЧИСТИТИ КЕШ (викликається при оновленні даних) ======
function clearSearchCache() {
    searchCache = {};
}

// ====== ЕКСПОРТ ФУНКЦІЙ ======
window.performSearch = performSearch;
window.clearSearchCache = clearSearchCache;