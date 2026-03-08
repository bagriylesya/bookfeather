// ===================================
// BOOKFEATHER - MAIN.JS
// Основний файл: кошик, вподобання, книги, авторизація
// ===================================

let books = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
// Favorites зберігаємо як масив id (числа)
let favorites = (() => {
    const raw = JSON.parse(localStorage.getItem('favorites') || '[]');
    // Підтримка старого формату (масив об'єктів) — конвертуємо в масив id
    if (raw.length > 0 && typeof raw[0] === 'object') {
        const ids = raw.map(f => f.id).filter(Boolean);
        localStorage.setItem('favorites', JSON.stringify(ids));
        return ids;
    }
    return raw;
})();
let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];

// ===================================
// ЗАВАНТАЖЕННЯ КНИГ
// ===================================
async function loadBooks(forceReload = false) {
    // Якщо книги вже в пам'яті — не завантажуємо знову
    if (!forceReload && books && books.length > 0) return books;

    const basePath = window.BASE_PATH || '';

    // 1. Спробуємо завантажити з MySQL через PHP API
    try {
        const response = await fetch(basePath + 'php/api.php?action=books&limit=100');
        if (response.ok) {
            const json = await response.json();
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                books = json.data.map(mapBookFromDB);
                localStorage.setItem('books', JSON.stringify(books));
                window.USE_API = true;
                return books;
            }
        }
    } catch (e) {
        console.log('PHP API недоступний, пробуємо localStorage...');
    }

    // 2. Fallback: localStorage
    try {
        const savedBooks = localStorage.getItem('books');
        if (savedBooks) {
            books = JSON.parse(savedBooks);
            if (books && books.length > 0) return books;
        }
    } catch (e) {}

    // 3. Fallback: books.json
    try {
        const response = await fetch(basePath + 'data/books.json');
        if (response.ok) {
            books = await response.json();
            localStorage.setItem('books', JSON.stringify(books));
            return books;
        }
    } catch (e) {}

    // 4. Остання резервна — вбудовані демо-дані
    books = getDemoBooks();
    localStorage.setItem('books', JSON.stringify(books));
    return books;
}

// Конвертація полів БД (snake_case) у формат фронтенду (camelCase)
function mapBookFromDB(b) {
    return {
        id:               b.id,
        title:            b.title,
        author:           b.author,
        originalTitle:    b.original_title  || b.originalTitle  || '',
        publisher:        b.publisher       || '',
        category:         b.category        || '',
        language:         b.language        || 'Українська',
        price:            parseFloat(b.price) || 0,
        discount:         parseInt(b.discount) || 0,
        rating:           parseFloat(b.rating) || 0,
        ratingCount:      parseInt(b.rating_count || b.ratingCount) || 0,
        pages:            parseInt(b.pages)    || 0,
        year:             parseInt(b.year)     || 0,
        cover:            b.cover             || 'Тверда',
        translator:       b.translator        || '',
        isbn:             b.isbn              || '',
        barcode:          b.barcode           || '',
        size:             b.size              || '',
        weight:           parseInt(b.weight)  || 0,
        image:            b.image             || '',
        images:           Array.isArray(b.images) ? b.images : [],
        shortDescription: b.short_description || b.shortDescription || '',
        description:      b.description       || '',
        isNew:            Boolean(b.is_new  ?? b.isNew),
        isTop:            Boolean(b.is_top  ?? b.isTop),
        stock:            parseInt(b.stock)    || 0,
        reserved:         parseInt(b.reserved) || 0,
    };
}

// ===================================
// ДЕМО-ДАНІ (якщо немає сервера)
// ===================================
function getDemoBooks() {
    return [
        {
            id: 1,
            title: "Майстер і Маргарита",
            author: "Михайло Булгаков",
            price: 250,
            originalTitle: "Мастер и Маргарита",
            category: "Художня література",
            categories: ["Художня література", "Фентезі"],
            rating: 4.9,
            ratingCount: 245,
            pages: 480,
            year: 2023,
            cover: "Тверда",
            language: "Українська",
            translator: "Олександр Мокровольський",
            publisher: "Фоліо",
            isbn: "978-966-03-7891-2",
            image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
            images: [
                "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
                "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400"
            ],
            shortDescription: "Культовий роман про любов, магію та боротьбу добра зі злом.",
            description: "Один з найвідоміших романів XX століття.",
            isNew: true,
            isTop: true,
            discount: 0,
            stock: 50,
            reserved: 0
        },
        {
            id: 2,
            title: "1984",
            author: "Джордж Орвелл",
            price: 220,
            originalTitle: "Nineteen Eighty-Four",
            category: "Художня література",
            rating: 4.8,
            ratingCount: 312,
            pages: 328,
            year: 2024,
            cover: "М'яка",
            language: "Українська",
            publisher: "Наш Формат",
            image: "https://images.unsplash.com/photo-1495640452779-dc497e8d3dcc?w=400",
            images: ["https://images.unsplash.com/photo-1495640452779-dc497e8d3dcc?w=400"],
            shortDescription: "Антиутопія про тоталітарне суспільство майбутнього.",
            description: "Роман-застереження про суспільство тотального контролю.",
            isNew: false,
            isTop: true,
            discount: 15,
            stock: 35,
            reserved: 0
        },
        {
            id: 3,
            title: "Гаррі Поттер і філософський камінь",
            author: "Джоан Роулінг",
            price: 300,
            category: "Фентезі",
            rating: 4.9,
            ratingCount: 520,
            pages: 320,
            year: 2023,
            cover: "Тверда",
            language: "Українська",
            image: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400",
            images: ["https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400"],
            shortDescription: "Перша книга легендарної серії про юного чарівника.",
            description: "Пригоди Гаррі Поттера в школі Гоґвортс.",
            isNew: false,
            isTop: true,
            discount: 0,
            stock: 12,
            reserved: 0
        },
        {
            id: 4,
            title: "Атомні звички",
            author: "Джеймс Клір",
            price: 320,
            category: "Психологія",
            rating: 4.8,
            ratingCount: 189,
            pages: 288,
            year: 2024,
            cover: "М'яка",
            language: "Українська",
            image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400",
            images: ["https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400"],
            shortDescription: "Як маленькі зміни призводять до великих результатів.",
            description: "Революційна книга про формування звичок.",
            isNew: true,
            isTop: true,
            discount: 10,
            stock: 0,
            reserved: 0
        },
        {
            id: 5,
            title: "Sapiens: Коротка історія людства",
            author: "Юваль Ной Харарі",
            price: 390,
            category: "Наука",
            rating: 4.7,
            ratingCount: 278,
            pages: 443,
            year: 2024,
            cover: "Тверда",
            language: "Українська",
            image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400",
            images: ["https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400"],
            shortDescription: "Історія людства від кам'яного віку до сьогодення.",
            description: "Захоплююча розповідь про те, як Homo sapiens став домінуючим видом.",
            isNew: true,
            isTop: true,
            discount: 0,
            stock: 25,
            reserved: 0
        },
        {
            id: 6,
            title: "Шерлок Холмс. Повне зібрання",
            author: "Артур Конан Дойл",
            price: 420,
            category: "Детективи",
            rating: 4.9,
            ratingCount: 156,
            pages: 980,
            year: 2023,
            cover: "Тверда",
            language: "Українська",
            image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400",
            images: ["https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400"],
            shortDescription: "Класичні детективні історії про найвідомішого сищика.",
            description: "Усі пригоди Шерлока Холмса та доктора Ватсона.",
            isNew: false,
            isTop: true,
            discount: 0,
            stock: 8,
            reserved: 0
        }
    ];
}

// ===================================
// ПОВІДОМЛЕННЯ
// ===================================
function showNotification(message, type = 'success', duration = 3000) {
    // Видаляємо попереднє повідомлення якщо є
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// ===================================
// ВІДОБРАЖЕННЯ КНИГ НА ГОЛОВНІЙ
// ===================================
async function displayHomeBooks() {
    await loadBooks();

    // Нещодавно переглянуті
    const recentlyViewedSection = document.getElementById('recently-viewed-section');
    const recentlyViewedContainer = document.getElementById('recently-viewed');
    if (recentlyViewedContainer && recentlyViewed.length > 0) {
        if (recentlyViewedSection) recentlyViewedSection.style.display = 'block';
        const recentBooks = recentlyViewed.slice(0, 4).map(id => books.find(b => b.id === id)).filter(Boolean);
        recentlyViewedContainer.innerHTML = recentBooks.map(book => createBookCard(book)).join('');
    }

    // Новинки
    const newBooksContainer = document.getElementById('new-books');
    if (newBooksContainer) {
        const newBooks = books.filter(book => book.isNew).slice(0, 6);
        newBooksContainer.innerHTML = newBooks.length
            ? newBooks.map(book => createBookCard(book)).join('')
            : '<p style="text-align:center;color:var(--cinereous);padding:40px;">Немає новинок</p>';
    }

    // Топ продажів
    const topBooksContainer = document.getElementById('top-books');
    if (topBooksContainer) {
        const topBooks = books.filter(book => book.isTop).slice(0, 6);
        topBooksContainer.innerHTML = topBooks.length
            ? topBooks.map(book => createBookCard(book)).join('')
            : '<p style="text-align:center;color:var(--cinereous);padding:40px;">Немає топ книг</p>';
    }

    attachBookCardListeners();
}

// ===================================
// КАРТКА КНИГИ (єдина версія для всього сайту)
// ===================================
function createBookCard(book) {
    const isFavorite = isInFavorites(book.id);
    const availableStock = (book.stock || 0) - (book.reserved || 0);
    const discountPrice = book.discount > 0 ? (book.price * (1 - book.discount / 100)) : book.price;

    // Значок наявності
    let stockBadge = '';
    if (availableStock <= 0) {
        stockBadge = '<div class="stock-badge out-of-stock">Немає в наявності</div>';
    } else if (availableStock <= 15) {
        stockBadge = `<div class="stock-badge low-stock">⚠️ Останні ${availableStock} шт</div>`;
    }

    // Бейджі
    let badges = '';
    if (book.isNew) badges += '<span class="badge badge-new">Новинка</span>';
    if (book.isTop) badges += '<span class="badge badge-top">Топ</span>';
    if (book.discount > 0) badges += `<span class="badge badge-discount">-${book.discount}%</span>`;

    // Ціна
    const priceHtml = book.discount > 0
        ? `<span class="price-old">${book.price} грн</span><span class="price-current">${discountPrice.toFixed(0)} грн</span>`
        : `<span class="price-current">${book.price} грн</span>`;

    // Рейтинг (зірки з emoji)
    const starsCount = Math.round((book.rating || 0) / 2);
    const stars = '⭐'.repeat(Math.min(starsCount, 5));

    return `
        <div class="book-card" data-book-id="${book.id}">
            ${stockBadge}
            <a href="book.html?id=${book.id}" class="book-card-link">
                <img src="${book.image || book.image_url || 'https://via.placeholder.com/250x350?text=Обкладинка'}" 
                     alt="${book.title}" 
                     class="book-image"
                     onerror="this.src='https://via.placeholder.com/250x350?text=Обкладинка'">
            </a>
            <div class="book-badges">${badges}</div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.author}</p>
                <div class="book-rating">
                    ${stars} <span class="rating-count">(${book.ratingCount || 0})</span>
                </div>
                <div class="book-footer">
                    <div class="book-price">${priceHtml}</div>
                    <div class="book-actions">
                        <button class="btn-icon fav-btn ${isFavorite ? 'active' : ''}" 
                                data-id="${book.id}"
                                title="${isFavorite ? 'Видалити з вподобань' : 'Додати до вподобань'}">♥</button>
                        ${availableStock > 0
                            ? `<button class="btn btn-primary btn-small add-to-cart" data-id="${book.id}">В кошик</button>`
                            : `<button class="btn btn-outline btn-small notify-btn" data-id="${book.id}">🔔 Повідомити</button>`
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ===================================
// СЛУХАЧІ ДЛЯ КАРТОК
// ===================================
function attachBookCardListeners() {
    // Кнопки "В кошик"
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(parseInt(btn.dataset.id));
        });
    });

    // Кнопки вподобань
    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(parseInt(btn.dataset.id), btn);
        });
    });

    // Кнопки "Повідомити"
    document.querySelectorAll('.notify-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            notifyWhenAvailable(parseInt(btn.dataset.id));
        });
    });
}

// ===================================
// КОШИК
// ===================================
function addToCart(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const availableStock = (book.stock || 0) - (book.reserved || 0);
    if (availableStock <= 0) {
        showNotification('На жаль, ця книга відсутня на складі', 'error');
        return;
    }

    const existingItem = cart.find(item => item.id === bookId);
    if (existingItem) {
        showNotification(`"${book.title}" вже є в кошику!`, 'info');
        return;
    }

    cart.push({ ...book, quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification(`"${book.title}" додано до кошика! 🛒`);
}

function updateCartCount() {
    const count = cart.length;
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
    });
}

// ===================================
// ВПОДОБАННЯ
// ===================================
function isInFavorites(bookId) {
    return favorites.includes(bookId);
}

function toggleFavorite(bookId, buttonEl) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const index = favorites.indexOf(bookId);

    if (index > -1) {
        favorites.splice(index, 1);
        document.querySelectorAll(`.fav-btn[data-id="${bookId}"]`).forEach(btn => {
            btn.classList.remove('active');
            btn.title = 'Додати до вподобань';
        });
        showNotification(`"${book.title}" видалено з вподобань`);
    } else {
        favorites.push(bookId);
        document.querySelectorAll(`.fav-btn[data-id="${bookId}"]`).forEach(btn => {
            btn.classList.add('active');
            btn.title = 'Видалити з вподобань';
        });
        showNotification(`"${book.title}" додано до вподобань! ♥`);
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavCount();
}

function updateFavCount() {
    const count = favorites.length;
    document.querySelectorAll('.fav-count').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
    });
}

// ===================================
// НЕЩОДАВНО ПЕРЕГЛЯНУТІ
// ===================================
function addToRecentlyViewed(bookId) {
    recentlyViewed = recentlyViewed.filter(id => id !== bookId);
    recentlyViewed.unshift(bookId);
    if (recentlyViewed.length > 10) recentlyViewed = recentlyViewed.slice(0, 10);
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
}

// ===================================
// ПОВІДОМЛЕННЯ ПРО НАЯВНІСТЬ
// ===================================
function notifyWhenAvailable(bookId) {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        if (confirm('Щоб отримати повідомлення, потрібно увійти. Перейти до входу?')) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
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
        bookId,
        email: currentUser.email,
        createdAt: new Date().toISOString()
    });

    localStorage.setItem('stockNotifications', JSON.stringify(notifications));
    showNotification('Ми повідомимо вас, коли книга з\'явиться в наявності! 🔔');
}

// ===================================
// АВТОРИЗАЦІЯ
// ===================================
function getCurrentUser() {
    try {
        const fromLocal = localStorage.getItem('currentUser');
        const fromSession = sessionStorage.getItem('currentUser');
        const raw = fromLocal || fromSession;
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    showNotification('Ви вийшли з системи');
    setTimeout(() => window.location.href = 'index.html', 1000);
}

// Оновлення меню профілю залежно від авторизації
function updateProfileMenu() {
    const menu = document.getElementById('profile-menu');
    if (!menu) return;

    const user = getCurrentUser();

    if (user) {
        menu.innerHTML = `
            <div style="padding: 12px 20px; border-bottom: 1px solid #eee; font-weight: 600; color: var(--blood-red);">
                ${user.name} ${user.surname || ''}
            </div>
            <a href="profile.html">Мій профіль</a>
            <a href="profile.html?tab=orders">Мої замовлення</a>
            <a href="favorites.html">Вподобання</a>
            ${user.isAdmin ? '<a href="admin.html">Адмін панель</a>' : ''}
            <a href="#" onclick="logout(); return false;" style="color: #dc3545;">Вийти</a>
        `;
    } else {
        menu.innerHTML = `
            <a href="login.html">Увійти</a>
            <a href="register.html">Реєстрація</a>
        `;
    }
}

// ===================================
// МЕНЮ ПРОФІЛЮ (відкрити/закрити)
// ===================================
function toggleProfileMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('profile-menu');
    if (menu) menu.classList.toggle('show');
}

document.addEventListener('click', (e) => {
    const menu = document.getElementById('profile-menu');
    if (menu && !e.target.closest('.profile-wrapper')) {
        menu.classList.remove('show');
    }
});

// ===================================
// ДОПОМІЖНІ ФУНКЦІЇ
// ===================================
// ===================================
// СИСТЕМА КАТЕГОРІЙ — ДИНАМІЧНА
// Вбудовані + ті що додав адмін
// ===================================

// ===================================
// МАППІНГ КАТЕГОРІЙ (англ → укр)
// ===================================
const CATEGORY_MAP = {
    'fiction':'Художня література','classic':'Класика','classics':'Класика',
    'fantasy':'Фентезі','sci-fi':'Наукова фантастика','science fiction':'Наукова фантастика',
    'detective':'Детективи','thriller':'Трилер','romance':'Романтика',
    'horror':'Жахи','adventure':'Пригоди','humor':'Гумор',
    'psychology':'Психологія','self-help':'Саморозвиток','business':'Бізнес',
    'history':'Історія','biography':'Біографії','science':'Наука',
    'philosophy':'Філософія','children':'Дитяча','comics':'Комікси та манга',
    'dystopia':'Антиутопія','ukrainian':'Українська література',
    'foreign':'Зарубіжна література','non-fiction':'Популярна наука',
};

function normalizeCategory(cat) {
    if (!cat) return cat;
    return CATEGORY_MAP[cat.toLowerCase()] || cat;
}
window.normalizeCategory = normalizeCategory;

const DEFAULT_CATEGORIES = [
    // Художня література
    { id: 'Художня література',    name: 'Художня література',    icon: '📖' },
    { id: 'Класика',               name: 'Класика',               icon: '🏛️' },
    { id: 'Сучасна проза',         name: 'Сучасна проза',         icon: '✍️' },
    { id: 'Українська література', name: 'Українська література', icon: '🇺🇦' },
    { id: 'Зарубіжна література',  name: 'Зарубіжна література',  icon: '🌍' },
    // Жанри
    { id: 'Детективи',             name: 'Детективи',             icon: '🔍' },
    { id: 'Трилер',                name: 'Трилер',                icon: '😰' },
    { id: 'Фентезі',               name: 'Фентезі',               icon: '🧙' },
    { id: 'Наукова фантастика',    name: 'Наукова фантастика',    icon: '🚀' },
    { id: 'Містика',               name: 'Містика',               icon: '👻' },
    { id: 'Жахи',                  name: 'Жахи',                  icon: '🕷️' },
    { id: 'Романтика',             name: 'Романтика',             icon: '💕' },
    { id: 'Пригоди',               name: 'Пригоди',               icon: '🗺️' },
    { id: 'Гумор',                 name: 'Гумор',                 icon: '😄' },
    { id: 'Антиутопія',            name: 'Антиутопія',            icon: '🏚️' },
    // Нон-фікшн
    { id: 'Психологія',            name: 'Психологія',            icon: '🧠' },
    { id: 'Саморозвиток',          name: 'Саморозвиток',          icon: '💪' },
    { id: 'Бізнес',                name: 'Бізнес',                icon: '💼' },
    { id: 'Фінанси',               name: 'Фінанси',               icon: '💰' },
    { id: 'Наука',                 name: 'Наука',                 icon: '🔬' },
    { id: 'Популярна наука',       name: 'Популярна наука',       icon: '🌌' },
    { id: 'Історія',               name: 'Історія',               icon: '⚔️' },
    { id: 'Біографії',             name: 'Біографії',             icon: '👤' },
    { id: 'Мемуари',               name: 'Мемуари',               icon: '📝' },
    { id: 'Філософія',             name: 'Філософія',             icon: '🤔' },
    { id: 'Політика',              name: 'Політика',              icon: '🏛️' },
    { id: 'Соціологія',            name: 'Соціологія',            icon: '👥' },
    { id: 'Право',                 name: 'Право',                 icon: '⚖️' },
    { id: 'Медицина',              name: 'Медицина',              icon: '🏥' },
    { id: 'Природа',               name: 'Природа',               icon: '🌿' },
    // Практичні
    { id: 'Кулінарія',             name: 'Кулінарія',             icon: '👨‍🍳' },
    { id: 'Подорожі',              name: 'Подорожі',              icon: '✈️' },
    { id: 'Спорт',                 name: 'Спорт',                 icon: '⚽' },
    { id: 'Мистецтво',             name: 'Мистецтво',             icon: '🎨' },
    { id: 'Музика',                name: 'Музика',                icon: '🎵' },
    { id: 'Архітектура',           name: 'Архітектура',           icon: '🏗️' },
    { id: 'Фотографія',            name: 'Фотографія',            icon: '📷' },
    { id: 'Дизайн',                name: 'Дизайн',                icon: '🎭' },
    // Навчальні
    { id: 'Навчальна',             name: 'Навчальна',             icon: '📚' },
    { id: 'Мови',                  name: 'Мови',                  icon: '🗣️' },
    { id: 'Математика',            name: 'Математика',            icon: '🔢' },
    { id: 'Програмування',         name: 'Програмування',         icon: '💻' },
    // Для дітей
    { id: 'Дитяча',                name: 'Дитяча',                icon: '🧸' },
    { id: 'Підліткова',            name: 'Підліткова',            icon: '🎒' },
    { id: 'Казки',                 name: 'Казки',                 icon: '🏰' },
    { id: 'Комікси та манга',      name: 'Комікси та манга',      icon: '💥' },
    // Духовне
    { id: 'Езотерика',             name: 'Езотерика',             icon: '🔮' },
    { id: 'Релігія',               name: 'Релігія',               icon: '✝️' },
    { id: 'Духовний розвиток',     name: 'Духовний розвиток',     icon: '🕊️' },
];

// Отримати всі категорії (вбудовані + додані адміном)
function getAllCategories() {
    const customCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
    const all = [...DEFAULT_CATEGORIES];

    customCategories.forEach(cat => {
        if (!all.find(c => c.id === cat.id)) {
            all.push(cat);
        }
    });

    return all;
}

// Додати нову категорію (з адмінки)
function addCustomCategory(name, icon = '📚') {
    if (!name || !name.trim()) return false;
    const id = name.trim();

    const all = getAllCategories();
    if (all.find(c => c.id === id)) return false; // вже є

    const custom = JSON.parse(localStorage.getItem('customCategories') || '[]');
    custom.push({ id, name: id, icon });
    localStorage.setItem('customCategories', JSON.stringify(custom));
    return true;
}

// Видалити кастомну категорію
function removeCustomCategory(id) {
    const custom = JSON.parse(localStorage.getItem('customCategories') || '[]');
    const filtered = custom.filter(c => c.id !== id);
    localStorage.setItem('customCategories', JSON.stringify(filtered));
}

// Отримати назву категорії (для сумісності)
function getCategoryName(category) {
    if (!category) return '';
    const all = getAllCategories();
    const found = all.find(c => c.id === category);
    return found ? found.name : category;
}

// Отримати іконку категорії
function getCategoryIcon(category) {
    const all = getAllCategories();
    const found = all.find(c => c.id === category);
    return found ? found.icon : '📚';
}

function scrollCategories(direction) {
    const track = document.getElementById('categories-track');
    const wrapper = document.querySelector('.categories-wrapper');
    if (!track || !wrapper) return;

    const cardWidth = 275;
    const visibleCards = Math.floor(wrapper.offsetWidth / cardWidth);
    const totalCards = track.children.length;
    const maxPosition = Math.max(0, totalCards - visibleCards);

    let categoryPosition = parseInt(track.dataset.position || 0);
    categoryPosition = Math.max(0, Math.min(categoryPosition + direction, maxPosition));
    track.dataset.position = categoryPosition;

    track.style.transform = `translateX(${-categoryPosition * cardWidth}px)`;
}

// ===================================
// ІНІЦІАЛІЗАЦІЯ
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    updateFavCount();
    updateProfileMenu();

    // Головна сторінка
    if (document.getElementById('new-books') || document.getElementById('top-books')) {
        displayHomeBooks();
    }
});