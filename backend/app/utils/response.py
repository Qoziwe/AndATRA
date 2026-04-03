"""Standard API response helpers."""

from flask import jsonify


def success_response(data, status_code=200):
    """Return a success JSON response."""
    return jsonify({"success": True, "data": data, "error": None}), status_code


def error_response(message, status_code=400):
    """Return an error JSON response."""
    return jsonify({"success": False, "data": None, "error": message}), status_code
