<?php

class PriceListController
{
    public function index(): void
    {
        $rows = Database::get()->query($this->baseQuery() . ' ORDER BY d.name, pli.name')->fetchAll();
        Response::json(array_map([$this, 'toDto'], $rows));
    }

    public function upsert(): void
    {
        $body = Request::body();
        Response::json($this->upsertData($body['distributor'] ?? [], $body['items'] ?? []));
    }

    /** Reutilizado por ImportController::confirm() para el entity "price_list". */
    public function upsertData(array $distributorInput, array $items): array
    {
        $name = trim($distributorInput['name'] ?? '');
        if ($name === '') {
            $name = 'Distribuidor Desconocido';
        }

        $db = Database::get();
        $stmt = $db->prepare('SELECT * FROM distributors WHERE name = :name');
        $stmt->execute(['name' => $name]);
        $distributor = $stmt->fetch();
        if ($distributor === false) {
            $db->prepare('INSERT INTO distributors (name, phone, email) VALUES (:name, :phone, :email)')
                ->execute(['name' => $name, 'phone' => $distributorInput['phone'] ?? null, 'email' => $distributorInput['email'] ?? null]);
            $distributorId = (int)$db->lastInsertId();
        } else {
            $distributorId = (int)$distributor['id'];
        }

        $result = [];
        foreach ($items as $item) {
            $itemName = trim($item['name'] ?? '');
            if ($itemName === '') {
                continue;
            }
            $vintageYear = $item['vintageYear'] ?? null;

            $stmt = $db->prepare(
                'SELECT id FROM price_list_items WHERE distributor_id = :distributor_id AND name = :name AND vintage_year <=> :year'
            );
            $stmt->execute(['distributor_id' => $distributorId, 'name' => $itemName, 'year' => $vintageYear]);
            $existing = $stmt->fetch();

            $params = [
                'distributor_id' => $distributorId,
                'name' => $itemName,
                'grape' => $item['grape'] ?? null,
                'year' => $vintageYear,
                'price' => $item['purchasePrice'] ?? null,
                'box_price' => $item['boxPurchasePrice'] ?? null,
                'sale_price' => $item['recommendedSalePrice'] ?? null,
                'image_url' => $item['imageUrl'] ?? null,
            ];

            if ($existing !== false) {
                $params['id'] = $existing['id'];
                $db->prepare(
                    'UPDATE price_list_items SET grape = :grape, vintage_year = :year, purchase_price = :price,
                     box_purchase_price = :box_price, recommended_sale_price = :sale_price, image_url = :image_url, updated_at = NOW()
                     WHERE id = :id'
                )->execute($params);
                $id = (int)$existing['id'];
            } else {
                $db->prepare(
                    'INSERT INTO price_list_items (distributor_id, name, grape, vintage_year, purchase_price, box_purchase_price, recommended_sale_price, image_url, updated_at)
                     VALUES (:distributor_id, :name, :grape, :year, :price, :box_price, :sale_price, :image_url, NOW())'
                )->execute($params);
                $id = (int)$db->lastInsertId();
            }

            $stmt = $db->prepare($this->baseQuery() . ' WHERE pli.id = :id');
            $stmt->execute(['id' => $id]);
            $result[] = $this->toDto($stmt->fetch());
        }

        return $result;
    }

    private function baseQuery(): string
    {
        return 'SELECT pli.*, d.name as distributor_name, d.phone as distributor_phone, d.email as distributor_email
                FROM price_list_items pli JOIN distributors d ON d.id = pli.distributor_id';
    }

    private function toDto(array $row): array
    {
        return [
            'id' => (int)$row['id'],
            'distributorId' => (int)$row['distributor_id'],
            'distributorName' => $row['distributor_name'],
            'distributorPhone' => $row['distributor_phone'],
            'distributorEmail' => $row['distributor_email'],
            'name' => $row['name'],
            'grape' => $row['grape'],
            'vintageYear' => $row['vintage_year'] !== null ? (int)$row['vintage_year'] : null,
            'purchasePrice' => $row['purchase_price'] !== null ? (float)$row['purchase_price'] : null,
            'boxPurchasePrice' => $row['box_purchase_price'] !== null ? (float)$row['box_purchase_price'] : null,
            'recommendedSalePrice' => $row['recommended_sale_price'] !== null ? (float)$row['recommended_sale_price'] : null,
            'imageUrl' => $row['image_url'],
            'updatedAt' => $row['updated_at'] !== null ? str_replace(' ', 'T', $row['updated_at']) : null,
        ];
    }
}
