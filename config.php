<?php
/**
 * ===================================
 * BOOKFEATHER - Конфігурація БД
 * ===================================
 * 
 * Цей файл містить налаштування підключення до бази даних
 * та допоміжні функції для роботи з БД
 * 
 * ВАЖЛИВО: Змініть DB_PASS на production!
 */

// Заборонити прямий доступ
if (!defined('BOOKFEATHER_ACCESS')) {
    die('Прямий доступ заборонено');
}

// ===================================
// НАЛАШТУВАННЯ БД
// ===================================

define('DB_HOST', 'localhost');       // Хост MySQL
define('DB_USER', 'root');            // Користувач (за замовчуванням root в OpenServer)
define('DB_PASS', '');                // Пароль (за замовчуванням пустий в OpenServer)
define('DB_NAME', 'bookfeather');     // Назва бази даних
define('DB_CHARSET', 'utf8mb4');      // Кодування

// ===================================
// ПІДКЛЮЧЕННЯ ДО БД
// ===================================

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            // Показувати помилки як виключення
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            
            // Повертати результати як асоціативні масиви
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            
            // Не емулювати prepared statements
            PDO::ATTR_EMULATE_PREPARES => false,
            
            // Постійне з'єднання (опціонально)
            // PDO::ATTR_PERSISTENT => true
        ]
    );
    
} catch(PDOException $e) {
    // В production показувати загальну помилку
    if ($_SERVER['SERVER_NAME'] === 'localhost' || $_SERVER['SERVER_NAME'] === 'bookfeather.loc') {
        die("Помилка підключення до БД: " . $e->getMessage());
    } else {
        die("Помилка підключення до бази даних. Спробуйте пізніше.");
    }
}

// ===================================
// ДОПОМІЖНІ ФУНКЦІЇ
// ===================================

/**
 * Виконати SQL запит
 * 
 * @param string $sql SQL запит з плейсхолдерами
 * @param array $params Параметри для запиту
 * @return PDOStatement
 */
function query($sql, $params = []) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    } catch(PDOException $e) {
        error_log("DB Error: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Отримати один рядок
 * 
 * @param string $sql SQL запит
 * @param array $params Параметри
 * @return array|false
 */
function fetchOne($sql, $params = []) {
    return query($sql, $params)->fetch();
}

/**
 * Отримати всі рядки
 * 
 * @param string $sql SQL запит
 * @param array $params Параметри
 * @return array
 */
function fetchAll($sql, $params = []) {
    return query($sql, $params)->fetchAll();
}

/**
 * Отримати ID останнього вставленого запису
 * 
 * @return string
 */
function lastInsertId() {
    global $pdo;
    return $pdo->lastInsertId();
}

/**
 * Почати транзакцію
 */
function beginTransaction() {
    global $pdo;
    $pdo->beginTransaction();
}

/**
 * Підтвердити транзакцію
 */
function commit() {
    global $pdo;
    $pdo->commit();
}

/**
 * Відмінити транзакцію
 */
function rollback() {
    global $pdo;
    $pdo->rollBack();
}

/**
 * Безпечно екранувати HTML
 * 
 * @param string $str Рядок
 * @return string
 */
function e($str) {
    return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
}

/**
 * Перевірити чи користувач адмін
 * 
 * @return bool
 */
function isAdmin() {
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

/**
 * Перевірити чи користувач залогінений
 * 
 * @return bool
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Отримати поточного користувача
 * 
 * @return array|null
 */
function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    return fetchOne("SELECT * FROM users WHERE id = ?", [$_SESSION['user_id']]);
}

/**
 * Відправити JSON відповідь
 * 
 * @param mixed $data Дані для відправки
 * @param int $code HTTP код
 */
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Відправити помилку
 * 
 * @param string $message Повідомлення про помилку
 * @param int $code HTTP код
 */
function jsonError($message, $code = 400) {
    jsonResponse(['error' => $message], $code);
}

/**
 * Перевірити CSRF токен
 * 
 * @param string $token Токен з форми
 * @return bool
 */
function verifyCsrfToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Генерувати CSRF токен
 * 
 * @return string
 */
function generateCsrfToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// ===================================
// НАЛАШТУВАННЯ СЕСІЇ
// ===================================

// Почати сесію якщо ще не почата
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ===================================
// ЧАСОВИЙ ПОЯС
// ===================================

date_default_timezone_set('Europe/Kyiv');

// ===================================
// ГОТОВО!
// ===================================

// Для використання в інших файлах:
// <?php
// define('BOOKFEATHER_ACCESS', true);
// require_once 'config.php';
// ?>