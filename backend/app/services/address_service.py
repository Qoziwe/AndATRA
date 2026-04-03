"""Location enrichment helpers for appeals."""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass

import requests
from flask import current_app

from app.models.district import District

logger = logging.getLogger(__name__)

SESSION = requests.Session()
SESSION.trust_env = False


@dataclass
class ResolvedLocation:
    """Normalized location details attached to an appeal."""

    location_text: str | None = None
    district: District | None = None


def resolve_location(
    *,
    latitude: float | None = None,
    longitude: float | None = None,
    location_text: str | None = None,
) -> ResolvedLocation:
    """Normalize manual location text and enrich it from coordinates when available."""
    normalized_text = _normalize_text(location_text)
    district = match_district(normalized_text)

    if latitude is not None and longitude is not None:
        geocoded = _reverse_geocode(latitude, longitude)
        normalized_text = _merge_location_text(normalized_text, geocoded.location_text)
        district = district or geocoded.district or _nearest_district(latitude, longitude)

    return ResolvedLocation(location_text=normalized_text, district=district)


def match_district(district_hint: str | None) -> District | None:
    """Match a district by slug, exact name, or partial mention."""
    normalized = _normalize_lookup(district_hint)
    if not normalized:
        return None

    district = District.query.filter_by(slug=normalized).first()
    if district:
        return district

    if isinstance(district_hint, str):
        district = District.query.filter(District.name.ilike(district_hint.strip())).first()
        if district:
            return district

    for candidate in District.query.all():
        name_normalized = _normalize_lookup(candidate.name)
        if normalized == name_normalized:
            return candidate
        if normalized in name_normalized or name_normalized in normalized:
            return candidate

    return None


def _reverse_geocode(latitude: float, longitude: float) -> ResolvedLocation:
    """Resolve a human-readable address from coordinates."""
    if not current_app.config.get("GEOCODING_ENABLED", True):
        return ResolvedLocation()

    try:
        response = SESSION.get(
            current_app.config["GEOCODING_REVERSE_URL"],
            params={
                "format": "jsonv2",
                "lat": latitude,
                "lon": longitude,
                "zoom": 18,
                "addressdetails": 1,
                "accept-language": "ru",
            },
            headers={"User-Agent": current_app.config["GEOCODING_USER_AGENT"]},
            timeout=current_app.config["GEOCODING_TIMEOUT"],
        )
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError) as exc:
        logger.warning("Reverse geocoding failed for %s,%s: %s", latitude, longitude, exc)
        return ResolvedLocation()

    address = payload.get("address") or {}
    composed = _compose_address_text(address, payload.get("display_name"))
    district = match_district(
        address.get("city_district")
        or address.get("suburb")
        or address.get("borough")
        or address.get("county")
    )
    return ResolvedLocation(location_text=composed, district=district)


def _compose_address_text(address: dict, display_name: str | None) -> str | None:
    street = (
        address.get("road")
        or address.get("pedestrian")
        or address.get("residential")
        or address.get("footway")
    )
    house = address.get("house_number")
    district = address.get("city_district") or address.get("suburb") or address.get("borough")
    city = address.get("city") or address.get("town") or address.get("state")

    parts: list[str] = []
    if street and house:
        parts.append(f"{street}, {house}")
    elif street:
        parts.append(street)
    if district:
        parts.append(district)
    if city:
        parts.append(city)

    if not parts and display_name:
        parts = [segment.strip() for segment in display_name.split(",")[:4] if segment.strip()]

    if not parts:
        return None

    return ", ".join(_dedupe_parts(parts))[:255]


def _nearest_district(latitude: float, longitude: float) -> District | None:
    """Pick the closest seeded district center when exact district is unavailable."""
    nearest: District | None = None
    nearest_distance: float | None = None

    for district in District.query.all():
        center = district.coordinates_center or {}
        lat = center.get("lat")
        lng = center.get("lng")
        if lat is None or lng is None:
            continue

        distance = math.dist((latitude, longitude), (lat, lng))
        if nearest_distance is None or distance < nearest_distance:
            nearest = district
            nearest_distance = distance

    return nearest


def _merge_location_text(primary: str | None, secondary: str | None) -> str | None:
    if primary and secondary:
        primary_key = _normalize_lookup(primary)
        secondary_key = _normalize_lookup(secondary)
        if primary_key == secondary_key or primary_key in secondary_key:
            return secondary
        if secondary_key in primary_key:
            return primary
        return f"{primary}, {secondary}"[:255]
    return primary or secondary


def _dedupe_parts(parts: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for part in parts:
        key = _normalize_lookup(part)
        if not key or key in seen:
            continue
        seen.add(key)
        result.append(part)
    return result


def _normalize_text(value: str | None) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = " ".join(value.split()).strip(" ,.")
    return cleaned[:255] if cleaned else None


def _normalize_lookup(value: str | None) -> str:
    if not isinstance(value, str):
        return ""
    cleaned = value.casefold()
    for char in ",.;:()[]{}'\"":
        cleaned = cleaned.replace(char, " ")
    return " ".join(cleaned.split())
