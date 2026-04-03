"""Analytics service for dashboard, category, trend, and heatmap data."""

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from app.extensions import db
from app.models.appeal import Appeal
from app.models.category import Category
from app.models.district import District

PERIOD_MAP = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
}


def _get_period_bounds(period: str = "30d") -> tuple[datetime, datetime, datetime]:
    days = PERIOD_MAP.get(period, 30)
    now = datetime.now(timezone.utc)
    current_start = now - timedelta(days=days)
    previous_start = current_start - timedelta(days=days)
    return now, current_start, previous_start


def _calculate_trend(current_value: int, previous_value: int) -> int:
    if previous_value == 0:
        return 100 if current_value > 0 else 0
    return round(((current_value - previous_value) / previous_value) * 100)


def _category_lookup() -> dict[str, Category]:
    return {category.slug: category for category in Category.query.all()}


def _district_name_lookup() -> dict[str, str]:
    return {district.slug: district.name for district in District.query.all()}


def _build_category_breakdown_from_counts(
    counts: dict[str, int],
    categories: dict[str, Category],
) -> list[dict]:
    breakdown = []

    for slug, value in sorted(counts.items(), key=lambda item: item[1], reverse=True):
        category = categories.get(slug)
        breakdown.append({
            "slug": slug,
            "label": category.name if category else slug,
            "value": value,
            "icon": category.icon if category else None,
            "description": category.description if category else None,
        })

    return breakdown


def _build_summary_narrative(
    period: str,
    total: int,
    critical_count: int,
    resolved_count: int,
    top_category: dict | None,
    top_district_name: str | None,
    top_district_count: int,
    resolution_rate: int,
) -> tuple[list[str], list[str]]:
    narrative = [
        (
            f"За период {period} в систему поступило {total} обращений. "
            f"Критических кейсов: {critical_count}, со статусом решено: {resolved_count}."
        )
    ]

    if top_category:
        narrative.append(
            f"Наибольшая нагрузка пришлась на категорию «{top_category['label']}» "
            f"({top_category['value']} обращений)."
        )

    if top_district_name:
        narrative.append(
            f"Наиболее активный район за период: «{top_district_name}» "
            f"({top_district_count} обращений)."
        )

    narrative.append(
        f"Текущая доля решённых обращений составляет {resolution_rate}%."
    )

    highlights = []
    if top_category:
        highlights.append(f"Топ-категория: {top_category['label']}")
    if top_district_name:
        highlights.append(f"Лидирующий район: {top_district_name}")
    highlights.append(f"Критические кейсы: {critical_count}")
    highlights.append(f"Доля решённых: {resolution_rate}%")

    return narrative, highlights


def get_dashboard_stats() -> dict:
    """Get dashboard counters for the overview page."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_appeals = Appeal.query.count()
    critical_appeals = Appeal.query.filter_by(priority="critical").count()
    resolved_today = Appeal.query.filter(
        Appeal.status == "resolved",
        Appeal.updated_at >= today_start,
    ).count()
    active_districts = (
        db.session.query(Appeal.district_id)
        .filter(Appeal.district_id.isnot(None))
        .distinct()
        .count()
    )
    critical_new_appeals = Appeal.query.filter_by(priority="critical", status="new").count()

    return {
        "total_appeals": total_appeals,
        "critical_appeals": critical_appeals,
        "resolved_today": resolved_today,
        "active_districts": active_districts,
        "critical_new_appeals": critical_new_appeals,
    }


def get_category_breakdown(period: str = "30d") -> list[dict]:
    """Get category counts and trend values for a selected period."""
    _, current_start, previous_start = _get_period_bounds(period)
    categories = Category.query.filter_by(parent_id=None).order_by(Category.name.asc()).all()
    result = []

    for category in categories:
        current_count = Appeal.query.filter(
            Appeal.category_id == category.id,
            Appeal.created_at >= current_start,
        ).count()
        previous_count = Appeal.query.filter(
            Appeal.category_id == category.id,
            Appeal.created_at >= previous_start,
            Appeal.created_at < current_start,
        ).count()

        result.append({
            "id": category.id,
            "slug": category.slug,
            "label": category.name,
            "icon": category.icon,
            "description": category.description,
            "value": current_count,
            "trend": _calculate_trend(current_count, previous_count),
        })

    return sorted(result, key=lambda item: item["value"], reverse=True)


def get_categories_catalog(period: str = "30d") -> list[dict]:
    """Return categories enriched with appeal counters and trend values."""
    breakdown_by_slug = {
        item["slug"]: item for item in get_category_breakdown(period)
    }
    categories = Category.query.filter_by(parent_id=None).order_by(Category.name.asc()).all()
    result = []

    for category in categories:
        metrics = breakdown_by_slug.get(category.slug, {})
        payload = category.to_dict(include_children=True)
        payload["appeal_count"] = metrics.get("value", 0)
        payload["trend"] = metrics.get("trend", 0)
        result.append(payload)

    return result


def get_summary(
    period: str = "30d",
    district_slug: str | None = None,
    category_slug: str | None = None,
) -> dict:
    """Get aggregated analytics summary with frontend-ready narrative fields."""
    _, since, _ = _get_period_bounds(period)
    query = Appeal.query.filter(Appeal.created_at >= since)

    if district_slug:
        district = District.query.filter_by(slug=district_slug).first()
        if district:
            query = query.filter(Appeal.district_id == district.id)

    if category_slug:
        category = Category.query.filter_by(slug=category_slug).first()
        if category:
            query = query.filter(Appeal.category_id == category.id)

    appeals = query.all()

    by_category = defaultdict(int)
    by_district = defaultdict(int)
    by_priority = defaultdict(int)
    by_status = defaultdict(int)

    for appeal in appeals:
        if appeal.category:
            by_category[appeal.category.slug] += 1
        if appeal.district:
            by_district[appeal.district.slug] += 1
        by_priority[appeal.priority] += 1
        by_status[appeal.status] += 1

    categories = _category_lookup()
    districts = _district_name_lookup()
    category_breakdown = _build_category_breakdown_from_counts(dict(by_category), categories)
    top_category = category_breakdown[0] if category_breakdown else None

    top_district_slug = None
    top_district_count = 0
    if by_district:
        top_district_slug, top_district_count = max(
            by_district.items(),
            key=lambda item: item[1],
        )

    critical_count = by_priority.get("critical", 0)
    resolved_count = by_status.get("resolved", 0)
    resolution_rate = round((resolved_count / len(appeals)) * 100) if appeals else 0

    resolved_appeals = [
        appeal for appeal in appeals if appeal.status == "resolved" and appeal.updated_at
    ]
    avg_response_hours = 0.0
    if resolved_appeals:
        total_hours = sum(
            (appeal.updated_at - appeal.created_at).total_seconds() / 3600
            for appeal in resolved_appeals
        )
        avg_response_hours = round(total_hours / len(resolved_appeals), 1)

    narrative, highlights = _build_summary_narrative(
        period=period,
        total=len(appeals),
        critical_count=critical_count,
        resolved_count=resolved_count,
        top_category=top_category,
        top_district_name=districts.get(top_district_slug) if top_district_slug else None,
        top_district_count=top_district_count,
        resolution_rate=resolution_rate,
    )

    return {
        "period": period,
        "total": len(appeals),
        "by_category": dict(by_category),
        "by_district": dict(by_district),
        "by_priority": dict(by_priority),
        "by_status": dict(by_status),
        "narrative": narrative,
        "highlights": highlights,
        "metrics": {
            **get_dashboard_stats(),
            "resolution_rate": resolution_rate,
            "avg_response_hours": avg_response_hours,
        },
        "category_breakdown": category_breakdown,
        "summary_source": "computed",
    }


def get_trends(period: str = "30d", category_slug: str | None = None) -> list[dict]:
    """Get time-series data for charts."""
    now, since, _ = _get_period_bounds(period)
    query = Appeal.query.filter(Appeal.created_at >= since)

    if category_slug:
        category = Category.query.filter_by(slug=category_slug).first()
        if category:
            query = query.filter(Appeal.category_id == category.id)

    appeals = query.all()
    daily_counts = defaultdict(lambda: {"count": 0, "resolved": 0, "critical": 0})

    for appeal in appeals:
        day_key = appeal.created_at.strftime("%Y-%m-%d")
        daily_counts[day_key]["count"] += 1
        if appeal.status == "resolved":
            daily_counts[day_key]["resolved"] += 1
        if appeal.priority == "critical":
            daily_counts[day_key]["critical"] += 1

    result = []
    current = since.date()
    today = now.date()

    while current <= today:
        day_key = current.strftime("%Y-%m-%d")
        point = daily_counts.get(day_key, {"count": 0, "resolved": 0, "critical": 0})
        result.append({
            "date": day_key,
            "count": point["count"],
            "total": point["count"],
            "resolved": point["resolved"],
            "critical": point["critical"],
        })
        current += timedelta(days=1)

    return result


def get_heatmap() -> list[dict]:
    """Get district totals with coordinates and recent trend values."""
    _, current_start, previous_start = _get_period_bounds("7d")
    districts = District.query.order_by(District.name.asc()).all()
    result = []

    for district in districts:
        total_count = Appeal.query.filter_by(district_id=district.id).count()
        current_period_count = Appeal.query.filter(
            Appeal.district_id == district.id,
            Appeal.created_at >= current_start,
        ).count()
        previous_period_count = Appeal.query.filter(
            Appeal.district_id == district.id,
            Appeal.created_at >= previous_start,
            Appeal.created_at < current_start,
        ).count()
        trend = _calculate_trend(current_period_count, previous_period_count)

        if current_period_count == 0:
            insight = "За последние 7 дней в этом районе не было новых обращений."
        elif trend > 0:
            insight = (
                f"За последние 7 дней количество новых обращений выросло на {trend}%."
            )
        elif trend < 0:
            insight = (
                f"За последние 7 дней количество новых обращений снизилось на {abs(trend)}%."
            )
        else:
            insight = "За последние 7 дней нагрузка по району остаётся стабильной."

        result.append({
            "district": district.to_dict(),
            "appeal_count": total_count,
            "trend": trend,
            "insight": insight,
        })

    return result
