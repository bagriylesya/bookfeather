-- ===================================
-- BOOKFEATHER DATABASE - ВИПРАВЛЕНА ВЕРСІЯ
-- Тільки необхідні поля, автооновлення, динамічні категорії
-- ===================================

CREATE DATABASE IF NOT EXISTS bookfeather 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE bookfeather;

-- ===================================
-- ТАБЛИЦЯ: books (Книги)
-- ===================================
CREATE TABLE IF NOT EXISTS books (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL COMMENT 'Назва книги',
    author VARCHAR(255) NOT NULL COMMENT 'Автор',
    original_title VARCHAR(255) NULL COMMENT 'Оригінальна назва',
    publisher VARCHAR(255) NULL COMMENT 'Видавництво',
    
    -- Категорії (динамічні, можна додавати нові)
    category VARCHAR(100) NOT NULL COMMENT 'Основна категорія',
    
    -- Мова (БЕЗ російської!)
    language VARCHAR(50) DEFAULT 'Українська' COMMENT 'Українська/Англійська/Інші',
    
    -- Ціна та знижка
    price DECIMAL(10,2) NOT NULL COMMENT 'Ціна в грн',
    discount INT DEFAULT 0 COMMENT 'Знижка у %',
    
    -- Рейтинг
    rating DECIMAL(3,2) DEFAULT 0 COMMENT 'Рейтинг 0-10',
    rating_count INT DEFAULT 0 COMMENT 'Кількість оцінок',
    
    -- Характеристики
    pages INT NULL COMMENT 'Кількість сторінок',
    year INT NULL COMMENT 'Рік видання',
    cover VARCHAR(50) NULL COMMENT 'Тверда/Мяка',
    translator VARCHAR(255) NULL COMMENT 'Перекладач',
    isbn VARCHAR(50) NULL COMMENT 'ISBN',
    barcode VARCHAR(50) NULL COMMENT 'Штрих-код',
    size VARCHAR(50) NULL COMMENT 'Розмір',
    weight INT NULL COMMENT 'Вага в грамах',
    illustrations VARCHAR(255) NULL COMMENT 'Ілюстрації',
    
    -- Зображення (КІЛЬКА ФОТО!)
    image_url TEXT NULL COMMENT 'Головне фото URL',
    images TEXT NULL COMMENT 'Всі фото через кому: url1,url2,url3',
    
    -- Опис
    short_description TEXT NULL COMMENT 'Короткий опис',
    description TEXT NULL COMMENT 'Повний опис',
    
    -- Мітки
    is_new BOOLEAN DEFAULT FALSE COMMENT 'Новинка',
    is_top BOOLEAN DEFAULT FALSE COMMENT 'Топ продаж',
    
    -- СКЛАД (ГОЛОВНЕ!)
    stock INT DEFAULT 0 COMMENT 'Кількість на складі',
    reserved INT DEFAULT 0 COMMENT 'Зарезервовано в кошиках',
    
    -- Дати
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Індекси для швидкості
    INDEX idx_category (category),
    INDEX idx_stock (stock),
    INDEX idx_language (language),
    FULLTEXT INDEX idx_search (title, author)
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
    
    -- Аватар (base64 або URL)
    avatar TEXT NULL COMMENT 'Аватар користувача',
    
    -- Email підтвердження
    is_verified BOOLEAN DEFAULT FALSE COMMENT 'Email підтверджений',
    verification_code VARCHAR(10) NULL COMMENT 'Код підтвердження',
    
    newsletter BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
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
    
    -- Доставка (БЕЗ САМОВИВОЗУ!)
    delivery_method VARCHAR(50) NOT NULL COMMENT 'novaposhta-warehouse/novaposhta-courier/ukrposhta',
    delivery_city VARCHAR(100) NOT NULL,
    delivery_warehouse VARCHAR(255) NOT NULL,
    
    -- Оплата
    payment_method VARCHAR(50) NOT NULL COMMENT 'cash/card/online',
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    
    comment TEXT NULL,
    
    -- Суми
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_cost DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    
    -- Статус
    status ENUM('processing', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'processing',
    tracking_number VARCHAR(50) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
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
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- ТАБЛИЦЯ: stock_notifications (Повідомити про наявність)
-- ===================================
CREATE TABLE IF NOT EXISTS stock_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    book_id INT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP NULL,
    
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE KEY unique_notification (book_id, user_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- ТРИГЕРИ - АВТОМАТИЧНЕ ОНОВЛЕННЯ
-- ===================================

-- 1. Автоматична генерація номеру замовлення
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

-- 2. АВТОМАТИЧНЕ ОНОВЛЕННЯ СКЛАДУ при створенні замовлення
DELIMITER //
CREATE TRIGGER after_order_item_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    -- Зменшуємо stock та reserved
    UPDATE books 
    SET stock = stock - NEW.quantity,
        reserved = reserved - NEW.quantity
    WHERE id = NEW.book_id;
END//
DELIMITER ;

-- 3. АВТОМАТИЧНЕ ПОВЕРНЕННЯ СКЛАДУ при скасуванні
DELIMITER //
CREATE TRIGGER after_order_cancel
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        -- Повертаємо книги на склад
        UPDATE books b
        INNER JOIN order_items oi ON b.id = oi.book_id
        SET b.stock = b.stock + oi.quantity
        WHERE oi.order_id = NEW.id;
    END IF;
END//
DELIMITER ;

-- ===================================
-- ПОЧАТКОВІ ДАНІ (тільки для тестування)
-- ===================================

-- Тестові книги
INSERT INTO books (title, author, price, category, language, rating, rating_count, pages, year, cover, image_url, images, short_description, description, is_new, is_top, stock) VALUES
('Майстер і Маргарита', 'Михайло Булгаков', 250, 'Художня література', 'Українська', 4.9, 245, 480, 2023, 'Тверда', 
 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400,https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
 'Культовий роман про любов, магію та боротьбу добра зі злом', 
 'Один з найвідоміших романів XX століття. Історія про письменника і його кохану, переплетена з біблійним сюжетом.', 
 TRUE, TRUE, 50),

('1984', 'Джордж Орвелл', 220, 'Художня література', 'Українська', 4.8, 312, 328, 2024, 'Тверда',
 'https://images.unsplash.com/photo-1495640452779-dc497e8d3dcc?w=400',
 'https://images.unsplash.com/photo-1495640452779-dc497e8d3dcc?w=400',
 'Антиутопія про тоталітарне суспільство майбутнього', 
 'Роман-застереження про суспільство тотального контролю.', 
 FALSE, TRUE, 35),

('Гаррі Поттер і філософський камінь', 'Джоан Роулінг', 300, 'Фентезі', 'Українська', 4.9, 520, 320, 2023, 'Тверда',
 'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400',
 'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400',
 'Перша книга легендарної серії про юного чарівника', 
 'Пригоди Гаррі Поттера в школі Гоґвортс.', 
 FALSE, TRUE, 12);

-- ===================================
-- ГОТОВО!
-- ===================================

SELECT 'База даних створена успішно!' as Message,
       COUNT(*) as 'Тестових книг' 
FROM books;

-- Перевірка тригерів
SELECT 'Тригери створені:' as Info;
SHOW TRIGGERS;