let books = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];

async function loadBooks() {
    try {
        const savedBooks = localStorage.getItem('books');
        if (savedBooks) {
            books = JSON.parse(savedBooks);
            return books;
        }
        
        const response = await fetch('php/books.json');
        books = await response.json();
        return books;
    } catch (error) {
        books = getDemoBooks();
        return books;
    }
}

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
            description: "Один з найвідоміших романів XX століття. Історія про письменника і його кохану, переплетена з біблійним сюжетом про Понтія Пілата.",
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
            language: "Українська",
            publisher: "Наш Формат",
            isbn: "978-617-7513-45-6",
            image: "https://images.unsplash.com/photo-1495640452779-dc497e8d3dcc?w=400",
            images: ["https://images.unsplash.com/photo-1495640452779-dc497e8d3dcc?w=400"],
            shortDescription: "Антиутопія про тоталітарне суспільство майбутнього.",
            description: "Роман-застереження про суспільство тотального контролю, де Великий Брат стежить за кожним.",
            isNew: false,
            isTop: true,
            discount: 15
        }
    ];
}

function showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

async function displayHomeBooks() {
    await loadBooks();
    
    const recentlyViewedSection = document.getElementById('recently-viewed-section');
    const recentlyViewedContainer = document.getElementById('recently-viewed');
    if (recentlyViewedContainer && recentlyViewed.length > 0) {
        recentlyViewedSection.style.display = 'block';
        const recentBooks = recentlyViewed.slice(0, 4).map(id => books.find(b => b.id === id)).filter(Boolean);
        recentlyViewedContainer.innerHTML = recentBooks.map(book => createBookCard(book)).join('');
    }
    
    const newBooksContainer = document.getElementById('new-books');
    if (newBooksContainer) {
        const newBooks = books.filter(book => book.isNew).slice(0, 6);
        newBooksContainer.innerHTML = newBooks.map(book => createBookCard(book)).join('');
    }
    
    const topBooksContainer = document.getElementById('top-books');
    if (topBooksContainer) {
        const topBooks = books.filter(book => book.isTop).slice(0, 6);
        topBooksContainer.innerHTML = topBooks.map(book => createBookCard(book)).join('');
    }
    
    attachBookCardListeners();
}

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

function addToRecentlyViewed(bookId) {
    recentlyViewed = recentlyViewed.filter(id => id !== bookId);
    recentlyViewed.unshift(bookId);
    if (recentlyViewed.length > 10) {
        recentlyViewed = recentlyViewed.slice(0, 10);
    }
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
}

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
}

function updateCartCount() {
    const count = cart.length;
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
    });
}

function toggleProfileMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('profile-menu');
    menu.classList.toggle('show');
}

document.addEventListener('click', (e) => {
    const menu = document.getElementById('profile-menu');
    if (menu && !e.target.closest('.profile-wrapper')) {
        menu.classList.remove('show');
    }
});

let categoryPosition = 0;

function scrollCategories(direction) {
    const track = document.getElementById('categories-track');
    const wrapper = document.querySelector('.categories-wrapper');
    const cardWidth = 275;
    const visibleCards = Math.floor(wrapper.offsetWidth / cardWidth);
    const totalCards = track.children.length;
    const maxPosition = Math.max(0, totalCards - visibleCards);
    
    categoryPosition += direction;
    categoryPosition = Math.max(0, Math.min(categoryPosition, maxPosition));
    
    const offset = -categoryPosition * cardWidth;
    track.style.transform = `translateX(${offset}px)`;
}

function getCategoryName(category) {
    const categories = {
        'fiction': 'Художня література',
        'detective': 'Детективи',
        'fantasy': 'Фентезі',
        'psychology': 'Психологія',
        'business': 'Бізнес',
        'science': 'Наука',
        'biography': 'Біографії',
        'history': 'Історія'
    };
    return categories[category] || category;
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    
    if (document.getElementById('new-books')) {
        displayHomeBooks();
    }
});