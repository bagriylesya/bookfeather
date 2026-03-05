-- ===================================
-- BOOKFEATHER - DATABASE.SQL
-- Повна схема бази даних
-- MySQL 5.7+ / MariaDB 10.3+
-- ===================================

CREATE DATABASE IF NOT EXISTS bookfeather
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE bookfeather;

-- ===================================
-- КНИГИ
-- ===================================
CREATE TABLE IF NOT EXISTS books (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title            VARCHAR(500)  NOT NULL,
    author           VARCHAR(300)  NOT NULL,
    original_title   VARCHAR(500)  DEFAULT '',
    publisher        VARCHAR(200)  DEFAULT '',
    category         VARCHAR(100)  DEFAULT '',
    language         VARCHAR(50)   DEFAULT 'Українська',
    price            DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount         TINYINT       NOT NULL DEFAULT 0 COMMENT '% знижки',
    rating           DECIMAL(3,1)  NOT NULL DEFAULT 0,
    rating_count     INT UNSIGNED  NOT NULL DEFAULT 0,
    pages            SMALLINT      DEFAULT 0,
    year             YEAR          DEFAULT NULL,
    cover            VARCHAR(50)   DEFAULT 'Тверда',
    translator       VARCHAR(200)  DEFAULT '',
    isbn             VARCHAR(20)   DEFAULT '',
    barcode          VARCHAR(30)   DEFAULT '',
    size             VARCHAR(50)   DEFAULT '',
    weight           SMALLINT      DEFAULT 0 COMMENT 'грами',
    illustrations    VARCHAR(100)  DEFAULT '',
    image            VARCHAR(1000) DEFAULT '',
    images           TEXT          DEFAULT '' COMMENT 'URL через кому',
    short_description TEXT         DEFAULT '',
    description      TEXT          DEFAULT '',
    is_new           TINYINT(1)    NOT NULL DEFAULT 0,
    is_top           TINYINT(1)    NOT NULL DEFAULT 0,
    stock            SMALLINT      NOT NULL DEFAULT 0,
    reserved         SMALLINT      NOT NULL DEFAULT 0,
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME      DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_category  (category),
    INDEX idx_is_new    (is_new),
    INDEX idx_is_top    (is_top),
    INDEX idx_price     (price),
    INDEX idx_rating    (rating),
    FULLTEXT idx_search (title, author, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- КОРИСТУВАЧІ
-- ===================================
CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    surname       VARCHAR(100) DEFAULT '',
    email         VARCHAR(255) NOT NULL UNIQUE,
    phone         VARCHAR(20)  DEFAULT '',
    password_hash VARCHAR(255) NOT NULL,
    birthday      DATE         DEFAULT NULL,
    newsletter    TINYINT(1)   NOT NULL DEFAULT 0,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- АДРЕСИ КОРИСТУВАЧІВ
-- ===================================
CREATE TABLE IF NOT EXISTS user_addresses (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL,
    label      VARCHAR(100) DEFAULT 'Основна',
    city       VARCHAR(100) NOT NULL,
    warehouse  VARCHAR(200) DEFAULT '',
    address    VARCHAR(300) DEFAULT '',
    is_default TINYINT(1)   NOT NULL DEFAULT 0,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- ЗАМОВЛЕННЯ
-- ===================================
CREATE TABLE IF NOT EXISTS orders (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_number      VARCHAR(30)   NOT NULL UNIQUE,
    customer_name     VARCHAR(200)  NOT NULL,
    customer_phone    VARCHAR(20)   NOT NULL,
    customer_email    VARCHAR(255)  DEFAULT '',
    delivery_method   VARCHAR(50)   NOT NULL DEFAULT 'np-warehouse',
    delivery_city     VARCHAR(100)  DEFAULT '',
    delivery_warehouse VARCHAR(200) DEFAULT '',
    delivery_address  VARCHAR(300)  DEFAULT '',
    payment_method    VARCHAR(30)   NOT NULL DEFAULT 'cod',
    comment           TEXT          DEFAULT '',
    subtotal          DECIMAL(10,2) NOT NULL DEFAULT 0,
    delivery_cost     DECIMAL(10,2) NOT NULL DEFAULT 0,
    total             DECIMAL(10,2) NOT NULL DEFAULT 0,
    status            ENUM('processing','confirmed','shipped','delivered','cancelled')
                      NOT NULL DEFAULT 'processing',
    tracking_number   VARCHAR(100)  DEFAULT NULL,
    items_json        LONGTEXT      NOT NULL COMMENT 'JSON масив товарів',
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME      DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_status       (status),
    INDEX idx_order_number (order_number),
    INDEX idx_created_at   (created_at),
    INDEX idx_phone        (customer_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- ЗВ'ЯЗОК ЗАМОВЛЕНЬ З ЮЗЕРАМИ
-- ===================================
CREATE TABLE IF NOT EXISTS user_orders (
    user_id  INT UNSIGNED NOT NULL,
    order_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, order_id),
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================================
-- РЕЙТИНГИ КОРИСТУВАЧІВ
-- ===================================
CREATE TABLE IF NOT EXISTS book_ratings (
    user_id    INT UNSIGNED NOT NULL,
    book_id    INT UNSIGNED NOT NULL,
    rating     TINYINT      NOT NULL CHECK (rating BETWEEN 1 AND 10),
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================================
-- КАСТОМНІ КАТЕГОРІЇ (додані адміном)
-- ===================================
CREATE TABLE IF NOT EXISTS custom_categories (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    icon       VARCHAR(10)  DEFAULT '📚',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- ТЕСТОВІ КНИГИ (12 штук)
-- ===================================
INSERT INTO books
    (title, author, publisher, category, language, price, discount,
     rating, rating_count, pages, year, cover, isbn,
     image, short_description, description, is_new, is_top, stock)
VALUES

('Кобзар',
 'Тарас Шевченко',
 'Дніпро',
 'Українська література',
 'Українська',
 320.00, 0,
 9.8, 1240,
 485, 2023, 'Тверда', '978-966-578-123-4',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Kobzar_1840.jpg/400px-Kobzar_1840.jpg',
 'Повне зібрання поезій великого Кобзаря.',
 'Найвидатніша збірка українського поета Тараса Шевченка, що містить його найкращі твори: «Катерина», «Гайдамаки», «Сон», «Заповіт» та багато інших. Кобзар — символ духовності й незламності українського народу.',
 0, 1, 47),

('Хіба ревуть воли, як ясла повні?',
 'Панас Мирний',
 'Знання',
 'Українська література',
 'Українська',
 275.00, 10,
 8.9, 430,
 512, 2022, 'Тверда', '978-966-382-456-7',
 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Panas_Myrnyi.jpg/400px-Panas_Myrnyi.jpg',
 'Класичний соціально-психологічний роман.',
 'Один із найвизначніших творів класичної української прози. Роман розповідає про трагічну долю Чіпки Варениченка — людини, яка через несправедливість суспільства стає на шлях злочину.',
 0, 1, 23),

('Атомні звички',
 'Джеймс Клір',
 'Nash Format',
 'Саморозвиток',
 'Українська',
 420.00, 15,
 9.2, 3800,
 320, 2023, 'Тверда', '978-617-7559-89-0',
 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg',
 'Найефективніший спосіб виробити корисні звички і позбутися шкідливих.',
 'Джеймс Клір — один із провідних у світі експертів з формування звичок. У цій книжці він розкриває практичні стратегії, що допоможуть вам щодня ставати кращою версією себе. Метод «атомних звичок» — маленьких, але потужних змін — може радикально трансформувати ваше життя.',
 0, 1, 89),


('Гаррі Поттер і філософський камінь',
 'Джоан Роулінґ',
 'А-БА-БА-ГА-ЛА-МА-ГА',
 'Фентезі',
 'Українська',
 450.00, 0,
 9.4, 8900,
 336, 2023, 'Тверда', '978-617-585-148-5',
 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1474154022i/3.jpg',
 'Перша книга легендарної серії про юного чарівника.',
 'Одинадцятирічний Гаррі Поттер живе у своїх нелюбих родичів Дурслів і навіть не підозрює, що він — чарівник. Одного дня він отримує запрошення до школи чарівництва і чаклунства Гоґвортс. Так починається неймовірна пригода, що захопить мільйони читачів по всьому світу.',
 1, 1, 62),

('Думай повільно... вирішуй швидко',
 'Деніел Канеман',
 'Nash Format',
 'Психологія',
 'Українська',
 395.00, 20,
 9.0, 2100,
 520, 2023, 'Тверда', '978-617-7559-67-8',
 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1317793965i/11468377.jpg',
 'Нобелівський лауреат про те, як ми насправді приймаємо рішення.',
 'Деніел Канеман — нобелівський лауреат, який присвятив десятиліття вивченню людського мислення. У цій книзі він описує два способи мислення: «Система 1» — швидке, інтуїтивне та емоційне, і «Система 2» — повільне, зважене та логічне.',
 0, 1, 55),

('1984',
 'Джордж Орвелл',
 'Vivat',
 'Антиутопія',
 'Українська',
 310.00, 0,
 9.3, 6700,
 368, 2022, 'Тверда', '978-966-982-345-6',
 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1657781256i/61439040.jpg',
 'Пророчий роман про тоталітаризм та контроль над людиною.',
 'Роман-антиутопія Джорджа Орвелла, написаний у 1948 році. Дія відбувається в майбутньому тоталітарному суспільстві, де Великий Брат стежить за кожним. Головний герой Вінстон Сміт починає таємно бунтувати проти Партії.',
 0, 1, 41),

('Зброя слів',
 'Ірена Карпа',
 'Meridian Czernowitz',
 'Сучасна проза',
 'Українська',
 285.00, 0,
 8.4, 320,
 224, 2024, 'М\'яка', '978-617-8280-12-3',
 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png',
 'Потужна проза від найяскравішої голосу сучасної України.',
 'Ірена Карпа — одна з найяскравіших постатей сучасної української літератури. Письменниця, яка пише відверто, гостро і без табу.',
 1, 0, 18),

('Sapiens. Коротка історія людства',
 'Юваль Ной Харарі',
 'BookChef',
 'Популярна наука',
 'Українська',
 490.00, 10,
 9.1, 4300,
 560, 2023, 'Тверда', '978-617-7559-45-6',
 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1420585954i/23692271.jpg',
 'Як Homo sapiens підкорив світ? Захоплива історія від первісних людей до сьогодення.',
 'Юваль Ной Харарі вміло поєднує результати наукових досліджень з людської біології, антропології, палеонтології та економіки, аби відповісти на найфундаментальніше запитання: чому саме Homo sapiens став паном планети Земля?',
 0, 1, 73),

('Код да Вінчі',
 'Ден Браун',
 'KM-BOOKS',
 'Детективи',
 'Українська',
 340.00, 5,
 8.6, 3100,
 544, 2022, 'Тверда', '978-617-7-44532-8',
 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1579621267i/968.jpg',
 'Найгучніший детектив десятиліть, що зрушив уявлення про мистецтво і релігію.',
 'Куратора Лувру знайдено мертвим у Великій галереї. Поруч із тілом — заплутані символи. Гарвардський символогіст Роберт Ленґдон і криптолог Софі Неве заплутуються у змові, яка веде до таємниць самого Леонардо да Вінчі.',
 0, 0, 29),

('Маленький принц',
 'Антуан де Сент-Екзюпері',
 'Навчальна книга — Богдан',
 'Класика',
 'Українська',
 220.00, 0,
 9.6, 7800,
 112, 2023, 'Тверда', '978-966-10-4567-2',
 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1367545443i/157993.jpg',
 'Казка для дорослих про найважливіше в житті.',
 'Маленький принц — це філософська казка-притча, у якій стосунки між людьми та пошук сенсу показані через прості образи. «Найголовнішого очима не побачиш — тільки серцем» — головний меседж цього шедевру.',
 0, 1, 95),

('Повернення до Рейховенбаху',
 'Наталка Сняданко',
 'Видавництво Старого Лева',
 'Сучасна проза',
 'Українська',
 310.00, 0,
 8.2, 180,
 296, 2024, 'Тверда', '978-617-679-789-0',
 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png',
 'Новий роман провідної української письменниці.',
 'Наталка Сняданко — лауреатка численних літературних премій. Її проза відзначається тонким психологізмом, іронічністю і глибоким аналізом сучасного суспільства.',
 1, 0, 12);