// ====== АВТОРИЗАЦІЯ ======
const ADMIN_PASSWORD = 'admin123';
let isAdminLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';

// ====== ПЕРЕВІРКА АВТОРИЗАЦІЇ ======
function checkAuth() {
    const loginSection = document.getElementById('admin-login');
    const panelSection = document.getElementById('admin-panel');
    
    if (isAdminLoggedIn) {
        loginSection.style.display = 'none';
        panelSection.style.display = 'block';
        loadAdminBooks();
    } else {
        loginSection.style.display = 'block';
        panelSection.style.display = 'none';
    }
}

// ====== ВХІД ======
function login(password) {
    if (password === ADMIN_PASSWORD) {
        isAdminLoggedIn = true;
        sessionStorage.setItem('adminLoggedIn', 'true');
        checkAuth();
        return true;
    }
    return false;
}

// ====== ВИХІД ======
function logout() {
    isAdminLoggedIn = false;
    sessionStorage.removeItem('adminLoggedIn');
    document.getElementById('admin-password').value = '';
    checkAuth();
    showNotification('Ви вийшли з панелі керування');
}

// ====== ДОДАВАННЯ КНИГИ ======
async function addBook(bookData) {
    const newId = books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1;
    
    const newBook = {
        id: newId,
        title: bookData.title,
        author: bookData.author,
        originalTitle: bookData.originalTitle || bookData.title,
        price: parseFloat(bookData.price),
        category: bookData.category,
        rating: parseFloat(bookData.rating) || 4.0,
        ratingCount: parseInt(bookData.ratingCount) || 0,
        pages: parseInt(bookData.pages) || 300,
        year: parseInt(bookData.year) || 2024,
        cover: bookData.cover || 'Тверда',
        image: bookData.image,
        images: [bookData.image],
        shortDescription: bookData.shortDescription,
        description: bookData.description,
        isNew: bookData.isNew === 'true',
        isTop: bookData.isTop === 'true',
        discount: parseInt(bookData.discount) || 0
    };
    
    books.push(newBook);
    localStorage.setItem('books', JSON.stringify(books));
    
    showNotification('Книгу успішно додано!');
    loadAdminBooks();
    
    return newBook;
}

// ====== ВИДАЛЕННЯ КНИГИ ======
function deleteBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    if (confirm(`Ви впевнені, що хочете видалити "${book.title}"?`)) {
        const index = books.findIndex(b => b.id === bookId);
        books.splice(index, 1);
        localStorage.setItem('books', JSON.stringify(books));
        loadAdminBooks();
        showNotification('Книгу видалено!');
    }
}

// ====== ВІДОБРАЖЕННЯ СПИСКУ КНИГ В АДМІНЦІ ======
function loadAdminBooks() {
    const container = document.getElementById('admin-books-list');
    if (!container) return;
    
    if (books.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; font-size: 18px;">Книги відсутні. Додайте першу книгу!</p>';
        return;
    }
    
    container.innerHTML = books.map(book => {
        const discountInfo = book.discount > 0 ? `<p><strong>Знижка:</strong> ${book.discount}%</p>` : '';
        return `
        <div class="admin-book-item">
            <img src="${book.image}" alt="${book.title}" class="admin-book-image">
            <div class="admin-book-info">
                <h3 class="admin-book-title">${book.title}</h3>
                <p class="admin-book-author">${book.author}</p>
                <p><strong>Категорія:</strong> ${getCategoryName(book.category)}</p>
                <p><strong>Ціна:</strong> ${book.price} грн</p>
                ${discountInfo}
                <p><strong>Рейтинг:</strong> ${book.rating} (${book.ratingCount || 0} оцінок)</p>
                <p><strong>Сторінок:</strong> ${book.pages || 'Н/Д'} | <strong>Рік:</strong> ${book.year || '2024'}</p>
            </div>
            <div class="admin-book-actions">
                <button class="btn btn-primary edit-book" data-id="${book.id}">Редагувати</button>
                <button class="btn btn-outline delete-book" data-id="${book.id}">Видалити</button>
            </div>
        </div>
    `}).join('');
    
    // Обробники
    document.querySelectorAll('.delete-book').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const bookId = parseInt(e.target.dataset.id);
            deleteBook(bookId);
        });
    });
    
    document.querySelectorAll('.edit-book').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const bookId = parseInt(e.target.dataset.id);
            editBook(bookId);
        });
    });
}

// ====== РЕДАГУВАННЯ КНИГИ ======
function editBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    // Переключаємо на вкладку додавання
    document.querySelector('[data-tab="add-book"]').click();
    
    // Заповнюємо форму
    const form = document.getElementById('add-book-form');
    form.elements['title'].value = book.title;
    form.elements['author'].value = book.author;
    form.elements['originalTitle'].value = book.originalTitle || '';
    form.elements['price'].value = book.price;
    form.elements['category'].value = book.category;
    form.elements['rating'].value = book.rating;
    form.elements['ratingCount'].value = book.ratingCount || 0;
    form.elements['pages'].value = book.pages || '';
    form.elements['year'].value = book.year || 2024;
    form.elements['cover'].value = book.cover || 'Тверда';
    form.elements['image'].value = book.image;
    form.elements['shortDescription'].value = book.shortDescription;
    form.elements['description'].value = book.description;
    form.elements['isNew'].checked = book.isNew;
    form.elements['isTop'].checked = book.isTop;
    form.elements['discount'].value = book.discount || 0;
    
    // Змінюємо кнопку
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Оновити книгу';
    submitBtn.dataset.editId = bookId;
    
    // Прокручуємо до форми
    form.scrollIntoView({ behavior: 'smooth' });
}

// ====== ОНОВЛЕННЯ КНИГИ ======
function updateBook(bookId, bookData) {
    const index = books.findIndex(b => b.id === bookId);
    if (index === -1) return;
    
    books[index] = {
        id: bookId,
        title: bookData.title,
        author: bookData.author,
        originalTitle: bookData.originalTitle || bookData.title,
        price: parseFloat(bookData.price),
        category: bookData.category,
        rating: parseFloat(bookData.rating) || 4.0,
        ratingCount: parseInt(bookData.ratingCount) || 0,
        pages: parseInt(bookData.pages) || 300,
        year: parseInt(bookData.year) || 2024,
        cover: bookData.cover || 'Тверда',
        image: bookData.image,
        images: [bookData.image],
        shortDescription: bookData.shortDescription,
        description: bookData.description,
        isNew: bookData.isNew === 'true',
        isTop: bookData.isTop === 'true',
        discount: parseInt(bookData.discount) || 0
    };
    
    localStorage.setItem('books', JSON.stringify(books));
    showNotification('Книгу оновлено!');
    loadAdminBooks();
}

// ====== ОТРИМАННЯ НАЗВИ КАТЕГОРІЇ ======
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

// ====== ПЕРЕКЛЮЧЕННЯ ВКЛАДОК ======
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

// ====== ІНІЦІАЛІЗАЦІЯ ======
document.addEventListener('DOMContentLoaded', async () => {
    if (!document.getElementById('admin-login')) return;
    
    await loadBooks();
    
    const savedBooks = localStorage.getItem('books');
    if (savedBooks) {
        books = JSON.parse(savedBooks);
    }
    
    checkAuth();
    setupTabs();
    
    // Форма входу
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;
        if (!login(password)) {
            showNotification('Неправильний пароль!');
        } else {
            showNotification('Ви успішно увійшли в панель керування');
        }
    });
    
    // Вихід
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Форма додавання книги
    document.getElementById('add-book-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const editId = submitBtn.dataset.editId;
        
        const formData = new FormData(form);
        const bookData = {
            title: formData.get('title'),
            author: formData.get('author'),
            originalTitle: formData.get('originalTitle'),
            price: formData.get('price'),
            category: formData.get('category'),
            rating: formData.get('rating'),
            ratingCount: formData.get('ratingCount'),
            pages: formData.get('pages'),
            year: formData.get('year'),
            cover: formData.get('cover'),
            image: formData.get('image'),
            shortDescription: formData.get('shortDescription'),
            description: formData.get('description'),
            isNew: formData.get('isNew') || 'false',
            isTop: formData.get('isTop') || 'false',
            discount: formData.get('discount')
        };
        
        if (editId) {
            updateBook(parseInt(editId), bookData);
            submitBtn.textContent = 'Додати книгу';
            delete submitBtn.dataset.editId;
        } else {
            addBook(bookData);
        }
        
        form.reset();
        
        // Переключаємо на вкладку керування
        document.querySelector('[data-tab="manage-books"]').click();
    });
});