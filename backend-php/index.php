<?php

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/Exceptions.php';

spl_autoload_register(function ($class) {
    foreach (['lib', 'controllers', 'services'] as $dir) {
        $path = __DIR__ . "/$dir/$class.php";
        if (is_file($path)) {
            require_once $path;
            return;
        }
    }
});

ErrorHandler::register();

// ---- CORS ----
header('Access-Control-Allow-Origin: ' . CORS_ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---- Path relativo a donde vive este index.php (soporta subfolder o subdominio) ----
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
$path = $scriptDir !== '' && str_starts_with($requestUri, $scriptDir)
    ? substr($requestUri, strlen($scriptDir))
    : $requestUri;
if ($path === '' || $path === false) {
    $path = '/';
}
if (strlen($path) > 1) {
    $path = rtrim($path, '/');
}

$router = new Router();

// ---- Auth ----
$router->add('POST', '/auth/login', 'AuthController', 'login', false);
$router->add('POST', '/auth/logout', 'AuthController', 'logout', false);

// ---- Health ----
$router->add('GET', '/health', 'HealthController', 'check', false);

// ---- Webhooks Tiendanube (protegidos por ?secret=, no por Bearer token) ----
$router->add('POST', '/webhooks/tiendanube', 'WebhookController', 'handle', false);
$router->add('POST', '/webhooks/tiendanube/orders', 'WebhookController', 'handle', false);

// ---- Wines ----
$router->add('GET', '/wines', 'WineController', 'index');
$router->add('GET', '/wines/{id}', 'WineController', 'show');
$router->add('POST', '/wines', 'WineController', 'create');
$router->add('PUT', '/wines/{id}', 'WineController', 'update');
$router->add('DELETE', '/wines/{id}', 'WineController', 'delete');
$router->add('POST', '/wines/{id}/image', 'WineController', 'uploadImage');

// ---- Members ----
// NOTA: /survey (frontend) es una demo pública sin login (se va a mover a Tiendanube más
// adelante) que usa estos mismos endpoints para buscar/crear el socio y guardar sus
// respuestas. Por eso todo el recurso /members queda sin exigir Bearer token, igual que
// el comportamiento actual del sistema (decisión explícita del usuario, no un descuido).
$router->add('GET', '/members', 'MemberController', 'index', false);
$router->add('GET', '/members/{id}', 'MemberController', 'show', false);
$router->add('POST', '/members', 'MemberController', 'create', false);
$router->add('PUT', '/members/{id}', 'MemberController', 'update', false);
$router->add('DELETE', '/members/{id}', 'MemberController', 'delete', false);
$router->add('POST', '/members/{memberId}/wine-ratings', 'MemberController', 'addWineRating', false);
$router->add('GET', '/members/{memberId}/wine-ratings', 'MemberController', 'wineRatings', false);
$router->add('GET', '/members/{memberId}/recommendations', 'MemberController', 'recommendations', false);
$router->add('PUT', '/members/{memberId}/survey', 'MemberController', 'survey', false);

// ---- Memberships ----
$router->add('GET', '/memberships', 'MembershipController', 'index');
$router->add('GET', '/memberships/member/{memberId}', 'MembershipController', 'byMember');
$router->add('GET', '/memberships/{id}', 'MembershipController', 'show');
$router->add('POST', '/memberships', 'MembershipController', 'create');
$router->add('PUT', '/memberships/{id}', 'MembershipController', 'update');
$router->add('DELETE', '/memberships/{id}', 'MembershipController', 'delete');

// ---- Shipments ----
$router->add('GET', '/shipments', 'ShipmentController', 'index');
$router->add('GET', '/shipments/member/{memberId}', 'ShipmentController', 'byMember');
$router->add('GET', '/shipments/type/{type}', 'ShipmentController', 'byType');
$router->add('GET', '/shipments/{id}', 'ShipmentController', 'show');
$router->add('POST', '/shipments/generate-proposals', 'ShipmentController', 'generateProposals');
$router->add('POST', '/shipments/{id}/confirm', 'ShipmentController', 'confirm');
$router->add('POST', '/shipments/{id}/cancel', 'ShipmentController', 'cancel');
$router->add('POST', '/shipments', 'ShipmentController', 'create');
$router->add('DELETE', '/shipments/{id}', 'ShipmentController', 'delete');

// ---- Orders ----
$router->add('GET', '/orders', 'OrderController', 'index');
$router->add('POST', '/orders/import', 'OrderController', 'importOrder');
$router->add('POST', '/orders/{id}/items', 'OrderController', 'addItem');
$router->add('PUT', '/orders/{orderId}/items/{itemId}/status', 'OrderController', 'updateItemStatus');
$router->add('PUT', '/orders/{orderId}/items/{itemId}', 'OrderController', 'updateItemQty');
$router->add('DELETE', '/orders/{orderId}/items/{itemId}', 'OrderController', 'removeItem');
$router->add('PUT', '/orders/{id}/status', 'OrderController', 'updateStatus');
$router->add('POST', '/orders', 'OrderController', 'createFromPurchaseList');
$router->add('DELETE', '/orders/{id}', 'OrderController', 'delete');

// ---- Price list ----
$router->add('GET', '/price-list', 'PriceListController', 'index');
$router->add('POST', '/price-list/upsert', 'PriceListController', 'upsert');

// ---- Purchase list ----
$router->add('GET', '/purchase-list', 'PurchaseListController', 'index');
$router->add('POST', '/purchase-list', 'PurchaseListController', 'create');
$router->add('PUT', '/purchase-list/{id}', 'PurchaseListController', 'updateQty');
$router->add('DELETE', '/purchase-list/{id}', 'PurchaseListController', 'delete');
$router->add('DELETE', '/purchase-list', 'PurchaseListController', 'clear');

// ---- Import con IA (reemplaza import_service Python) ----
$router->add('GET', '/import-uploads/{filename}', 'ImportController', 'serveUpload', false);
$router->add('POST', '/import/{entity}', 'ImportController', 'preview');
$router->add('POST', '/import/{entity}/confirm', 'ImportController', 'confirm');

$router->dispatch($_SERVER['REQUEST_METHOD'], $path);
