// ===================================
// BOOKFEATHER - ADMIN.JS (ВИПРАВЛЕНО)
// Адмін панель: книги, склад, кілька фото, категорії
// ===================================

// ===================================
// ІНІЦІАЛІЗАЦІЯ
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Нічого не робимо до входу
});

async function initAdminPanel() {
    await loadBooks();
    loadAdminBooks();
    loadCategoryOptions();
}

// ===================================
// ЗАВАНТАЖЕННЯ ОПЦІЙ КАТЕГОРІЙ
// ===================================
function loadCategoryOptions() {
    const datalist = document.getElementById('category-suggestions');
    if (!datalist) return;
    const cats = getAllCategories();
    datalist.innerHTML = cats.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');
}

// ===================================
// ВІДОБРАЖЕННЯ КНИГ В АДМІНЦІ
// ===================================
function loadAdminBooks() {
    const container = document.getElementById('admin-books-list');
    if (!container) return;
    if (!books || books.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:60px; color:var(--cinereous);">
            <div style="font-size:60px; margin-bottom:20px;">📚</div>
            <h3>Книг ще немає</h3>
            <p>Додайте першу книгу через форму вище</p>
        </div>`;
        return;
    }
    container.innerHTML = books.map(book => createAdminBookCard(book)).join('');
    const searchEl = document.getElementById('admin-books-search');
    if (searchEl && searchEl.value.trim()) filterAdminBooks();
}

// ===================================
// КАРТКА КНИГИ В АДМІНЦІ
// ===================================
function createAdminBookCard(book) {
    const availableStock = (book.stock || 0) - (book.reserved || 0);
    let stockColor = '#28a745', stockText = `✅ ${availableStock} шт`;
    if (availableStock <= 0) { stockColor = '#dc3545'; stockText = '❌ Немає'; }
    else if (availableStock <= 15) { stockColor = '#ffc107'; stockText = `⚠️ ${availableStock} шт`; }

    const allImages = getBookImages(book);
    const imagesPreview = allImages.slice(0,3).map((url,i)=>`
        <img src="${url}" style="width:50px; height:70px; object-fit:cover; border-radius:4px; border:2px solid ${i===0?'var(--blood-red)':'#ddd'};"
             onerror="this.style.display='none'" title="${i===0?'Головне фото':'Додаткове фото'}">
    `).join('');

    return `
        <div class="admin-book-item" style="position:relative; background:white; padding:20px 20px 20px 50px; border-radius:12px; margin-bottom:14px;
                    box-shadow:0 2px 8px rgba(0,0,0,0.07); border-left:4px solid var(--blood-red);" data-id="${book.id}">
            <input type="checkbox" class="book-checkbox" data-id="${book.id}"
                   onchange="window.onBookCheckboxChange && window.onBookCheckboxChange(this)"
                   style="position:absolute; top:50%; left:16px; transform:translateY(-50%); width:20px; height:20px; accent-color:var(--blood-red); cursor:pointer;">
            <div style="display:flex; gap:20px; align-items:flex-start;">
                <div style="display:flex; gap:6px; flex-shrink:0;">${imagesPreview || '<div style="width:80px; height:110px; background:#f0e8d8; border-radius:8px; display:flex; align-items:center; justify-content:center; color:var(--cinereous);">📷</div>'}</div>
                <div style="flex:1; min-width:0;">
                    <h3 style="margin-bottom:6px; color:var(--blood-red); font-size:18px;">${escapeHtml(book.title)}</h3>
                    <p style="color:var(--cinereous); margin-bottom:10px; font-size:14px;">${escapeHtml(book.author)}</p>
                    <div style="display:flex; flex-wrap:wrap; gap:16px; font-size:14px; margin-bottom:10px;">
                        <span>📂 <strong>${getCategoryIcon(book.category)} ${book.category}</strong></span>
                        <span>💰 <strong>${book.price} грн</strong> ${book.discount>0?`<span style="color:var(--blood-red);">(-${book.discount}%)</span>`:''}</span>
                        <span style="color:${stockColor}; font-weight:600;">${stockText} <small style="color:var(--cinereous); font-weight:400;">(заброньовано: ${book.reserved||0})</small></span>
                    </div>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        ${book.isNew ? '<span style="background:#2d8a4e; color:white; padding:3px 10px; border-radius:12px; font-size:12px; font-weight:600;">Новинка</span>' : ''}
                        ${book.isTop ? '<span style="background:#d4a017; color:white; padding:3px 10px; border-radius:12px; font-size:12px; font-weight:600;">Топ</span>' : ''}
                        ${allImages.length>1 ? `<span style="background:#6c757d; color:white; padding:3px 10px; border-radius:12px; font-size:12px;">📷 ${allImages.length} фото</span>` : ''}
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px; flex-shrink:0;">
                    <button class="btn btn-outline btn-small" onclick="editBook(${book.id})">✏️ Редагувати</button>
                    <button class="btn btn-small" onclick="quickEditStock(${book.id})" style="border:2px solid #0d6efd; color:#0d6efd; background:white; padding:7px 14px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer;">📦 Склад</button>
                    <button class="btn btn-small" onclick="deleteBook(${book.id})" style="border:2px solid #dc3545; color:#dc3545; background:white; padding:7px 14px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer;">🗑️ Видалити</button>
                </div>
            </div>
        </div>
    `;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function getBookImages(book) {
    if (Array.isArray(book.images) && book.images.length) return book.images.filter(Boolean);
    if (typeof book.images === 'string' && book.images.trim()) return book.images.split(',').map(s=>s.trim()).filter(Boolean);
    if (book.image_url) return [book.image_url];
    if (book.image) return [book.image];
    return [];
}

// ===================================
// ШВИДКЕ РЕДАГУВАННЯ СКЛАДУ
// ===================================
function quickEditStock(bookId) {
    const book = books.find(b => String(b.id) === String(bookId));
    if (!book) return;
    const newStock = prompt(`📦 Книга: "${book.title}"\n\nПоточний склад: ${book.stock||0} шт\nЗарезервовано: ${book.reserved||0} шт\n\nВведіть нову кількість:`, book.stock||0);
    if (newStock === null) return;
    const parsed = parseInt(newStock);
    if (isNaN(parsed) || parsed < 0) {
        _showInlineMsg('❌ Введіть коректну кількість!', 'error');
        if (typeof showNotification === 'function') showNotification('Введіть коректну кількість!', 'error');
        return;
    }
    const idx = books.findIndex(b => String(b.id) === String(bookId));
    if (idx === -1) return;
    if (books[idx].stock === parsed) {
        if (typeof showNotification === 'function') showNotification('ℹ️ Кількість не змінена', 'info');
        return;
    }
    books[idx].stock = parsed;
    books[idx].updatedAt = new Date().toISOString();
    _persistAdminBooks();
    loadAdminBooks();
    const successMsg = `✅ Склад книги "${book.title}" оновлено: ${parsed} шт`;
    _showInlineMsg(successMsg, 'success');
    if (typeof showNotification === 'function') showNotification(successMsg, 'success', 5000);
    if (typeof showAdminSuccessBanner === 'function') showAdminSuccessBanner(successMsg);
}

// ===================================
// НАЛАШТУВАННЯ ФОРМИ
// ===================================
function setupFormHandler() {
    const form = document.getElementById('add-book-form');
    if (!form || form._handlerAttached) return;
    form._handlerAttached = true;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = form.dataset.editId;
        if (editId) updateBook(parseInt(editId));
        else addBook();
    });
}

// ===================================
// ЗБІР ДАНИХ З ФОРМИ
// ===================================
function collectFormData(form) {
    const formData = new FormData(form);
    const mainImage = (formData.get('image') || '').trim();
    const extraImages = (formData.get('images') || '').trim();
    const allUrls = [mainImage, ...extraImages.split(',').map(s=>s.trim())].filter(url => url && (url.startsWith('http') || url.startsWith('/') || url.startsWith('images/')));
    const uniqueUrls = [...new Set(allUrls)];
    const isNewChecked = form.elements['isNew'] ? form.elements['isNew'].checked : false;
    const isTopChecked = form.elements['isTop'] ? form.elements['isTop'].checked : false;
    let categoriesArr = [];
    try {
        const raw = formData.get('categoriesJson') || '[]';
        categoriesArr = JSON.parse(raw);
    } catch(e) {}
    if (categoriesArr.length === 0 && Array.isArray(window._selectedCategories) && window._selectedCategories.length > 0) {
        categoriesArr = window._selectedCategories;
    }
    const primaryCategory = categoriesArr.length > 0 ? categoriesArr[0].id : '';
    return {
        title: formData.get('title')?.trim() || '',
        author: formData.get('author')?.trim() || '',
        originalTitle: formData.get('originalTitle')?.trim() || '',
        publisher: formData.get('publisher')?.trim() || '',
        category: primaryCategory,
        categories: categoriesArr.map(c=>c.id),
        categoriesData: categoriesArr,
        language: formData.get('language') || 'Українська',
        price: parseFloat((formData.get('price')||'0').replace(',','.')) || 0,
        discount: parseInt(formData.get('discount')) || 0,
        goodreadsUrl: formData.get('goodreadsUrl')?.trim() || '',
        pages: parseInt(formData.get('pages')) || 0,
        year: parseInt(formData.get('year')) || new Date().getFullYear(),
        cover: formData.get('cover') || 'Тверда',
        translator: formData.get('translator')?.trim() || '',
        isbn: formData.get('isbn')?.trim() || '',
        barcode: formData.get('barcode')?.trim() || '',
        size: formData.get('size')?.trim() || '',
        weight: parseInt(formData.get('weight')) || 0,
        illustrations: formData.get('illustrations') || '',
        image: uniqueUrls[0] || '',
        image_url: uniqueUrls[0] || '',
        images: uniqueUrls,
        shortDescription: formData.get('shortDescription')?.trim() || '',
        description: formData.get('description')?.trim() || '',
        isNew: isNewChecked,
        isTop: isTopChecked,
        stock: parseInt(formData.get('stock')) || 0,
        reserved: 0,
    };
}

// ===================================
// ДОДАВАННЯ КНИГИ (ПОВНІСТЮ ПЕРЕРОБЛЕНО)
// ===================================
function _showInlineMsg(msg, type) {
    let el = document.getElementById('_inline-add-msg');
    if (!el) {
        el = document.createElement('div');
        el.id = '_inline-add-msg';
        el.style.cssText = 'margin:12px 0; padding:14px 18px; border-radius:10px; font-size:15px; font-weight:600; display:none;';
        const btn = document.getElementById('save-book-btn');
        if (btn && btn.parentNode) btn.parentNode.insertBefore(el, btn);
    }
    el.textContent = msg;
    el.style.display = 'block';
    if (type === 'error') {
        el.style.background = '#f8d7da';
        el.style.color = '#721c24';
        el.style.border = '2px solid #dc3545';
    } else {
        el.style.background = '#d4edda';
        el.style.color = '#155724';
        el.style.border = '2px solid #2d8a4e';
    }
    clearTimeout(el._hideTimer);
    if (type !== 'error') el._hideTimer = setTimeout(() => { if(el) el.style.display = 'none'; }, 8000);
}

async function addBook() {
    // Захист від подвійного натискання
    if (window._addBookInProgress) {
        _showInlineMsg('⏳ Зачекайте, книга вже додається...', 'info');
        return;
    }
    window._addBookInProgress = true;

    const btn = document.getElementById('save-book-btn');
    const origText = btn ? btn.textContent : '➕ Додати книгу';
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Зберігаємо...'; }

    let success = false;
    try {
        const form = document.getElementById('add-book-form');
        const data = collectFormData(form);

        // Валідація
        if (!data.title) throw new Error('missing_title');
        if (!data.author) throw new Error('missing_author');
        if (!data.category) throw new Error('missing_category');
        if (!data.price || data.price <= 0) throw new Error('invalid_price');

        // Перевірка на дублікат (за назвою та автором)
        const existing = books.find(b => 
            b.title.toLowerCase() === data.title.toLowerCase() && 
            b.author.toLowerCase() === data.author.toLowerCase()
        );
        if (existing) {
            const confirmDup = confirm(`Книга "${data.title}" (${data.author}) вже існує.\n\nДодати ще одну копію (з новим ID)?`);
            if (!confirmDup) {
                if (btn) { btn.disabled = false; btn.textContent = origText; }
                window._addBookInProgress = false;
                return;
            }
        }

        // Спроба зберегти через API (якщо ввімкнено)
        let savedViaAPI = false;
        if (window.USE_API) {
            try {
                const basePath = window.BASE_PATH || '';
                const resp = await fetch(basePath + 'php/api.php?action=books', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': window.ADMIN_TOKEN || 'admin123' },
                    body: JSON.stringify(data)
                });
                const json = await resp.json();
                if (json.success) {
                    const newBook = { ...data, id: json.id || Date.now(), rating: 0, ratingCount: 0, createdAt: new Date().toISOString() };
                    books.push(newBook);
                    _persistAdminBooks();
                    savedViaAPI = true;
                    success = true;
                    // Показуємо успіх і очищуємо
                    await _finalizeAddBook(form, `✅ Книгу "${data.title}" збережено в базі даних! 📚`);
                    return;
                }
            } catch(e) {
                console.warn('API недоступний, зберігаємо локально', e);
            }
        }

        // Локальне збереження (якщо API не спрацював або вимкнено)
        const newBook = { ...data, id: Date.now(), rating: 0, ratingCount: 0, createdAt: new Date().toISOString() };
        books.push(newBook);
        _persistAdminBooks();
        success = true;
        await _finalizeAddBook(form, `✅ Книгу "${newBook.title}" успішно додано! 📚`);

    } catch(err) {
        let errorMsg = '❌ Помилка при збереженні. Спробуйте ще раз.';
        if (err.message === 'missing_title') errorMsg = '⚠️ Введіть назву книги!';
        else if (err.message === 'missing_author') errorMsg = '⚠️ Введіть автора!';
        else if (err.message === 'missing_category') errorMsg = '⚠️ Додайте хоча б одну категорію (жанр)!';
        else if (err.message === 'invalid_price') errorMsg = '⚠️ Введіть коректну ціну!';
        _showInlineMsg(errorMsg, 'error');
        if (typeof showNotification === 'function') showNotification(errorMsg, 'error');
        console.error('addBook error:', err);
    } finally {
        window._addBookInProgress = false;
        if (btn && !success) {
            btn.disabled = false;
            btn.textContent = origText;
        }
    }
}

// Фіналізація після успішного додавання (очищення форми, оновлення списку)
async function _finalizeAddBook(form, successMsg) {
    // Показуємо успішне повідомлення
    _showInlineMsg(successMsg, 'success');
    if (typeof showNotification === 'function') showNotification(successMsg, 'success', 6000);
    if (typeof showAdminSuccessBanner === 'function') showAdminSuccessBanner(successMsg);
    if (typeof showBookFormStatus === 'function') showBookFormStatus(successMsg, 'success');

    // Оновлюємо список книг і категорії (обгортаємо в try, щоб не зламати очищення)
    try {
        loadAdminBooks();
        loadCategoryOptions();
    } catch(e) { console.warn('Помилка оновлення списку:', e); }

    // Очищення форми (надійне, без викидання помилок назовні)
    try {
        if (form) {
            form.reset();
            delete form.dataset.editId;
            if (window._selectedCategories) window._selectedCategories = [];
            const tagsEl = document.getElementById('category-tags');
            const hiddenEl = document.getElementById('categories-json-input');
            const catInput = document.getElementById('category-input-field');
            if (tagsEl) tagsEl.innerHTML = '';
            if (hiddenEl) hiddenEl.value = '[]';
            if (catInput) catInput.value = '';
            const discountEl = form.querySelector('[name="discount"]');
            if (discountEl) discountEl.value = '0';
            const stockEl = form.querySelector('[name="stock"]');
            if (stockEl) stockEl.value = '0';
            const langEl = form.querySelector('[name="language"]');
            if (langEl) langEl.value = 'Українська';
            const isNewEl = form.querySelector('[name="isNew"]');
            const isTopEl = form.querySelector('[name="isTop"]');
            if (isNewEl) isNewEl.checked = false;
            if (isTopEl) isTopEl.checked = false;
        }
        const btn = document.getElementById('save-book-btn');
        if (btn) {
            btn.disabled = false;
            btn.textContent = '➕ Додати книгу';
        }
        // Перемикаємо на вкладку "Керування книгами"
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        const manageBtn = document.querySelector('[data-tab="manage-books"]');
        const manageTab = document.getElementById('manage-books');
        if (manageBtn) manageBtn.classList.add('active');
        if (manageTab) manageTab.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) {
        console.warn('Помилка при очищенні форми (не критично):', e);
    }

    // Ховаємо статус через 5 секунд
    setTimeout(() => {
        if (typeof hideBookFormStatus === 'function') hideBookFormStatus();
        const inlineMsg = document.getElementById('_inline-add-msg');
        if (inlineMsg) inlineMsg.style.display = 'none';
    }, 5000);
}

// ===================================
// РЕДАГУВАННЯ КНИГИ
// ===================================
function editBook(id) {
    const book = books.find(b => String(b.id) === String(id));
    if (!book) return;
    const form = document.getElementById('add-book-form');
    form.dataset.editId = id;
    const set = (name, val) => { if (form.elements[name]) form.elements[name].value = val ?? ''; };
    set('title', book.title);
    set('author', book.author);
    set('originalTitle', book.originalTitle);
    set('publisher', book.publisher);
    set('category', book.category);
    set('language', book.language || 'Українська');
    set('price', book.price);
    set('discount', book.discount || 0);
    set('goodreadsUrl', book.goodreadsUrl || '');
    set('pages', book.pages || '');
    set('year', book.year || '');
    set('cover', book.cover || 'Тверда');
    set('translator', book.translator);
    set('isbn', book.isbn);
    set('barcode', book.barcode);
    set('size', book.size);
    set('weight', book.weight || '');
    set('illustrations', book.illustrations || '');
    set('shortDescription', book.shortDescription);
    set('description', book.description);
    set('stock', book.stock || 0);
    const allImages = getBookImages(book);
    set('image', allImages[0] || '');
    set('images', allImages.slice(1).join(', '));
    if (form.elements['isNew']) form.elements['isNew'].checked = !!book.isNew;
    if (form.elements['isTop']) form.elements['isTop'].checked = !!book.isTop;
    // Відновлення категорій
    window._selectedCategories = [];
    const tagsEl = document.getElementById('category-tags');
    const hiddenEl = document.getElementById('categories-json-input');
    const catInput = document.getElementById('category-input-field');
    if (tagsEl) tagsEl.innerHTML = '';
    if (hiddenEl) hiddenEl.value = '';
    if (catInput) catInput.value = '';
    const allCats = typeof getAllCategories === 'function' ? getAllCategories() : [];
    let catsToRestore = [];
    if (Array.isArray(book.categoriesData) && book.categoriesData.length) catsToRestore = book.categoriesData;
    else if (Array.isArray(book.categories) && book.categories.length) {
        catsToRestore = book.categories.map(cid => {
            const found = allCats.find(c => c.id === cid);
            return found ? { id: found.id, name: found.name, label: `${found.icon} ${found.name}` } : { id: cid, name: cid, label: `📚 ${cid}` };
        });
    } else if (book.category) {
        const found = allCats.find(c => c.id === book.category || c.name === book.category);
        catsToRestore = found ? [{ id: found.id, name: found.name, label: `${found.icon} ${found.name}` }] : [{ id: book.category, name: book.category, label: `📚 ${book.category}` }];
    }
    catsToRestore.forEach(c => { if (typeof window.addCategoryTag === 'function') window.addCategoryTag(c.name); });
    const btn = document.getElementById('save-book-btn');
    if (btn) btn.textContent = '💾 Зберегти зміни';
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="add-book"]')?.classList.add('active');
    document.getElementById('add-book')?.classList.add('active');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showNotification(`Редагування: "${book.title}"`, 'info');
}

// ===================================
// ОНОВЛЕННЯ КНИГИ
// ===================================
async function updateBook(id) {
    if (window._updateBookInProgress) return;
    window._updateBookInProgress = true;
    const btn = document.getElementById('save-book-btn');
    const origText = btn ? btn.textContent : '💾 Зберегти зміни';
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Зберігаємо...'; }
    let success = false;
    try {
        const strId = String(id);
        const idx = books.findIndex(b => String(b.id) === strId);
        if (idx === -1) throw new Error('not_found');
        const form = document.getElementById('add-book-form');
        const data = collectFormData(form);
        if (!data.title) throw new Error('missing_title');
        if (!data.author) throw new Error('missing_author');
        if (!data.category) throw new Error('missing_category');
        if (!data.price || data.price <= 0) throw new Error('invalid_price');
        const originalId = books[idx].id;
        const basePath = window.BASE_PATH || '';
        if (window.USE_API) {
            try {
                const resp = await fetch(basePath + `php/api.php?action=books&id=${originalId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': window.ADMIN_TOKEN || 'admin123' },
                    body: JSON.stringify(data)
                });
                const json = await resp.json();
                if (json.success) {
                    books[idx] = { ...books[idx], ...data, id: originalId, rating: books[idx].rating ?? 0, ratingCount: books[idx].ratingCount ?? 0, updatedAt: new Date().toISOString() };
                    _persistAdminBooks();
                    success = true;
                    await _finalizeUpdateBook(form, `✅ Книгу "${data.title}" оновлено! 💾`);
                    return;
                }
            } catch(e) { console.warn('API недоступний'); }
        }
        books[idx] = { ...books[idx], ...data, id: originalId, rating: books[idx].rating ?? 0, ratingCount: books[idx].ratingCount ?? 0, updatedAt: new Date().toISOString() };
        _persistAdminBooks();
        success = true;
        await _finalizeUpdateBook(form, `✅ Зміни збережено: "${data.title}"! 💾`);
    } catch(err) {
        let errorMsg = '❌ Помилка при оновленні книги';
        if (err.message === 'missing_title') errorMsg = '⚠️ Введіть назву книги!';
        else if (err.message === 'missing_author') errorMsg = '⚠️ Введіть автора!';
        else if (err.message === 'missing_category') errorMsg = '⚠️ Додайте хоча б одну категорію!';
        else if (err.message === 'invalid_price') errorMsg = '⚠️ Введіть коректну ціну!';
        showNotification(errorMsg, 'error');
        console.error('updateBook error:', err);
    } finally {
        window._updateBookInProgress = false;
        if (btn && !success) {
            btn.disabled = false;
            btn.textContent = origText;
        }
    }
}

async function _finalizeUpdateBook(form, successMsg) {
    _showInlineMsg(successMsg, 'success');
    if (typeof showNotification === 'function') showNotification(successMsg, 'success', 6000);
    if (typeof showAdminSuccessBanner === 'function') showAdminSuccessBanner(successMsg);
    try {
        loadAdminBooks();
        loadCategoryOptions();
    } catch(e) { console.warn(e); }
    try {
        if (form) {
            form.reset();
            delete form.dataset.editId;
            if (window._selectedCategories) window._selectedCategories = [];
            const tagsEl = document.getElementById('category-tags');
            const hiddenEl = document.getElementById('categories-json-input');
            const catInput = document.getElementById('category-input-field');
            if (tagsEl) tagsEl.innerHTML = '';
            if (hiddenEl) hiddenEl.value = '[]';
            if (catInput) catInput.value = '';
            const discountEl = form.querySelector('[name="discount"]');
            if (discountEl) discountEl.value = '0';
            const stockEl = form.querySelector('[name="stock"]');
            if (stockEl) stockEl.value = '0';
            const langEl = form.querySelector('[name="language"]');
            if (langEl) langEl.value = 'Українська';
            const isNewEl = form.querySelector('[name="isNew"]');
            const isTopEl = form.querySelector('[name="isTop"]');
            if (isNewEl) isNewEl.checked = false;
            if (isTopEl) isTopEl.checked = false;
        }
        const btn = document.getElementById('save-book-btn');
        if (btn) {
            btn.disabled = false;
            btn.textContent = '➕ Додати книгу';
        }
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        const manageBtn = document.querySelector('[data-tab="manage-books"]');
        const manageTab = document.getElementById('manage-books');
        if (manageBtn) manageBtn.classList.add('active');
        if (manageTab) manageTab.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) { console.warn('Помилка очищення форми після оновлення:', e); }
    setTimeout(() => {
        if (typeof hideBookFormStatus === 'function') hideBookFormStatus();
        const inlineMsg = document.getElementById('_inline-add-msg');
        if (inlineMsg) inlineMsg.style.display = 'none';
    }, 5000);
}

// ===================================
// ЗБЕРЕЖЕННЯ В LOCALSTORAGE
// ===================================
function _persistAdminBooks() {
    localStorage.setItem('books', JSON.stringify(books));
    localStorage.setItem('books_admin_modified', Date.now().toString());
    localStorage.setItem('books_admin_overrides', JSON.stringify(books));
    if (typeof clearSearchCache === 'function') clearSearchCache();
}

// ===================================
// ВИДАЛЕННЯ КНИГИ
// ===================================
async function deleteBook(id) {
    const book = books.find(b => String(b.id) === String(id));
    if (!book) return;
    if (!confirm(`Видалити книгу "${book.title}"?\n\nЦю дію не можна скасувати.`)) return;
    const basePath = window.BASE_PATH || '';
    if (window.USE_API) {
        try {
            const resp = await fetch(basePath + `php/api.php?action=books&id=${id}`, {
                method: 'DELETE',
                headers: { 'X-Admin-Token': window.ADMIN_TOKEN || 'admin123' }
            });
            const json = await resp.json();
            if (json.success) {
                books = books.filter(b => String(b.id) !== String(id));
                _persistAdminBooks();
                showNotification(`Книгу "${book.title}" видалено з бази даних`);
                loadAdminBooks();
                loadCategoryOptions();
                return;
            }
        } catch(e) { console.warn('API недоступний'); }
    }
    books = books.filter(b => String(b.id) !== String(id));
    _persistAdminBooks();
    showNotification(`Книгу "${book.title}" видалено`);
    loadAdminBooks();
    loadCategoryOptions();
}

// ===================================
// ДОПОМІЖНІ
// ===================================
function saveAdminBooks() { _persistAdminBooks(); }
function resetFormButton() {
    const btn = document.getElementById('save-book-btn');
    if (btn) btn.textContent = 'Додати книгу';
}
window.initAdminPanel = initAdminPanel;
window.loadAdminBooks = loadAdminBooks;
window.loadCategoryOptions = loadCategoryOptions;
window.editBook = editBook;
window.updateBook = updateBook;
window.deleteBook = deleteBook;
window.quickEditStock = quickEditStock;
window.setupFormHandler = setupFormHandler;
window.addBook = addBook;

// ===================================
// ПОШУК КНИГ В АДМІНЦІ
// ===================================
function filterAdminBooks() {
    const input = document.getElementById('admin-books-search');
    const query = (input?.value || '').toLowerCase().trim();
    const container = document.getElementById('admin-books-list');
    const counter = document.getElementById('admin-search-count');
    if (!container) return;
    const items = container.querySelectorAll('.admin-book-item');
    if (!query) {
        items.forEach(el => el.style.display = '');
        if (counter) counter.textContent = '';
        return;
    }
    let visible = 0;
    items.forEach(el => {
        const id = el.dataset.id;
        const book = books.find(b => String(b.id) === String(id));
        if (!book) { el.style.display = 'none'; return; }
        const haystack = [book.title, book.author, book.publisher || '', book.isbn || '', book.category || ''].join(' ').toLowerCase();
        if (haystack.includes(query)) { el.style.display = ''; visible++; }
        else el.style.display = 'none';
    });
    if (counter) {
        if (visible === 0) counter.innerHTML = `<span style="color:#dc3545;">Нічого не знайдено за запитом &laquo;${escapeHtml(query)}&raquo;</span>`;
        else counter.textContent = `Знайдено: ${visible} з ${items.length} книг`;
    }
}
window.filterAdminBooks = filterAdminBooks;

function clearBooksCache() {
    localStorage.removeItem('books');
    localStorage.removeItem('books_admin_modified');
    localStorage.removeItem('books_admin_overrides');
    books = [];
    showNotification('🔄 Кеш очищено. Перезавантажте сторінку.', 'info');
    setTimeout(() => window.location.reload(), 1200);
}
window.clearBooksCache = clearBooksCache;

// ===================================
// ФУНКЦІЇ ДЛЯ СТАТУСУ ФОРМИ (якщо потрібні)
// ===================================
function showBookFormStatus(msg, type) {
    const el = document.getElementById('book-form-status');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    if (type === 'success') {
        el.style.background = '#d4edda';
        el.style.color = '#155724';
        el.style.border = '2px solid #2d8a4e';
    } else if (type === 'error') {
        el.style.background = '#f8d7da';
        el.style.color = '#721c24';
        el.style.border = '2px solid #dc3545';
    }
}
function hideBookFormStatus() {
    const el = document.getElementById('book-form-status');
    if (el) el.style.display = 'none';
}
window.showBookFormStatus = showBookFormStatus;
window.hideBookFormStatus = hideBookFormStatus;

function showAdminSuccessBanner(msg) {
    const existing = document.getElementById('admin-save-banner');
    if (existing) existing.remove();
    const banner = document.createElement('div');
    banner.id = 'admin-save-banner';
    banner.innerHTML = `<div style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
        <span style="font-size:17px; font-weight:700;">${escapeHtml(msg)}</span>
        <button onclick="document.getElementById('admin-save-banner').remove()" style="background:none; border:none; font-size:22px; cursor:pointer; color:#155724; line-height:1; padding:0;">×</button>
    </div>`;
    banner.style.cssText = `background: #d4edda; border: 2px solid #2d8a4e; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; color: #155724;`;
    const manageTab = document.getElementById('manage-books');
    if (manageTab) {
        const h2 = manageTab.querySelector('h2');
        const insertAfter = h2 ? h2.nextSibling : manageTab.firstChild;
        manageTab.insertBefore(banner, insertAfter);
        setTimeout(() => { if (banner.parentNode) banner.remove(); }, 8000);
    }
}
window.showAdminSuccessBanner = showAdminSuccessBanner;