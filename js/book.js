// ====== ГЛОБАЛЬНІ ЗМІННІ ======
let currentBook = null;
let currentImageIndex = 0;
let userRatings = JSON.parse(localStorage.getItem('userRatings')) || {};

// ====== ВІДОБРАЖЕННЯ ДЕТАЛЕЙ КНИГИ ======
async function displayBookDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = parseInt(urlParams.get('id'));
    
    await loadBooks();
    const book = books.find(b => b.id === bookId);
    
    const container = document.getElementById('book-detail');
    
    if (!book) {
        container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Книгу не знайдено</p>';
        return;
    }
    
    currentBook = book;
    addToRecentlyViewed(bookId);
    
    const isFavorite = favorites.some(fav => fav.id === book.id);
    const images = book.images || [book.image];
    const userRating = userRatings[bookId] || 0;
    
    // Розрахунок фінальної ціни зі знижкою
    const finalPrice = book.discount > 0 ? (book.price * (1 - book.discount / 100)).toFixed(2) : book.price;
    const priceHtml = book.discount > 0 
        ? `<p class="book-detail-price"><span style="text-decoration: line-through; font-size: 24px; color: #947268;">${book.price} грн</span> ${finalPrice} грн <span style="color: var(--blood-red); font-size: 20px;">(-${book.discount}%)</span></p>`
        : `<p class="book-detail-price">${book.price} грн</p>`;
    
    container.innerHTML = `
        <div class="book-gallery">
            <div class="main-image-container">
                <img src="${images[0]}" alt="${book.title}" class="main-image" id="main-image" onclick="window.open(this.src, '_blank')">
                ${images.length > 1 ? `
                <div class="gallery-nav">
                    <button onclick="changeImage(-1)">‹</button>
                    <button onclick="changeImage(1)">›</button>
                </div>
                ` : ''}
            </div>
            ${images.length > 1 ? `
            <div class="gallery-thumbnails">
                ${images.map((img, index) => `
                    <img src="${img}" class="thumbnail ${index === 0 ? 'active' : ''}" onclick="setImage(${index})">
                `).join('')}
            </div>
            ` : ''}
        </div>
        
        <div class="book-detail-info">
            <h1 class="page-title">${book.title}</h1>
            <p class="book-detail-author">
                Автор: <span class="meta-value clickable" onclick="filterByAuthor('${book.author}')">${book.author}</span>
            </p>
            
            <div class="rating-interactive">
                <div class="stars-display">${generateStars(book.rating)}</div>
                <span class="rating-info">${book.rating.toFixed(1)} (${book.ratingCount || 0} оцінок)</span>
            </div>
            
            <div style="margin-bottom: 20px;">
                <p style="font-size: 17px; margin-bottom: 10px; color: var(--drab-brown);">Поставте свою оцінку:</p>
                <div class="rating-input" id="rating-input">
                    ${generateRatingStars(userRating)}
                </div>
            </div>
            
            ${priceHtml}
            
            <div class="book-meta">
                ${createMetaRow('Оригінальна назва', book.originalTitle || book.title)}
                ${createMetaRow('Автор', book.author, true, `filterByAuthor('${book.author}')`)}
                ${book.translator ? createMetaRow('Перекладач', book.translator) : ''}
                ${book.publisher ? createMetaRow('Видавництво', book.publisher, true, `filterByPublisher('${book.publisher}')`) : ''}
                ${createMetaRow('Категорія', getCategoryName(book.category), true, `filterByCategory('${book.category}')`)}
                ${book.categories && book.categories.length > 0 ? createMetaRow('Додаткові категорії', book.categories.map(c => `<span class="meta-value clickable" onclick="filterByCategory('${c}')">${getCategoryName(c)}</span>`).join(', ')) : ''}
                ${createMetaRow('Мова', book.language || 'Українська')}
                ${createMetaRow('Обкладинка', book.cover || 'Тверда')}
                ${createMetaRow('Кількість сторінок', book.pages || 'Н/Д')}
                ${createMetaRow('Рік видання', book.year || '2024')}
                ${book.size ? createMetaRow('Розмір (мм)', book.size) : ''}
                ${book.weight ? createMetaRow('Вага', `${book.weight} г`) : ''}
                ${book.isbn ? createMetaRow('ISBN', book.isbn) : ''}
                ${book.barcode ? createMetaRow('Штрих-код', book.barcode) : ''}
                ${book.illustrations ? createMetaRow('Ілюстрації', book.illustrations) : ''}
            </div>
            
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 24px; margin-bottom: 15px; color: var(--blood-red);">Опис</h3>
                <p class="book-detail-description" style="line-height: 1.9; font-size: 17px;">${book.description}</p>
            </div>
            
            <div class="book-actions" style="display: flex; gap: 12px;">
                <button class="btn btn-primary" onclick="addToCart(${book.id})" style="flex: 2;">Додати в кошик</button>
                <button class="fav-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite(${book.id}, this)" style="flex: 1; background-color: transparent; border: 2px solid var(--blood-red); color: var(--blood-red); padding: 12px; border-radius: 8px; cursor: pointer; font-size: 20px;">♥</button>
            </div>
        </div>
    `;
    
    attachRatingListeners(bookId);
    displaySimilarBooks(book.category, book.categories, bookId);
}

// ====== СТВОРЕННЯ РЯДКА МЕТАДАНИХ ======
function createMetaRow(label, value, clickable = false, onclick = '') {
    if (!value || value === 'Н/Д') return '';
    const valueClass = clickable ? 'meta-value clickable' : 'meta-value';
    const clickAttr = onclick ? `onclick="${onclick}"` : '';
    return `
        <div class="meta-row">
            <span class="meta-label">${label}:</span>
            <span class="${valueClass}" ${clickAttr}>${value}</span>
        </div>
    `;
}

// ====== ГЕНЕРАЦІЯ ЗІРОК ВІДОБРАЖЕННЯ ======
function generateStars(rating) {
    const fullStars = Math.floor(rating / 2);
    const halfStar = (rating % 2) >= 1;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '★'.repeat(fullStars);
    if (halfStar) stars += '⯨';
    stars += '☆'.repeat(emptyStars);
    
    return stars;
}

// ====== ГЕНЕРАЦІЯ ІНТЕРАКТИВНИХ ЗІРОК ======
function generateRatingStars(userRating) {
    let stars = '';
    for (let i = 0.5; i <= 10; i += 0.5) {
        const active = i <= userRating ? 'active' : '';
        const starType = (i % 1 === 0.5) ? '½' : '★';
        const displayRating = i.toFixed(1);
        stars += `<button class="star-btn ${active}" data-rating="${i}" title="${displayRating}/10">${starType}</button>`;
    }
    return stars;
}

// ====== ОБРОБНИКИ ОЦІНЮВАННЯ ======
function attachRatingListeners(bookId) {
    const ratingBtns = document.querySelectorAll('.star-btn');
    ratingBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const rating = parseFloat(btn.dataset.rating);
            setUserRating(bookId, rating);
            
            // Оновлюємо відображення
            ratingBtns.forEach(b => {
                const btnRating = parseFloat(b.dataset.rating);
                if (btnRating <= rating) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });
            
            showNotification(`Ви поставили оцінку ${rating}/10`);
        });
    });
}

// ====== ЗБЕРЕЖЕННЯ ОЦІНКИ КОРИСТУВАЧА ======
function setUserRating(bookId, rating) {
    userRatings[bookId] = rating;
    localStorage.setItem('userRatings', JSON.stringify(userRatings));
    
    // Оновлюємо середню оцінку книги
    const book = books.find(b => b.id === bookId);
    if (book) {
        book.ratingCount = (book.ratingCount || 0) + 1;
        const totalRating = (book.rating * 2 * (book.ratingCount - 1)) + rating;
        book.rating = totalRating / (book.ratingCount * 2);
        
        localStorage.setItem('books', JSON.stringify(books));
    }
}

// ====== ГАЛЕРЕЯ ЗОБРАЖЕНЬ ======
function changeImage(direction) {
    const images = currentBook.images || [currentBook.image];
    currentImageIndex += direction;
    
    if (currentImageIndex < 0) currentImageIndex = images.length - 1;
    if (currentImageIndex >= images.length) currentImageIndex = 0;
    
    setImage(currentImageIndex);
}

function setImage(index) {
    const images = currentBook.images || [currentBook.image];
    currentImageIndex = index;
    
    document.getElementById('main-image').src = images[index];
    
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

// ====== ФІЛЬТРАЦІЯ ======
function filterByAuthor(author) {
    window.location.href = `catalog.html?author=${encodeURIComponent(author)}`;
}

function filterByCategory(category) {
    window.location.href = `catalog.html?category=${encodeURIComponent(category)}`;
}

function filterByPublisher(publisher) {
    window.location.href = `catalog.html?publisher=${encodeURIComponent(publisher)}`;
}

// ====== СХОЖІ КНИГИ ======
async function displaySimilarBooks(mainCategory, additionalCategories, currentBookId) {
    const container = document.getElementById('similar-books');
    if (!container) return;
    
    const allCategories = [mainCategory, ...(additionalCategories || [])];
    
    const similarBooks = books
        .filter(b => b.id !== currentBookId && allCategories.some(cat => 
            b.category === cat || (b.categories && b.categories.includes(cat))
        ))
        .slice(0, 6);
    
    if (similarBooks.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--cinereous);">Схожих книг не знайдено</p>';
        return;
    }
    
    container.innerHTML = similarBooks.map(book => createBookCard(book)).join('');
    attachBookCardListeners();
}

// ====== ІНІЦІАЛІЗАЦІЯ ======
document.addEventListener('DOMContentLoaded', () => {
    displayBookDetails();
});