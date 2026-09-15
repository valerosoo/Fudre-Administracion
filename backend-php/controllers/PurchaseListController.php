<?php

class PurchaseListController
{
    public function index(): void
    {
        $rows = Database::get()->query($this->baseQuery() . ' ORDER BY d.name, i.name')->fetchAll();
        Response::json(array_map([$this, 'toDto'], $rows));
    }

    public function create(): void
    {
        $body = Request::body();
        $priceListItemId = (int)($body['priceListItemId'] ?? 0);
        $quantity = (int)($body['quantity'] ?? 0);
        if ($quantity <= 0) {
            throw new BusinessException('La cantidad debe ser mayor a 0');
        }

        $db = Database::get();
        $stmt = $db->prepare('SELECT * FROM purchase_list_items WHERE price_list_item_id = :pli_id');
        $stmt->execute(['pli_id' => $priceListItemId]);
        $existing = $stmt->fetch();

        if ($existing !== false) {
            $newQty = (int)$existing['quantity'] + $quantity;
            $db->prepare('UPDATE purchase_list_items SET quantity = :qty WHERE id = :id')
                ->execute(['qty' => $newQty, 'id' => $existing['id']]);
            $id = (int)$existing['id'];
        } else {
            $db->prepare('INSERT INTO purchase_list_items (price_list_item_id, quantity) VALUES (:pli_id, :qty)')
                ->execute(['pli_id' => $priceListItemId, 'qty' => $quantity]);
            $id = (int)$db->lastInsertId();
        }

        Response::json($this->find($id), 201);
    }

    public function updateQty(string $id): void
    {
        $body = Request::body();
        $quantity = (int)($body['quantity'] ?? 0);

        if ($quantity <= 0) {
            Database::get()->prepare('DELETE FROM purchase_list_items WHERE id = :id')->execute(['id' => (int)$id]);
            Response::noContent();
            return;
        }

        Database::get()->prepare('UPDATE purchase_list_items SET quantity = :qty WHERE id = :id')
            ->execute(['qty' => $quantity, 'id' => (int)$id]);
        Response::json($this->find((int)$id));
    }

    public function delete(string $id): void
    {
        Database::get()->prepare('DELETE FROM purchase_list_items WHERE id = :id')->execute(['id' => (int)$id]);
        Response::noContent();
    }

    public function clear(): void
    {
        Database::get()->exec('DELETE FROM purchase_list_items');
        Response::noContent();
    }

    private function baseQuery(): string
    {
        return 'SELECT pl.*, i.name, i.grape, i.vintage_year, i.purchase_price, i.box_purchase_price, i.recommended_sale_price, i.image_url,
                        d.id as distributor_id, d.name as distributor_name, d.phone as distributor_phone, d.email as distributor_email
                 FROM purchase_list_items pl
                 JOIN price_list_items i ON i.id = pl.price_list_item_id
                 JOIN distributors d ON d.id = i.distributor_id';
    }

    private function find(int $id): array
    {
        $stmt = Database::get()->prepare($this->baseQuery() . ' WHERE pl.id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if ($row === false) {
            throw new NotFoundException("No se encontró el ítem del carrito $id");
        }
        return $this->toDto($row);
    }

    private function toDto(array $row): array
    {
        return [
            'id' => (int)$row['id'],
            'priceListItemId' => (int)$row['price_list_item_id'],
            'name' => $row['name'],
            'grape' => $row['grape'],
            'vintageYear' => $row['vintage_year'] !== null ? (int)$row['vintage_year'] : null,
            'purchasePrice' => $row['purchase_price'] !== null ? (float)$row['purchase_price'] : null,
            'boxPurchasePrice' => $row['box_purchase_price'] !== null ? (float)$row['box_purchase_price'] : null,
            'recommendedSalePrice' => $row['recommended_sale_price'] !== null ? (float)$row['recommended_sale_price'] : null,
            'imageUrl' => $row['image_url'],
            'distributorId' => (int)$row['distributor_id'],
            'distributorName' => $row['distributor_name'],
            'distributorPhone' => $row['distributor_phone'],
            'distributorEmail' => $row['distributor_email'],
            'quantity' => (int)$row['quantity'],
            'addedAt' => $row['added_at'] !== null ? str_replace(' ', 'T', $row['added_at']) : null,
        ];
    }
}
