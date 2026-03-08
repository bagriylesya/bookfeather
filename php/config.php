<?php
// ===================================
// BOOKFEATHER - CONFIG.PHP
// Конфігурація бази даних та константи
// ===================================

// ===================================
// БАЗА ДАНИХ
// ===================================
define('DB_HOST', '127.127.126.31');
define('DB_NAME',     'bookfeather');
define('DB_USER',     'root');        // змініть на свого юзера
define('DB_PASSWORD', 'root');           // змініть на свій пароль
define('DB_CHARSET',  'utf8mb4');

// ===================================
// АДМІН
// ===================================
define('ADMIN_PASSWORD', 'admin123'); // змініть на свій пароль!
define('ADMIN_EMAIL',    'admin@bookfeather.com');

// ===================================
// САЙТ
// ===================================
define('SITE_NAME',  'BOOKFEATHER');
define('SITE_URL',   'http://localhost'); // змінити на продакшн URL
define('SITE_EMAIL', 'info@bookfeather.com');

// ===================================
// ДОСТАВКА
// ===================================
define('DELIVERY_NP_WAREHOUSE_PRICE', 50);
define('DELIVERY_NP_COURIER_PRICE',   80);
define('DELIVERY_UKRPOSHTA_PRICE',    35);
define('DELIVERY_NP_FREE_THRESHOLD',  500);
define('DELIVERY_COURIER_FREE_THRESHOLD', 800);

// ===================================
// CORS — дозволяємо запити з фронтенду
// ===================================
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

// Preflight OPTIONS запит
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ===================================
// ПІДКЛЮЧЕННЯ ДО БД (PDO)
// ===================================
function getDB(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST, DB_NAME, DB_CHARSET
        );
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            jsonError('Помилка підключення до бази даних: ' . $e->getMessage(), 500);
        }
    }

    return $pdo;
}

// ===================================
// ДОПОМІЖНІ ФУНКЦІЇ
// ===================================

// Відповідь JSON з успіхом
function jsonSuccess(mixed $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode([
        'success' => true,
        'data'    => $data,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Відповідь JSON з помилкою
function jsonError(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error'   => $message,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Отримати тіло запиту як масив
function getRequestBody(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// Очистити рядок від небезпечного HTML
function sanitize(mixed $val): string {
    return htmlspecialchars(trim((string)$val), ENT_QUOTES, 'UTF-8');
}

// Перевірка email
function isValidEmail(string $email): bool {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Перевірка українського телефону
function isValidPhone(string $phone): bool {
    $clean = preg_replace('/[\s\-()]+/', '', $phone);
    return (bool) preg_match('/^(\+380|0)\d{9}$/', $clean);
}

// Хешування пароля
function hashPassword(string $password): string {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

// Перевірка пароля
function verifyPassword(string $password, string $hash): bool {
    return password_verify($password, $hash);
}

// Перевірка авторизації адміна (простий токен)
function requireAdmin(): void {
    $token = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
    if ($token !== ADMIN_PASSWORD) {
        jsonError('Доступ заборонено', 403);
    }
}

// Конвертація масиву зображень у рядок для БД
function imagesToString(mixed $images): string {
    if (is_array($images)) return implode(',', array_filter($images));
    return (string)$images;
}

// Конвертація рядка зображень у масив
function stringToImages(string $images): array {
    if (empty($images)) return [];
    return array_values(array_filter(array_map('trim', explode(',', $images))));
}

// Розрахунок вартості доставки
function calcDelivery(float $subtotal, string $method): float {
    return match($method) {
        'np-warehouse' => $subtotal >= DELIVERY_NP_FREE_THRESHOLD    ? 0 : DELIVERY_NP_WAREHOUSE_PRICE,
        'np-courier'   => $subtotal >= DELIVERY_COURIER_FREE_THRESHOLD ? 0 : DELIVERY_NP_COURIER_PRICE,
        'ukrposhta'    => DELIVERY_UKRPOSHTA_PRICE,
        default        => DELIVERY_NP_WAREHOUSE_PRICE,
    };
}