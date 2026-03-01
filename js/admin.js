// ===================================
// BOOKFEATHER - ADMIN.JS ПОВНА ВЕРСІЯ
// Адмін панель з динамічними категоріями, складом, галереями
// ===================================

let books = [];

// ===================================
// ІНІЦІАЛІЗАЦІЯ
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
    loadAdminBooks();
    loadCategoryOptions();
    setupFormHandler();
});

// ===================================
// ЗАВАНТАЖЕННЯ КНИГ
// ===================================
async function loadBooks() {
    // Спроба завантажити з сервера
    try {
        const response = await fetch('/api/books');
        if (response.ok) {
            books = await response.json();
            localStorage.setItem('books', JSON.stringify(books));
            return books;
        }
    } catch (e) {
        console.log('Сервер недоступний, використовуємо localStorage');
    }
    
    // Завантаження з localStorage
    const savedBooks = localStorage.getItem('books');
    if (savedBooks) {
        books = JSON.parse(savedBooks);
    } else {
        books = getDefaultBooks();
        localStorage.setItem('books', JSON.stringify(books));
    }
    return books;
}

// ===================================
// ОТРИМАННЯ ВСІХ КАТЕГОРІЙ
// ===================================
function getAllCategories() {
    const categories = new Set();
    books.forEach(book => {
        if (book.category) {
            categories.add(book.category);
        }
    });
    return Array.from(categories).sort();
}

// ===================================
// ЗАВАНТАЖЕННЯ ОПЦІЙ КАТЕГОРІЙ (для datalist)
// ===================================
function loadCategoryOptions() {
    const datalist = document.getElementById('category-suggestions');
    if (!datalist) return;
    
    const categories = getAllCategories();
    datalist.innerHTML = categories.map(cat => 
        `<option value="${cat}">`
    ).join('');
}

// ===================================
// ВІДОБРАЖЕННЯ КНИГ В АДМІНЦІ
// ===================================
function loadAdminBooks() {
    const container = document.getElementById('admin-books-list');
    if (!container) return;
    
    if (books.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--cinereous);">
                <div style="font-size: 60px; margin-bottom: 20px;">📚</div>
                <h3>Поки що немає книг</h3>
                <p>Додайте першу книгу через форму вище</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = books.map(book => {
        const availableStock = (book.stock || 0) - (book.reserved || 0);
        
        // Індикатор складу
        let stockIndicator = '';
        if (availableStock <= 0) {
            stockIndicator = '❌ Немає';
        } else if (availableStock <= 15) {
            stockIndicator = `⚠️ ${availableStock} шт`;
        } else {
            stockIndicator = `✅ ${availableStock} шт`;
        }
        
        return `
            <div class="admin-book-item" style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <div style="display: flex; gap: 20px; align-items: start;">
                    <img src="${book.image || book.image_url || 'https://via.placeholder.com/100x140'}" 
                         alt="${book.title}" 
                         style="width: 100px; height: 140px; object-fit: cover; border-radius: 8px;">
                    
                    <div style="flex: 1;">
                        <h3 style="margin-bottom: 8px; color: var(--blood-red);">${book.title}</h3>
                        <p style="color: var(--cinereous); margin-bottom: 8px;">${book.author}</p>
                        
                        <div style="display: flex; gap: 20px; margin-bottom: 10px; font-size: 14px;">
                            <span><strong>Категорія:</strong> ${book.category}</span>
                            <span><strong>Ціна:</strong> ${book.price} грн</span>
                            <span><strong>Склад:</strong> ${stockIndicator}</span>
                        </div>
                        
                        ${book.discount > 0 ? `<span class="badge" style="background: var(--blood-red); color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px;">Знижка ${book.discount}%</span>` : ''}
                        ${book.isNew ? `<span class="badge" style="background: #28a745; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; margin-left: 5px;">Новинка</span>` : ''}
                        ${book.isTop ? `<span class="badge" style="background: #ffc107; color: var(--black-bean); padding: 4px 10px; border-radius: 12px; font-size: 12px; margin-left: 5px;">Топ</span>` : ''}
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-outline btn-small" onclick="editBook(${book.id})" style="padding: 8px 16px;">✏️ Редагувати</button>
                        <button class="btn btn-outline btn-small" onclick="deleteBook(${book.id})" style="padding: 8px 16px; border-color: #dc3545; color: #dc3545;">🗑️ Видалити</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===================================
// НАЛАШТУВАННЯ ОБРОБНИКА ФОРМИ
// ===================================
function setupFormHandler() {
    const form = document.getElementById('add-book-form');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const editId = form.dataset.editId;
        if (editId) {
            updateBook(parseInt(editId));
        } else {
            addBook();
        }
    });
}

// ===================================
// ДОДАВАННЯ КНИГИ
// ===================================
function addBook() {
    const form = document.getElementById('add-book-form');
    const formData = new FormData(form);
    
    // Обробка кількох зображень (через кому)
    const imagesInput = formData.get('images') || formData.get('image') || '';
    const imagesArray = imagesInput.split(',').map(url => url.trim()).filter(url => url);
    
    const newBook = {
        id: Date.now(),
        title: formData.get('title'),
        author: formData.get('author'),
        originalTitle: formData.get('originalTitle') || '',
        publisher: formData.get('publisher') || '',
        category: formData.get('category'),
        language: formData.get('language') || 'Українська',
        price: parseFloat(formData.get('price')),
        discount: parseInt(formData.get('discount')) || 0,
        rating: parseFloat(formData.get('rating')) || 0,
        ratingCount: parseInt(formData.get('ratingCount')) || 0,
        pages: parseInt(formData.get('pages')) || 0,
        year: parseInt(formData.get('year')) || new Date().getFullYear(),
        cover: formData.get('cover') || '',
        translator: formData.get('translator') || '',
        isbn: formData.get('isbn') || '',
        barcode: formData.get('barcode') || '',
        size: formData.get('size') || '',
        weight: parseInt(formData.get('weight')) || 0,
        illustrations: formData.get('illustrations') || '',
        
        // Зображення
        image: imagesArray[0] || '',
        image_url: imagesArray[0] || '',
        images: imagesArray.join(','),
        
        // Описи
        shortDescription: formData.get('shortDescription') || '',
        description: formData.get('description') || '',
        
        // Мітки
        isNew: formData.get('isNew') === 'on',
        isTop: formData.get('isTop') === 'on',
        
        // СКЛАД (ГОЛОВНЕ!)
        stock: parseInt(formData.get('stock')) || 0,
        reserved: 0,
        
        createdAt: new Date().toISOString()
    };
    
    books.push(newBook);
    saveBooks();
    
    showNotification('Книгу додано успішно!', 'success');
    form.reset();
    loadAdminBooks();
    loadCategoryOptions(); // Оновлюємо список категорій
}

// ===================================
// РЕДАГУВАННЯ КНИГИ
// ===================================
function editBook(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;
    
    const form = document.getElementById('add-book-form');
    form.dataset.editId = id;
    
    // Заповнення форми
    form.elements['title'].value = book.title;
    form.elements['author'].value = book.author;
    form.elements['originalTitle'].value = book.originalTitle || '';
    form.elements['publisher'].value = book.publisher || '';
    form.elements['category'].value = book.category;
    form.elements['language'].value = book.language || 'Українська';
    form.elements['price'].value = book.price;
    form.elements['discount'].value = book.discount || 0;
    form.elements['rating'].value = book.rating || 0;
    form.elements['ratingCount'].value = book.ratingCount || 0;
    form.elements['pages'].value = book.pages || '';
    form.elements['year'].value = book.year || '';
    form.elements['cover'].value = book.cover || '';
    form.elements['translator'].value = book.translator || '';
    form.elements['isbn'].value = book.isbn || '';
    form.elements['barcode'].value = book.barcode || '';
    form.elements['size'].value = book.size || '';
    form.elements['weight'].value = book.weight || '';
    form.elements['illustrations'].value = book.illustrations || '';
    
    // Зображення
    if (form.elements['images']) {
        form.elements['images'].value = book.images || book.image_url || book.image || '';
    }
    
    // Описи
    form.elements['shortDescription'].value = book.shortDescription || '';
    form.elements['description'].value = book.description || '';
    
    // Мітки
    form.elements['isNew'].checked = book.isNew || false;
    form.elements['isTop'].checked = book.isTop || false;
    
    // СКЛАД
    form.elements['stock'].value = book.stock || 0;
    
    // Зміна кнопки
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = '💾 Зберегти зміни';
    
    // Прокрутка до форми
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===================================
// ОНОВЛЕННЯ КНИГИ
// ===================================
function updateBook(id) {
    const bookIndex = books.findIndex(b => b.id === id);
    if (bookIndex === -1) return;
    
    const form = document.getElementById('add-book-form');
    const formData = new FormData(form);
    
    // Обробка зображень
    const imagesInput = formData.get('images') || formData.get('image') || '';
    const imagesArray = imagesInput.split(',').map(url => url.trim()).filter(url => url);
    
    // Оновлення книги
    books[bookIndex] = {
        ...books[bookIndex],
        title: formData.get('title'),
        author: formData.get('author'),
        originalTitle: formData.get('originalTitle') || '',
        publisher: formData.get('publisher') || '',
        category: formData.get('category'),
        language: formData.get('language') || 'Українська',
        price: parseFloat(formData.get('price')),
        discount: parseInt(formData.get('discount')) || 0,
        rating: parseFloat(formData.get('rating')) || 0,
        ratingCount: parseInt(formData.get('ratingCount')) || 0,
        pages: parseInt(formData.get('pages')) || 0,
        year: parseInt(formData.get('year')) || new Date().getFullYear(),
        cover: formData.get('cover') || '',
        translator: formData.get('translator') || '',
        isbn: formData.get('isbn') || '',
        barcode: formData.get('barcode') || '',
        size: formData.get('size') || '',
        weight: parseInt(formData.get('weight')) || 0,
        illustrations: formData.get('illustrations') || '',
        image: imagesArray[0] || '',
        image_url: imagesArray[0] || '',
        images: imagesArray.join(','),
        shortDescription: formData.get('shortDescription') || '',
        description: formData.get('description') || '',
        isNew: formData.get('isNew') === 'on',
        isTop: formData.get('isTop') === 'on',
        stock: parseInt(formData.get('stock')) || 0,
        updatedAt: new Date().toISOString()
    };
    
    saveBooks();
    
    showNotification('Книгу оновлено успішно!', 'success');
    
    // Скидання форми
    form.reset();
    delete form.dataset.editId;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = '➕ Додати книгу';
    
    loadAdminBooks();
    loadCategoryOptions();
}

// ===================================
// ВИДАЛЕННЯ КНИГИ
// ===================================
function deleteBook(id) {
    if (!confirm('Ви впевнені, що хочете видалити цю книгу?')) return;
    
    books = books.filter(b => b.id !== id);
    saveBooks();
    
    showNotification('Книгу видалено', 'success');
    loadAdminBooks();
    loadCategoryOptions();
}

// ===================================
// ЗБЕРЕЖЕННЯ КНИГ
// ===================================
function saveBooks() {
    localStorage.setItem('books', JSON.stringify(books));
    
    // Спроба відправити на сервер
    fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(books)
    }).catch(e => console.log('Сервер недоступний'));
}

// ===================================
// ПОКАЗ ПОВІДОМЛЕНЬ
// ===================================
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===================================
// ПОЧАТКОВІ КНИГИ (якщо немає даних)
// ===================================
function getDefaultBooks() {
    return [
        {
            id: 1,
            title: "Майстер і Маргарита",
            author: "Михайло Булгаков",
            category: "Художня література",
            language: "Українська",
            price: 250,
            rating: 4.9,
            ratingCount: 245,
            stock: 50,
            reserved: 0,
            image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
            image_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
            images: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
            shortDescription: "Культовий роман про любов і магію",
            isNew: true,
            isTop: true
        }
    ];
}

// ===================================
// ЕКСПОРТ ФУНКЦІЙ
// ===================================
window.loadBooks = loadBooks;
window.addBook = addBook;
window.editBook = editBook;
window.updateBook = updateBook;
window.deleteBook = deleteBook;