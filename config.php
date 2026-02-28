<?php
// config.php - Налаштування бази даних

// Налаштування підключення
define('DB_HOST', 'localhost');     // Хост бази даних
define('DB_USER', 'root');          // Користувач (за замовчуванням root)
define('DB_PASS', '');              // Пароль (за замовчуванням пустий)
define('DB_NAME', 'bookfeather');   // Назва бази даних

// Підключення до бази даних
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch(PDOException $e) {
    die("Помилка підключення до бази даних: " . $e->getMessage());
}

// Функція для безпечного виконання запитів
function query($sql, $params = []) {
    global $pdo;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

// Функція для отримання одного рядка
function fetchOne($sql, $params = []) {
    return query($sql, $params)->fetch();
}

// Функція для отримання всіх рядків
function fetchAll($sql, $params = []) {
    return query($sql, $params)->fetchAll();
}
?>