// ===================================
// BOOKFEATHER - CHECKOUT.JS
// Оформлення замовлення: форма, доставка, збереження
// ===================================

// ===================================
// ІНІЦІАЛІЗАЦІЯ
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('checkout-form')) return;

    loadOrderSummary();
    setupDeliveryListeners();
    setupFormSubmit();
    fillUserData();
    setupAddressToggle();
});

// ===================================
// ПІДСУМОК ЗАМОВЛЕННЯ (права колонка)
// ===================================
function loadOrderSummary() {
    const cartData = JSON.parse(localStorage.getItem('cart')) || [];

    if (cartData.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    const container = document.getElementById('order-items');
    if (container) {
        container.innerHTML = cartData.map(item => createOrderItem(item)).join('');
    }

    recalcTotals();
    updateSelectedRadio();
}

// ===================================
// КАРТКА ТОВАРУ В ПІДСУМКУ
// ===================================
function createOrderItem(item) {
    const finalPrice = item.discount > 0
        ? (item.price * (1 - item.discount / 100))
        : item.price;
    const qty   = item.quantity || 1;
    const total = (finalPrice * qty).toFixed(0);

    const imgSrc = item.image || item.image_url || 'https://via.placeholder.com/50x68?text=📚';

    return `
        <div style="display:flex; gap:12px; align-items:center; padding:12px 0; border-bottom:1px solid #f0e8d8;">
            <img src="${imgSrc}" alt="${item.title}"
                 style="width:50px; height:68px; object-fit:cover; border-radius:6px; flex-shrink:0;"
                 onerror="this.src='https://via.placeholder.com/50x68?text=📚'">
            <div style="flex:1; min-width:0;">
                <div style="font-weight:600; font-size:14px; margin-bottom:3px;
                            white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
                <div style="font-size:13px; color:var(--cinereous);">${item.author}</div>
                <div style="font-size:13px; color:var(--cinereous); margin-top:2px;">${qty} шт × ${finalPrice.toFixed(0)} грн</div>
            </div>
            <div style="font-weight:700; color:var(--blood-red); font-size:16px; flex-shrink:0;">
                ${total} грн
            </div>
        </div>
    `;
}

// ===================================
// ПЕРЕРАХУНОК СУММ
// ===================================
function recalcTotals() {
    const cartData = JSON.parse(localStorage.getItem('cart')) || [];

    let subtotal = 0;
    cartData.forEach(item => {
        const price = parseFloat(item.discount) > 0
            ? (parseFloat(item.price) * (1 - parseFloat(item.discount) / 100))
            : parseFloat(item.price) || 0;
        subtotal += price * (parseInt(item.quantity) || 1);
    });

    const delivery = calcDeliveryCost(subtotal);
    const total    = subtotal + delivery;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('items-total',   `${subtotal.toFixed(0)} грн`);
    set('delivery-cost', delivery === 0 ? 'Безкоштовно' : `${delivery} грн`);
    set('final-total',   `${total.toFixed(0)} грн`);

    // Підказка
    const hint = document.getElementById('free-delivery-hint');
    if (hint) {
        if (delivery > 0 && subtotal < 899) {
            hint.innerHTML = `<small style="color:var(--cinereous);">Ще <strong>${(899 - subtotal).toFixed(0)} грн</strong> — і доставка безкоштовна</small>`;
        } else if (delivery === 0) {
            hint.innerHTML = `<small style="color:#2d8a4e;">✅ У вас безкоштовна доставка!</small>`;
        }
    }
}

// ===================================
// ВАРТІСТЬ ДОСТАВКИ
// ===================================
function calcDeliveryCost(subtotal) {
    const method = document.querySelector('input[name="delivery"]:checked')?.value || 'np-warehouse';

    const thresholds = {
        'np-warehouse': { free: 899,  price: 50 },
        'np-courier':   { free: 800,  price: 80 },
        'ukrposhta':    { free: 9999, price: 35 },
    };

    const cfg = thresholds[method] || thresholds['np-warehouse'];
    return subtotal >= cfg.free ? 0 : cfg.price;
}

// ===================================
// СЛУХАЧІ ДОСТАВКИ
// ===================================
function setupDeliveryListeners() {
    document.querySelectorAll('input[name="delivery"]').forEach(radio => {
        radio.addEventListener('change', () => {
            updateDeliveryCost();
            updateSelectedRadio();
        });
    });

    document.querySelectorAll('.radio-option').forEach(option => {
        option.addEventListener('click', () => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio) { radio.checked = true; updateDeliveryCost(); updateSelectedRadio(); }
        });
    });
}

function updateSelectedRadio() {
    document.querySelectorAll('.radio-option').forEach(opt => {
        const radio = opt.querySelector('input[type="radio"]');
        opt.classList.toggle('selected', radio?.checked);
    });
}

function updateDeliveryCost() {
    recalcTotals();
}

// ===================================
// ПЕРЕКЛЮЧЕННЯ ВИДИМОСТІ АДРЕСИ
// ===================================
function setupAddressToggle() {
    // Якщо вибрали "кур'єр" — показуємо поле вулиці
    document.querySelectorAll('input[name="delivery"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const courierFields = document.getElementById('courier-fields');
            if (courierFields) {
                courierFields.style.display = radio.value === 'np-courier' ? 'block' : 'none';
            }
        });
    });
}

// ===================================
// ЗАПОВНЕННЯ ДАНИХ КОРИСТУВАЧА
// ===================================
function fillUserData() {
    const user = getCurrentUser();
    if (!user) return;

    const form = document.getElementById('checkout-form');
    if (!form) return;

    const set = (name, val) => {
        const el = form.elements[name];
        if (el && val) el.value = val;
    };

    set('name',  `${user.name || ''} ${user.surname || ''}`.trim());
    set('phone', user.phone);
    set('email', user.email);

    // Остання збережена адреса
    if (user.addresses?.length > 0) {
        const last = user.addresses[user.addresses.length - 1];
        set('city',      last.city);
        set('warehouse', last.warehouse);
    }
}

// ===================================
// ВІДПРАВКА ФОРМИ
// ===================================
function setupFormSubmit() {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    // Телефон — авто +380
    const phoneInput = form.elements['phone'];
    if (phoneInput) {
        phoneInput.addEventListener('focus', () => {
            if (!phoneInput.value) phoneInput.value = '+380';
        });
        phoneInput.addEventListener('input', () => {
            if (!phoneInput.value.startsWith('+380')) {
                const digits = phoneInput.value.replace(/\D/g, '');
                if (digits.startsWith('380')) phoneInput.value = '+' + digits;
                else if (digits.startsWith('0')) phoneInput.value = '+38' + digits;
                else phoneInput.value = '+380' + digits;
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Валідація
        const name  = form.elements['name']?.value?.trim();
        const phone = form.elements['phone']?.value?.trim();
        const city  = form.elements['city']?.value?.trim();

        if (!name) {
            showNotification("Введіть ваше ім'я", 'error');
            form.elements['name']?.focus();
            return;
        }
        if (!phone || phone.length < 13) {
            showNotification('Введіть коректний номер телефону', 'error');
            form.elements['phone']?.focus();
            return;
        }
        if (!city) {
            showNotification('Введіть місто доставки', 'error');
            form.elements['city']?.focus();
            return;
        }

        const btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Оформлюємо...'; }

        try {
            const order = buildOrder(form);
            await saveOrder(order);
            await updateStock(order.items);

            if (order.userId) addOrderToUser(order.userId, order);

            // Очищаємо кошик
            localStorage.removeItem('cart');
            cart = [];
            updateCartCount();

            showNotification(`✅ Замовлення #${order.orderNumber} оформлено!`);

            setTimeout(() => {
                window.location.href = `order-success.html?id=${order.id}&num=${order.orderNumber}`;
            }, 1200);

        } catch (err) {
            console.error(err);
            showNotification('Помилка оформлення. Спробуйте ще раз.', 'error');
            if (btn) { btn.disabled = false; btn.textContent = 'Оформити замовлення'; }
        }
    });
}

// ===================================
// ФОРМУВАННЯ ОБ'ЄКТУ ЗАМОВЛЕННЯ
// ===================================
function buildOrder(form) {
    const fd      = new FormData(form);
    const cartData = JSON.parse(localStorage.getItem('cart')) || [];
    const user    = getCurrentUser();

    let subtotal = 0;
    cartData.forEach(item => {
        const p = parseFloat(item.discount) > 0 ? parseFloat(item.price) * (1 - parseFloat(item.discount) / 100) : parseFloat(item.price) || 0;
        subtotal += p * (parseInt(item.quantity) || 1);
    });

    const deliveryCost = calcDeliveryCost(subtotal);

    return {
        id:          Date.now(),
        orderNumber: `BF-${Date.now().toString().slice(-8)}`,
        date:        new Date().toISOString(),

        customer: {
            name:  fd.get('name'),
            phone: fd.get('phone'),
            email: fd.get('email'),
        },

        delivery: {
            method:    fd.get('delivery'),
            city:      fd.get('city'),
            warehouse: fd.get('warehouse'),
            address:   fd.get('courier-address') || '',
        },

        payment: fd.get('payment'),
        comment: fd.get('comment') || '',

        items: cartData.map(item => ({
            id:       item.id,
            title:    item.title,
            author:   item.author,
            price:    item.price,
            discount: item.discount || 0,
            quantity: item.quantity || 1,
            image:    item.image || item.image_url || '',
        })),

        subtotal,
        deliveryCost,
        total: subtotal + deliveryCost,

        // processing → confirmed → shipped → delivered → cancelled
        status: 'processing',
        trackingNumber: null,

        userId: user ? user.id : null,
    };
}

// ===================================
// ЗБЕРЕЖЕННЯ ЗАМОВЛЕННЯ
// ===================================
async function saveOrder(order) {
    const all = JSON.parse(localStorage.getItem('allOrders') || '[]');
    all.push(order);
    localStorage.setItem('allOrders', JSON.stringify(all));

    // Спроба відправити на сервер
    try {
        await fetch('php/api.php?action=orders', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(order),
        });
    } catch { /* сервер недоступний — не страшно */ }

    return order;
}

// ===================================
// ОНОВЛЕННЯ СКЛАДУ
// ===================================
async function updateStock(items) {
    await loadBooks();

    items.forEach(orderItem => {
        const book = books.find(b => b.id === orderItem.id);
        if (!book) return;

        book.stock    = Math.max(0, (book.stock    || 0) - orderItem.quantity);
        book.reserved = Math.max(0, (book.reserved || 0) - orderItem.quantity);
    });

    localStorage.setItem('books', JSON.stringify(books));
    clearSearchCache?.();
}

// ===================================
// ДОДАВАННЯ ЗАМОВЛЕННЯ ДО ПРОФІЛЮ
// ===================================
function addOrderToUser(userId, order) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const idx   = users.findIndex(u => u.id === userId);
    if (idx === -1) return;

    if (!users[idx].orders) users[idx].orders = [];
    users[idx].orders.unshift(order); // нові зверху
    localStorage.setItem('users', JSON.stringify(users));

    // Оновлюємо currentUser
    const storage = localStorage.getItem('currentUser') ? localStorage : sessionStorage;
    storage.setItem('currentUser', JSON.stringify(users[idx]));
}

// ===================================
// ЕКСПОРТ
// ===================================
window.updateDeliveryCost = updateDeliveryCost;
window.loadOrderSummary   = loadOrderSummary;