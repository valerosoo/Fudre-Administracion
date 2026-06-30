import json
import os
import re
import traceback

import requests as req
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from ai_client import get_ai_client
from config import BACKEND_URL, IMPORT_UPLOAD_DIR
from extractors import build_ai_input
from prompts import get_prompt


app = Flask(__name__)
CORS(app)


def parse_json_from_response(text: str):
    """Extrae JSON de la respuesta del AI aunque tenga texto extra alrededor."""
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"```(?:json)?\s*(\[.*?\]|\{.*?\})\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    for pattern in (r"\[.*\]", r"\{.*\}"):
        match = re.search(pattern, text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

    raise ValueError(f"No se pudo parsear JSON de la respuesta:\n{text[:500]}")


def normalize_price_list_data(data: dict):
    distributor = data.get("distributor") if isinstance(data.get("distributor"), dict) else {}
    normalized_distributor = {
        "name": distributor.get("name") or "Distribuidor Desconocido",
        "phone": distributor.get("phone"),
        "email": distributor.get("email"),
    }

    items = data.get("items", [])
    if not isinstance(items, list):
        items = []

    normalized_items = []
    for item in items:
        if not isinstance(item, dict):
            continue
        normalized_items.append({
            "name": item.get("name"),
            "grape": item.get("grape"),
            "vintageYear": item.get("vintageYear"),
            "purchasePrice": item.get("purchasePrice"),
            "boxPurchasePrice": item.get("boxPurchasePrice"),
            "recommendedSalePrice": item.get("recommendedSalePrice"),
            "imageUrl": item.get("imageUrl"),
        })

    return normalized_distributor, normalized_items


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/import-uploads/<path:filename>", methods=["GET"])
def import_uploads(filename):
    return send_from_directory(os.path.abspath(IMPORT_UPLOAD_DIR), filename)


@app.route("/import/<entity>", methods=["POST"])
def import_preview(entity):
    """
    Recibe el archivo, lo procesa con AI y devuelve un preview de los datos
    extraidos, sin insertar todavia en la BD.
    """
    if entity not in ("wines", "members", "memberships", "shipments", "price_list", "order"):
        return jsonify({"error": f"Entidad desconocida: '{entity}'"}), 400

    if "file" not in request.files:
        return jsonify({"error": "No se recibio ningun archivo"}), 400

    file = request.files["file"]
    file_bytes = file.read()
    filename = file.filename or "archivo"
    print(f"[DEBUG] Archivo recibido: {filename}, tamano: {len(file_bytes)} bytes")

    try:
        ai_input = build_ai_input(file_bytes, filename)
        content = ai_input["content"]
        attachments = ai_input["attachments"]
        image_candidates = [
            a["url"] for a in attachments
            if isinstance(a, dict) and a.get("url")
        ]
        print(f"[DEBUG] Texto extraido: {len(content)} chars")
        print(f"[DEBUG] Adjuntos AI: {len(attachments)}")
    except Exception as e:
        print(f"[DEBUG] Error extrayendo: {traceback.format_exc()}")
        return jsonify({"error": f"Error leyendo el archivo: {e}"}), 400

    if not content.strip() and not attachments:
        return jsonify({"error": "El archivo esta vacio o no se pudo leer"}), 400

    try:
        ai = get_ai_client()
        prompt = get_prompt(entity, content)
        print(f"[DEBUG] Llamando AI ({len(prompt)} chars en prompt)...")
        raw = ai.complete(prompt, attachments=attachments)
        print(f"[DEBUG] Respuesta AI: {raw[:200]}")
    except Exception as e:
        print(f"[DEBUG] Error AI: {traceback.format_exc()}")
        return jsonify({"error": f"Error del AI: {e}"}), 500

    try:
        data = parse_json_from_response(raw)
        print(f"[DEBUG] JSON parseado OK: {len(data) if isinstance(data, list) else 'dict'}")
    except ValueError as e:
        print(f"[DEBUG] Error parsing JSON: {e}")
        return jsonify({"error": str(e)}), 500

    if entity == "price_list" and isinstance(data, dict):
        distributor, items = normalize_price_list_data(data)
        return jsonify({
            "entity": entity,
            "distributor": distributor,
            "items": items,
            "count": len(items),
            "imageCandidates": image_candidates,
        })

    if entity == "order" and isinstance(data, dict):
        items = data.get("items", [])
        if not isinstance(items, list):
            items = []
        return jsonify({
            "entity": entity,
            "distributor": data.get("distributor", {}),
            "items": items,
            "count": len(items),
            "imageCandidates": image_candidates,
        })

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
    Recibe los datos del preview revisados por el usuario e inserta en la BD
    via la API del backend de Fudre.
    """
    body = request.json or {}
    results = {"success": 0, "errors": []}

    if entity == "price_list":
        try:
            payload = {"distributor": body.get("distributor", {}), "items": body.get("items", [])}
            response = req.post(f"{BACKEND_URL}/price-list/upsert", json=payload, timeout=30)
            response.raise_for_status()
            results["success"] = len(response.json())
        except Exception as e:
            results["errors"].append(str(e))

    elif entity == "order":
        try:
            payload = {"distributor": body.get("distributor", {}), "items": body.get("items", [])}
            response = req.post(f"{BACKEND_URL}/orders/import", json=payload, timeout=30)
            response.raise_for_status()
            results["success"] = len(response.json().get("items", []))
        except Exception as e:
            results["errors"].append(str(e))

    elif entity == "members":
        members_data = body.get("members", [])
        memberships_data = body.get("memberships", [])
        existing = {m["name"]: m["id"] for m in _get_all("members")}

        for member in members_data:
            try:
                response = req.post(f"{BACKEND_URL}/members", json=member, timeout=10)
                response.raise_for_status()
                existing[member["name"]] = response.json()["id"]
                results["success"] += 1
            except Exception as e:
                results["errors"].append(f"Miembro '{member.get('name')}': {e}")

        for membership in memberships_data:
            member_name = membership.pop("memberName", None)
            member_id = existing.get(member_name)
            if not member_id:
                results["errors"].append(f"Membresia: no se encontro miembro '{member_name}'")
                continue

            try:
                payload = {**membership, "memberId": member_id}
                response = req.post(f"{BACKEND_URL}/memberships", json=payload, timeout=10)
                response.raise_for_status()
                results["success"] += 1
            except Exception as e:
                results["errors"].append(f"Membresia de '{member_name}': {e}")

    else:
        items = body.get("items", [])
        for item in items:
            try:
                response = req.post(f"{BACKEND_URL}/{entity}", json=item, timeout=10)
                response.raise_for_status()
                results["success"] += 1
            except Exception as e:
                results["errors"].append(str(e))

    return jsonify(results)


def _get_all(entity: str) -> list:
    try:
        response = req.get(f"{BACKEND_URL}/{entity}", timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception:
        return []


if __name__ == "__main__":
    print("Servicio de importacion corriendo en http://localhost:8081")
    app.run(port=8081, debug=True)
