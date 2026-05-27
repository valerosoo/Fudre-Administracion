import json
import re
import traceback
import requests as req
from flask import Flask, request, jsonify
from flask_cors import CORS

from config import BACKEND_URL
from ai_client import get_ai_client
from extractors import extract_text
from prompts import get_prompt

app = Flask(__name__)
CORS(app)


# ── Helpers ──────────────────────────────────────────────────────────────────

def parse_json_from_response(text: str):
    """Extrae JSON de la respuesta del AI aunque tenga texto extra alrededor."""
    text = text.strip()

    # Intentar parseo directo
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Buscar bloque ```json ... ```
    m = re.search(r"```(?:json)?\s*(\[.*?\]|\{.*?\})\s*```", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass

    # Buscar primer array [...] o objeto {...}
    for pattern in (r"\[.*\]", r"\{.*\}"):
        m = re.search(pattern, text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group())
            except json.JSONDecodeError:
                pass

    raise ValueError(f"No se pudo parsear JSON de la respuesta:\n{text[:500]}")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/import/<entity>", methods=["POST"])
def import_preview(entity):
    """
    Recibe el archivo, lo procesa con AI y devuelve un preview de los datos
    extraídos (sin insertar en la BD todavía).
    """
    if entity not in ("wines", "members", "memberships", "shipments"):
        return jsonify({"error": f"Entidad desconocida: '{entity}'"}), 400

    if "file" not in request.files:
        return jsonify({"error": "No se recibió ningún archivo"}), 400

    file = request.files["file"]
    file_bytes = file.read()
    filename = file.filename or "archivo"
    print(f"[DEBUG] Archivo recibido: {filename}, tamaño: {len(file_bytes)} bytes")

    # 1. Extraer texto del archivo
    try:
        content = extract_text(file_bytes, filename)
        print(f"[DEBUG] Texto extraído: {len(content)} chars")
    except Exception as e:
        print(f"[DEBUG] Error extrayendo: {traceback.format_exc()}")
        return jsonify({"error": f"Error leyendo el archivo: {e}"}), 400

    if not content.strip():
        return jsonify({"error": "El archivo está vacío o no se pudo leer"}), 400

    # 2. Llamar al AI
    try:
        ai = get_ai_client()
        prompt = get_prompt(entity, content)
        print(f"[DEBUG] Llamando AI ({len(prompt)} chars en prompt)...")
        raw = ai.complete(prompt)
        print(f"[DEBUG] Respuesta AI: {raw[:200]}")
    except Exception as e:
        print(f"[DEBUG] Error AI: {traceback.format_exc()}")
        return jsonify({"error": f"Error del AI: {e}"}), 500

    # 3. Parsear JSON
    try:
        data = parse_json_from_response(raw)
        print(f"[DEBUG] JSON parseado OK: {len(data) if isinstance(data, list) else 'dict'}")
    except ValueError as e:
        print(f"[DEBUG] Error parsing JSON: {e}")
        return jsonify({"error": str(e)}), 500

    # Para "members", el AI puede devolver { members: [...], memberships: [...] }
    if entity == "members" and isinstance(data, dict):
        return jsonify({
            "entity": "members",
            "members": data.get("members", []),
            "memberships": data.get("memberships", []),
            "count": len(data.get("members", [])),
        })

    if not isinstance(data, list):
        data = [data]

    return jsonify({"entity": entity, "preview": data, "count": len(data)})


@app.route("/import/<entity>/confirm", methods=["POST"])
def import_confirm(entity):
    """
    Recibe los datos del preview (ya revisados por el usuario) e inserta en la BD
    via la API del backend de Fudre.
    """
    body = request.json or {}
    results = {"success": 0, "errors": []}

    if entity == "members":
        # Insertar miembros y luego membresías relacionadas
        members_data = body.get("members", [])
        memberships_data = body.get("memberships", [])

        # Primero obtener miembros existentes para resolver nombres a IDs
        existing = {m["name"]: m["id"] for m in _get_all("members")}

        for m in members_data:
            try:
                r = req.post(f"{BACKEND_URL}/members", json=m, timeout=10)
                r.raise_for_status()
                existing[m["name"]] = r.json()["id"]
                results["success"] += 1
            except Exception as e:
                results["errors"].append(f"Miembro '{m.get('name')}': {e}")

        for ms in memberships_data:
            member_name = ms.pop("memberName", None)
            member_id = existing.get(member_name)
            if not member_id:
                results["errors"].append(f"Membresía: no se encontró miembro '{member_name}'")
                continue
            try:
                payload = {**ms, "memberId": member_id}
                r = req.post(f"{BACKEND_URL}/memberships", json=payload, timeout=10)
                r.raise_for_status()
                results["success"] += 1
            except Exception as e:
                results["errors"].append(f"Membresía de '{member_name}': {e}")

    else:
        items = body.get("items", [])
        for item in items:
            try:
                r = req.post(f"{BACKEND_URL}/{entity}", json=item, timeout=10)
                r.raise_for_status()
                results["success"] += 1
            except Exception as e:
                results["errors"].append(str(e))

    return jsonify(results)


def _get_all(entity: str) -> list:
    try:
        r = req.get(f"{BACKEND_URL}/{entity}", timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception:
        return []


# ── Arranque ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Servicio de importación corriendo en http://localhost:8081")
    print(f"Proveedor AI: {__import__('config').AI_PROVIDER}")
    app.run(port=8081, debug=True)
