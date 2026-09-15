<?php

class MembershipController
{
    public function index(): void
    {
        Response::json(array_map([$this, 'toDto'], $this->allWithMember()));
    }

    public function show(string $id): void
    {
        Response::json($this->toDto($this->find((int)$id)));
    }

    public function byMember(string $memberId): void
    {
        $stmt = Database::get()->prepare($this->baseQuery() . ' WHERE ms.member_id = :member_id ORDER BY ms.id');
        $stmt->execute(['member_id' => (int)$memberId]);
        Response::json(array_map([$this, 'toDto'], $stmt->fetchAll()));
    }

    public function create(): void
    {
        Response::json($this->createData(Request::body()), 201);
    }

    /** Reutilizado por ImportController::confirm() para el entity "memberships". */
    public function createData(array $body): array
    {
        $memberId = (int)($body['memberId'] ?? 0);

        $stmt = Database::get()->prepare('SELECT id FROM members WHERE id = :id');
        $stmt->execute(['id' => $memberId]);
        if ($stmt->fetch() === false) {
            throw new NotFoundException("No se encontró el miembro $memberId");
        }

        Database::get()->prepare(
            'INSERT INTO memberships (member_id, plan, status, start_date, end_date)
             VALUES (:member_id, :plan, :status, :start_date, :end_date)'
        )->execute([
            'member_id' => $memberId,
            'plan' => $body['plan'] ?? null,
            'status' => $body['status'] ?? 'ACTIVE',
            'start_date' => $body['startDate'] ?? date('Y-m-d'),
            'end_date' => $body['endDate'] ?? null,
        ]);
        $id = (int)Database::get()->lastInsertId();
        return $this->toDto($this->find($id));
    }

    public function update(string $id): void
    {
        $membershipId = (int)$id;
        $membership = $this->find($membershipId);
        $body = Request::body();

        $plan = array_key_exists('plan', $body) && $body['plan'] !== null ? $body['plan'] : $membership['plan'];
        $status = array_key_exists('status', $body) && $body['status'] !== null ? $body['status'] : $membership['status'];
        $startDate = array_key_exists('startDate', $body) && $body['startDate'] !== null ? $body['startDate'] : $membership['start_date'];
        $endDate = array_key_exists('endDate', $body) ? $body['endDate'] : $membership['end_date'];

        Database::get()->prepare(
            'UPDATE memberships SET plan = :plan, status = :status, start_date = :start_date, end_date = :end_date WHERE id = :id'
        )->execute([
            'plan' => $plan, 'status' => $status, 'start_date' => $startDate, 'end_date' => $endDate, 'id' => $membershipId,
        ]);
        Response::json($this->toDto($this->find($membershipId)));
    }

    public function delete(string $id): void
    {
        Database::get()->prepare('DELETE FROM memberships WHERE id = :id')->execute(['id' => (int)$id]);
        Response::noContent();
    }

    private function baseQuery(): string
    {
        return 'SELECT ms.*, m.name as member_name, m.email as member_email FROM memberships ms JOIN members m ON m.id = ms.member_id';
    }

    private function allWithMember(): array
    {
        return Database::get()->query($this->baseQuery() . ' ORDER BY ms.id')->fetchAll();
    }

    private function find(int $id): array
    {
        $stmt = Database::get()->prepare($this->baseQuery() . ' WHERE ms.id = :id');
        $stmt->execute(['id' => $id]);
        $membership = $stmt->fetch();
        if ($membership === false) {
            throw new NotFoundException("No se encontró la membresía $id");
        }
        return $membership;
    }

    private function toDto(array $row): array
    {
        return [
            'id' => (int)$row['id'],
            'memberId' => (int)$row['member_id'],
            'memberName' => $row['member_name'],
            'memberEmail' => $row['member_email'],
            'plan' => $row['plan'],
            'status' => $row['status'],
            'startDate' => $row['start_date'],
            'endDate' => $row['end_date'],
        ];
    }
}
