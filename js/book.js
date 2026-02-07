let currentBook = null;
let currentImageIndex = 0;
let userRatings = JSON.parse(localStorage.getItem('userRatings')) || {};
let userRating = 0;

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
    userRating = userRatings[bookId] || 0;
    
    const finalPrice = book.discount > 0 ? (book.price * (1 - book.discount / 100)).toFixed(2) : book.price;
    const priceHtml = book.discount > 0 
        ? `<p class="book-detail-price"><span style="text-decoration: line-through; font-size: 26px; color: #947268;">${book.price} грн</span> ${finalPrice} грн <span style="color: var(--blood-red); font-size: 22px;">(-${book.discount}%)</span></p>`
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
            
            ${priceHtml}
            
            <div class="rating-interactive">
                <div class="current-rating">
                    <div class="stars-display">${generateStarsDisplay(book.rating)}</div>
                    <span class="rating-info">${book.rating.toFixed(1)} / 10 (${book.ratingCount || 0} оцінок)</span>
                </div>
                
                <div class="user-rating">
                    <div class="user-rating-label">Поставте свою оцінку:</div>
                    <div class="rating-stars" id="rating-stars">
                        ${generateRatingStars()}
                    </div>
                    <div class="selected-rating" id="selected-rating">
                        ${userRating > 0 ? `Ваша оцінка: ${userRating} / 10` : 'Оберіть оцінку'}
                    </div>
                </div>
            </div>
            
            <div class="book-meta">
                ${createMetaRow('Оригінальна назва', book.originalTitle || book.title)}
                ${createMetaRow('Автор', book.author, true, `filterByAuthor('${book.author}')`)}
                ${book.publisher ? createMetaRow('Видавництво', book.publisher, true, `filterByPublisher('${book.publisher}')`) : ''}
                ${createMetaRow('Категорія', getCategoryName(book.category), true, `filterByCategory('${book.category}')`)}
                ${book.categories && book.categories.length > 0 ? createMetaRow('Додаткові категорії', book.categories.map(c => `<span class="meta-value clickable" onclick="filterByCategory('${c}')">${getCategoryName(c)}</span>`).join(', ')) : ''}
                ${createMetaRow('Мова', book.language || 'Українська')}
                ${book.translator ? createMetaRow('Перекладач', book.translator) : ''}
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
                <h3 style="font-size: 26px; margin-bottom: 18px; color: var(--blood-red);">Опис</h3>
                <p style="line-height: 1.9; font-size: 17px;">${book.description}</p>
            </div>
            
            <div class="book-actions" style="display: flex; gap: 15px;">
                <button class="btn btn-primary" onclick="addToCart(${book.id})" style="flex: 2; padding: 16px; font-size: 18px;">Додати в кошик</button>
                <button class="fav-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite(${book.id}, this)" style="flex: 1; font-size: 24px;">♥</button>
            </div>
        </div>
    `;
    
    attachRatingListeners(bookId);
    displaySimilarBooks(book.category, book.categories, bookId);
}

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

function generateStarsDisplay(rating) {
    const normalizedRating = rating / 2;
    const fullStars = Math.floor(normalizedRating);
    const hasHalfStar = (normalizedRating % 1) >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '⯨';
    stars += '☆'.repeat(emptyStars);
    
    return stars;
}

function generateRatingStars() {
    let html = '';
    for (let i = 1; i <= 10; i++) {
        const filled = i <= userRating ? 'filled' : '';
        html += `<span class="star ${filled}" data-rating="${i}">★</span>`;
    }
    return html;
}

function attachRatingListeners(bookId) {
    const stars = document.querySelectorAll('.star');
    const selectedRatingEl = document.getElementById('selected-rating');
    
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            const rating = index + 1;
            setUserRating(bookId, rating);
            userRating = rating;
            
            stars.forEach((s, i) => {
                if (i < rating) {
                    s.classList.add('filled');
                } else {
                    s.classList.remove('filled');
                }
            });
            
            selectedRatingEl.textContent = `Ваша оцінка: ${rating} / 10`;
            showNotification(`Ви поставили оцінку ${rating}/10`);
        });
        
        star.addEventListener('mouseenter', () => {
            const rating = index + 1;
            stars.forEach((s, i) => {
                if (i < rating) {
                    s.classList.add('filled');
                } else {
                    s.classList.remove('filled');
                }
            });
        });
    });
    
    const ratingStarsContainer = document.getElementById('rating-stars');
    ratingStarsContainer.addEventListener('mouseleave', () => {
        stars.forEach((s, i) => {
            if (i < userRating) {
                s.classList.add('filled');
            } else {
                s.classList.remove('filled');
            }
        });
    });
}

function setUserRating(bookId, rating) {
    userRatings[bookId] = rating;
    localStorage.setItem('userRatings', JSON.stringify(userRatings));
    
    const book = books.find(b => b.id === bookId);
    if (book) {
        const previousCount = book.ratingCount || 0;
        const previousTotal = (book.rating || 0) * previousCount;
        book.ratingCount = previousCount + 1;
        book.rating = (previousTotal + rating) / book.ratingCount;
        
        localStorage.setItem('books', JSON.stringify(books));
    }
}

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

function filterByAuthor(author) {
    window.location.href = `catalog.html?author=${encodeURIComponent(author)}`;
}

function filterByCategory(category) {
    window.location.href = `catalog.html?category=${encodeURIComponent(category)}`;
}

function filterByPublisher(publisher) {
    window.location.href = `catalog.html?publisher=${encodeURIComponent(publisher)}`;
}

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

document.addEventListener('DOMContentLoaded', () => {
    displayBookDetails();
});