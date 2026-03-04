<?php
/**
 * BOOKFEATHER - Конфігурація БД
 * Підключення до MySQL та допоміжні функції
 */

// Налаштування БД
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'bookfeather');
define('DB_CHARSET', 'utf8mb4');

// Підключення до БД
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch(PDOException $e) {
    die("Помилка підключення: " . $e->getMessage());
}

// Функція виконання запиту
function query($sql, $params = []) {
    global $pdo;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

// Отримати один рядок
function fetchOne($sql, $params = []) {
    return query($sql, $params)->fetch();
}

// Отримати всі рядки
function fetchAll($sql, $params = []) {
    return query($sql, $params)->fetchAll();
}

// ID останнього запису
function lastInsertId() {
    global $pdo;
    return $pdo->lastInsertId();
}

// Почати транзакцію
function beginTransaction() {
    global $pdo;
    $pdo->beginTransaction();
}

// Підтвердити транзакцію
function commit() {
    global $pdo;
    $pdo->commit();
}

// Відмінити транзакцію
function rollback() {
    global $pdo;
    $pdo->rollBack();
}

// Екранування HTML
function e($str) {
    return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
}

// Перевірка адміна
function isAdmin() {
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

// Перевірка логіну
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

// Поточний користувач
function getCurrentUser() {
    if (!isLoggedIn()) return null;
    return fetchOne("SELECT * FROM users WHERE id = ?", [$_SESSION['user_id']]);
}

// JSON відповідь
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// JSON помилка
function jsonError($message, $code = 400) {
    jsonResponse(['error' => $message], $code);
}

// Почати сесію
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Часовий пояс
date_default_timezone_set('Europe/Kyiv');
?>