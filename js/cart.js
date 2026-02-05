// ====== ВІДОБРАЖЕННЯ КОШИКА ======
function displayCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    const cartSummary = document.getElementById('cart-summary');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '';
        emptyCart.style.display = 'flex';
        emptyCart.style.flexDirection = 'column';
        emptyCart.style.justifyContent = 'center';
        emptyCart.style.alignItems = 'center';
        cartSummary.style.display = 'none';
        return;
    }
    
    emptyCart.style.display = 'none';
    cartSummary.style.display = 'block';
    
    cartItemsContainer.innerHTML = cart.map(item => {
        const finalPrice = item.discount > 0 ? (item.price * (1 - item.discount / 100)).toFixed(2) : item.price;
        const priceHtml = item.discount > 0 
            ? `<p class="cart-item-price"><span style="text-decoration: line-through; font-size: 18px; color: #947268;">${item.price} грн</span> ${finalPrice} грн</p>`
            : `<p class="cart-item-price">${item.price} грн</p>`;
        
        return `
        <div class="cart-item" data-book-id="${item.id}">
            <img src="${item.image}" alt="${item.title}" class="cart-item-image">
            <div class="cart-item-info">
                <h3 class="cart-item-title">${item.title}</h3>
                <p class="cart-item-author">${item.author}</p>
                ${priceHtml}
            </div>
            <button class="cart-item-remove" data-id="${item.id}" onclick="event.stopPropagation()">Видалити</button>
        </div>
    `}).join('');
    
    // Підсумок
    updateCartSummary();
    
    // Обробники
    attachCartListeners();
}

// ====== ОНОВЛЕННЯ ПІДСУМКУ ======
function updateCartSummary() {
    const itemsCount = cart.length;
    let subtotal = 0;
    
    cart.forEach(item => {
        const finalPrice = item.discount > 0 ? (item.price * (1 - item.discount / 100)) : item.price;
        subtotal += finalPrice;
    });
    
    const delivery = subtotal >= 500 ? 0 : 50;
    const total = subtotal + delivery;
    
    document.getElementById('items-count').textContent = itemsCount;
    document.getElementById('subtotal').textContent = `${subtotal.toFixed(2)} грн`;
    document.getElementById('delivery').textContent = delivery === 0 ? 'Безкоштовно' : `${delivery} грн`;
    document.getElementById('total').textContent = `${total.toFixed(2)} грн`;
}

// ====== ВИДАЛЕННЯ З КОШИКА ======
function removeFromCart(bookId) {
    const index = cart.findIndex(item => item.id === bookId);
    if (index > -1) {
        const book = cart[index];
        if (confirm(`Видалити "${book.title}" з кошика?`)) {
            cart.splice(index, 1);
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            displayCart();
            showNotification('Книгу видалено з кошика');
        }
    }
}

// ====== ОЧИЩЕННЯ КОШИКА ======
function clearCart() {
    if (confirm('Ви впевнені, що хочете очистити кошик?')) {
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        displayCart();
        showNotification('Кошик очищено');
    }
}

// ====== ОФОРМЛЕННЯ ЗАМОВЛЕННЯ ======
function checkout() {
    if (cart.length === 0) {
        showNotification('Ваш кошик порожній!');
        return;
    }
    
    // Тут має бути перенаправлення на сторінку оформлення або форму
    showNotification('Дякуємо за замовлення! Наш менеджер зв\'яжеться з вами найближчим часом.');
    
    // Очищаємо кошик після замовлення
    setTimeout(() => {
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        displayCart();
    }, 2000);
}

// ====== ОБРОБНИКИ ПОДІЙ ======
function attachCartListeners() {
    // Видалення товару
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const bookId = parseInt(e.target.dataset.id);
            removeFromCart(bookId);
        });
    });
    
    // Клік на товар для перегляду деталей
    document.querySelectorAll('.cart-item').forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('cart-item-remove')) {
                const bookId = parseInt(item.dataset.bookId);
                window.location.href = `book.html?id=${bookId}`;
            }
        });
    });
}

// ====== ІНІЦІАЛІЗАЦІЯ ======
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('cart-items')) return;
    
    displayCart();
    
    // Очищення кошика
    const clearCartBtn = document.getElementById('clear-cart');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
    
    // Оформлення замовлення
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
});