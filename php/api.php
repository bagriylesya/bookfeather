<?php
// ===================================
// BOOKFEATHER - API.PHP
// REST API: books, orders, users, categories
// ===================================

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

// ===================================
// РОУТИНГ
// ===================================
switch ($action) {

    // ----- КНИГИ -----
    case 'books':
        switch ($method) {
            case 'GET':    getBooks();        break;
            case 'POST':   requireAdmin(); createBook();    break;
            case 'PUT':    requireAdmin(); updateBook($id); break;
            case 'DELETE': requireAdmin(); deleteBook($id); break;
            default: jsonError('Метод не підтримується', 405);
        }
        break;

    case 'book':
        if ($method === 'GET' && $id) getBook($id);
        else jsonError('Невірний запит');
        break;

    // ----- ЗАМОВЛЕННЯ -----
    case 'orders':
        switch ($method) {
            case 'GET':  requireAdmin(); getOrders();         break;
            case 'POST': createOrder();                       break;
            default: jsonError('Метод не підтримується', 405);
        }
        break;

    case 'order':
        switch ($method) {
            case 'GET': getOrder($id); break;
            case 'PUT': requireAdmin(); updateOrderStatus($id); break;
            default: jsonError('Метод не підтримується', 405);
        }
        break;

    // ----- КОРИСТУВАЧІ -----
    case 'register':
        if ($method === 'POST') registerUser();
        else jsonError('Метод не підтримується', 405);
        break;

    case 'login':
        if ($method === 'POST') loginUser();
        else jsonError('Метод не підтримується', 405);
        break;

    case 'user':
        switch ($method) {
            case 'GET': getUser($id); break;
            case 'PUT': updateUser($id); break;
            default: jsonError('Метод не підтримується', 405);
        }
        break;

    // ----- КАТЕГОРІЇ -----
    case 'categories':
        if ($method === 'GET') getCategories();
        else jsonError('Метод не підтримується', 405);
        break;

    // ----- СКЛАД -----
    case 'stock':
        if ($method === 'PUT' && $id) {
            requireAdmin();
            updateStock($id);
        } else jsonError('Невірний запит');
        break;

    // ----- ПОШУК -----
    case 'search':
        if ($method === 'GET') searchBooks();
        else jsonError('Метод не підтримується', 405);
        break;

    default:
        // Fallback: якщо POST без action — зберегти книги (для сумісності з admin.js)
        if ($method === 'POST') {
            $body = getRequestBody();
            if (is_array($body) && isset($body[0])) {
                saveBooksFromFrontend($body);
            } else {
                jsonError('Невідома дія');
            }
        } else {
            jsonError('Невідома дія: ' . $action);
        }
}

// ===================================
// КНИГИ
// ===================================

function getBooks(): void {
    $db = getDB();

    $where  = [];
    $params = [];

    if (!empty($_GET['category'])) {
        $where[]  = 'category = ?';
        $params[] = $_GET['category'];
    }
    if (!empty($_GET['search'])) {
        $where[]  = '(title LIKE ? OR author LIKE ? OR description LIKE ?)';
        $q        = '%' . $_GET['search'] . '%';
        $params   = array_merge($params, [$q, $q, $q]);
    }
    if (isset($_GET['in_stock']) && $_GET['in_stock'] === '1') {
        $where[]  = '(stock - reserved) > 0';
    }
    if (isset($_GET['discount']) && $_GET['discount'] === '1') {
        $where[] = 'discount > 0';
    }
    if (isset($_GET['is_new']) && $_GET['is_new'] === '1') {
        $where[] = 'is_new = 1';
    }
    if (!empty($_GET['min_price'])) {
        $where[]  = 'price >= ?';
        $params[] = (float)$_GET['min_price'];
    }
    if (!empty($_GET['max_price'])) {
        $where[]  = 'price <= ?';
        $params[] = (float)$_GET['max_price'];
    }

    $sql = 'SELECT * FROM books';
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);

    // Сортування
    $sort = $_GET['sort'] ?? 'popular';
    $sql .= match($sort) {
        'new'        => ' ORDER BY is_new DESC, created_at DESC',
        'price-low'  => ' ORDER BY price ASC',
        'price-high' => ' ORDER BY price DESC',
        'rating'     => ' ORDER BY rating DESC',
        'discount'   => ' ORDER BY discount DESC',
        default      => ' ORDER BY is_top DESC, rating DESC',
    };

    $limit  = min((int)($_GET['limit'] ?? 50), 100);
    $offset = (int)($_GET['offset'] ?? 0);
    $sql   .= " LIMIT $limit OFFSET $offset";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $books = $stmt->fetchAll();

    foreach ($books as &$book) {
        $book['images']    = stringToImages($book['images'] ?? '');
        $book['is_new']    = (bool)$book['is_new'];
        $book['is_top']    = (bool)$book['is_top'];
        $book['price']     = (float)$book['price'];
        $book['discount']  = (int)$book['discount'];
        $book['stock']     = (int)$book['stock'];
        $book['reserved']  = (int)$book['reserved'];
        $book['rating']    = (float)$book['rating'];
        $book['rating_count'] = (int)$book['rating_count'];
    }

    jsonSuccess($books);
}

function getBook(int $id): void {
    $db   = getDB();
    $stmt = $db->prepare('SELECT * FROM books WHERE id = ?');
    $stmt->execute([$id]);
    $book = $stmt->fetch();

    if (!$book) jsonError('Книгу не знайдено', 404);

    $book['images']   = stringToImages($book['images'] ?? '');
    $book['is_new']   = (bool)$book['is_new'];
    $book['is_top']   = (bool)$book['is_top'];
    $book['price']    = (float)$book['price'];
    $book['discount'] = (int)$book['discount'];
    $book['stock']    = (int)$book['stock'];
    $book['reserved'] = (int)$book['reserved'];

    jsonSuccess($book);
}

function createBook(): void {
    $db   = getDB();
    $data = getRequestBody();

    if (empty($data['title']))  jsonError('Назва обов\'язкова');
    if (empty($data['author'])) jsonError('Автор обов\'язковий');
    if (empty($data['price']))  jsonError('Ціна обов\'язкова');

    $stmt = $db->prepare('
        INSERT INTO books
            (title, author, original_title, publisher, category, language,
             price, discount, rating, rating_count, pages, year,
             cover, translator, isbn, barcode, size, weight,
             image, images, short_description, description,
             is_new, is_top, stock, reserved, created_at)
        VALUES
            (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
    ');

    $stmt->execute([
        sanitize($data['title']),
        sanitize($data['author']),
        sanitize($data['originalTitle'] ?? $data['original_title'] ?? ''),
        sanitize($data['publisher'] ?? ''),
        sanitize($data['category'] ?? ''),
        sanitize($data['language'] ?? 'Українська'),
        (float)($data['price'] ?? 0),
        (int)($data['discount'] ?? 0),
        (float)($data['rating'] ?? 0),
        (int)($data['ratingCount'] ?? $data['rating_count'] ?? 0),
        (int)($data['pages'] ?? 0),
        (int)($data['year'] ?? date('Y')),
        sanitize($data['cover'] ?? 'Тверда'),
        sanitize($data['translator'] ?? ''),
        sanitize($data['isbn'] ?? ''),
        sanitize($data['barcode'] ?? ''),
        sanitize($data['size'] ?? ''),
        (int)($data['weight'] ?? 0),
        sanitize($data['image'] ?? $data['image_url'] ?? ''),
        imagesToString($data['images'] ?? []),
        sanitize($data['shortDescription'] ?? $data['short_description'] ?? ''),
        sanitize($data['description'] ?? ''),
        (int)!empty($data['isNew'] ?? $data['is_new']),
        (int)!empty($data['isTop'] ?? $data['is_top']),
        (int)($data['stock'] ?? 0),
        0,
    ]);

    jsonSuccess(['id' => (int)$db->lastInsertId()], 201);
}

function updateBook(?int $id): void {
    if (!$id) jsonError('ID не вказано');
    $db   = getDB();
    $data = getRequestBody();

    $stmt = $db->prepare('
        UPDATE books SET
            title=?, author=?, original_title=?, publisher=?, category=?,
            language=?, price=?, discount=?, pages=?, year=?, cover=?,
            translator=?, isbn=?, barcode=?, size=?, weight=?,
            image=?, images=?, short_description=?, description=?,
            is_new=?, is_top=?, stock=?
        WHERE id=?
    ');

    $stmt->execute([
        sanitize($data['title'] ?? ''),
        sanitize($data['author'] ?? ''),
        sanitize($data['originalTitle'] ?? $data['original_title'] ?? ''),
        sanitize($data['publisher'] ?? ''),
        sanitize($data['category'] ?? ''),
        sanitize($data['language'] ?? 'Українська'),
        (float)($data['price'] ?? 0),
        (int)($data['discount'] ?? 0),
        (int)($data['pages'] ?? 0),
        (int)($data['year'] ?? date('Y')),
        sanitize($data['cover'] ?? 'Тверда'),
        sanitize($data['translator'] ?? ''),
        sanitize($data['isbn'] ?? ''),
        sanitize($data['barcode'] ?? ''),
        sanitize($data['size'] ?? ''),
        (int)($data['weight'] ?? 0),
        sanitize($data['image'] ?? $data['image_url'] ?? ''),
        imagesToString($data['images'] ?? []),
        sanitize($data['shortDescription'] ?? $data['short_description'] ?? ''),
        sanitize($data['description'] ?? ''),
        (int)!empty($data['isNew'] ?? $data['is_new']),
        (int)!empty($data['isTop'] ?? $data['is_top']),
        (int)($data['stock'] ?? 0),
        $id,
    ]);

    jsonSuccess(['updated' => $id]);
}

function deleteBook(?int $id): void {
    if (!$id) jsonError('ID не вказано');
    $db   = getDB();
    $stmt = $db->prepare('DELETE FROM books WHERE id = ?');
    $stmt->execute([$id]);
    jsonSuccess(['deleted' => $id]);
}

function updateStock(?int $id): void {
    if (!$id) jsonError('ID не вказано');
    $db   = getDB();
    $data = getRequestBody();

    if (!isset($data['stock'])) jsonError('Поле stock обов\'язкове');

    $stmt = $db->prepare('UPDATE books SET stock = ? WHERE id = ?');
    $stmt->execute([(int)$data['stock'], $id]);
    jsonSuccess(['id' => $id, 'stock' => (int)$data['stock']]);
}

// Fallback: фронтенд зберіг масив книг — синхронізуємо в БД
function saveBooksFromFrontend(array $books): void {
    $db = getDB();

    foreach ($books as $book) {
        $id = (int)($book['id'] ?? 0);
        if (!$id) continue;

        // Перевіряємо чи є в БД
        $check = $db->prepare('SELECT id FROM books WHERE id = ?');
        $check->execute([$id]);

        if ($check->fetch()) {
            $stmt = $db->prepare('UPDATE books SET stock=?, reserved=? WHERE id=?');
            $stmt->execute([(int)($book['stock'] ?? 0), (int)($book['reserved'] ?? 0), $id]);
        }
    }

    jsonSuccess(['synced' => count($books)]);
}

// ===================================
// ПОШУК
// ===================================

function searchBooks(): void {
    $q = trim($_GET['q'] ?? '');
    if (strlen($q) < 2) jsonError('Запит занадто короткий');

    $db   = getDB();
    $like = '%' . $q . '%';

    $stmt = $db->prepare('
        SELECT id, title, author, price, discount, image, stock, reserved, category
        FROM books
        WHERE title LIKE ? OR author LIKE ? OR description LIKE ?
        ORDER BY
            CASE WHEN title LIKE ? THEN 0
                 WHEN author LIKE ? THEN 1
                 ELSE 2
            END,
            rating DESC
        LIMIT 5
    ');

    $stmt->execute([$like, $like, $like, $like, $like]);
    $results = $stmt->fetchAll();

    foreach ($results as &$r) {
        $r['price']    = (float)$r['price'];
        $r['discount'] = (int)$r['discount'];
        $r['stock']    = (int)$r['stock'];
        $r['reserved'] = (int)$r['reserved'];
    }

    jsonSuccess($results);
}

// ===================================
// КАТЕГОРІЇ
// ===================================

function getCategories(): void {
    $db   = getDB();
    $stmt = $db->query('SELECT DISTINCT category FROM books WHERE category != "" ORDER BY category');
    $cats = $stmt->fetchAll(PDO::FETCH_COLUMN);
    jsonSuccess($cats);
}

// ===================================
// ЗАМОВЛЕННЯ
// ===================================

function createOrder(): void {
    $db   = getDB();
    $data = getRequestBody();

    // Мінімальна валідація
    if (empty($data['customer']['name']))  jsonError('Ім\'я покупця обов\'язкове');
    if (empty($data['customer']['phone'])) jsonError('Телефон обов\'язковий');
    if (empty($data['items']))             jsonError('Кошик порожній');

    // Рахуємо суму
    $subtotal = 0;
    foreach ($data['items'] as $item) {
        $price = (float)($item['price'] ?? 0);
        $disc  = (int)($item['discount'] ?? 0);
        $qty   = (int)($item['quantity'] ?? 1);
        $final = $disc > 0 ? $price * (1 - $disc / 100) : $price;
        $subtotal += $final * $qty;
    }

    $deliveryMethod = $data['delivery']['method'] ?? 'np-warehouse';
    $deliveryCost   = calcDelivery($subtotal, $deliveryMethod);
    $total          = $subtotal + $deliveryCost;
    $orderNumber    = 'BF-' . date('ymd') . '-' . strtoupper(substr(uniqid(), -5));

    $db->beginTransaction();

    try {
        // Зберігаємо замовлення
        $stmt = $db->prepare('
            INSERT INTO orders
                (order_number, customer_name, customer_phone, customer_email,
                 delivery_method, delivery_city, delivery_warehouse, delivery_address,
                 payment_method, comment, subtotal, delivery_cost, total,
                 status, items_json, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
        ');

        $stmt->execute([
            $orderNumber,
            sanitize($data['customer']['name']),
            sanitize($data['customer']['phone']),
            sanitize($data['customer']['email'] ?? ''),
            sanitize($deliveryMethod),
            sanitize($data['delivery']['city'] ?? ''),
            sanitize($data['delivery']['warehouse'] ?? ''),
            sanitize($data['delivery']['address'] ?? ''),
            sanitize($data['payment'] ?? 'cod'),
            sanitize($data['comment'] ?? ''),
            round($subtotal, 2),
            round($deliveryCost, 2),
            round($total, 2),
            'processing',
            json_encode($data['items'], JSON_UNESCAPED_UNICODE),
        ]);

        $orderId = (int)$db->lastInsertId();

        // Знімаємо зі складу
        foreach ($data['items'] as $item) {
            $itemId = (int)($item['id'] ?? 0);
            $qty    = (int)($item['quantity'] ?? 1);
            if (!$itemId) continue;

            $upd = $db->prepare('
                UPDATE books
                SET stock    = GREATEST(0, stock - ?),
                    reserved = GREATEST(0, reserved - ?)
                WHERE id = ?
            ');
            $upd->execute([$qty, $qty, $itemId]);
        }

        // Якщо є userId — записуємо зв'язок
        if (!empty($data['userId'])) {
            $link = $db->prepare('INSERT INTO user_orders (user_id, order_id) VALUES (?,?)');
            $link->execute([(int)$data['userId'], $orderId]);
        }

        $db->commit();

        jsonSuccess([
            'id'          => $orderId,
            'orderNumber' => $orderNumber,
            'total'       => round($total, 2),
        ], 201);

    } catch (Exception $e) {
        $db->rollBack();
        jsonError('Помилка при збереженні замовлення: ' . $e->getMessage(), 500);
    }
}

function getOrders(): void {
    $db   = getDB();
    $sql  = 'SELECT * FROM orders ORDER BY created_at DESC';
    $stmt = $db->query($sql);
    $orders = $stmt->fetchAll();

    foreach ($orders as &$o) {
        $o['items']         = json_decode($o['items_json'] ?? '[]', true) ?: [];
        $o['subtotal']      = (float)$o['subtotal'];
        $o['delivery_cost'] = (float)$o['delivery_cost'];
        $o['total']         = (float)$o['total'];
        unset($o['items_json']);
    }

    jsonSuccess($orders);
}

function getOrder(?int $id): void {
    if (!$id) jsonError('ID не вказано');
    $db   = getDB();
    $stmt = $db->prepare('SELECT * FROM orders WHERE id = ?');
    $stmt->execute([$id]);
    $order = $stmt->fetch();
    if (!$order) jsonError('Замовлення не знайдено', 404);

    $order['items'] = json_decode($order['items_json'] ?? '[]', true) ?: [];
    unset($order['items_json']);
    jsonSuccess($order);
}

function updateOrderStatus(?int $id): void {
    if (!$id) jsonError('ID не вказано');
    $db   = getDB();
    $data = getRequestBody();

    $allowed = ['processing','confirmed','shipped','delivered','cancelled'];
    $status  = $data['status'] ?? '';

    if (!in_array($status, $allowed)) {
        jsonError('Невірний статус. Дозволені: ' . implode(', ', $allowed));
    }

    $stmt = $db->prepare('UPDATE orders SET status=? WHERE id=?');
    $stmt->execute([$status, $id]);
    jsonSuccess(['id' => $id, 'status' => $status]);
}

// ===================================
// КОРИСТУВАЧІ
// ===================================

function registerUser(): void {
    $db   = getDB();
    $data = getRequestBody();

    $name    = sanitize($data['name']    ?? '');
    $surname = sanitize($data['surname'] ?? '');
    $email   = sanitize($data['email']   ?? '');
    $phone   = sanitize($data['phone']   ?? '');
    $password = $data['password'] ?? '';

    if (!$name)              jsonError('Ім\'я обов\'язкове');
    if (!isValidEmail($email)) jsonError('Некоректний email');
    if (strlen($password) < 6) jsonError('Пароль мінімум 6 символів');

    // Перевірка дублікату
    $check = $db->prepare('SELECT id FROM users WHERE email = ?');
    $check->execute([$email]);
    if ($check->fetch()) jsonError('Email вже зареєстрований');

    $hash = hashPassword($password);

    $stmt = $db->prepare('
        INSERT INTO users (name, surname, email, phone, password_hash, newsletter, created_at)
        VALUES (?,?,?,?,?,?,NOW())
    ');
    $stmt->execute([
        $name, $surname, $email, $phone, $hash,
        (int)!empty($data['newsletter']),
    ]);

    $userId = (int)$db->lastInsertId();

    jsonSuccess([
        'id'      => $userId,
        'name'    => $name,
        'surname' => $surname,
        'email'   => $email,
    ], 201);
}

function loginUser(): void {
    $db   = getDB();
    $data = getRequestBody();

    $email    = sanitize($data['email']    ?? '');
    $password = $data['password'] ?? '';

    if (!$email || !$password) jsonError('Введіть email та пароль');

    $stmt = $db->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !verifyPassword($password, $user['password_hash'])) {
        jsonError('Невірний email або пароль', 401);
    }

    unset($user['password_hash']);
    jsonSuccess($user);
}

function getUser(?int $id): void {
    if (!$id) jsonError('ID не вказано');
    $db   = getDB();
    $stmt = $db->prepare('SELECT id, name, surname, email, phone, newsletter, created_at FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $user = $stmt->fetch();
    if (!$user) jsonError('Користувача не знайдено', 404);
    jsonSuccess($user);
}

function updateUser(?int $id): void {
    if (!$id) jsonError('ID не вказано');
    $db   = getDB();
    $data = getRequestBody();

    $fields  = [];
    $params  = [];

    if (isset($data['name']))     { $fields[] = 'name=?';       $params[] = sanitize($data['name']); }
    if (isset($data['surname']))  { $fields[] = 'surname=?';    $params[] = sanitize($data['surname']); }
    if (isset($data['phone']))    { $fields[] = 'phone=?';      $params[] = sanitize($data['phone']); }
    if (isset($data['newsletter'])) { $fields[] = 'newsletter=?'; $params[] = (int)$data['newsletter']; }

    // Зміна пароля
    if (!empty($data['newPassword'])) {
        if (strlen($data['newPassword']) < 6) jsonError('Пароль мінімум 6 символів');

        // Перевіряємо поточний
        $chk = $db->prepare('SELECT password_hash FROM users WHERE id=?');
        $chk->execute([$id]);
        $row = $chk->fetch();
        if (!$row || !verifyPassword($data['currentPassword'] ?? '', $row['password_hash'])) {
            jsonError('Невірний поточний пароль', 401);
        }
        $fields[] = 'password_hash=?';
        $params[] = hashPassword($data['newPassword']);
    }

    if (empty($fields)) jsonError('Немає полів для оновлення');

    $params[] = $id;
    $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id=?';
    $db->prepare($sql)->execute($params);
    jsonSuccess(['updated' => $id]);
}