<?php

class MemberController
{
    public function index(): void
    {
        $stmt = Database::get()->query('SELECT * FROM members ORDER BY id');
        $members = array_map(fn($row) => $this->toDto($row, false), $stmt->fetchAll());
        Response::json($members);
    }

    public function show(string $id): void
    {
        Response::json($this->toDto($this->find((int)$id), true));
    }

    public function create(): void
    {
        Response::json($this->createData(Request::body()), 201);
    }

    /** Reutilizado por ImportController::confirm() para el entity "members". */
    public function createData(array $body): array
    {
        $email = $body['email'] ?? null;

        $stmt = Database::get()->prepare('SELECT id FROM members WHERE email = :email');
        $stmt->execute(['email' => $email]);
        if ($stmt->fetch() !== false) {
            throw new BusinessException("Ya existe un miembro con el email: $email");
        }

        $stmt = Database::get()->prepare(
            'INSERT INTO members (name, email, phone, delivery_address, wine_style, wine_types, open_to_new, occasions, knowledge, frequency, budget)
             VALUES (:name, :email, :phone, :delivery_address, :wine_style, :wine_types, :open_to_new, :occasions, :knowledge, :frequency, :budget)'
        );
        $stmt->execute([
            'name' => $body['name'] ?? 'Sin Nombre',
            'email' => $email,
            'phone' => $body['phone'] ?? null,
            'delivery_address' => $body['deliveryAddress'] ?? null,
            'wine_style' => $body['wineStyle'] ?? null,
            'wine_types' => $body['wineTypes'] ?? null,
            'open_to_new' => isset($body['openToNew']) ? (int)(bool)$body['openToNew'] : null,
            'occasions' => $body['occasions'] ?? null,
            'knowledge' => $body['knowledge'] ?? null,
            'frequency' => $body['frequency'] ?? null,
            'budget' => $body['budget'] ?? null,
        ]);
        $id = (int)Database::get()->lastInsertId();
        return $this->toDto($this->find($id), false);
    }

    public function update(string $id): void
    {
        $memberId = (int)$id;
        $member = $this->find($memberId);
        $body = Request::body();

        $fields = [
            'name' => 'name', 'email' => 'email', 'phone' => 'phone',
            'deliveryAddress' => 'delivery_address', 'wineStyle' => 'wine_style',
            'wineTypes' => 'wine_types', 'occasions' => 'occasions',
            'knowledge' => 'knowledge', 'frequency' => 'frequency', 'budget' => 'budget',
        ];
        $set = [];
        $params = ['id' => $memberId];
        foreach ($fields as $jsonKey => $column) {
            if (array_key_exists($jsonKey, $body) && $body[$jsonKey] !== null) {
                $set[] = "$column = :$column";
                $params[$column] = $body[$jsonKey];
            }
        }
        if (array_key_exists('openToNew', $body) && $body['openToNew'] !== null) {
            $set[] = 'open_to_new = :open_to_new';
            $params['open_to_new'] = (int)(bool)$body['openToNew'];
        }

        if (!empty($set)) {
            $sql = 'UPDATE members SET ' . implode(', ', $set) . ' WHERE id = :id';
            Database::get()->prepare($sql)->execute($params);
        }

        Response::json($this->toDto($this->find($memberId), false));
    }

    public function delete(string $id): void
    {
        Database::get()->prepare('DELETE FROM members WHERE id = :id')->execute(['id' => (int)$id]);
        Response::noContent();
    }

    public function addWineRating(string $memberId): void
    {
        $memberId = (int)$memberId;
        $body = Request::body();
        $wineId = (int)($body['wineId'] ?? 0);
        $rating = (int)($body['rating'] ?? 0);
        $notes = $body['notes'] ?? null;

        $db = Database::get();
        $stmt = $db->prepare('SELECT id FROM wine_ratings WHERE member_id = :member_id AND wine_id = :wine_id');
        $stmt->execute(['member_id' => $memberId, 'wine_id' => $wineId]);
        $existing = $stmt->fetch();

        if ($existing !== false) {
            $db->prepare('UPDATE wine_ratings SET rating = :rating, notes = :notes WHERE id = :id')
                ->execute(['rating' => $rating, 'notes' => $notes, 'id' => $existing['id']]);
            $ratingId = (int)$existing['id'];
        } else {
            $db->prepare('INSERT INTO wine_ratings (member_id, wine_id, rating, notes) VALUES (:member_id, :wine_id, :rating, :notes)')
                ->execute(['member_id' => $memberId, 'wine_id' => $wineId, 'rating' => $rating, 'notes' => $notes]);
            $ratingId = (int)$db->lastInsertId();
        }

        Response::json($this->wineRatingDto($ratingId));
    }

    public function wineRatings(string $memberId): void
    {
        $stmt = Database::get()->prepare(
            'SELECT wr.*, w.name as wine_name FROM wine_ratings wr JOIN wines w ON w.id = wr.wine_id
             WHERE wr.member_id = :member_id ORDER BY wr.id'
        );
        $stmt->execute(['member_id' => (int)$memberId]);
        $ratings = array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'memberId' => (int)$row['member_id'],
                'wineId' => (int)$row['wine_id'],
                'wineName' => $row['wine_name'],
                'rating' => (int)$row['rating'],
                'notes' => $row['notes'],
                'ratedAt' => str_replace(' ', 'T', $row['rated_at']),
            ];
        }, $stmt->fetchAll());
        Response::json($ratings);
    }

    public function recommendations(string $memberId): void
    {
        $service = new RecommendationService();
        Response::json($service->getRecommendations((int)$memberId));
    }

    public function survey(string $memberId): void
    {
        $memberId = (int)$memberId;
        $member = $this->find($memberId);
        $body = Request::body();

        $fields = [
            'phone' => 'phone', 'deliveryAddress' => 'delivery_address', 'wineStyle' => 'wine_style',
            'wineTypes' => 'wine_types', 'occasions' => 'occasions', 'knowledge' => 'knowledge',
            'frequency' => 'frequency', 'budget' => 'budget',
        ];
        $set = ['survey_completed_at = NOW()'];
        $params = ['id' => $memberId];
        foreach ($fields as $jsonKey => $column) {
            if (array_key_exists($jsonKey, $body) && $body[$jsonKey] !== null) {
                $set[] = "$column = :$column";
                $params[$column] = $body[$jsonKey];
            }
        }
        if (array_key_exists('openToNew', $body) && $body['openToNew'] !== null) {
            $set[] = 'open_to_new = :open_to_new';
            $params['open_to_new'] = (int)(bool)$body['openToNew'];
        }
        Database::get()->prepare('UPDATE members SET ' . implode(', ', $set) . ' WHERE id = :id')->execute($params);

        if (isset($body['grapeRatings']) && is_array($body['grapeRatings'])) {
            $db = Database::get();
            $db->prepare('DELETE FROM member_grape_ratings WHERE member_id = :id')->execute(['id' => $memberId]);
            $insert = $db->prepare('INSERT INTO member_grape_ratings (member_id, grape, rating) VALUES (:member_id, :grape, :rating)');
            foreach ($body['grapeRatings'] as $grape => $rating) {
                $rating = (int)$rating;
                if ($rating >= 1 && $rating <= 5) {
                    $insert->execute(['member_id' => $memberId, 'grape' => $grape, 'rating' => $rating]);
                }
            }
        }

        $member = $this->find($memberId);
        Mailer::sendSurveyWelcome($member);

        Response::json($this->toDto($member, true));
    }

    private function find(int $id): array
    {
        $stmt = Database::get()->prepare('SELECT * FROM members WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $member = $stmt->fetch();
        if ($member === false) {
            throw new NotFoundException("No se encontró el miembro $id");
        }
        return $member;
    }

    private function wineRatingDto(int $ratingId): array
    {
        $stmt = Database::get()->prepare(
            'SELECT wr.*, w.name as wine_name FROM wine_ratings wr JOIN wines w ON w.id = wr.wine_id WHERE wr.id = :id'
        );
        $stmt->execute(['id' => $ratingId]);
        $row = $stmt->fetch();
        return [
            'id' => (int)$row['id'],
            'memberId' => (int)$row['member_id'],
            'wineId' => (int)$row['wine_id'],
            'wineName' => $row['wine_name'],
            'rating' => (int)$row['rating'],
            'notes' => $row['notes'],
            'ratedAt' => str_replace(' ', 'T', $row['rated_at']),
        ];
    }

    private function toDto(array $row, bool $includeGrapeRatings): array
    {
        $dto = [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'deliveryAddress' => $row['delivery_address'],
            'wineStyle' => $row['wine_style'],
            'wineTypes' => $row['wine_types'],
            'openToNew' => $row['open_to_new'] !== null ? (bool)$row['open_to_new'] : null,
            'occasions' => $row['occasions'],
            'knowledge' => $row['knowledge'],
            'frequency' => $row['frequency'],
            'budget' => $row['budget'],
            'surveyCompletedAt' => $row['survey_completed_at'] !== null ? str_replace(' ', 'T', $row['survey_completed_at']) : null,
            'createdAt' => $row['created_at'] !== null ? str_replace(' ', 'T', $row['created_at']) : null,
            'grapeRatings' => null,
        ];

        if ($includeGrapeRatings) {
            $stmt = Database::get()->prepare('SELECT id, grape, rating FROM member_grape_ratings WHERE member_id = :id');
            $stmt->execute(['id' => $row['id']]);
            $dto['grapeRatings'] = array_map(fn($r) => [
                'id' => (int)$r['id'], 'grape' => $r['grape'], 'rating' => (int)$r['rating'],
            ], $stmt->fetchAll());
        }

        return $dto;
    }
}
