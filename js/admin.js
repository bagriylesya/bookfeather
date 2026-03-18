// ===================================
// BOOKFEATHER - ADMIN.JS
// Адмін панель: книги, склад, кілька фото, категорії
// ВАЖЛИВО: не оголошуємо `let books` — використовуємо з main.js
// ===================================

// ===================================
// ІНІЦІАЛІЗАЦІЯ
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Нічого не робимо до входу — все запускається після login
});

// Викликається після успішного входу адміна
async function initAdminPanel() {
    await loadBooks();
    loadAdminBooks();
    loadCategoryOptions();
}

// ===================================
// ЗАВАНТАЖЕННЯ ОПЦІЙ КАТЕГОРІЙ (datalist у формі)
// ===================================
function loadCategoryOptions() {
    const datalist = document.getElementById('category-suggestions');
    if (!datalist) return;

    const cats = getAllCategories();
    datalist.innerHTML = cats.map(c =>
        `<option value="${c.name}">${c.icon} ${c.name}</option>`
    ).join('');
}

// ===================================
// ВІДОБРАЖЕННЯ КНИГ В АДМІНЦІ
// ===================================
function loadAdminBooks() {
    const container = document.getElementById('admin-books-list');
    if (!container) return;

    if (!books || books.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:60px; color:var(--cinereous);">
                <div style="font-size:60px; margin-bottom:20px;">📚</div>
                <h3>Книг ще немає</h3>
                <p>Додайте першу книгу через форму вище</p>
            </div>
        `;
        return;
    }

    container.innerHTML = books.map(book => createAdminBookCard(book)).join('');
}

// ===================================
// КАРТКА КНИГИ В АДМІНЦІ
// ===================================
function createAdminBookCard(book) {
    const availableStock = (book.stock || 0) - (book.reserved || 0);

    let stockColor = '#28a745';
    let stockText  = `✅ ${availableStock} шт`;
    if (availableStock <= 0) {
        stockColor = '#dc3545';
        stockText  = '❌ Немає';
    } else if (availableStock <= 15) {
        stockColor = '#ffc107';
        stockText  = `⚠️ ${availableStock} шт`;
    }

    // Кілька зображень
    const allImages = getBookImages(book);
    const imagesPreview = allImages.slice(0, 3).map((url, i) => `
        <img src="${url}"
             style="width:50px; height:70px; object-fit:cover; border-radius:4px; border:2px solid ${i === 0 ? 'var(--blood-red)' : '#ddd'};"
             onerror="this.style.display='none'"
             title="${i === 0 ? 'Головне фото' : 'Додаткове фото'}">
    `).join('');

    return `
        <div class="admin-book-item" style="position:relative; background:white; padding:20px 20px 20px 50px; border-radius:12px; margin-bottom:14px;
                    box-shadow:0 2px 8px rgba(0,0,0,0.07); border-left:4px solid var(--blood-red);" data-id="${book.id}">
            <input type="checkbox" class="book-checkbox" data-id="${book.id}"
                   onchange="window.onBookCheckboxChange && window.onBookCheckboxChange(this)"
                   style="position:absolute; top:50%; left:16px; transform:translateY(-50%); width:20px; height:20px; accent-color:var(--blood-red); cursor:pointer;">
            <div style="display:flex; gap:20px; align-items:flex-start;">

                <!-- Фото -->
                <div style="display:flex; gap:6px; flex-shrink:0;">
                    ${imagesPreview || `<div style="width:80px; height:110px; background:#f0e8d8; border-radius:8px; display:flex; align-items:center; justify-content:center; color:var(--cinereous);">📷</div>`}
                </div>

                <!-- Інфо -->
                <div style="flex:1; min-width:0;">
                    <h3 style="margin-bottom:6px; color:var(--blood-red); font-size:18px;">${book.title}</h3>
                    <p style="color:var(--cinereous); margin-bottom:10px; font-size:14px;">${book.author}</p>

                    <div style="display:flex; flex-wrap:wrap; gap:16px; font-size:14px; margin-bottom:10px;">
                        <span>📂 <strong>${getCategoryIcon(book.category)} ${book.category}</strong></span>
                        <span>💰 <strong>${book.price} грн</strong>
                            ${book.discount > 0 ? `<span style="color:var(--blood-red);">(-${book.discount}%)</span>` : ''}
                        </span>
                        <span style="color:${stockColor}; font-weight:600;">
                            ${stockText}
                            <small style="color:var(--cinereous); font-weight:400;">(заброньовано: ${book.reserved || 0})</small>
                        </span>
                    </div>

                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        ${book.isNew  ? '<span style="background:#2d8a4e; color:white; padding:3px 10px; border-radius:12px; font-size:12px; font-weight:600;">Новинка</span>' : ''}
                        ${book.isTop  ? '<span style="background:#d4a017; color:white; padding:3px 10px; border-radius:12px; font-size:12px; font-weight:600;">Топ</span>' : ''}
                        ${allImages.length > 1 ? `<span style="background:#6c757d; color:white; padding:3px 10px; border-radius:12px; font-size:12px;">📷 ${allImages.length} фото</span>` : ''}
                    </div>
                </div>

                <!-- Дії -->
                <div style="display:flex; flex-direction:column; gap:8px; flex-shrink:0;">
                    <button class="btn btn-outline btn-small" onclick="editBook(${book.id})">✏️ Редагувати</button>
                    <button class="btn btn-small"
                            onclick="quickEditStock(${book.id})"
                            style="border:2px solid #0d6efd; color:#0d6efd; background:white; padding:7px 14px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer;">
                        📦 Склад
                    </button>
                    <button class="btn btn-small"
                            onclick="deleteBook(${book.id})"
                            style="border:2px solid #dc3545; color:#dc3545; background:white; padding:7px 14px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer;">
                        🗑️ Видалити
                    </button>
                </div>

            </div>
        </div>
    `;
}

// ===================================
// ДОПОМІЖНА: отримати масив фото книги
// ===================================
function getBookImages(book) {
    // Підтримка обох форматів: рядок через кому або масив
    if (Array.isArray(book.images) && book.images.length > 0) {
        return book.images.filter(Boolean);
    }
    if (typeof book.images === 'string' && book.images.trim()) {
        return book.images.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (book.image_url) return [book.image_url];
    if (book.image)     return [book.image];
    return [];
}

// ===================================
// ШВИДКЕ РЕДАГУВАННЯ СКЛАДУ
// ===================================
function quickEditStock(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const current = book.stock || 0;
    const newStock = prompt(
        `📦 Книга: "${book.title}"\n\nПоточний склад: ${current} шт\nЗарезервовано: ${book.reserved || 0} шт\n\nВведіть нову кількість:`,
        current
    );

    if (newStock === null) return; // скасували
    const parsed = parseInt(newStock);
    if (isNaN(parsed) || parsed < 0) {
        showNotification('Некоректне число', 'error');
        return;
    }

    const idx = books.findIndex(b => b.id === bookId);
    books[idx].stock = parsed;
    saveAdminBooks();
    loadAdminBooks();
    showNotification(`Склад "${book.title}" оновлено: ${parsed} шт`);
}

// ===================================
// НАЛАШТУВАННЯ ФОРМИ
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
// ЗБІР ДАНИХ З ФОРМИ
// ===================================
function collectFormData(form) {
    const formData = new FormData(form);

    // Головне фото + додаткові
    const mainImage   = (formData.get('image')  || '').trim();
    const extraImages = (formData.get('images') || '').trim();

    // Збираємо всі URL в масив
    const allUrls = [mainImage, ...extraImages.split(',').map(s => s.trim())]
        .filter(url => url && url.startsWith('http'));

    // Видалення дублів
    const uniqueUrls = [...new Set(allUrls)];

    return {
        title:            formData.get('title')?.trim() || '',
        author:           formData.get('author')?.trim() || '',
        originalTitle:    formData.get('originalTitle')?.trim() || '',
        publisher:        formData.get('publisher')?.trim() || '',
        category:         formData.get('category')?.trim() || '',
        language:         formData.get('language') || 'Українська',
        price:            parseFloat(formData.get('price')) || 0,
        discount:         parseInt(formData.get('discount')) || 0,
        rating:           parseFloat(formData.get('rating')) || 0,
        ratingCount:      parseInt(formData.get('ratingCount')) || 0,
        pages:            parseInt(formData.get('pages')) || 0,
        year:             parseInt(formData.get('year')) || new Date().getFullYear(),
        cover:            formData.get('cover') || 'Тверда',
        translator:       formData.get('translator')?.trim() || '',
        isbn:             formData.get('isbn')?.trim() || '',
        barcode:          formData.get('barcode')?.trim() || '',
        size:             formData.get('size')?.trim() || '',
        weight:           parseInt(formData.get('weight')) || 0,
        illustrations:    formData.get('illustrations') || '',
        // Фото
        image:            uniqueUrls[0] || '',
        image_url:        uniqueUrls[0] || '',
        images:           uniqueUrls,   // зберігаємо як масив
        // Описи
        shortDescription: formData.get('shortDescription')?.trim() || '',
        description:      formData.get('description')?.trim() || '',
        // Мітки
        isNew:            formData.get('isNew') === 'on',
        isTop:            formData.get('isTop') === 'on',
        // Склад
        stock:            parseInt(formData.get('stock')) || 0,
        reserved:         0,
    };
}

// ===================================
// ДОДАВАННЯ КНИГИ
// ===================================
async function addBook() {
    const form = document.getElementById('add-book-form');
    const data = collectFormData(form);

    if (!data.title || !data.author || !data.category || !data.price || !data.image) {
        showNotification('Заповніть всі обов\'язкові поля!', 'error');
        return;
    }

    const basePath = window.BASE_PATH || '';

    // Спробуємо зберегти в MySQL
    if (window.USE_API) {
        try {
            const resp = await fetch(basePath + 'php/api.php?action=books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Token': window.ADMIN_TOKEN || 'admin123'
                },
                body: JSON.stringify(data)
            });
            const json = await resp.json();
            if (json.success) {
                showNotification(`✅ Книгу "${data.title}" збережено в базі даних!`);
                await loadBooks(true); // перезавантажуємо з БД
                form.reset();
                delete form.dataset.editId;
                resetFormButton();
                loadAdminBooks();
                loadCategoryOptions();
                document.querySelector('[data-tab="manage-books"]')?.click();
                return;
            }
        } catch (e) {
            console.warn('API недоступний, зберігаємо локально');
        }
    }

    // Fallback: localStorage
    const newBook = { ...data, id: Date.now(), createdAt: new Date().toISOString() };
    books.push(newBook);
    localStorage.setItem('books', JSON.stringify(books));
    showNotification(`✅ Книгу "${newBook.title}" додано!`);
    form.reset();
    delete form.dataset.editId;
    resetFormButton();
    loadAdminBooks();
    loadCategoryOptions();
    document.querySelector('[data-tab="manage-books"]')?.click();
}

// ===================================
// РЕДАГУВАННЯ: заповнення форми
// ===================================
function editBook(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;

    const form = document.getElementById('add-book-form');
    form.dataset.editId = id;

    // Основні поля
    const set = (name, val) => { if (form.elements[name]) form.elements[name].value = val ?? ''; };

    set('title',            book.title);
    set('author',           book.author);
    set('originalTitle',    book.originalTitle);
    set('publisher',        book.publisher);
    set('category',         book.category);
    set('language',         book.language || 'Українська');
    set('price',            book.price);
    set('discount',         book.discount || 0);
    set('rating',           book.rating || 0);
    set('ratingCount',      book.ratingCount || 0);
    set('pages',            book.pages || '');
    set('year',             book.year || '');
    set('cover',            book.cover || 'Тверда');
    set('translator',       book.translator);
    set('isbn',             book.isbn);
    set('barcode',          book.barcode);
    set('size',             book.size);
    set('weight',           book.weight || '');
    set('illustrations',    book.illustrations || '');
    set('shortDescription', book.shortDescription);
    set('description',      book.description);
    set('stock',            book.stock || 0);

    // Фото: головне + додаткові
    const allImages = getBookImages(book);
    set('image',  allImages[0] || '');
    set('images', allImages.slice(1).join(', '));

    // Чекбокси
    if (form.elements['isNew']) form.elements['isNew'].checked = !!book.isNew;
    if (form.elements['isTop']) form.elements['isTop'].checked = !!book.isTop;

    // Кнопка
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.textContent = '💾 Зберегти зміни';

    // Переходимо на таб форми
    document.querySelector('[data-tab="add-book"]')?.click();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showNotification(`Редагування: "${book.title}"`, 'info');
}

// ===================================
// ОНОВЛЕННЯ КНИГИ
// ===================================
async function updateBook(id) {
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return;

    const form = document.getElementById('add-book-form');
    const data = collectFormData(form);

    if (!data.title || !data.author || !data.category || !data.price) {
        showNotification('Заповніть всі обов\'язкові поля!', 'error');
        return;
    }

    const basePath = window.BASE_PATH || '';

    // Спробуємо оновити в MySQL
    if (window.USE_API) {
        try {
            const resp = await fetch(basePath + `php/api.php?action=books&id=${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Token': window.ADMIN_TOKEN || 'admin123'
                },
                body: JSON.stringify(data)
            });
            const json = await resp.json();
            if (json.success) {
                showNotification(`✅ Книгу "${data.title}" оновлено в базі даних!`);
                await loadBooks(true);
                form.reset();
                delete form.dataset.editId;
                resetFormButton();
                loadAdminBooks();
                loadCategoryOptions();
                return;
            }
        } catch (e) {
            console.warn('API недоступний, зберігаємо локально');
        }
    }

    // Fallback: localStorage
    books[idx] = { ...books[idx], ...data, id, updatedAt: new Date().toISOString() };
    localStorage.setItem('books', JSON.stringify(books));
    showNotification(`✅ Книгу "${data.title}" оновлено!`);
    form.reset();
    delete form.dataset.editId;
    resetFormButton();
    loadAdminBooks();
    loadCategoryOptions();
}

// ===================================
// ВИДАЛЕННЯ КНИГИ
// ===================================
async function deleteBook(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;

    if (!confirm(`Видалити книгу "${book.title}"?\n\nЦю дію не можна скасувати.`)) return;

    const basePath = window.BASE_PATH || '';

    // Спробуємо видалити з MySQL
    if (window.USE_API) {
        try {
            const resp = await fetch(basePath + `php/api.php?action=books&id=${id}`, {
                method: 'DELETE',
                headers: { 'X-Admin-Token': window.ADMIN_TOKEN || 'admin123' }
            });
            const json = await resp.json();
            if (json.success) {
                showNotification(`Книгу "${book.title}" видалено з бази даних`);
                await loadBooks(true);
                loadAdminBooks();
                loadCategoryOptions();
                return;
            }
        } catch (e) {
            console.warn('API недоступний');
        }
    }

    // Fallback: localStorage
    books = books.filter(b => b.id !== id);
    localStorage.setItem('books', JSON.stringify(books));
    showNotification(`Книгу "${book.title}" видалено`);
    loadAdminBooks();
    loadCategoryOptions();
}

// ===================================
// ЗБЕРЕЖЕННЯ (legacy fallback)
// ===================================
function saveAdminBooks() {
    localStorage.setItem('books', JSON.stringify(books));
}

// ===================================
// СКИДАННЯ ФОРМИ
// ===================================
function resetFormButton() {
    const btn = document.querySelector('#add-book-form button[type="submit"]');
    if (btn) btn.textContent = '➕ Додати книгу';
}

// ===================================
// ЕКСПОРТ
// ===================================
window.initAdminPanel   = initAdminPanel;
window.loadAdminBooks   = loadAdminBooks;
window.loadCategoryOptions = loadCategoryOptions;
window.editBook         = editBook;
window.updateBook       = updateBook;
window.deleteBook       = deleteBook;
window.quickEditStock   = quickEditStock;
window.setupFormHandler = setupFormHandler;
window.addBook          = addBook;