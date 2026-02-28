// ====== CHECKOUT.JS - ОФОРМЛЕННЯ ЗАМОВЛЕННЯ ======
// Цей файл відповідає за повноцінне оформлення замовлення з збереженням в БД/localStorage

// ====== ІНІЦІАЛІЗАЦІЯ ======
document.addEventListener('DOMContentLoaded', () => {
    loadOrderSummary();
    setupDeliveryListeners();
    setupFormSubmit();
    fillUserData();
});

// ====== ЗАВАНТАЖЕННЯ ПІДСУМКУ ЗАМОВЛЕННЯ ======
function loadOrderSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemsContainer = document.getElementById('order-items');
    const itemsTotal = document.getElementById('items-total');
    const deliveryCost = document.getElementById('delivery-cost');
    const finalTotal = document.getElementById('final-total');
    
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    
    // Відображення товарів
    itemsContainer.innerHTML = cart.map(item => createOrderItem(item)).join('');
    
    // Підрахунок сум
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = calculateDeliveryCost(subtotal);
    const total = subtotal + delivery;
    
    itemsTotal.textContent = `${subtotal} грн`;
    deliveryCost.textContent = `${delivery} грн`;
    finalTotal.textContent = `${total} грн`;
}

// ====== СТВОРЕННЯ ЕЛЕМЕНТУ ТОВАРУ ======
function createOrderItem(item) {
    return `
        <div class="summary-item">
            <img src="${item.image}" alt="${item.title}">
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 5px;">${item.title}</div>
                <div style="font-size: 14px; color: var(--cinereous);">${item.author}</div>
                <div style="margin-top: 5px;">
                    <span style="font-size: 14px; color: var(--cinereous);">Кількість:</span>
                    <span style="font-weight: 600;">${item.quantity} шт</span>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 700; color: var(--blood-red); font-size: 18px;">
                    ${item.price * item.quantity} грн
                </div>
            </div>
        </div>
    `;
}

// ====== РОЗРАХУНОК ВАРТОСТІ ДОСТАВКИ ======
function calculateDeliveryCost(subtotal) {
    const deliveryMethod = document.querySelector('input[name="delivery"]:checked')?.value || 'novaposhta-warehouse';
    
    const costs = {
        'novaposhta-warehouse': subtotal >= 500 ? 0 : 50,
        'novaposhta-courier': subtotal >= 800 ? 0 : 80,
        'ukrposhta': 35
    };
    
    return costs[deliveryMethod] || 50;
}

// ====== ОНОВЛЕННЯ ВАРТОСТІ ДОСТАВКИ ======
function updateDeliveryCost() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = calculateDeliveryCost(subtotal);
    const total = subtotal + delivery;
    
    document.getElementById('delivery-cost').textContent = `${delivery} грн`;
    document.getElementById('final-total').textContent = `${total} грн`;
    
    // Оновлення активного стану radio
    document.querySelectorAll('.radio-option').forEach(option => {
        const radio = option.querySelector('input[type="radio"]');
        if (radio.checked) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

// ====== НАЛАШТУВАННЯ СЛУХАЧІВ ДОСТАВКИ ======
function setupDeliveryListeners() {
    document.querySelectorAll('input[name="delivery"]').forEach(radio => {
        radio.addEventListener('change', updateDeliveryCost);
    });
    
    // Клік по всьому radio-option
    document.querySelectorAll('.radio-option').forEach(option => {
        option.addEventListener('click', () => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                updateDeliveryCost();
            }
        });
    });
}

// ====== ЗАПОВНЕННЯ ДАНИХ КОРИСТУВАЧА ======
function fillUserData() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const form = document.getElementById('checkout-form');
    if (form) {
        form.elements['name'].value = `${currentUser.name} ${currentUser.surname}`;
        form.elements['phone'].value = currentUser.phone || '';
        form.elements['email'].value = currentUser.email || '';
        
        // Якщо є збережена адреса
        if (currentUser.addresses && currentUser.addresses.length > 0) {
            const lastAddress = currentUser.addresses[currentUser.addresses.length - 1];
            form.elements['city'].value = lastAddress.city || '';
            form.elements['warehouse'].value = lastAddress.warehouse || '';
        }
    }
}

// ====== ОТРИМАННЯ ПОТОЧНОГО КОРИСТУВАЧА ======
function getCurrentUser() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || 'null');
    return currentUser;
}

// ====== НАЛАШТУВАННЯ ВІДПРАВКИ ФОРМИ ======
function setupFormSubmit() {
    const form = document.getElementById('checkout-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const currentUser = getCurrentUser();
        
        // Створення об'єкту замовлення
        const order = {
            id: Date.now(),
            orderNumber: `BF-${Date.now().toString().slice(-8)}`,
            date: new Date().toISOString(),
            
            // Контактні дані
            customer: {
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email')
            },
            
            // Доставка
            delivery: {
                method: formData.get('delivery'),
                city: formData.get('city'),
                warehouse: formData.get('warehouse')
            },
            
            // Оплата
            payment: formData.get('payment'),
            
            // Коментар
            comment: formData.get('comment') || '',
            
            // Товари
            items: cart.map(item => ({
                id: item.id,
                title: item.title,
                author: item.author,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            })),
            
            // Суми
            subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            deliveryCost: calculateDeliveryCost(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)),
            total: 0, // буде розраховано нижче
            
            // Статус
            status: 'processing', // processing, confirmed, shipped, delivered, cancelled
            
            // ID користувача (якщо залогінений)
            userId: currentUser ? currentUser.id : null
        };
        
        order.total = order.subtotal + order.deliveryCost;
        
        try {
            // Збереження замовлення
            await saveOrder(order);
            
            // Оновлення складу
            await updateStock(cart);
            
            // Очищення кошика
            localStorage.removeItem('cart');
            updateCartCount();
            
            // Додавання до профілю користувача
            if (currentUser) {
                addOrderToUser(currentUser.id, order);
            }
            
            // Показ повідомлення
            showNotification(`Замовлення #${order.orderNumber} успішно оформлено!`);
            
            // Перенаправлення
            setTimeout(() => {
                window.location.href = `order-success.html?id=${order.id}`;
            }, 1500);
            
        } catch (error) {
            console.error('Помилка оформлення замовлення:', error);
            showNotification('Помилка оформлення замовлення. Спробуйте ще раз.', 'error');
        }
    });
}

// ====== ЗБЕРЕЖЕННЯ ЗАМОВЛЕННЯ ======
async function saveOrder(order) {
    // Збереження в localStorage
    let allOrders = JSON.parse(localStorage.getItem('allOrders')) || [];
    allOrders.push(order);
    localStorage.setItem('allOrders', JSON.stringify(allOrders));
    
    // TODO: Відправка на сервер (коли буде PHP API)
    // await fetch('/api/orders', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(order)
    // });
    
    return order;
}

// ====== ОНОВЛЕННЯ СКЛАДУ ======
async function updateStock(cartItems) {
    await loadBooks();
    
    cartItems.forEach(cartItem => {
        const book = books.find(b => b.id === cartItem.id);
        if (book) {
            // Зменшуємо кількість на складі
            book.stock = (book.stock || 0) - cartItem.quantity;
            
            // Зменшуємо зарезервовану кількість
            book.reserved = (book.reserved || 0) - cartItem.quantity;
            
            // Не допускаємо негативних значень
            if (book.stock < 0) book.stock = 0;
            if (book.reserved < 0) book.reserved = 0;
        }
    });
    
    // Збереження оновлених даних
    localStorage.setItem('books', JSON.stringify(books));
    
    // TODO: Оновлення на сервері
    // await fetch('/api/books/update-stock', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(cartItems)
    // });
}

// ====== ДОДАВАННЯ ЗАМОВЛЕННЯ ДО КОРИСТУВАЧА ======
function addOrderToUser(userId, order) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        if (!users[userIndex].orders) {
            users[userIndex].orders = [];
        }
        users[userIndex].orders.push(order);
        
        // Збереження
        localStorage.setItem('users', JSON.stringify(users));
        
        // Оновлення currentUser
        const storageType = localStorage.getItem('currentUser') ? localStorage : sessionStorage;
        storageType.setItem('currentUser', JSON.stringify(users[userIndex]));
    }
}

// ====== ЕКСПОРТ ФУНКЦІЙ ======
window.updateDeliveryCost = updateDeliveryCost;
window.loadOrderSummary = loadOrderSummary;