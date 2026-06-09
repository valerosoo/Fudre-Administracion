"""
Genera datos de prueba de envios para ver la UI de Historial, Membresias y Pedidos Separados.
Inserta envios historicos CONFIRMED (meses pasados) y genera propuestas PROPOSED para el mes actual.
"""

import json, urllib.request, urllib.error, mysql.connector
from datetime import date

BASE  = "http://localhost:8080/api"
DB    = dict(host="localhost", user="root", password="Argentina2025", database="fudre_admin")

PLAN_WINES = {"BROTE": 2, "BROTE_PLUS": 3, "ENVERO": 4, "ENVERO_PLUS": 5}

def api_get(path):
    r = urllib.request.urlopen(BASE + path, timeout=5)
    return json.loads(r.read())

def api_post(path, body=None):
    data = json.dumps(body or {}).encode()
    req  = urllib.request.Request(BASE + path, data=data, method="POST",
                                  headers={"Content-Type": "application/json"})
    try:
        r = urllib.request.urlopen(req, timeout=10)
        return json.loads(r.read()) if r.status != 204 else None
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {e.read().decode()[:200]}")
        return None

print("=" * 60)
print("  Seeding shipments")
print("=" * 60)

memberships = api_get("/memberships")
wines       = api_get("/wines")

# Tomar los primeros 10 vinos (ya marcados como elegibles por test_recommendations.py)
pool = wines[:10]

conn = mysql.connector.connect(**DB)
cur  = conn.cursor()

# ── 1. Envios historicos CONFIRMED (ultimos 3 meses) ─────────────
print("\n  Insertando envios historicos (Mar-May 2026)...")

PAST_MONTHS = [
    date(2026, 3, 1),
    date(2026, 4, 1),
    date(2026, 5, 1),
]

total_inserted = 0

for ms in memberships:
    if ms["status"] != "ACTIVE":
        continue

    n_wines = PLAN_WINES.get(ms["plan"], 2)
    # Rotar vinos para que cada mes tenga vinos distintos
    wine_rotation = pool * 3

    for i, month_date in enumerate(PAST_MONTHS):
        # Verificar si ya existe un envio CONFIRMED para este miembro y mes
        cur.execute(
            "SELECT id FROM shipments WHERE member_id=%s AND YEAR(shipped_at)=%s AND MONTH(shipped_at)=%s AND type='MEMBERSHIP' AND status='CONFIRMED'",
            (ms["memberId"], month_date.year, month_date.month)
        )
        if cur.fetchone():
            continue

        cur.execute(
            """INSERT INTO shipments (member_id, membership_id, shipped_at, shipping_cost, notes, type, status)
               VALUES (%s, %s, %s, 0, %s, 'MEMBERSHIP', 'CONFIRMED')""",
            (ms["memberId"], ms["id"], month_date.strftime("%Y-%m-%d"),
             f"Envio {month_date.strftime('%B %Y')} - {ms['plan']}")
        )
        shipment_id = cur.lastrowid

        # Agregar N vinos segun el plan (rotando por mes)
        for j in range(n_wines):
            wine = wine_rotation[(i * n_wines + j) % len(wine_rotation)]
            cur.execute(
                "INSERT INTO shipment_items (shipment_id, wine_id, quantity, unit_price) VALUES (%s, %s, 1, %s)",
                (shipment_id, wine["id"], wine.get("referencePrice") or 0)
            )

        total_inserted += 1

conn.commit()
print(f"  OK: {total_inserted} envios historicos insertados")

# ── 2. Pedidos separados STANDALONE ──────────────────────────────
print("\n  Insertando pedidos separados de ejemplo...")

standalone_examples = [
    {"member_id": 1, "membership_id": 1, "date": "2026-05-15", "tn_id": "TN-88421", "wines": [pool[0], pool[1]]},
    {"member_id": 3, "membership_id": 3, "date": "2026-06-03", "tn_id": None,        "wines": [pool[2]]},
]

for ex in standalone_examples:
    cur.execute(
        "SELECT id FROM shipments WHERE member_id=%s AND shipped_at=%s AND type='STANDALONE'",
        (ex["member_id"], ex["date"])
    )
    if cur.fetchone():
        continue

    cur.execute(
        """INSERT INTO shipments (member_id, membership_id, shipped_at, shipping_cost, notes, tiendanube_order_id, type, status)
           VALUES (%s, %s, %s, 500, 'Pedido separado de prueba', %s, 'STANDALONE', 'CONFIRMED')""",
        (ex["member_id"], ex["membership_id"], ex["date"], ex["tn_id"])
    )
    sid = cur.lastrowid
    for wine in ex["wines"]:
        cur.execute(
            "INSERT INTO shipment_items (shipment_id, wine_id, quantity, unit_price) VALUES (%s, %s, 1, %s)",
            (sid, wine["id"], wine.get("referencePrice") or 0)
        )

conn.commit()
cur.close()
conn.close()
print("  OK: pedidos separados insertados")

# ── 3. Propuestas del mes actual (PROPOSED) ───────────────────────
print("\n  Generando propuestas para junio 2026...")
proposals = api_post("/shipments/generate-proposals?year=2026&month=6")

if proposals is None:
    print("  (sin respuesta o ya existen)")
elif len(proposals) == 0:
    print("  Ya existen propuestas para todos los miembros este mes")
else:
    print(f"  OK: {len(proposals)} propuesta(s) generada(s)")
    for p in proposals:
        items = p.get("items") or []
        print(f"     - {p.get('memberName','?'):<28} {len(items)} vinos  (PROPOSED)")

# ── Resumen ───────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  Listo! Ahora podes ver en el admin:")
print("  /shipments -> Membresias:      propuestas de junio (PROPOSED)")
print("  /shipments -> Pedidos Separados: 2 pedidos de prueba")
print("  /shipments -> Historial:       todos los envios por fecha")
print("=" * 60)
