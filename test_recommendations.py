"""
Test del algoritmo de recomendaciones de vinos.
Prepara datos de prueba, llama a los endpoints y muestra los resultados.
"""

import json
import urllib.request
import urllib.error
import mysql.connector

BASE = "http://localhost:8080/api"
DB = dict(host="localhost", user="root", password="Argentina2025", database="fudre_admin")

# ─── helpers ──────────────────────────────────────────────────────────────────

def api_get(path):
    r = urllib.request.urlopen(BASE + path, timeout=5)
    return json.loads(r.read())

def api_post(path, body=None):
    data = json.dumps(body or {}).encode()
    req = urllib.request.Request(BASE + path, data=data, method="POST",
                                  headers={"Content-Type": "application/json"})
    try:
        r = urllib.request.urlopen(req, timeout=10)
        if r.status == 204:
            return None
        return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {e.read().decode()[:200]}")
        return None

def api_put(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(BASE + path, data=data, method="PUT",
                                  headers={"Content-Type": "application/json"})
    r = urllib.request.urlopen(req, timeout=5)
    return json.loads(r.read())

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

# ─── 1. elegir miembro y plan de prueba ───────────────────────────────────────

section("1. Cargando datos existentes")

members = api_get("/members")
memberships = api_get("/memberships")
wines = api_get("/wines")

print(f"  Miembros encontrados:   {len(members)}")
print(f"  Membresías encontradas: {len(memberships)}")
print(f"  Vinos en inventario:    {len(wines)}")

if not members or not memberships:
    print("  ❌ No hay miembros o membresías. Cargá datos primero.")
    exit(1)

# Usar el primer miembro con membresía activa
test_member = members[0]
test_membership = next((m for m in memberships if m.get("memberId") == test_member["id"]), memberships[0])
test_plan = test_membership.get("plan", "BROTE")

print(f"\n  👤 Miembro de prueba:  #{test_member['id']} {test_member['name']}")
print(f"  📋 Plan:               {test_plan}")

# ─── 2. cargar grape ratings al miembro (directo en DB) ──────────────────────

section("2. Insertando grape ratings de prueba")

GRAPES = [
    ("Malbec",             5),
    ("Cabernet Sauvignon", 4),
    ("Merlot",             4),
    ("Syrah",              3),
    ("Pinot Noir",         4),
    ("Chardonnay",         2),
    ("Sauvignon Blanc",    2),
    ("Cabernet Franc",     3),
    ("Torrontés",          1),
    ("Rosado",             2),
]

conn = mysql.connector.connect(**DB)
cur = conn.cursor()

# Borrar ratings previos del miembro de prueba
cur.execute("DELETE FROM member_grape_ratings WHERE member_id = %s", (test_member["id"],))

# Insertar nuevos ratings
for grape, rating in GRAPES:
    cur.execute(
        "INSERT INTO member_grape_ratings (member_id, grape, rating) VALUES (%s, %s, %s)",
        (test_member["id"], grape, rating)
    )
    print(f"  ⭐ {grape:<22} → {rating}/5")

conn.commit()
print(f"\n  ✓ {len(GRAPES)} grape ratings cargados para {test_member['name']}")

# ─── 3. marcar vinos como club eligible ───────────────────────────────────────

section("3. Marcando vinos como club eligible")

# Tomar los primeros 10 vinos como elegibles
eligible_wines = wines[:10]

for wine in eligible_wines:
    updated = api_put(f"/wines/{wine['id']}", {**wine, "isClubEligible": True})
    print(f"  ✓ {updated.get('name','?')[:40]:<42} ({updated.get('grape','?')})")

print(f"\n  ✓ {len(eligible_wines)} vinos marcados como elegibles")

# ─── 4. agregar vinos al WinePool para el plan ───────────────────────────────

section(f"4. Agregando vinos al WinePool para plan {test_plan}")

# Borrar entradas previas del pool para este plan
cur.execute("DELETE FROM wine_pool WHERE plan = %s", (test_plan,))

for wine in eligible_wines:
    cur.execute(
        "INSERT INTO wine_pool (plan, wine_id, is_active) VALUES (%s, %s, 1)",
        (test_plan, wine["id"])
    )
    print(f"  + {wine.get('name','?')[:40]}")

conn.commit()
cur.close()
conn.close()
print(f"\n  ✓ {len(eligible_wines)} vinos en el pool de {test_plan}")

# ─── 5. llamar al endpoint de recomendaciones ─────────────────────────────────

section(f"5. Llamando GET /members/{test_member['id']}/recommendations")

recs = api_get(f"/members/{test_member['id']}/recommendations")

if not recs:
    print("  ❌ No se obtuvieron recomendaciones")
    exit(1)

para_vos = recs.get("paraVos", [])
nuevas = recs.get("nuevasExperiencias", [])

print(f"\n  🍷 PARA VOS ({len(para_vos)} vinos):")
for w in para_vos:
    print(f"     • {w.get('name','?'):<40} {w.get('grape','?')}")

print(f"\n  🌟 NUEVAS EXPERIENCIAS ({len(nuevas)} vinos):")
for w in nuevas:
    print(f"     • {w.get('name','?'):<40} {w.get('grape','?')}")

# ─── 6. generar propuestas del mes ────────────────────────────────────────────

from datetime import datetime
now = datetime.now()

section(f"6. Generando propuestas para {now.strftime('%B %Y')}")

proposals = api_post(f"/shipments/generate-proposals?year={now.year}&month={now.month}")

if proposals is None:
    print("  ⚠️  Sin respuesta del endpoint (puede ser que ya existan propuestas)")
elif isinstance(proposals, list):
    if len(proposals) == 0:
        print("  ℹ️  Ya existían propuestas para todos los miembros este mes (idempotente ✓)")
    else:
        print(f"  ✓ {len(proposals)} propuesta(s) generadas:")
        for p in proposals:
            items = p.get("items") or []
            print(f"     • {p.get('memberName','?'):<30} {len(items)} vinos → estado: {p.get('status','?')}")
            for item in items:
                print(f"       - {item.get('wineName','?')} ({item.get('wineGrape','?')})")

# ─── 7. simular rating de un vino recibido (historial) ────────────────────────

section("7. Simulando que el miembro califica un vino recibido")

if eligible_wines:
    wine_to_rate = eligible_wines[0]
    result = api_post(f"/members/{test_member['id']}/wine-ratings", {
        "memberId": test_member["id"],
        "wineId": wine_to_rate["id"],
        "rating": 5,
        "notes": "Excelente, muy frutado"
    })
    if result:
        print(f"  ✓ Calificó '{wine_to_rate.get('name','?')}' con {result.get('rating','?')}/5")
        print(f"    Nota: {result.get('notes','')}")

# ─── resumen ──────────────────────────────────────────────────────────────────

section("✅ Test completado")
print(f"""
  Resultados del algoritmo para {test_member['name']} (plan {test_plan}):
  ├─ Para Vos:            {len(para_vos)} vino(s) ({'✓' if para_vos else '✗'})
  ├─ Nuevas Experiencias: {len(nuevas)} vino(s) ({'✓' if nuevas else '✗'})
  └─ Propuestas mes:      {'✓' if proposals is not None else '✗'}

  {'✅ Algoritmo funcionando correctamente' if para_vos else '❌ Revisar: no se generaron recomendaciones'}
""")
