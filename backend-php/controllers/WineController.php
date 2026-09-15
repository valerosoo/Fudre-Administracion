<?php

class WineController
{
    public function index(): void
    {
        $stmt = Database::get()->query('SELECT * FROM wines ORDER BY id');
        $wines = array_map([$this, 'toDto'], $stmt->fetchAll());
        Response::json($wines);
    }

    public function show(string $id): void
    {
        Response::json($this->toDto($this->find((int)$id)));
    }

    public function create(): void
    {
        Response::json($this->createData(Request::body()), 201);
    }

    /** Reutilizado por ImportController::confirm() para el entity "wines". */
    public function createData(array $body): array
    {
        $stockGondola = (int)($body['stockGondola'] ?? 0);
        $stockCuartito = (int)($body['stockCuartito'] ?? 0);
        $isClubEligible = (bool)($body['isClubEligible'] ?? false);

        $db = Database::get();
        $stmt = $db->prepare(
            'INSERT INTO wines (name, grape, vintage_year, stock_gondola, stock_cuartito, reference_price, is_club_eligible, upload_status)
             VALUES (:name, :grape, :vintage_year, :stock_gondola, :stock_cuartito, :reference_price, :is_club_eligible, :upload_status)'
        );
        $stmt->execute([
            'name' => $body['name'] ?? null,
            'grape' => $body['grape'] ?? null,
            'vintage_year' => $body['vintageYear'] ?? null,
            'stock_gondola' => $stockGondola,
            'stock_cuartito' => $stockCuartito,
            'reference_price' => $body['referencePrice'] ?? null,
            'is_club_eligible' => $isClubEligible ? 1 : 0,
            'upload_status' => 'PENDING',
        ]);
        $id = (int)$db->lastInsertId();
        $wine = $this->find($id);

        try {
            $totalStock = $stockGondola + $stockCuartito;
            [$productId, $variantId] = TiendanubeClient::createProduct(
                $wine['name'],
                $wine['reference_price'] !== null ? (float)$wine['reference_price'] : null,
                $totalStock
            );
            $update = $db->prepare(
                'UPDATE wines SET tiendanube_product_id = :pid, tiendanube_variant_id = :vid, upload_status = :status WHERE id = :id'
            );
            $update->execute(['pid' => $productId, 'vid' => $variantId, 'status' => 'UPLOADED', 'id' => $id]);
            $wine = $this->find($id);
        } catch (Throwable $e) {
            Logger::warn("No se pudo crear el producto en Tiendanube (wine $id): " . $e->getMessage());
        }

        return $this->toDto($wine);
    }

    public function update(string $id): void
    {
        $wineId = (int)$id;
        $wine = $this->find($wineId);
        $body = Request::body();

        $name = array_key_exists('name', $body) ? $body['name'] : $wine['name'];
        $grape = array_key_exists('grape', $body) ? $body['grape'] : $wine['grape'];
        $vintageYear = array_key_exists('vintageYear', $body) ? $body['vintageYear'] : $wine['vintage_year'];
        $stockGondola = array_key_exists('stockGondola', $body)
            ? (int)($body['stockGondola'] ?? 0)
            : (int)$wine['stock_gondola'];
        $stockCuartito = array_key_exists('stockCuartito', $body)
            ? (int)($body['stockCuartito'] ?? 0)
            : (int)$wine['stock_cuartito'];
        $referencePrice = array_key_exists('referencePrice', $body) ? $body['referencePrice'] : $wine['reference_price'];
        $isClubEligible = array_key_exists('isClubEligible', $body)
            ? (bool)($body['isClubEligible'] ?? false)
            : (bool)$wine['is_club_eligible'];

        $db = Database::get();
        $stmt = $db->prepare(
            'UPDATE wines SET name = :name, grape = :grape, vintage_year = :vintage_year,
             stock_gondola = :stock_gondola, stock_cuartito = :stock_cuartito,
             reference_price = :reference_price, is_club_eligible = :is_club_eligible
             WHERE id = :id'
        );
        $stmt->execute([
            'name' => $name,
            'grape' => $grape,
            'vintage_year' => $vintageYear,
            'stock_gondola' => $stockGondola,
            'stock_cuartito' => $stockCuartito,
            'reference_price' => $referencePrice,
            'is_club_eligible' => $isClubEligible ? 1 : 0,
            'id' => $wineId,
        ]);
        $wine = $this->find($wineId);

        if (!empty($wine['tiendanube_product_id']) && !empty($wine['tiendanube_variant_id'])) {
            try {
                $totalStock = $stockGondola + $stockCuartito;
                TiendanubeClient::updateProduct(
                    $wine['tiendanube_product_id'],
                    $wine['tiendanube_variant_id'],
                    $name,
                    $referencePrice !== null ? (float)$referencePrice : null,
                    $totalStock
                );
                $db->prepare('UPDATE wines SET upload_status = :status WHERE id = :id')
                    ->execute(['status' => 'UPLOADED', 'id' => $wineId]);
                $wine = $this->find($wineId);
            } catch (Throwable $e) {
                Logger::warn("No se pudo actualizar el producto en Tiendanube (wine $wineId): " . $e->getMessage());
            }
        }

        Response::json($this->toDto($wine));
    }

    public function delete(string $id): void
    {
        $wineId = (int)$id;
        $wine = $this->find($wineId);

        if (!empty($wine['tiendanube_product_id'])) {
            try {
                TiendanubeClient::deleteProduct($wine['tiendanube_product_id']);
            } catch (Throwable $e) {
                Logger::warn("No se pudo borrar el producto en Tiendanube (wine $wineId): " . $e->getMessage());
            }
        }

        Database::get()->prepare('DELETE FROM wines WHERE id = :id')->execute(['id' => $wineId]);
        Response::noContent();
    }

    public function uploadImage(string $id): void
    {
        $wineId = (int)$id;
        $wine = $this->find($wineId);

        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            throw new BusinessException('No se recibió el archivo de imagen');
        }

        $originalName = $_FILES['file']['name'] ?? '';
        $dotPos = strrpos($originalName, '.');
        $ext = $dotPos !== false ? substr($originalName, $dotPos + 1) : 'jpg';
        $filename = 'wine_' . $wineId . '_' . substr(bin2hex(random_bytes(4)), 0, 8) . '.' . $ext;

        $dir = UPLOADS_DIR . '/wines';
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        move_uploaded_file($_FILES['file']['tmp_name'], $dir . '/' . $filename);

        $publicUrl = SERVER_BASE_URL . '/uploads/wines/' . $filename;
        Database::get()->prepare('UPDATE wines SET image_url = :url WHERE id = :id')
            ->execute(['url' => $publicUrl, 'id' => $wineId]);
        $wine = $this->find($wineId);

        if (!empty($wine['tiendanube_product_id'])) {
            try {
                TiendanubeClient::uploadProductImage($wine['tiendanube_product_id'], $publicUrl);
            } catch (Throwable $e) {
                Logger::warn("No se pudo subir la imagen a Tiendanube (wine $wineId): " . $e->getMessage());
            }
        }

        Response::json($this->toDto($wine));
    }

    private function find(int $id): array
    {
        $stmt = Database::get()->prepare('SELECT * FROM wines WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $wine = $stmt->fetch();
        if ($wine === false) {
            throw new NotFoundException("No se encontró el vino $id");
        }
        return $wine;
    }

    private function toDto(array $row): array
    {
        $stockGondola = (int)$row['stock_gondola'];
        $stockCuartito = (int)$row['stock_cuartito'];
        return [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'grape' => $row['grape'],
            'vintageYear' => $row['vintage_year'] !== null ? (int)$row['vintage_year'] : null,
            'stockGondola' => $stockGondola,
            'stockCuartito' => $stockCuartito,
            'stockTotal' => $stockGondola + $stockCuartito,
            'referencePrice' => $row['reference_price'] !== null ? (float)$row['reference_price'] : null,
            'category' => $row['category'],
            'isClubEligible' => (bool)$row['is_club_eligible'],
            'tiendanubeProductId' => $row['tiendanube_product_id'],
            'tiendanubeVariantId' => $row['tiendanube_variant_id'],
            'uploadStatus' => $row['upload_status'],
            'imageUrl' => $row['image_url'],
        ];
    }
}
