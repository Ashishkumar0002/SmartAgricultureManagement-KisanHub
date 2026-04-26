from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
import time
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import (
    ActivityLog,
    Advisory,
    Alert,
    AnalyticsEvent,
    Crop,
    Equipment,
    EquipmentBooking,
    FarmImage,
    Farmer,
    FarmingTechnique,
    User,
)

APP_START_TIME = time.time()


@dataclass
class AdminService:
    """Service layer for admin analytics and management APIs."""

    def get_dashboard_stats(self, db: Session) -> dict[str, Any]:
        now = datetime.utcnow()
        seven_days_ago = now - timedelta(days=7)
        day_start = datetime(now.year, now.month, now.day)

        total_users = db.query(func.count(User.id)).scalar() or 0
        active_users = db.query(func.count(User.id)).filter(User.last_active >= seven_days_ago).scalar() or 0
        total_farmers = db.query(func.count(User.id)).filter(User.role == 'farmer').scalar() or 0
        active_crops = db.query(func.count(Crop.id)).scalar() or 0
        dau = db.query(func.count(User.id)).filter(User.last_active >= day_start).scalar() or 0

        growth_rows = (
            db.query(func.date(User.last_active).label('date'), func.count(User.id).label('count'))
            .filter(User.last_active.isnot(None), User.last_active >= seven_days_ago)
            .group_by(func.date(User.last_active))
            .order_by(func.date(User.last_active))
            .all()
        )
        growth_map = {str(row.date): int(row.count) for row in growth_rows if row.date is not None}

        user_growth_data: list[dict[str, Any]] = []
        for day_offset in range(6, -1, -1):
            day = now - timedelta(days=day_offset)
            key = day.date().isoformat()
            user_growth_data.append({'date': key, 'count': growth_map.get(key, 0)})

        crop_rows = (
            db.query(Crop.name.label('name'), func.count(Crop.id).label('count'))
            .group_by(Crop.name)
            .order_by(func.count(Crop.id).desc())
            .limit(10)
            .all()
        )

        feature_usage_counts = {
            'alertsCount': db.query(func.count(Alert.id)).scalar() or 0,
            'equipmentBookingsCount': db.query(func.count(EquipmentBooking.id)).scalar() or 0,
            'techniquesCount': db.query(func.count(FarmingTechnique.id)).scalar() or 0,
        }
        feature_usage_chart = [
            {'feature': 'alerts', 'count': int(feature_usage_counts['alertsCount'])},
            {'feature': 'equipmentBookings', 'count': int(feature_usage_counts['equipmentBookingsCount'])},
            {'feature': 'techniques', 'count': int(feature_usage_counts['techniquesCount'])},
        ]

        crop_distribution = [
            {'cropType': row.name, 'name': row.name, 'count': int(row.count)} for row in crop_rows
        ]

        return {
            'totalUsers': int(total_users),
            'activeUsers': int(active_users),
            'totalFarmers': int(total_farmers),
            'activeCrops': int(active_crops),
            'dau': int(dau),
            'userGrowthData': user_growth_data,
            'cropDistribution': crop_distribution,
            'featureUsage': feature_usage_chart,
            'featureUsageCounts': feature_usage_counts,
        }

    def get_farming_insights(self, db: Session) -> dict[str, Any]:
        top_crops = (
            db.query(Crop.name.label('name'), func.count(Crop.id).label('count'))
            .group_by(Crop.name)
            .order_by(func.count(Crop.id).desc())
            .limit(8)
            .all()
        )

        techniques = (
            db.query(FarmingTechnique.title.label('name'), func.count(FarmingTechnique.id).label('count'))
            .group_by(FarmingTechnique.title)
            .order_by(func.count(FarmingTechnique.id).desc())
            .limit(8)
            .all()
        )

        region_wise = (
            db.query(User.region.label('region'), func.count(User.id).label('count'))
            .filter(User.role == 'farmer')
            .group_by(User.region)
            .order_by(func.count(User.id).desc())
            .all()
        )

        return {
            'topCrops': [{'name': row.name, 'count': int(row.count)} for row in top_crops],
            'mostUsedTechniques': [{'name': row.name, 'count': int(row.count)} for row in techniques],
            'regionWiseFarmers': [
                {'region': row.region or 'Unknown', 'count': int(row.count)} for row in region_wise
            ],
        }

    def get_analytics(self, db: Session) -> dict[str, Any]:
        now = datetime.utcnow()
        day_start = now - timedelta(days=1)
        month_start = now - timedelta(days=30)

        dau = db.query(func.count(User.id)).filter(User.last_active >= day_start).scalar() or 0
        mau = db.query(func.count(User.id)).filter(User.last_active >= month_start).scalar() or 0

        prev_window_end = month_start
        prev_window_start = prev_window_end - timedelta(days=30)
        retained_users = (
            db.query(func.count(User.id))
            .filter(User.last_active >= month_start, User.created_at <= prev_window_end)
            .scalar()
            or 0
        )
        baseline_users = (
            db.query(func.count(User.id))
            .filter(User.created_at >= prev_window_start, User.created_at < prev_window_end)
            .scalar()
            or 0
        )
        retention_rate = round((retained_users / baseline_users) * 100, 2) if baseline_users else 0.0

        feature_events = (
            db.query(AnalyticsEvent.feature.label('feature'), func.count(AnalyticsEvent.id).label('count'))
            .filter(AnalyticsEvent.created_at >= month_start)
            .group_by(AnalyticsEvent.feature)
            .order_by(func.count(AnalyticsEvent.id).desc())
            .all()
        )

        if not feature_events:
            feature_events = [
                ('alerts', db.query(func.count(Alert.id)).scalar() or 0),
                ('equipment', db.query(func.count(EquipmentBooking.id)).scalar() or 0),
                ('techniques', db.query(func.count(FarmingTechnique.id)).scalar() or 0),
            ]
            usage = [{'feature': row[0], 'count': int(row[1])} for row in feature_events]
        else:
            usage = [{'feature': row.feature or 'unknown', 'count': int(row.count)} for row in feature_events]

        return {
            'dau': dau,
            'mau': mau,
            'retentionRate': retention_rate,
            'retentionData': {
                'retainedUsers': retained_users,
                'baselineUsers': baseline_users,
                'rate': retention_rate,
            },
            'featureUsage': usage,
        }

    def get_equipment_analytics(self, db: Session) -> dict[str, Any]:
        total = db.query(func.count(Equipment.id)).scalar() or 0
        total_bookings = db.query(func.count(EquipmentBooking.id)).scalar() or 0
        booked = (
            db.query(func.count(EquipmentBooking.id))
            .filter(EquipmentBooking.status.in_(['confirmed', 'approved', 'pending']))
            .scalar()
            or 0
        )

        most_rented_rows = (
            db.query(Equipment.name.label('name'), func.count(EquipmentBooking.id).label('count'))
            .join(EquipmentBooking, Equipment.id == EquipmentBooking.equipment_id)
            .group_by(Equipment.name)
            .order_by(func.count(EquipmentBooking.id).desc())
            .limit(10)
            .all()
        )

        return {
            'totalListings': total,
            'totalBookings': total_bookings,
            'activeBookings': booked,
            'mostRentedEquipment': [{'name': row.name, 'count': int(row.count)} for row in most_rented_rows],
        }

    def get_system_health(self, db: Session) -> dict[str, Any]:
        now = datetime.utcnow()
        one_day_ago = now - timedelta(days=1)

        recent_errors = (
            db.query(func.count(ActivityLog.id))
            .filter(ActivityLog.level == 'error', ActivityLog.timestamp >= one_day_ago)
            .scalar()
            or 0
        )
        uptime_seconds = max(0, int(time.time() - APP_START_TIME))

        return {
            'serverTime': now.isoformat(),
            'uptime': uptime_seconds,
            'status': 'OK',
            'totalErrors': int(recent_errors),
            # Keep legacy fields for backward compatibility with existing screens.
            'apiStatus': 'ok',
            'databaseStatus': 'ok',
            'recentErrorCount': int(recent_errors),
        }


admin_service = AdminService()
