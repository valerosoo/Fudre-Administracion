<?php

/** Reemplaza a import_service/main.py (Python/Flask) completo. */
class ImportController
{
    private const VALID_ENTITIES = ['wines', 'members', 'memberships', 'shipments', 'price_list', 'order'];

    public function serveUpload(string $filename): void
    {
        if (str_contains($filename, '..') || str_contains($filename, '/') || str_contains($filename, '\\')) {
            throw new NotFoundException('Archivo no encontrado');
        }
        $path = UPLOADS_DIR . '/imported/' . $filename;
        if (!is_file($path)) {
            throw new NotFoundException('Archivo no encontrado');
        }
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $mime = match ($ext) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            default => 'application/octet-stream',
        };
        header("Content-Type: $mime");
        readfile($path);
        exit;
    }

    public function preview(string $entity): void
    {
        if (!in_array($entity, self::VALID_ENTITIES, true)) {
            throw new BusinessException("Entity de import desconocida: $entity");
        }
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            throw new BusinessException('No se recibió el archivo');
        }

        $bytes = file_get_contents($_FILES['file']['tmp_name']);
        $filename = $_FILES['file']['name'] ?? '';

        $input = ImportExtractor::build($bytes, $filename);
        $content = $input['content'];
        $attachments = $input['attachments'];
        $imageCandidates = array_values(array_filter(array_map(fn($a) => $a['url'] ?? null, $attachments)));

        if ($content === '' && empty($attachments)) {
            throw new BusinessException('El archivo esta vacio o no se pudo leer');
        }

        $prompt = ImportPrompts::get($entity, $content);
        $raw = ClaudeClient::complete($prompt, $attachments);
        $data = JsonExtractor::extract($raw);

        switch ($entity) {
            case 'price_list':
                $normalized = $this->normalizePriceListData(self::isAssoc($data) ? $data : []);
                Response::json([
                    'entity' => $entity,
                    'distributor' => $normalized['distributor'],
                    'items' => $normalized['items'],
                    'count' => count($normalized['items']),
                    'imageCandidates' => $imageCandidates,
                ]);
                return;

            case 'order':
                $dataArr = self::isAssoc($data) ? $data : [];
                $items = $dataArr['items'] ?? [];
                Response::json([
                    'entity' => $entity,
                    'distributor' => $dataArr['distributor'] ?? [],
                    'items' => $items,
                    'count' => count($items),
                ]);
                return;

            case 'members':
                $dataArr = self::isAssoc($data) ? $data : [];
                $members = $dataArr['members'] ?? [];
                Response::json([
                    'entity' => 'members',
                    'members' => $members,
                    'memberships' => $dataArr['memberships'] ?? [],
                    'count' => count($members),
                ]);
                return;

            default:
                $list = self::isAssoc($data) ? [$data] : $data;
                Response::json(['entity' => $entity, 'preview' => $list, 'count' => count($list)]);
        }
    }

    public function confirm(string $entity): void
    {
        if (!in_array($entity, self::VALID_ENTITIES, true)) {
            throw new BusinessException("Entity de import desconocida: $entity");
        }
        $body = Request::body();
        $success = 0;
        $errors = [];

        switch ($entity) {
            case 'price_list':
                $result = (new PriceListController())->upsertData($body['distributor'] ?? [], $body['items'] ?? []);
                $success = count($result);
                break;

            case 'order':
                $order = (new OrderController())->importOrderData($body['distributor'] ?? [], $body['items'] ?? []);
                $success = count($order['items']);
                break;

            case 'members':
                [$success, $errors] = $this->confirmMembers($body);
                break;

            case 'shipments':
                foreach ($body['items'] ?? [] as $item) {
                    try {
                        $this->confirmShipmentItem($item);
                        $success++;
                    } catch (Throwable $e) {
                        $errors[] = $e->getMessage();
                    }
                }
                break;

            default: // wines, memberships
                $controller = $entity === 'wines' ? new WineController() : new MembershipController();
                foreach ($body['items'] ?? [] as $item) {
                    try {
                        $controller->createData($item);
                        $success++;
                    } catch (Throwable $e) {
                        $errors[] = $e->getMessage();
                    }
                }
        }

        Response::json(['success' => $success, 'errors' => $errors]);
    }

    private function confirmMembers(array $body): array
    {
        $db = Database::get();
        $existing = [];
        foreach ($db->query('SELECT id, name FROM members')->fetchAll() as $row) {
            $existing[$row['name']] = (int)$row['id'];
        }

        $success = 0;
        $errors = [];
        $memberController = new MemberController();

        foreach ($body['members'] ?? [] as $memberData) {
            try {
                $dto = $memberController->createData($memberData);
                $existing[$memberData['name'] ?? ''] = $dto['id'];
                $success++;
            } catch (Throwable $e) {
                $errors[] = $e->getMessage();
            }
        }

        $membershipController = new MembershipController();
        foreach ($body['memberships'] ?? [] as $membershipData) {
            $memberName = $membershipData['memberName'] ?? '';
            unset($membershipData['memberName']);
            if (!isset($existing[$memberName])) {
                $errors[] = "No se encontró miembro: $memberName";
                continue;
            }
            try {
                $membershipData['memberId'] = $existing[$memberName];
                $membershipController->createData($membershipData);
                $success++;
            } catch (Throwable $e) {
                $errors[] = $e->getMessage();
            }
        }

        return [$success, $errors];
    }

    private function confirmShipmentItem(array $item): void
    {
        $memberName = $item['memberName'] ?? '';
        $db = Database::get();

        $stmt = $db->prepare('SELECT * FROM members WHERE name = :name LIMIT 1');
        $stmt->execute(['name' => $memberName]);
        $member = $stmt->fetch();
        if ($member === false) {
            throw new NotFoundException("No se encontró miembro: $memberName");
        }

        $stmt = $db->prepare("SELECT id FROM memberships WHERE member_id = :id AND status = 'ACTIVE' LIMIT 1");
        $stmt->execute(['id' => $member['id']]);
        $membership = $stmt->fetch();
        if ($membership === false) {
            throw new BusinessException("El miembro $memberName no tiene una membresía activa");
        }

        $items = [];
        foreach ($item['items'] ?? [] as $wineItem) {
            $wineName = $wineItem['wineName'] ?? '';
            $stmt = $db->prepare('SELECT id, reference_price FROM wines WHERE LOWER(name) = LOWER(:name) LIMIT 1');
            $stmt->execute(['name' => $wineName]);
            $wine = $stmt->fetch();
            if ($wine === false) {
                continue;
            }
            $items[] = [
                'wineId' => (int)$wine['id'],
                'quantity' => (int)($wineItem['quantity'] ?? 1),
                'unitPrice' => $wineItem['unitPrice'] ?? $wine['reference_price'],
            ];
        }

        (new ShipmentController())->createData([
            'memberId' => (int)$member['id'],
            'membershipId' => (int)$membership['id'],
            'shippedAt' => $item['shippedAt'] ?? null,
            'shippingCost' => $item['shippingCost'] ?? null,
            'notes' => $item['notes'] ?? null,
            'items' => $items,
        ]);
    }

    private function normalizePriceListData(array $data): array
    {
        $distributor = is_array($data['distributor'] ?? null) ? $data['distributor'] : [];
        $items = is_array($data['items'] ?? null) ? $data['items'] : [];

        $mapped = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }
            $mapped[] = [
                'name' => $item['name'] ?? null,
                'grape' => $item['grape'] ?? null,
                'vintageYear' => $item['vintageYear'] ?? null,
                'purchasePrice' => $item['purchasePrice'] ?? null,
                'boxPurchasePrice' => $item['boxPurchasePrice'] ?? null,
                'recommendedSalePrice' => $item['recommendedSalePrice'] ?? null,
                'imageUrl' => $item['imageUrl'] ?? null,
            ];
        }

        return [
            'distributor' => [
                'name' => trim($distributor['name'] ?? '') ?: 'Distribuidor Desconocido',
                'phone' => $distributor['phone'] ?? null,
                'email' => $distributor['email'] ?? null,
            ],
            'items' => $mapped,
        ];
    }

    private static function isAssoc($value): bool
    {
        if (!is_array($value) || empty($value)) {
            return false;
        }
        return array_keys($value) !== range(0, count($value) - 1);
    }
}
