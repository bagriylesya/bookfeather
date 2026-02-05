// ====== ГЛОБАЛЬНІ ЗМІННІ ======
let books = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];

// ====== ЗАВАНТАЖЕННЯ КНИГ ======
async function loadBooks() {
    try {
        // Спочатку перевіряємо localStorage
        const savedBooks = localStorage.getItem('books');
        if (savedBooks) {
            books = JSON.parse(savedBooks);
            return books;
        }
        
        const response = await fetch('php/books.json');
        books = await response.json();
        return books;
    } catch (error) {
        console.error('Помилка завантаження книг:', error);
        books = getDemoBooks();
        return books;
    }
}

// ====== ДЕМО ДАНІ ======
function getDemoBooks() {
    return [
        {
            id: 1,
            title: "Майстер і Маргарита",
            author: "Михайло Булгаков",
            price: 250,
            originalTitle: "Мастер и Маргарита",
            category: "fiction",
            categories: ["fiction", "fantasy"],
            rating: 4.9,
            ratingCount: 245,
            pages: 480,
            year: 2023,
            cover: "Тверда",
            language: "Українська",
            translator: "Олександр Мокровольський",
            publisher: "Фоліо",
            isbn: "978-966-03-7891-2",
            barcode: "9789660378912",
            size: "150x210x30",
            weight: 650,
            illustrations: "Без ілюстрацій",
            image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
            images: [
                "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
                "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400"
            ],
            shortDescription: "Культовий роман про любов, магію та боротьбу добра зі злом.",
            description: "Один з найвідоміших романів XX століття. Історія про письменника і його кохану, переплетена з біблійним сюжетом про Понтія Пілата. Роман поєднує в собі сатиру на радянську дійсність, містичні елементи та філософські роздуми про природу добра і зла.",
            isNew: true,
            isTop: true,
            discount: 0
        },
        {
            id: 2,
            title: "1984",
            author: "Джордж Орвелл",
            price: 220,
            originalTitle: "Nineteen Eighty-Four",
            category: "fiction",
            rating: 4.8,
            ratingCount: 312,
            pages: 328,
            year: 2024,
            cover: "М'яка",
            image: "https://images.unsplash.com/photo-1495640452779-dc497e8d3dcc?w=400",
            images: ["https://images.unsplash.com/photo-1495640452779-dc497e8d3dcc?w=400"],
            shortDescription: "Антиутопія про тоталітарне суспільство майбутнього.",
            description: "Роман-застереження про суспільство тотального контролю, де Великий Брат стежить за кожним. Історія Вінстона Сміта, який намагається зберегти свою індивідуальність у світі, де навіть думки контролюються партією.",
            isNew: false,
            isTop: true,
            discount: 15
        },
        {
            id: 3,
            title: "Гаррі Поттер і філософський камінь",
            author: "Джоан Роулінг",
            price: 300,
            originalTitle: "Harry Potter and the Philosopher's Stone",
            category: "fantasy",
            rating: 4.9,
            ratingCount: 567,
            pages: 432,
            year: 2023,
            cover: "Тверда",
            image: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400",
            images: ["https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400"],
            shortDescription: "Перша книга легендарної серії про юного чарівника.",
            description: "Пригоди Гаррі Поттера в школі чарівництва та чаклунства Гоґвортс. Хлопчик, який вижив, дізнається про свою справжню природу та починає навчання магії.",
            isNew: false,
            isTop: true,
            discount: 0
        },
        {
            id: 4,
            title: "Думай повільно... вирішуй швидко",
            author: "Даніель Канеман",
            price: 350,
            originalTitle: "Thinking, Fast and Slow",
            category: "psychology",
            rating: 4.7,
            ratingCount: 189,
            pages: 512,
            year: 2024,
            cover: "Тверда",
            image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
            images: ["https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400"],
            shortDescription: "Як працює наш розум і як приймати кращі рішення.",
            description: "Нобелівський лауреат розповідає про дві системи мислення та їх вплив на наші рішення. Швидка інтуїтивна система та повільна раціональна система.",
            isNew: true,
            isTop: false,
            discount: 10
        },
        {
            id: 5,
            title: "Сила волі. Тонкощі самоконтролю",
            author: "Келлі Макґоніґал",
            price: 280,
            originalTitle: "The Willpower Instinct",
            category: "psychology",
            rating: 4.6,
            ratingCount: 156,
            pages: 384,
            year: 2023,
            cover: "М'яка",
            image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
            images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400"],
            shortDescription: "Наукові методи покращення самоконтролю та сили волі.",
            description: "Практичні поради від стенфордського психолога про те, як керувати своїми імпульсами. Книга базується на курсі 'Наука сили волі'.",
            isNew: true,
            isTop: false,
            discount: 0
        },
        {
            id: 6,
            title: "Шерлок Холмс. Повне зібрання",
            author: "Артур Конан Дойл",
            price: 420,
            originalTitle: "The Complete Sherlock Holmes",
            category: "detective",
            rating: 4.9,
            ratingCount: 423,
            pages: 1088,
            year: 2024,
            cover: "Тверда",
            image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400",
            images: ["https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400"],
            shortDescription: "Класичні детективні історії про найвідомішого сищика.",
            description: "Усі пригоди Шерлока Холмса та доктора Ватсона в одному виданні. Від 'Етюду в багряних тонах' до останніх оповідань.",
            isNew: false,
            isTop: true,
            discount: 20
        }
    ];
}

// ====== ПОКАЗ СПОВІЩЕННЯ ======
function showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// ====== ВІДОБРАЖЕННЯ КНИГ НА ГОЛОВНІЙ ======
async function displayHomeBooks() {
    await loadBooks();
    
    // Нещодавно переглянуті
    const recentlyViewedSection = document.getElementById('recently-viewed-section');
    const recentlyViewedContainer = document.getElementById('recently-viewed');
    if (recentlyViewedContainer && recentlyViewed.length > 0) {
        recentlyViewedSection.style.display = 'block';
        const recentBooks = recentlyViewed.slice(0, 4).map(id => books.find(b => b.id === id)).filter(Boolean);
        recentlyViewedContainer.innerHTML = recentBooks.map(book => createBookCard(book)).join('');
    }
    
    // Новинки
    const newBooksContainer = document.getElementById('new-books');
    if (newBooksContainer) {
        const newBooks = books.filter(book => book.isNew).slice(0, 6);
        newBooksContainer.innerHTML = newBooks.map(book => createBookCard(book)).join('');
    }
    
    // Топ книги
    const topBooksContainer = document.getElementById('top-books');
    if (topBooksContainer) {
        const topBooks = books.filter(book => book.isTop).slice(0, 6);
        topBooksContainer.innerHTML = topBooks.map(book => createBookCard(book)).join('');
    }
    
    attachBookCardListeners();
}

// ====== СТВОРЕННЯ КАРТКИ КНИГИ ======
function createBookCard(book) {
    const isFavorite = favorites.some(fav => fav.id === book.id);
    let badge = '';
    if (book.discount > 0) {
        badge = `<span class="book-badge">-${book.discount}%</span>`;
    } else if (book.isNew) {
        badge = '<span class="book-badge">Новинка</span>';
    }
    
    const finalPrice = book.discount > 0 ? (book.price * (1 - book.discount / 100)).toFixed(2) : book.price;
    const priceHtml = book.discount > 0 
        ? `<p class="book-price"><span style="text-decoration: line-through; font-size: 20px; color: #947268;">${book.price} грн</span> ${finalPrice} грн</p>`
        : `<p class="book-price">${book.price} грн</p>`;
    
    return `
        <div class="book-card" data-book-id="${book.id}">
            ${badge}
            <img src="${book.image}" alt="${book.title}" class="book-image">
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.author}</p>
                <div class="book-rating">${'★'.repeat(Math.floor(book.rating))}${'☆'.repeat(5-Math.floor(book.rating))} ${book.rating} (${book.ratingCount || 0})</div>
                <p class="book-description">${book.shortDescription}</p>
                ${priceHtml}
                <div class="book-actions">
                    <button class="btn btn-primary add-to-cart" data-id="${book.id}">В кошик</button>
                    <button class="fav-btn ${isFavorite ? 'active' : ''}" data-id="${book.id}" title="Додати у вподобання">♥</button>
                </div>
            </div>
        </div>
    `;
}

// ====== ОБРОБНИКИ ПОДІЙ ДЛЯ КАРТОК ======
function attachBookCardListeners() {
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const bookId = parseInt(e.target.dataset.id);
            addToCart(bookId);
        });
    });
    
    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const bookId = parseInt(e.target.dataset.id);
            toggleFavorite(bookId, e.target);
        });
    });
    
    document.querySelectorAll('.book-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.add-to-cart') && !e.target.closest('.fav-btn')) {
                const bookId = parseInt(card.dataset.bookId);
                addToRecentlyViewed(bookId);
                window.location.href = `book.html?id=${bookId}`;
            }
        });
    });
}

// ====== НЕЩОДАВНО ПЕРЕГЛЯНУТІ ======
function addToRecentlyViewed(bookId) {
    recentlyViewed = recentlyViewed.filter(id => id !== bookId);
    recentlyViewed.unshift(bookId);
    if (recentlyViewed.length > 10) {
        recentlyViewed = recentlyViewed.slice(0, 10);
    }
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
}

// ====== ДОДАВАННЯ В КОШИК ======
function addToCart(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    const existingItem = cart.find(item => item.id === bookId);
    
    if (existingItem) {
        showNotification('Ця книга вже в кошику!');
        return;
    }
    
    cart.push({...book, quantity: 1});
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    showNotification(`"${book.title}" додано до кошика!`);
}

// ====== ВПОДОБАННЯ ======
function toggleFavorite(bookId, button) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    const index = favorites.findIndex(fav => fav.id === bookId);
    
    if (index > -1) {
        favorites.splice(index, 1);
        button.classList.remove('active');
        showNotification(`"${book.title}" видалено з вподобань`);
    } else {
        favorites.push(book);
        button.classList.add('active');
        showNotification(`"${book.title}" додано до вподобань`);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesCount();
}

// ====== ОНОВЛЕННЯ ЛІЧИЛЬНИКІВ ======
function updateCartCount() {
    const count = cart.length;
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
    });
}

function updateFavoritesCount() {
    const count = favorites.length;
    document.querySelectorAll('.fav-count').forEach(el => {
        el.textContent = count;
    });
}

// ====== ВІДОБРАЖЕННЯ ДЕТАЛЕЙ КНИГИ ======
async function displayBookDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = parseInt(urlParams.get('id'));
    
    await loadBooks();
    const book = books.find(b => b.id === bookId);
    
    const container = document.getElementById('book-detail');
    
    if (!book) {
        container.innerHTML = '<p>Книгу не знайдено</p>';
        return;
    }
    
    // Додаємо до нещодавно переглянутих
    addToRecentlyViewed(bookId);
    
    const isFavorite = favorites.some(fav => fav.id === book.id);
    const finalPrice = book.discount > 0 ? (book.price * (1 - book.discount / 100)).toFixed(2) : book.price;
    const priceHtml = book.discount > 0 
        ? `<p class="book-detail-price"><span style="text-decoration: line-through; font-size: 24px; color: #947268;">${book.price} грн</span> ${finalPrice} грн <span style="color: var(--blood-red); font-size: 20px;">(-${book.discount}%)</span></p>`
        : `<p class="book-detail-price">${book.price} грн</p>`;
    
    container.innerHTML = `
        <div class="book-detail-image">
            <img src="${book.image}" alt="${book.title}" onclick="window.open(this.src, '_blank')">
        </div>
        <div class="book-detail-info">
            <h1>${book.title}</h1>
            <p class="book-detail-author">Автор: ${book.author}</p>
            <div class="book-rating" style="font-size: 18px; margin-bottom: 15px;">${'★'.repeat(Math.floor(book.rating))}${'☆'.repeat(5-Math.floor(book.rating))} ${book.rating} (${book.ratingCount || 0} оцінок)</div>
            ${priceHtml}
            
            <div class="book-meta">
                <div class="book-meta-item">
                    <span class="book-meta-label">Оригінальна назва:</span>
                    <span>${book.originalTitle || book.title}</span>
                </div>
                <div class="book-meta-item">
                    <span class="book-meta-label">Обкладинка:</span>
                    <span>${book.cover || 'Тверда'}</span>
                </div>
                <div class="book-meta-item">
                    <span class="book-meta-label">Кількість сторінок:</span>
                    <span>${book.pages || 'Н/Д'}</span>
                </div>
                <div class="book-meta-item">
                    <span class="book-meta-label">Рік видання:</span>
                    <span>${book.year || '2024'}</span>
                </div>
                <div class="book-meta-item">
                    <span class="book-meta-label">Категорія:</span>
                    <span>${getCategoryName(book.category)}</span>
                </div>
            </div>
            
            <p class="book-detail-description">${book.description}</p>
            
            <div class="book-actions">
                <button class="btn btn-primary add-to-cart" data-id="${book.id}">Додати в кошик</button>
                <button class="fav-btn ${isFavorite ? 'active' : ''}" data-id="${book.id}">♥ Вподобання</button>
            </div>
        </div>
    `;
    
    attachBookCardListeners();
    displaySimilarBooks(book.category, book.id);
}

// ====== НАЗВА КАТЕГОРІЇ ======
function getCategoryName(category) {
    const categories = {
        'fiction': 'Художня література',
        'detective': 'Детективи',
        'fantasy': 'Фентезі',
        'psychology': 'Психологія',
        'business': 'Бізнес',
        'science': 'Наука',
        'biography': 'Біографії',
        'history': 'Історія',
        'children': 'Дитячі книги',
        'romance': 'Романтика',
        'thriller': 'Трилери',
        'poetry': 'Поезія'
    };
    return categories[category] || category;
}

// ====== СХОЖІ КНИГИ ======
async function displaySimilarBooks(category, currentBookId) {
    const container = document.getElementById('similar-books');
    if (!container) return;
    
    const similarBooks = books
        .filter(b => b.category === category && b.id !== currentBookId)
        .slice(0, 4);
    
    container.innerHTML = similarBooks.map(book => createBookCard(book)).join('');
    attachBookCardListeners();
}

// ====== ІНІЦІАЛІЗАЦІЯ ======
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    updateFavoritesCount();
    
    if (document.getElementById('new-books')) {
        displayHomeBooks();
    }
    
    if (document.getElementById('book-detail')) {
        displayBookDetails();
    }
});