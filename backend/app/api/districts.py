"""Districts API — reference data endpoint."""

from flask import Blueprint
from app.utils.response import success_response
from app.models.district import District

districts_bp = Blueprint("districts", __name__)


@districts_bp.route("/districts", methods=["GET"])
def list_districts():
    """Return all districts with coordinates."""
    districts = District.query.all()
    return success_response([d.to_dict() for d in districts])
