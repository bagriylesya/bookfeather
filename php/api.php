<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Шлях до файлу з книгами
$booksFile = 'books.json';

// Отримання методу запиту
$method = $_SERVER['REQUEST_METHOD'];

// Функція для читання книг
function getBooks() {
    global $booksFile;
    if (file_exists($booksFile)) {
        $json = file_get_contents($booksFile);
        return json_decode($json, true);
    }
    return [];
}

// Функція для збереження книг
function saveBooks($books) {
    global $booksFile;
    $json = json_encode($books, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    file_put_contents($booksFile, $json);
}

// Обробка запитів
switch ($method) {
    case 'GET':
        // Отримання всіх книг або однієї книги за ID
        $books = getBooks();
        
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $book = array_filter($books, function($b) use ($id) {
                return $b['id'] == $id;
            });
            echo json_encode(array_values($book)[0] ?? null);
        } else {
            echo json_encode($books);
        }
        break;
        
    case 'POST':
        // Додавання нової книги
        $books = getBooks();
        $newBook = json_decode(file_get_contents('php://input'), true);
        
        // Генеруємо новий ID
        $maxId = 0;
        foreach ($books as $book) {
            if ($book['id'] > $maxId) {
                $maxId = $book['id'];
            }
        }
        $newBook['id'] = $maxId + 1;
        
        $books[] = $newBook;
        saveBooks($books);
        
        echo json_encode([
            'success' => true,
            'message' => 'Книгу додано',
            'book' => $newBook
        ]);
        break;
        
    case 'PUT':
        // Оновлення книги
        $books = getBooks();
        $updatedBook = json_decode(file_get_contents('php://input'), true);
        
        foreach ($books as $key => $book) {
            if ($book['id'] == $updatedBook['id']) {
                $books[$key] = $updatedBook;
                saveBooks($books);
                echo json_encode([
                    'success' => true,
                    'message' => 'Книгу оновлено'
                ]);
                exit;
            }
        }
        
        echo json_encode([
            'success' => false,
            'message' => 'Книгу не знайдено'
        ]);
        break;
        
    case 'DELETE':
        // Видалення книги
        $books = getBooks();
        
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $books = array_filter($books, function($b) use ($id) {
                return $b['id'] != $id;
            });
            
            saveBooks(array_values($books));
            
            echo json_encode([
                'success' => true,
                'message' => 'Книгу видалено'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'ID не вказано'
            ]);
        }
        break;
        
    default:
        echo json_encode([
            'success' => false,
            'message' => 'Метод не підтримується'
        ]);
        break;
}
?>