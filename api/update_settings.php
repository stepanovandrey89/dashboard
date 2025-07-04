<?php
// Включаем отображение ошибок для отладки
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Логирование для отладки
error_log("API вызван: " . $_SERVER['REQUEST_METHOD']);

// Обработка preflight запроса
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    error_log("OPTIONS запрос обработан");
    exit();
}

// Проверяем метод запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    error_log("Неверный метод: " . $_SERVER['REQUEST_METHOD']);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Получаем данные из запроса
$input = file_get_contents('php://input');
error_log("Входные данные: " . $input);

$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    error_log("Ошибка декодирования JSON: " . json_last_error_msg());
    echo json_encode(['error' => 'Invalid JSON']);
    exit();
}

// Валидация данных
$coreTemp = isset($data['coreTemperatureThreshold']) ? intval($data['coreTemperatureThreshold']) : null;
$memoryTemp = isset($data['memoryTemperatureThreshold']) ? intval($data['memoryTemperatureThreshold']) : null;

if ($coreTemp === null || $memoryTemp === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit();
}

// Валидация диапазонов
if ($coreTemp < 70 || $coreTemp > 100) {
    http_response_code(400);
    echo json_encode(['error' => 'Core temperature must be between 70-100°C']);
    exit();
}

if ($memoryTemp < 80 || $memoryTemp > 110) {
    http_response_code(400);
    echo json_encode(['error' => 'Memory temperature must be between 80-110°C']);
    exit();
}

// Подготавливаем данные для сохранения
$settings = [
    'coreTemperatureThreshold' => $coreTemp,
    'memoryTemperatureThreshold' => $memoryTemp,
    'lastUpdated' => date('c'), // ISO 8601 format
    'updatedBy' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
];

// Путь к файлу настроек
$settingsFile = '../data/global_settings.json';

error_log("Путь к файлу: " . realpath($settingsFile));

// Создаем директорию если не существует
$dir = dirname($settingsFile);
if (!is_dir($dir)) {
    error_log("Создание директории: " . $dir);
    mkdir($dir, 0755, true);
}

// Сохраняем настройки
$result = file_put_contents($settingsFile, json_encode($settings, JSON_PRETTY_PRINT));

error_log("Результат записи: " . ($result !== false ? "успех" : "ошибка"));

if ($result === false) {
    http_response_code(500);
    error_log("Не удалось записать файл");
    echo json_encode(['error' => 'Failed to save settings']);
    exit();
}

error_log("Настройки успешно сохранены");

// Возвращаем успешный ответ
echo json_encode([
    'success' => true,
    'message' => 'Settings updated successfully',
    'settings' => $settings
]);
?>