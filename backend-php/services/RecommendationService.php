<?php

class RecommendationService
{
    private const WINES_PER_PLAN = [
        'BROTE' => 2,
        'BROTE_PLUS' => 3,
        'ENVERO' => 4,
        'ENVERO_PLUS' => 5,
    ];

    /**
     * @return array{candidates: array[], surveyGrapeRatings: array<string,int>}|null
     */
    private function buildScoredCandidates(int $memberId): ?array
    {
        $db = Database::get();

        $stmt = $db->prepare("SELECT * FROM memberships WHERE member_id = :id AND status = 'ACTIVE' LIMIT 1");
        $stmt->execute(['id' => $memberId]);
        $membership = $stmt->fetch();
        if ($membership === false) {
            return null;
        }
        $plan = $membership['plan'];

        $stmt = $db->prepare(
            'SELECT w.* FROM wine_pool wp JOIN wines w ON w.id = wp.wine_id
             WHERE wp.plan = :plan AND wp.is_active = 1'
        );
        $stmt->execute(['plan' => $plan]);
        $pool = $stmt->fetchAll();
        if (empty($pool)) {
            return null;
        }

        $stmt = $db->prepare(
            "SELECT DISTINCT si.wine_id FROM shipment_items si
             JOIN shipments s ON s.id = si.shipment_id
             WHERE s.member_id = :id AND s.status = 'CONFIRMED'"
        );
        $stmt->execute(['id' => $memberId]);
        $receivedWineIds = array_map('intval', array_column($stmt->fetchAll(), 'wine_id'));
        $receivedCount = count($receivedWineIds);

        $stmt = $db->prepare('SELECT grape, rating FROM member_grape_ratings WHERE member_id = :id');
        $stmt->execute(['id' => $memberId]);
        $surveyGrapeRatings = [];
        foreach ($stmt->fetchAll() as $row) {
            $surveyGrapeRatings[strtolower($row['grape'])] = (int)$row['rating'];
        }

        $avgRatingCache = [];
        $candidates = [];
        foreach ($pool as $wine) {
            if (!(bool)$wine['is_club_eligible']) {
                continue;
            }
            if (in_array((int)$wine['id'], $receivedWineIds, true)) {
                continue;
            }

            $grapeKey = $wine['grape'] !== null ? strtolower($wine['grape']) : '';
            $surveyScore = $surveyGrapeRatings[$grapeKey] ?? 3.0;

            if ($receivedCount < 10) {
                $score = $surveyScore;
            } else {
                if (!array_key_exists($grapeKey, $avgRatingCache)) {
                    $stmt = $db->prepare(
                        'SELECT AVG(wr.rating) as avg_rating FROM wine_ratings wr
                         JOIN wines w ON w.id = wr.wine_id
                         WHERE wr.member_id = :member_id AND LOWER(w.grape) = :grape'
                    );
                    $stmt->execute(['member_id' => $memberId, 'grape' => $grapeKey]);
                    $avg = $stmt->fetch()['avg_rating'] ?? null;
                    $avgRatingCache[$grapeKey] = $avg !== null ? (float)$avg : null;
                }
                $avg = $avgRatingCache[$grapeKey];
                $score = $avg !== null ? (0.4 * $surveyScore + 0.6 * $avg) : $surveyScore;
            }

            $wine['_score'] = $score;
            $candidates[] = $wine;
        }

        usort($candidates, fn($a, $b) => $b['_score'] <=> $a['_score']);

        return ['candidates' => $candidates, 'surveyGrapeRatings' => $surveyGrapeRatings, 'plan' => $plan, 'membership' => $membership];
    }

    public function getRecommendations(int $memberId): array
    {
        $result = $this->buildScoredCandidates($memberId);
        if ($result === null) {
            return ['paraVos' => [], 'nuevasExperiencias' => []];
        }
        $candidates = $result['candidates'];
        $surveyGrapeRatings = $result['surveyGrapeRatings'];

        $paraVos = array_slice($candidates, 0, 2);
        $paraVosIds = array_map(fn($w) => (int)$w['id'], $paraVos);

        $strongGrapes = [];
        foreach ($surveyGrapeRatings as $grape => $rating) {
            if ($rating > 3.0) {
                $strongGrapes[] = $grape;
            }
        }

        $nuevasExperiencias = [];
        $usedIds = $paraVosIds;
        foreach ($candidates as $wine) {
            if (count($nuevasExperiencias) >= 2) {
                break;
            }
            $id = (int)$wine['id'];
            if (in_array($id, $usedIds, true)) {
                continue;
            }
            $grapeKey = $wine['grape'] !== null ? strtolower($wine['grape']) : '';
            if (in_array($grapeKey, $strongGrapes, true)) {
                continue;
            }
            $nuevasExperiencias[] = $wine;
            $usedIds[] = $id;
        }

        if (count($nuevasExperiencias) < 2) {
            foreach ($candidates as $wine) {
                if (count($nuevasExperiencias) >= 2) {
                    break;
                }
                $id = (int)$wine['id'];
                if (in_array($id, $usedIds, true)) {
                    continue;
                }
                $nuevasExperiencias[] = $wine;
                $usedIds[] = $id;
            }
        }

        return [
            'paraVos' => array_map([$this, 'toRecommendationWineDto'], $paraVos),
            'nuevasExperiencias' => array_map([$this, 'toRecommendationWineDto'], $nuevasExperiencias),
        ];
    }

    /** @return array[] ShipmentDto-like arrays de las propuestas creadas */
    public function generateProposalsForMonth(int $year, int $month): array
    {
        $db = Database::get();
        $created = [];

        $memberships = $db->query("SELECT * FROM memberships WHERE status = 'ACTIVE'")->fetchAll();

        foreach ($memberships as $membership) {
            $memberId = (int)$membership['member_id'];

            $stmt = $db->prepare(
                "SELECT id FROM shipments WHERE member_id = :member_id AND type = 'MEMBERSHIP' AND status = 'PROPOSED'
                 AND YEAR(shipped_at) = :year AND MONTH(shipped_at) = :month LIMIT 1"
            );
            $stmt->execute(['member_id' => $memberId, 'year' => $year, 'month' => $month]);
            if ($stmt->fetch() !== false) {
                continue;
            }

            $result = $this->buildScoredCandidates($memberId);
            if ($result === null || empty($result['candidates'])) {
                continue;
            }

            $winesNeeded = self::WINES_PER_PLAN[$result['plan']] ?? 2;
            $chosen = array_slice($result['candidates'], 0, $winesNeeded);

            $shippedAt = sprintf('%04d-%02d-01', $year, $month);
            $stmt = $db->prepare(
                'INSERT INTO shipments (membership_id, member_id, shipped_at, type, status, notes)
                 VALUES (:membership_id, :member_id, :shipped_at, "MEMBERSHIP", "PROPOSED", :notes)'
            );
            $stmt->execute([
                'membership_id' => $membership['id'],
                'member_id' => $memberId,
                'shipped_at' => $shippedAt,
                'notes' => "Propuesta generada automáticamente para $month/$year",
            ]);
            $shipmentId = (int)$db->lastInsertId();

            $itemStmt = $db->prepare(
                'INSERT INTO shipment_items (shipment_id, wine_id, quantity, unit_price) VALUES (:shipment_id, :wine_id, 1, :unit_price)'
            );
            foreach ($chosen as $wine) {
                $itemStmt->execute([
                    'shipment_id' => $shipmentId,
                    'wine_id' => $wine['id'],
                    'unit_price' => $wine['reference_price'],
                ]);
            }

            $created[] = $shipmentId;
        }

        return $created;
    }

    private function toRecommendationWineDto(array $row): array
    {
        $stockGondola = (int)$row['stock_gondola'];
        $stockCuartito = (int)$row['stock_cuartito'];
        return [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'grape' => $row['grape'],
            'vintageYear' => $row['vintage_year'] !== null ? (int)$row['vintage_year'] : null,
            'referencePrice' => $row['reference_price'] !== null ? (float)$row['reference_price'] : null,
            'category' => $row['category'],
            'isClubEligible' => (bool)$row['is_club_eligible'],
            'imageUrl' => $row['image_url'],
            'stockGondola' => $stockGondola,
            'stockCuartito' => $stockCuartito,
            'stockTotal' => $stockGondola + $stockCuartito,
            'tiendanubeProductId' => null,
            'tiendanubeVariantId' => null,
            'uploadStatus' => null,
        ];
    }
}
