let filteredBooks = [];
let currentFilters = {
    search: '',
    author: '',
    publisher: '',
    category: '',
    priceMin: 0,
    priceMax: Infinity,
    sort: 'popularity'
};

async function loadCatalog() {
    await loadBooks();
    
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFromUrl = urlParams.get('category');
    const authorFromUrl = urlParams.get('author');
    const publisherFromUrl = urlParams.get('publisher');
    
    if (categoryFromUrl) {
        document.getElementById('category-filter').value = categoryFromUrl;
        currentFilters.category = categoryFromUrl;
    }
    
    if (authorFromUrl) {
        document.getElementById('author-filter').value = decodeURIComponent(authorFromUrl);
        currentFilters.author = decodeURIComponent(authorFromUrl);
    }
    
    if (publisherFromUrl) {
        document.getElementById('publisher-filter').value = decodeURIComponent(publisherFromUrl);
        currentFilters.publisher = decodeURIComponent(publisherFromUrl);
    }
    
    applyFilters();
}

function applyFilters() {
    filteredBooks = books.filter(book => {
        const searchMatch = !currentFilters.search || 
            book.title.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
            book.author.toLowerCase().includes(currentFilters.search.toLowerCase());
        
        const authorMatch = !currentFilters.author || 
            book.author.toLowerCase().includes(currentFilters.author.toLowerCase());
        
        const publisherMatch = !currentFilters.publisher || 
            (book.publisher && book.publisher.toLowerCase().includes(currentFilters.publisher.toLowerCase()));
        
        const categoryMatch = !currentFilters.category || book.category === currentFilters.category;
        
        const priceMatch = book.price >= currentFilters.priceMin && 
                          book.price <= currentFilters.priceMax;
        
        return searchMatch && authorMatch && publisherMatch && categoryMatch && priceMatch;
    });
    
    sortBooks();
    displayCatalog();
}

function sortBooks() {
    switch(currentFilters.sort) {
        case 'popularity':
            filteredBooks.sort((a, b) => (b.isTop ? 1 : 0) - (a.isTop ? 1 : 0));
            break;
        case 'newest':
            filteredBooks.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
            break;
        case 'price-asc':
            filteredBooks.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredBooks.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            filteredBooks.sort((a, b) => b.rating - a.rating);
            break;
    }
}

function displayCatalog() {
    const container = document.getElementById('catalog-books');
    const emptyState = document.getElementById('empty-state');
    const resultsCount = document.getElementById('results-count');
    
    resultsCount.textContent = filteredBooks.length;
    
    if (filteredBooks.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    container.innerHTML = filteredBooks.map(book => createBookCard(book)).join('');
    attachBookCardListeners();
}

function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('author-filter').value = '';
    document.getElementById('publisher-filter').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('sort-filter').value = 'popularity';
    document.getElementById('price-min').value = '';
    document.getElementById('price-max').value = '';
    
    currentFilters = {
        search: '',
        author: '',
        publisher: '',
        category: '',
        priceMin: 0,
        priceMax: Infinity,
        sort: 'popularity'
    };
    
    applyFilters();
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('catalog-books')) return;
    
    loadCatalog();
    
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    searchBtn.addEventListener('click', () => {
        currentFilters.search = searchInput.value;
        applyFilters();
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentFilters.search = searchInput.value;
            applyFilters();
        }
    });
    
    document.getElementById('apply-filters').addEventListener('click', () => {
        currentFilters.author = document.getElementById('author-filter').value;
        currentFilters.publisher = document.getElementById('publisher-filter').value;
        currentFilters.category = document.getElementById('category-filter').value;
        currentFilters.sort = document.getElementById('sort-filter').value;
        
        const priceMin = document.getElementById('price-min').value;
        const priceMax = document.getElementById('price-max').value;
        
        currentFilters.priceMin = priceMin ? parseFloat(priceMin) : 0;
        currentFilters.priceMax = priceMax ? parseFloat(priceMax) : Infinity;
        
        applyFilters();
    });
    
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
    
    document.getElementById('category-filter').addEventListener('change', () => {
        currentFilters.category = document.getElementById('category-filter').value;
        applyFilters();
    });
    
    document.getElementById('sort-filter').addEventListener('change', () => {
        currentFilters.sort = document.getElementById('sort-filter').value;
        applyFilters();
    });
});