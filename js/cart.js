function displayCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    const cartSummary = document.getElementById('cart-summary');
    
    if (cart.length === 0) {
        cartItemsContainer.style.display = 'none';
        emptyCart.style.display = 'flex';
        emptyCart.style.flexDirection = 'column';
        emptyCart.style.justifyContent = 'center';
        emptyCart.style.alignItems = 'center';
        cartSummary.style.display = 'none';
        return;
    }
    
    emptyCart.style.display = 'none';
    cartSummary.style.display = 'block';
    cartItemsContainer.style.display = 'block';
    
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
            <button class="cart-item-remove" data-id="${item.id}" onclick="event.stopPropagation(); removeFromCart(${item.id})">Видалити</button>
        </div>
    `}).join('');
    
    updateCartSummary();
    attachCartListeners();
}

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

function removeFromCart(bookId) {
    const index = cart.findIndex(item => item.id === bookId);
    if (index > -1) {
        const book = cart[index];
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        displayCart();
        showNotification('Книгу видалено з кошика');
    }
}

function clearCart() {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    displayCart();
    showNotification('Кошик очищено');
}

function checkout() {
    if (cart.length === 0) {
        showNotification('Ваш кошик порожній!');
        return;
    }
    
    showNotification('Дякуємо за замовлення! Наш менеджер зв\'яжеться з вами найближчим часом.');
    
    setTimeout(() => {
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        displayCart();
    }, 2000);
}

function attachCartListeners() {
    document.querySelectorAll('.cart-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('cart-item-remove')) {
                const bookId = parseInt(item.dataset.bookId);
                window.location.href = `book.html?id=${bookId}`;
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('cart-items')) return;
    
    displayCart();
    
    const clearCartBtn = document.getElementById('clear-cart');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
});