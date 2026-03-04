// ===================================
// BOOKFEATHER - CART.JS
// Кошик: відображення, кількість, видалення, підсумок
// ===================================

// ===================================
// ІНІЦІАЛІЗАЦІЯ
// ===================================
document.addEventListener('DOMContentLoaded', async () => {
    if (!document.getElementById('cart-items')) return;

    await loadBooks();
    displayCart();

    document.getElementById('clear-cart')?.addEventListener('click', clearCart);
    document.getElementById('checkout-btn')?.addEventListener('click', () => {
        window.location.href = 'checkout.html';
    });
});

// ===================================
// ВІДОБРАЖЕННЯ КОШИКА
// ===================================
function displayCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCart          = document.getElementById('empty-cart');
    const cartSummary        = document.getElementById('cart-summary');

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.style.display = 'none';
        if (emptyCart)   { emptyCart.style.display = 'flex'; emptyCart.style.flexDirection = 'column'; emptyCart.style.alignItems = 'center'; }
        if (cartSummary) cartSummary.style.display = 'none';
        return;
    }

    if (emptyCart)   emptyCart.style.display   = 'none';
    if (cartSummary) cartSummary.style.display = 'block';
    cartItemsContainer.style.display = 'block';

    cartItemsContainer.innerHTML = cart.map(item => createCartItem(item)).join('');
    updateCartSummary();
    attachCartListeners();
}

// ===================================
// КАРТКА ТОВАРУ В КОШИКУ
// ===================================
function createCartItem(item) {
    const finalPrice = item.discount > 0
        ? (item.price * (1 - item.discount / 100))
        : item.price;

    const priceHtml = item.discount > 0 ? `
        <div class="cart-item-price">
            <span style="text-decoration:line-through; font-size:15px; color:var(--cinereous);">${item.price} грн</span>
            <span style="color:var(--blood-red); font-size:20px; font-weight:700; margin-left:8px;">${finalPrice.toFixed(0)} грн</span>
            <span style="color:var(--blood-red); font-size:13px; margin-left:6px;">(-${item.discount}%)</span>
        </div>
    ` : `
        <div class="cart-item-price">${item.price} грн</div>
    `;

    const imgSrc = item.image || item.image_url || 'https://via.placeholder.com/90x120?text=📚';

    return `
        <div class="cart-item" data-book-id="${item.id}">
            <img src="${imgSrc}"
                 alt="${item.title}"
                 class="cart-item-image"
                 onerror="this.src='https://via.placeholder.com/90x120?text=📚'">

            <div class="cart-item-info">
                <h3 class="cart-item-title">${item.title}</h3>
                <p class="cart-item-author">${item.author}</p>
                ${priceHtml}

                <!-- Кількість -->
                <div class="cart-item-qty" style="display:flex; align-items:center; gap:10px; margin-top:10px;">
                    <button class="qty-btn qty-minus" data-id="${item.id}"
                        style="width:32px; height:32px; border:2px solid #ddd; background:white;
                               border-radius:50%; font-size:18px; cursor:pointer; display:flex;
                               align-items:center; justify-content:center; transition:all 0.2s;"
                        onmouseover="this.style.borderColor='var(--blood-red)'; this.style.color='var(--blood-red)'"
                        onmouseout="this.style.borderColor='#ddd'; this.style.color='inherit'">−</button>

                    <span style="font-size:18px; font-weight:600; min-width:24px; text-align:center;">
                        ${item.quantity || 1}
                    </span>

                    <button class="qty-btn qty-plus" data-id="${item.id}"
                        style="width:32px; height:32px; border:2px solid #ddd; background:white;
                               border-radius:50%; font-size:18px; cursor:pointer; display:flex;
                               align-items:center; justify-content:center; transition:all 0.2s;"
                        onmouseover="this.style.borderColor='var(--blood-red)'; this.style.color='var(--blood-red)'"
                        onmouseout="this.style.borderColor='#ddd'; this.style.color='inherit'">+</button>

                    <span style="font-size:14px; color:var(--cinereous);">
                        = <strong style="color:var(--black-bean);">
                            ${(finalPrice * (item.quantity || 1)).toFixed(0)} грн
                        </strong>
                    </span>
                </div>
            </div>

            <button class="cart-item-remove" data-id="${item.id}"
                    onclick="event.stopPropagation(); removeFromCart(${item.id})">
                ✕ Видалити
            </button>
        </div>
    `;
}

// ===================================
// ПІДСУМОК КОШИКА
// ===================================
function updateCartSummary() {
    let subtotal = 0;
    let totalQty = 0;

    cart.forEach(item => {
        const finalPrice = item.discount > 0
            ? (item.price * (1 - item.discount / 100))
            : item.price;
        subtotal += finalPrice * (item.quantity || 1);
        totalQty += (item.quantity || 1);
    });

    const delivery = subtotal >= 500 ? 0 : 50;
    const total    = subtotal + delivery;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('items-count', `${totalQty} шт (${cart.length} назв)`);
    set('subtotal',    `${subtotal.toFixed(0)} грн`);
    set('delivery',    delivery === 0 ? 'Безкоштовно 🎉' : `${delivery} грн`);
    set('total',       `${total.toFixed(0)} грн`);

    // Підказка про безкоштовну доставку
    const hint = document.getElementById('delivery-hint');
    if (hint) {
        if (delivery > 0) {
            const diff = (500 - subtotal).toFixed(0);
            hint.innerHTML = `<small style="color:var(--cinereous);">До безкоштовної доставки ще <strong>${diff} грн</strong></small>`;
        } else {
            hint.innerHTML = `<small style="color:#2d8a4e; font-weight:600;">✅ Безкоштовна доставка</small>`;
        }
    }
}

// ===================================
// СЛУХАЧІ КОШИКА
// ===================================
function attachCartListeners() {
    // Клік на картку → сторінка книги
    document.querySelectorAll('.cart-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.cart-item-remove') ||
                e.target.closest('.qty-btn')) return;
            window.location.href = `book.html?id=${item.dataset.bookId}`;
        });
    });

    // Кнопки кількості
    document.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            changeQty(parseInt(btn.dataset.id), 1);
        });
    });

    document.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            changeQty(parseInt(btn.dataset.id), -1);
        });
    });
}

// ===================================
// ЗМІНА КІЛЬКОСТІ
// ===================================
function changeQty(bookId, delta) {
    const idx = cart.findIndex(item => item.id === bookId);
    if (idx === -1) return;

    const book = books.find(b => b.id === bookId);
    const availableStock = book ? ((book.stock || 0) - (book.reserved || 0)) : 999;

    const newQty = (cart[idx].quantity || 1) + delta;

    if (newQty <= 0) {
        removeFromCart(bookId);
        return;
    }

    if (newQty > availableStock) {
        showNotification(`На складі лише ${availableStock} шт`, 'error');
        return;
    }

    cart[idx].quantity = newQty;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    displayCart();
}

// ===================================
// ВИДАЛЕННЯ З КОШИКА
// ===================================
function removeFromCart(bookId) {
    const item = cart.find(i => i.id === bookId);
    if (!item) return;

    cart = cart.filter(i => i.id !== bookId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    displayCart();
    showNotification(`"${item.title}" видалено з кошика`);
}

// ===================================
// ОЧИСТИТИ КОШИК
// ===================================
function clearCart() {
    if (cart.length === 0) return;
    if (!confirm('Очистити весь кошик?')) return;

    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    displayCart();
    showNotification('Кошик очищено');
}