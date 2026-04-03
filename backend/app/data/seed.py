"""Idempotent database seeder with mock data.

Usage: python -m app.data.seed
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app import create_app
from app.data.mock_appeals import generate_mock_appeals
from app.extensions import db
from app.models.appeal import Appeal
from app.models.category import Category
from app.models.district import District


CATEGORIES = [
    {"name": "РўСЂР°РЅСЃРїРѕСЂС‚", "slug": "transport", "icon": "рџљ—", "description": "Р”РѕСЂРѕРіРё, СЃРІРµС‚РѕС„РѕСЂС‹, РѕР±С‰РµСЃС‚РІРµРЅРЅС‹Р№ С‚СЂР°РЅСЃРїРѕСЂС‚"},
    {"name": "Р­РєРѕР»РѕРіРёСЏ", "slug": "ecology", "icon": "рџЊї", "description": "РњСѓСЃРѕСЂ, Р·Р°РіСЂСЏР·РЅРµРЅРёРµ, Р·РµР»С‘РЅС‹Рµ Р·РѕРЅС‹"},
    {"name": "Р‘РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ", "slug": "safety", "icon": "рџ›ЎпёЏ", "description": "РћСЃРІРµС‰РµРЅРёРµ, РѕРїР°СЃРЅС‹Рµ Р·РѕРЅС‹, РїСЂР°РІРѕРїРѕСЂСЏРґРѕРє"},
    {"name": "РђСЂС‹РєРё", "slug": "aryk_monitoring", "icon": "рџ’§", "description": "РЎРѕСЃС‚РѕСЏРЅРёРµ Р°СЂС‹С‡РЅРѕР№ СЃРµС‚Рё"},
    {"name": "РЎРѕС†РёР°Р»СЊРЅР°СЏ СЃС„РµСЂР°", "slug": "social", "icon": "рџ‘Ґ", "description": "РћР±СЂР°Р·РѕРІР°РЅРёРµ, РєСѓР»СЊС‚СѓСЂР°, СЃРѕС†РёР°Р»СЊРЅР°СЏ РїРѕРјРѕС‰СЊ"},
    {"name": "Р—РґСЂР°РІРѕРѕС…СЂР°РЅРµРЅРёРµ", "slug": "healthcare", "icon": "рџЏҐ", "description": "РџРѕР»РёРєР»РёРЅРёРєРё, Р±РѕР»СЊРЅРёС†С‹, РјРµРґРёС†РёРЅСЃРєРёРµ СѓСЃР»СѓРіРё"},
    {"name": "РРЅС„СЂР°СЃС‚СЂСѓРєС‚СѓСЂР°", "slug": "infrastructure", "icon": "рџЏ—пёЏ", "description": "Р—РґР°РЅРёСЏ, С‚СЂРѕС‚СѓР°СЂС‹, РїР»РѕС‰Р°РґРєРё, Р»РёС„С‚С‹"},
    {"name": "РљРѕРјРјСѓРЅР°Р»СЊРЅС‹Рµ СѓСЃР»СѓРіРё", "slug": "utilities", "icon": "вљЎ", "description": "Р’РѕРґР°, РіР°Р·, СЌР»РµРєС‚СЂРёС‡РµСЃС‚РІРѕ, РєР°РЅР°Р»РёР·Р°С†РёСЏ, РѕС‚РѕРїР»РµРЅРёРµ"},
]

DISTRICTS = [
    {"name": "РђР»РјР°Р»РёРЅСЃРєРёР№ СЂР°Р№РѕРЅ", "slug": "almalinskiy", "city": "РђР»РјР°С‚С‹", "coordinates_center": {"lat": 43.2567, "lng": 76.9286}},
    {"name": "Р‘РѕСЃС‚Р°РЅРґС‹РєСЃРєРёР№ СЂР°Р№РѕРЅ", "slug": "bostandykskiy", "city": "РђР»РјР°С‚С‹", "coordinates_center": {"lat": 43.2180, "lng": 76.9275}},
    {"name": "РњРµРґРµСѓСЃРєРёР№ СЂР°Р№РѕРЅ", "slug": "medeusskiy", "city": "РђР»РјР°С‚С‹", "coordinates_center": {"lat": 43.2400, "lng": 76.9580}},
    {"name": "РђСѓСЌР·РѕРІСЃРєРёР№ СЂР°Р№РѕРЅ", "slug": "auezovskiy", "city": "РђР»РјР°С‚С‹", "coordinates_center": {"lat": 43.2350, "lng": 76.8650}},
    {"name": "РќР°СѓСЂС‹Р·Р±Р°Р№СЃРєРёР№ СЂР°Р№РѕРЅ", "slug": "nauryzbayskiy", "city": "РђР»РјР°С‚С‹", "coordinates_center": {"lat": 43.2700, "lng": 76.8200}},
    {"name": "Р–РµС‚С‹СЃСѓСЃРєРёР№ СЂР°Р№РѕРЅ", "slug": "zhetysusskiy", "city": "РђР»РјР°С‚С‹", "coordinates_center": {"lat": 43.2850, "lng": 76.9700}},
    {"name": "РўСѓСЂРєСЃРёР±СЃРєРёР№ СЂР°Р№РѕРЅ", "slug": "turksibskiy", "city": "РђР»РјР°С‚С‹", "coordinates_center": {"lat": 43.3100, "lng": 76.9500}},
    {"name": "РђР»Р°С‚Р°СѓСЃРєРёР№ СЂР°Р№РѕРЅ", "slug": "alatauskiy", "city": "РђР»РјР°С‚С‹", "coordinates_center": {"lat": 43.2100, "lng": 76.8100}},
]


def seed_categories():
    """Seed categories (idempotent)."""
    if Category.query.count() > 0:
        print("  Categories already seeded, skipping.")
        return
    for category_data in CATEGORIES:
        db.session.add(Category(**category_data))
    db.session.commit()
    print(f"  Seeded {len(CATEGORIES)} categories.")


def seed_districts():
    """Seed districts (idempotent)."""
    if District.query.count() > 0:
        print("  Districts already seeded, skipping.")
        return
    for district_data in DISTRICTS:
        db.session.add(District(**district_data))
    db.session.commit()
    print(f"  Seeded {len(DISTRICTS)} districts.")


def seed_appeals():
    """Seed mock appeals (idempotent)."""
    if Appeal.query.count() > 0:
        print("  Appeals already seeded, skipping.")
        return

    mock_appeals = generate_mock_appeals(len(DISTRICTS))
    category_map = {category.slug: category.id for category in Category.query.all()}

    for appeal_data in mock_appeals:
        category_slug = appeal_data.pop("category_slug", None)
        appeal = Appeal(**appeal_data)
        if category_slug and category_slug in category_map:
            appeal.category_id = category_map[category_slug]
        db.session.add(appeal)

    db.session.commit()
    print(f"  Seeded {len(mock_appeals)} appeals.")


def seed_all():
    """Run all seeders in order."""
    print("Seeding database...")
    seed_categories()
    seed_districts()
    seed_appeals()
    print("Seeding complete!")


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        seed_all()
