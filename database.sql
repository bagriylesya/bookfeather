-- ===================================
-- BOOKFEATHER DATABASE
-- Повна структура бази даних
-- ===================================

-- Видалити базу якщо існує (ОБЕРЕЖНО!)
-- DROP DATABASE IF EXISTS bookfeather;

-- Створити базу даних
CREATE DATABASE IF NOT EXISTS bookfeather 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Використовувати базу
USE bookfeather;

-- ===================================
-- ТАБЛИЦЯ: books (Книги)
-- ===================================
CREATE TABLE IF NOT EXISTS books (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    original_title VARCHAR(255) NULL,
    publisher VARCHAR(255) NULL,
    category VARCHAR(100) NOT NULL,
    categories TEXT NULL COMMENT 'JSON масив додаткових категорій',
    language VARCHAR(50) DEFAULT 'Українська',
    price DECIMAL(10,2) NOT NULL,
    discount INT DEFAULT 0 COMMENT 'Відсоток знижки 0-100',
    rating DECIMAL(3,2) DEFAULT 0 COMMENT 'Рейтинг 0-10',
    rating_count INT DEFAULT 0 COMMENT 'Кількість оцінок',
    pages INT NULL,
    year INT NULL,
    cover VARCHAR(50) NULL COMMENT 'Тверда/М\'яка',
    translator VARCHAR(255) NULL,
    isbn VARCHAR(50) NULL,
    barcode VARCHAR(50) NULL,
    size VARCHAR(50) NULL COMMENT 'Розмір в мм',
    weight INT NULL COMMENT 'Вага в грамах',
    illustrations VARCHAR(255) NULL,
    image_url TEXT NULL COMMENT 'Головне фото',
    images TEXT NULL COMMENT 'JSON масив всіх фото',
    short_description TEXT NULL,
    description TEXT NULL,
    is_new BOOLEAN DEFAULT FALSE,
    is_top BOOLEAN DEFAULT FALSE,
    stock INT DEFAULT 0 COMMENT 'Кількість на складі',
    reserved INT DEFAULT 0 COMMENT 'Зарезервовано в кошиках',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_stock (stock),
    INDEX idx_price (price),
    INDEX idx_rating (rating),
    FULLTEXT INDEX idx_search (title, author, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- ТАБЛИЦЯ: users (Користувачі)
-- ===================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NULL,
    password VARCHAR(255) NOT NULL,
    avatar TEXT NULL COMMENT 'Base64 або URL аватара',
    is_verified BOOLEAN DEFAULT FALSE COMMENT 'Email підтверджений',
    verification_code VARCHAR(10) NULL COMMENT 'Код підтвердження',
    newsletter BOOLEAN DEFAULT TRUE COMMENT 'Підписка на розсилку',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- ТАБЛИЦЯ: orders (Замовлення)
-- ===================================
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL COMMENT 'NULL якщо гість',
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Контакти
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Доставка
    delivery_method VARCHAR(50) NOT NULL COMMENT 'novaposhta-warehouse, novaposhta-courier, ukrposhta',
    delivery_city VARCHAR(100) NOT NULL,
    delivery_warehouse VARCHAR(255) NOT NULL,
    
    -- Оплата
    payment_method VARCHAR(50) NOT NULL COMMENT 'cash, card, online',
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    
    -- Коментар
    comment TEXT NULL,
    
    -- Суми
    subtotal DECIMAL(10,2) NOT NULL COMMENT 'Вартість товарів',
    delivery_cost DECIMAL(10,2) NOT NULL COMMENT 'Вартість доставки',
    total DECIMAL(10,2) NOT NULL COMMENT 'Загальна сума',
    
    -- Статус
    status ENUM('processing', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'processing',
    tracking_number VARCHAR(50) NULL COMMENT 'ТТН',
    
    -- Дати
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_email (customer_email),
    INDEX idx_phone (customer_phone),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- ТАБЛИЦЯ: order_items (Товари в замовленні)
-- ===================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    book_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL COMMENT 'Ціна на момент покупки',
    quantity INT DEFAULT 1,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_book (book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- ТАБЛИЦЯ: categories (Категорії)
-- ===================================
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    slug VARCHAR(100) UNIQUE NOT NULL COMMENT 'URL-friendly назва',
    name_uk VARCHAR(100) NOT NULL COMMENT 'Українська назва',
    name_en VARCHAR(100) NULL COMMENT 'Англійська назва',
    description TEXT NULL,
    icon VARCHAR(50) NULL COMMENT 'Emoji або клас іконки',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_active (is_active),
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Вставити базові категорії
INSERT INTO categories (slug, name_uk, icon, sort_order) VALUES
('fiction', 'Художня література', '📖', 1),
('detective', 'Детективи', '🔍', 2),
('fantasy', 'Фентезі', '🐉', 3),
('psychology', 'Психологія', '🧠', 4),
('business', 'Бізнес', '💼', 5),
('science', 'Наука', '🔬', 6),
('biography', 'Біографії', '👤', 7),
('history', 'Історія', '📜', 8);

-- ===================================
-- ТАБЛИЦЯ: stock_notifications (Повідомлення про наявність)
-- ===================================
CREATE TABLE IF NOT EXISTS stock_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    book_id INT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP NULL,
    
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_book (book_id),
    INDEX idx_notified (notified),
    UNIQUE KEY unique_notification (book_id, user_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- ТАБЛИЦЯ: discounts (Знижки)
-- ===================================
CREATE TABLE IF NOT EXISTS discounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    discount_percent INT NOT NULL COMMENT 'Відсоток знижки 1-90',
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_dates (start_date, end_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- ТАБЛИЦЯ: discount_books (Книги в знижках)
-- ===================================
CREATE TABLE IF NOT EXISTS discount_books (
    discount_id INT NOT NULL,
    book_id INT NOT NULL,
    PRIMARY KEY (discount_id, book_id),
    FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- ТАБЛИЦЯ: addresses (Збережені адреси)
-- ===================================
CREATE TABLE IF NOT EXISTS addresses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    city VARCHAR(100) NOT NULL,
    warehouse VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- ТАБЛИЦЯ: reviews (Відгуки) - на майбутнє
-- ===================================
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    book_id INT NOT NULL,
    user_id INT NULL,
    rating INT NOT NULL COMMENT 'Оцінка 1-10',
    comment TEXT NULL,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_book (book_id),
    INDEX idx_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- ТАБЛИЦЯ: admin_logs (Логи адміна)
-- ===================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action VARCHAR(100) NOT NULL COMMENT 'add_book, edit_book, delete_book, etc',
    details TEXT NULL COMMENT 'JSON з деталями',
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- ПРЕДСТАВЛЕННЯ (Views)
-- ===================================

-- Активні книги зі складом
CREATE OR REPLACE VIEW active_books AS
SELECT 
    b.*,
    (b.stock - COALESCE(b.reserved, 0)) as available_stock
FROM books b
WHERE b.stock > 0;

-- Популярні книги
CREATE OR REPLACE VIEW popular_books AS
SELECT 
    b.*,
    COUNT(DISTINCT oi.order_id) as order_count
FROM books b
LEFT JOIN order_items oi ON b.id = oi.book_id
GROUP BY b.id
ORDER BY order_count DESC;

-- ===================================
-- ТРИГЕРИ (Triggers)
-- ===================================

-- Автоматично генерувати номер замовлення
DELIMITER //
CREATE TRIGGER before_order_insert 
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        SET NEW.order_number = CONCAT('BF-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0'));
    END IF;
END//
DELIMITER ;

-- Оновлювати склад при створенні замовлення
DELIMITER //
CREATE TRIGGER after_order_item_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE books 
    SET reserved = reserved + NEW.quantity
    WHERE id = NEW.book_id;
END//
DELIMITER ;

-- Повертати склад при скасуванні замовлення
DELIMITER //
CREATE TRIGGER after_order_cancel
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        UPDATE books b
        INNER JOIN order_items oi ON b.id = oi.book_id
        SET b.reserved = b.reserved - oi.quantity
        WHERE oi.order_id = NEW.id;
    END IF;
END//
DELIMITER ;

-- ===================================
-- ПОЧАТКОВІ ДАНІ (тестові книги)
-- ===================================

INSERT INTO books (title, author, price, category, rating, rating_count, pages, year, image_url, short_description, description, is_new, is_top, stock) VALUES
('Майстер і Маргарита', 'Михайло Булгаков', 250, 'fiction', 4.9, 245, 480, 2023, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400', 'Культовий роман про любов, магію та боротьбу добра зі злом', 'Один з найвідоміших романів XX століття. Історія про письменника і його кохану, переплетена з біблійним сюжетом про Понтія Пілата.', TRUE, TRUE, 50),

('1984', 'Джордж Орвелл', 220, 'fiction', 4.8, 312, 328, 2024, 'https://images.unsplash.com/photo-1495640452779-dc497e8d3dcc?w=400', 'Антиутопія про тоталітарне суспільство майбутнього', 'Роман-застереження про суспільство тотального контролю, де Великий Брат стежить за кожним.', FALSE, TRUE, 35),

('Гаррі Поттер і філософський камінь', 'Джоан Роулінг', 300, 'fantasy', 4.9, 520, 320, 2023, 'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400', 'Перша книга легендарної серії про юного чарівника', 'Пригоди Гаррі Поттера в школі чарівництва та чаклунства Гоґвортс.', FALSE, TRUE, 12);

-- ===================================
-- ГОТОВО!
-- ===================================

SELECT 'База даних BOOKFEATHER створена успішно!' as Status;
SELECT COUNT(*) as 'Кількість книг' FROM books;
SELECT COUNT(*) as 'Кількість категорій' FROM categories;