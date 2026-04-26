"""
Farmer Dashboard Router - All endpoints for farmer functionality
"""

from datetime import datetime, timedelta
import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import (
    User, Farmer, Expert, Crop, Advisory, MarketPrice,
    Job, Worker, Application, Equipment, EquipmentBooking,
    AdvisoryImage, AdvisoryMessage, FarmingTechnique, Alert,
    CropGuide, CropInfo, ActivityLog, FarmImage
)
from app.schemas import (
    FarmerIn, FarmerOut,
    CropIn, CropOut,
    AdvisoryIn, AdvisoryOut, AdvisoryDetailOut, AdvisoryMessageIn, AdvisoryMessageOut,
    MarketPriceOut,
    MarketNewsOut,
    AlertOut,
    GovernmentSchemeOut,
    OpenFarmCropOut,
    ApplicationIn, ApplicationOut, AvailableJobOut, FarmerApplicationOut,
    JobApplicantOut, JobIn, JobOut,
    WorkerIn, WorkerOut,
    EquipmentIn, EquipmentOut,
    EquipmentBookingIn, EquipmentBookingOut,
    FarmingTechniqueOut,
    CropGuideOut,
    FarmerJobApplicationOut,
    FarmerDashboardStatsOut
)
from app.services.deps import get_current_user
from app.core.config import settings
import os
import shutil
from sqlalchemy import func, or_

router = APIRouter(prefix='/farmer', tags=['farmer'])


def _avg_from_range(text: str) -> float:
    numbers: list[float] = []
    current = ''
    for ch in text:
        if ch.isdigit() or ch == '.':
            current += ch
        elif current:
            numbers.append(float(current))
            current = ''
    if current:
        numbers.append(float(current))

    if not numbers:
        return 0.0
    if len(numbers) == 1:
        return numbers[0]
    return (numbers[0] + numbers[1]) / 2


def _expected_yield_to_tons(expected_yield: str) -> float:
    text = expected_yield.lower()
    avg = _avg_from_range(text)
    if avg <= 0:
        return 0.0

    if 'quintal' in text:
        return round(avg / 10, 2)
    if 'ton' in text:
        return round(avg, 2)
    return round(avg, 2)


def _estimate_growth_days(sowing_season: str, crop_type: str) -> int:
    season = sowing_season.lower()
    ctype = crop_type.lower()

    if 'fruit' in ctype:
        return 240
    if 'cash' in ctype:
        return 180
    if 'vegetable' in ctype:
        return 110
    if 'grain' in ctype:
        return 130

    if 'winter' in season:
        return 140
    if 'monsoon' in season:
        return 120
    if 'summer' in season:
        return 100
    return 120


def _build_market_price_fallback(limit: int, crop_name: str | None = None) -> list[dict]:
    crops = [
        'Wheat', 'Rice', 'Maize', 'Barley', 'Mustard', 'Soybean', 'Groundnut',
        'Cotton', 'Sugarcane', 'Gram', 'Tur', 'Moong', 'Urad', 'Masoor',
        'Bajra', 'Jowar', 'Onion', 'Potato', 'Tomato', 'Garlic', 'Chili',
        'Apple', 'Banana', 'Mango', 'Orange', 'Cauliflower', 'Cabbage',
        'Brinjal', 'Lady Finger', 'Cucumber', 'Peas', 'Carrot', 'Spinach',
    ]
    markets = [
        'Ludhiana Mandi, Punjab', 'Azadpur Mandi, Delhi', 'Nashik Market, Maharashtra',
        'Patna Mandi, Bihar', 'Kanpur Market, Uttar Pradesh', 'Indore Market, Madhya Pradesh',
        'Jaipur Mandi, Rajasthan', 'Ahmedabad Mandi, Gujarat', 'Kolkata Market, West Bengal',
        'Hyderabad Mandi, Telangana', 'Bengaluru Market, Karnataka', 'Coimbatore Mandi, Tamil Nadu',
        'Pune APMC, Maharashtra', 'Bathinda Mandi, Punjab', 'Nagpur Market, Maharashtra',
    ]

    normalized_crop = (crop_name or '').strip()
    if normalized_crop:
        crops = [normalized_crop.title()]

    now = datetime.utcnow()
    rows: list[dict] = []
    for index in range(limit):
        crop = crops[index % len(crops)]
        market = markets[index % len(markets)]
        # Deterministic synthetic modal price to keep fallback stable.
        price = float(1200 + ((index * 137) % 5200)) / 100
        rows.append({
            'id': index + 1,
            'crop_name': crop,
            'price': price,
            'market_name': market,
            'updated_at': now - timedelta(days=index % 7),
        })
    return rows


def _market_price_row_to_response(item: MarketPrice, index: int) -> dict:
    return {
        'id': index + 1,
        'crop_name': item.crop_name,
        'price': round(float(item.price) / 100, 2),
        'market_name': item.market_name,
        'updated_at': item.updated_at,
    }


def _build_market_news_fallback(limit: int) -> list[dict]:
    fallback_items = [
        {
            'title': 'Kharif season outlook: mandi demand expected to remain strong',
            'description': 'Early arrivals and steady transport conditions are supporting mandi activity across major agricultural belts.',
            'url': 'https://www.agricoop.nic.in/',
            'image_url': 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=80',
            'source_name': 'Agriculture Desk',
        },
        {
            'title': 'Irrigation planning picks up as farmers prepare for next sowing window',
            'description': 'Farm advisors recommend water scheduling to reduce stress risk during temperature swings.',
            'url': 'https://farmer.gov.in/',
            'image_url': 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80',
            'source_name': 'Farm Water Monitor',
        },
        {
            'title': 'Fertilizer availability improves in key crop clusters',
            'description': 'Distribution channels report improved stock flow for urea and balanced nutrient blends.',
            'url': 'https://www.india.gov.in/topics/agriculture',
            'image_url': 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1600&q=80',
            'source_name': 'Rural Inputs Watch',
        },
        {
            'title': 'Crop advisory update: pest management focus for vegetable growers',
            'description': 'Experts suggest integrated practices and field-level scouting for timely intervention.',
            'url': 'https://agmarknet.gov.in/',
            'image_url': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1600&q=80',
            'source_name': 'Agri Advisory Line',
        },
        {
            'title': 'Market trend: oilseed prices show mixed movement across mandis',
            'description': 'Regional demand and arrivals continue to influence daily price direction for key commodities.',
            'url': 'https://agmarknet.gov.in/',
            'image_url': 'https://images.unsplash.com/photo-1530507629858-e4977d30e89d?auto=format&fit=crop&w=1600&q=80',
            'source_name': 'Mandi Update',
        },
    ]

    now = datetime.utcnow()
    rows: list[dict] = []
    for index in range(limit):
        source = fallback_items[index % len(fallback_items)]
        rows.append({
            **source,
            'published_at': now - timedelta(hours=index * 3),
        })
    return rows


def _normalize_text(value: object) -> str:
    if value is None:
        return ''
    return str(value).strip()


def _extract_field(record: dict, direct_keys: list[str], fuzzy_keys: list[str]) -> str | None:
    normalized_map = {str(key).strip().lower(): key for key in record.keys()}

    for key in direct_keys:
        original_key = normalized_map.get(key.lower())
        if original_key is None:
            continue
        value = _normalize_text(record.get(original_key))
        if value:
            return value

    for fuzzy in fuzzy_keys:
        fuzzy_lower = fuzzy.lower()
        for normalized_key, original_key in normalized_map.items():
            if fuzzy_lower in normalized_key:
                value = _normalize_text(record.get(original_key))
                if value:
                    return value
    return None


def _build_scheme_rows_from_records(records: list[dict]) -> list[dict]:
    rows: list[dict] = []
    for record in records:
        scheme_name = _extract_field(
            record,
            ['scheme_name', 'scheme', 'name'],
            ['scheme', 'yojana', 'title']
        )
        if not scheme_name:
            continue

        ministry = _extract_field(
            record,
            ['ministry', 'ministry_name', 'department'],
            ['ministry', 'department']
        )
        state = _extract_field(
            record,
            ['state', 'state_name', 'state_ut'],
            ['state', 'ut']
        )
        description = _extract_field(
            record,
            ['description', 'brief', 'details'],
            ['description', 'objective', 'benefit', 'brief']
        )
        source_url = _extract_field(
            record,
            ['url', 'link', 'website'],
            ['http', 'url', 'link']
        )

        rows.append({
            'scheme_name': scheme_name,
            'ministry': ministry,
            'state': state,
            'description': description,
            'source_url': source_url,
        })
    return rows


def _append_important_schemes(rows: list[dict]) -> list[dict]:
    important = [
        {
            'scheme_name': 'PM-KISAN',
            'ministry': 'Ministry of Agriculture & Farmers Welfare',
            'state': 'All India',
            'description': 'Income support scheme for eligible farmer families.',
            'source_url': 'https://pmkisan.gov.in/',
        },
        {
            'scheme_name': 'Pradhan Mantri Fasal Bima Yojana',
            'ministry': 'Ministry of Agriculture & Farmers Welfare',
            'state': 'All India',
            'description': 'Crop insurance support against yield losses and climate risks.',
            'source_url': 'https://pmfby.gov.in/',
        },
        {
            'scheme_name': 'Kisan Credit Card',
            'ministry': 'Department of Financial Services',
            'state': 'All India',
            'description': 'Affordable institutional credit for crop and allied activities.',
            'source_url': 'https://www.myscheme.gov.in/',
        },
        {
            'scheme_name': 'Soil Health Card Scheme',
            'ministry': 'Ministry of Agriculture & Farmers Welfare',
            'state': 'All India',
            'description': 'Soil nutrient assessment and advisory for balanced fertilizer usage.',
            'source_url': 'https://soilhealth.dac.gov.in/',
        },
    ]

    existing = {_normalize_text(item.get('scheme_name')).lower() for item in rows}
    for item in important:
        if item['scheme_name'].lower() not in existing:
            rows.append(item)
    return rows


def _crop_info_to_guide_payload(item: CropInfo) -> dict:
    return {
        'id': item.id,
        'crop_name': item.name,
        'growth_duration_days': _estimate_growth_days(item.sowing_season, item.crop_type),
        'water_requirements': item.water_requirements,
        'climate_conditions': item.climate_requirements,
        'fertilizer_usage': item.fertilizer_recommendations,
        'common_diseases': item.pest_disease_prevention,
        'prevention_methods': item.best_practices,
        'best_season': item.sowing_season,
        'avg_yield_per_hectare': _expected_yield_to_tons(item.expected_yield),
        'created_at': item.created_at,
        'updated_at': item.updated_at,
    }


def _crop_category_profile(crop_name: str) -> dict:
    normalized = crop_name.strip().lower()

    if normalized in {'apple', 'banana', 'mango', 'orange'}:
        category = 'Fruits'
    elif normalized in {'tomato', 'onion', 'potato', 'garlic', 'chili', 'cauliflower', 'cabbage', 'brinjal', 'cucumber', 'carrot', 'spinach'}:
        category = 'Vegetables'
    else:
        category = 'Others'

    category_map = {
        'wheat': {
            'season': 'Rabi',
            'soil_type': 'Loamy soil',
            'temperature': '10-25°C',
            'water_requirement': 'Moderate',
            'irrigation': 'Every 7-10 days',
            'fertilizer': {'nitrogen': '120 kg/ha', 'phosphorus': '60 kg/ha', 'potassium': '40 kg/ha'},
            'sowing_time': 'October-November',
            'harvest_time': 'March-April',
            'common_diseases': ['Rust', 'Powdery mildew'],
            'solutions': ['Use fungicide', 'Crop rotation'],
        },
        'rice': {
            'season': 'Kharif',
            'soil_type': 'Clay loam soil',
            'temperature': '20-35°C',
            'water_requirement': 'High',
            'irrigation': 'Continuous standing water / every 5-7 days',
            'fertilizer': {'nitrogen': '100 kg/ha', 'phosphorus': '50 kg/ha', 'potassium': '40 kg/ha'},
            'sowing_time': 'June-July',
            'harvest_time': 'October-November',
            'common_diseases': ['Blast', 'Bacterial blight'],
            'solutions': ['Seed treatment', 'Proper drainage'],
        },
        'tomato': {
            'season': 'Rabi / Zaid',
            'soil_type': 'Well-drained loamy soil',
            'temperature': '18-28°C',
            'water_requirement': 'Moderate',
            'irrigation': 'Every 4-7 days',
            'fertilizer': {'nitrogen': '90 kg/ha', 'phosphorus': '60 kg/ha', 'potassium': '80 kg/ha'},
            'sowing_time': 'August-September',
            'harvest_time': 'December-February',
            'common_diseases': ['Early blight', 'Leaf curl'],
            'solutions': ['Mulching', 'Integrated pest management'],
        },
    }

    cereal_defaults = {
        'season': 'Kharif / Rabi',
        'soil_type': 'Well-drained loamy soil',
        'temperature': '15-30°C',
        'water_requirement': 'Moderate',
        'irrigation': 'Every 7-10 days',
        'fertilizer': {'nitrogen': '100 kg/ha', 'phosphorus': '50 kg/ha', 'potassium': '40 kg/ha'},
        'sowing_time': 'Monsoon / Early winter',
        'harvest_time': '3-5 months after sowing',
        'common_diseases': ['Rust', 'Leaf spot'],
        'solutions': ['Crop rotation', 'Use certified seeds'],
    }

    pulse_defaults = {
        'season': 'Rabi / Summer',
        'soil_type': 'Loamy to clay loam soil',
        'temperature': '20-30°C',
        'water_requirement': 'Low to moderate',
        'irrigation': 'Every 10-14 days',
        'fertilizer': {'nitrogen': '20 kg/ha', 'phosphorus': '50 kg/ha', 'potassium': '20 kg/ha'},
        'sowing_time': 'October-November',
        'harvest_time': '2.5-4 months after sowing',
        'common_diseases': ['Wilt', 'Powdery mildew'],
        'solutions': ['Seed treatment', 'Intercropping'],
    }

    oilseed_defaults = {
        'season': 'Rabi / Kharif',
        'soil_type': 'Sandy loam to loamy soil',
        'temperature': '18-32°C',
        'water_requirement': 'Moderate',
        'irrigation': 'Every 8-12 days',
        'fertilizer': {'nitrogen': '60 kg/ha', 'phosphorus': '40 kg/ha', 'potassium': '40 kg/ha'},
        'sowing_time': 'October-November',
        'harvest_time': 'March-April',
        'common_diseases': ['Rust', 'Root rot'],
        'solutions': ['Disease-resistant varieties', 'Balanced fertilization'],
    }

    vegetable_defaults = {
        'season': 'Year-round (preferred cool season)',
        'soil_type': 'Fertile loamy soil',
        'temperature': '15-30°C',
        'water_requirement': 'Moderate to high',
        'irrigation': 'Every 3-6 days',
        'fertilizer': {'nitrogen': '80 kg/ha', 'phosphorus': '60 kg/ha', 'potassium': '60 kg/ha'},
        'sowing_time': 'Season-specific nursery/transplanting',
        'harvest_time': '60-120 days after sowing',
        'common_diseases': ['Blight', 'Mosaic virus'],
        'solutions': ['Neem-based spray', 'Staking and spacing'],
    }

    fruit_defaults = {
        'season': 'Perennial crop',
        'soil_type': 'Deep loamy soil',
        'temperature': '12-30°C',
        'water_requirement': 'Moderate',
        'irrigation': 'Every 7-14 days',
        'fertilizer': {'nitrogen': '150 kg/ha', 'phosphorus': '80 kg/ha', 'potassium': '100 kg/ha'},
        'sowing_time': 'Monsoon / Spring',
        'harvest_time': '6-12 months after planting',
        'common_diseases': ['Fruit rot', 'Anthracnose'],
        'solutions': ['Pruning', 'Orchard sanitation'],
    }

    commercial_defaults = {
        'season': 'Long duration crop',
        'soil_type': 'Well-drained fertile soil',
        'temperature': '20-35°C',
        'water_requirement': 'Moderate to high',
        'irrigation': 'Every 5-10 days',
        'fertilizer': {'nitrogen': '120 kg/ha', 'phosphorus': '60 kg/ha', 'potassium': '60 kg/ha'},
        'sowing_time': 'Spring / Monsoon',
        'harvest_time': '4-12 months depending on crop',
        'common_diseases': ['Borer attack', 'Wilt'],
        'solutions': ['Use resistant varieties', 'Monitor pests regularly'],
    }

    if normalized in {'wheat', 'rice', 'maize', 'barley', 'bajra', 'jowar'}:
        base = cereal_defaults
    elif normalized in {'gram', 'tur', 'moong', 'urad', 'masoor', 'peas'}:
        base = pulse_defaults
    elif normalized in {'mustard', 'soybean', 'groundnut', 'sunflower', 'sesame'}:
        base = oilseed_defaults
    elif normalized in {'tomato', 'onion', 'potato', 'garlic', 'chili', 'cauliflower', 'cabbage', 'brinjal', 'cucumber', 'carrot'}:
        base = vegetable_defaults
    elif normalized in {'apple', 'banana', 'mango', 'orange'}:
        base = fruit_defaults
    elif normalized in {'cotton', 'sugarcane'}:
        base = commercial_defaults
    else:
        base = vegetable_defaults

    profile = {
        'crop_name': crop_name.title(),
        'category': category,
        **base,
    }

    if normalized == 'tomato':
        profile['solutions'] = ['Use fungicide', 'Crop rotation']
    return profile


def _build_openfarm_crop_profiles(limit: int = 30) -> list[dict]:
    crop_names = [
        'Wheat', 'Rice', 'Maize', 'Barley', 'Mustard', 'Soybean', 'Groundnut',
        'Cotton', 'Sugarcane', 'Gram', 'Tur', 'Moong', 'Urad', 'Masoor',
        'Bajra', 'Jowar', 'Onion', 'Potato', 'Tomato', 'Garlic', 'Chili',
        'Apple', 'Banana', 'Mango', 'Orange', 'Cauliflower', 'Cabbage',
        'Brinjal', 'Cucumber', 'Carrot', 'Peas',
    ]

    profiles = [_crop_category_profile(name) for name in crop_names[:limit]]
    return profiles


def _filter_openfarm_crops_by_category(crops: list[dict], category: str | None) -> list[dict]:
    normalized = (category or '').strip().lower()
    if not normalized or normalized == 'all':
        return crops

    if normalized == 'fruit':
        normalized = 'fruits'
    elif normalized == 'vegetable':
        normalized = 'vegetables'
    elif normalized in {'other', 'others'}:
        normalized = 'others'

    if normalized == 'fruits':
        return [item for item in crops if item.get('category', '').lower() == 'fruits']
    if normalized == 'vegetables':
        return [item for item in crops if item.get('category', '').lower() == 'vegetables']
    if normalized == 'others':
        return [item for item in crops if item.get('category', '').lower() == 'others']
    return crops


def _fetch_openfarm_crop_profile(filter_name: str) -> dict | None:
    url = f"https://openfarm.cc/api/v1/crops/?filter={filter_name}"
    try:
        request = Request(url, headers={'User-Agent': 'SAMS/1.0'})
        with urlopen(request, timeout=8) as response:
            payload = json.loads(response.read().decode('utf-8'))

        items = payload.get('data') or payload.get('crops') or payload.get('results') or []
        if isinstance(items, dict):
            items = [items]
        if not isinstance(items, list) or not items:
            return None

        first_item = items[0]
        attributes = first_item.get('attributes') if isinstance(first_item, dict) else {}
        crop_name = (
            (first_item.get('name') if isinstance(first_item, dict) else None)
            or (attributes.get('name') if isinstance(attributes, dict) else None)
            or filter_name.title()
        )
        return _crop_category_profile(str(crop_name))
    except Exception:
        return None


def _fetch_openfarm_crop_catalog(limit: int = 30) -> list[dict]:
    url = 'https://openfarm.cc/api/v1/crops/'
    try:
        request = Request(url, headers={'User-Agent': 'SAMS/1.0'})
        with urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode('utf-8'))

        items = payload.get('data') or payload.get('crops') or payload.get('results') or []
        if isinstance(items, dict):
            items = [items]
        if not isinstance(items, list) or not items:
            return []

        seen: set[str] = set()
        profiles: list[dict] = []
        for item in items:
            if not isinstance(item, dict):
                continue

            attributes = item.get('attributes') if isinstance(item.get('attributes'), dict) else {}
            name = _normalize_text(item.get('name') or attributes.get('name'))
            if not name:
                continue

            normalized = name.lower()
            if normalized in seen:
                continue
            seen.add(normalized)

            profile = _crop_category_profile(name)
            profile['source_url'] = 'https://openfarm.cc/api/v1/crops/'
            profiles.append(profile)

            if len(profiles) >= limit:
                break

        return profiles
    except Exception:
        return []


def _get_farmer_for_current_user(current_user: User, db: Session, farmer_id: int | None = None) -> Farmer:
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')

    if farmer_id is not None and farmer_id != farmer.id:
        raise HTTPException(status_code=403, detail='Farmer mismatch')

    return farmer


def _resolve_applicant_profile(applicant: User, db: Session) -> dict[str, str | None]:
    farmer_profile = db.query(Farmer).filter(Farmer.user_id == applicant.id).first()
    expert_profile = db.query(Expert).filter(Expert.user_id == applicant.id).first()

    skills = None
    location = None
    experience = None
    contact = applicant.phone

    if farmer_profile:
        skills = farmer_profile.crop_types or farmer_profile.crop_variety
        location = farmer_profile.location
        contact = farmer_profile.phone or contact
        experience = (
            f"{farmer_profile.farming_experience_years} years"
            if farmer_profile.farming_experience_years is not None
            else None
        )
    elif expert_profile:
        skills = expert_profile.specialization
        location = expert_profile.working_organization
        contact = expert_profile.phone or contact
        experience = (
            f"{expert_profile.years_of_experience} years"
            if expert_profile.years_of_experience is not None
            else None
        )

    return {
        'applicant_name': applicant.full_name,
        'experience': experience,
        'skills': skills,
        'contact_number': contact,
        'location': location,
    }


def require_farmer(current_user: User = Depends(get_current_user)) -> User:
    """Verify user is a farmer"""
    if current_user.role != 'farmer':
        raise HTTPException(status_code=403, detail='Only farmers can access this endpoint')
    return current_user


def log_activity(
    db: Session,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    description: str = '',
    ip_address: str | None = None
):
    """Log user activity"""
    activity = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        ip_address=ip_address
    )
    db.add(activity)
    db.commit()


def ensure_upload_dir():
    """Ensure upload directory exists"""
    os.makedirs('uploads/advisory_images', exist_ok=True)


def ensure_farm_upload_dir():
    os.makedirs('uploads/farms', exist_ok=True)


def _split_csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(',') if item.strip()]


def _join_csv(values: list[str] | None) -> str | None:
    items = [item.strip() for item in (values or []) if item and item.strip()]
    if not items:
        return None
    return ', '.join(items)


def _calculate_soil_health_status(
    soil_ph: float | None,
    moisture: float | None,
    nitrogen: float | None,
    phosphorus: float | None,
    potassium: float | None,
) -> str:
    nutrient_values = [value for value in [nitrogen, phosphorus, potassium] if value is not None]
    ph_good = soil_ph is not None and 6.0 <= soil_ph <= 7.5
    moisture_good = moisture is not None and moisture > 40
    nutrients_balanced = len(nutrient_values) == 3 and min(nutrient_values) >= 20 and (max(nutrient_values) - min(nutrient_values)) <= 60

    if ph_good and moisture_good and nutrients_balanced:
        return 'Good'

    moderate = (
        soil_ph is not None and 5.5 <= soil_ph <= 8.0
        and moisture is not None and moisture >= 25
        and len(nutrient_values) >= 2
    )
    return 'Moderate' if moderate else 'Poor'


def _calculate_crop_duration_days(sowing_date: datetime | None, harvest_date: datetime | None) -> int | None:
    if not sowing_date or not harvest_date:
        return None
    delta = harvest_date.date() - sowing_date.date()
    return max(delta.days, 0)


def _generate_smart_alerts(farmer: Farmer) -> list[dict]:
    now = datetime.utcnow()
    alerts: list[dict] = []

    if farmer.soil_moisture is not None and farmer.soil_moisture < 30:
        alerts.append({
            'message': f"Low moisture alert: Soil moisture is {farmer.soil_moisture:.1f}%. Irrigation is recommended.",
            'type': 'soil',
            'date': now,
        })

    if farmer.soil_ph is not None and (farmer.soil_ph < 6.0 or farmer.soil_ph > 7.5):
        alerts.append({
            'message': f"Soil imbalance alert: Soil pH is {farmer.soil_ph:.1f}, which is outside the recommended range.",
            'type': 'soil',
            'date': now,
        })

    if farmer.harvest_date is not None:
        days_to_harvest = (farmer.harvest_date.date() - now.date()).days
        if 0 <= days_to_harvest <= 30:
            alerts.append({
                'message': f'Harvest reminder: Harvest is due in {days_to_harvest} day(s). Plan labour and storage now.',
                'type': 'planning',
                'date': now,
            })

    return alerts


def _smart_alerts_to_dashboard_alerts(farmer: Farmer) -> list[dict]:
    now = datetime.utcnow()
    rows: list[dict] = []

    for index, alert in enumerate(_generate_smart_alerts(farmer), start=1):
        message = str(alert['message'])
        alert_type = str(alert['type'])
        rows.append({
            'id': -(100 + index),
            'expert_id': 0,
            'title': message.split(':', 1)[0],
            'description': message,
            'alert_type': alert_type,
            'severity': 'high' if 'moisture' in message.lower() else ('medium' if 'imbalance' in message.lower() else 'low'),
            'target_regions': farmer.location,
            'affected_crops': farmer.current_crops,
            'recommendations': 'Review farm conditions and take corrective action.',
            'is_active': True,
            'created_at': alert['date'],
            'updated_at': alert['date'],
            'expiry_date': farmer.harvest_date if 'harvest' in message.lower() else None,
        })

    return rows


def _farmer_to_response(farmer: Farmer, include_alerts: bool = True) -> dict:
    crop_current = farmer.current_crops or farmer.crop_variety
    equipment = _split_csv(farmer.equipment_owned)

    response = {
        'id': farmer.id,
        'user_id': farmer.user_id,
        'name': farmer.name,
        'location': farmer.location,
        'total_land': farmer.total_land,
        'soil_type': farmer.soil_type,
        'crop_variety': farmer.crop_variety,
        'irrigation_type': farmer.irrigation_type,
        'phone': farmer.phone,
        'profile_image': farmer.profile_image,
        'farm_image': farmer.farm_image,
        'soil': {
            'type': farmer.soil_type,
            'ph': farmer.soil_ph,
            'nitrogen': farmer.soil_nitrogen,
            'phosphorus': farmer.soil_phosphorus,
            'potassium': farmer.soil_potassium,
            'moisture': farmer.soil_moisture,
            'health_status': farmer.soil_health_status,
        },
        'crop_planning': {
            'current_crop': crop_current,
            'previous_crop': farmer.previous_crop,
            'season': farmer.crop_season,
            'sowing_date': farmer.sowing_date,
            'harvest_date': farmer.harvest_date,
            'duration_days': farmer.crop_duration_days,
        },
        'analytics': {
            'yield_kg': farmer.yield_kg,
            'cost': farmer.cost,
            'revenue': farmer.revenue,
            'profit': farmer.profit,
        },
        'assets': {
            'equipment': equipment,
            'livestock': farmer.livestock_count,
            'storage': farmer.storage_capacity_kg,
            'workers': farmer.workers_count,
        },
        'created_at': farmer.created_at,
        'updated_at': farmer.updated_at,
    }

    if include_alerts:
        response['alerts'] = _generate_smart_alerts(farmer)

    return response


def _apply_farmer_payload(farmer: Farmer, data: FarmerIn) -> Farmer:
    payload = data.model_dump(exclude_none=True)
    nested_keys = {'soil', 'crop_planning', 'analytics', 'assets'}

    for key, value in payload.items():
        if key not in nested_keys and hasattr(farmer, key):
            setattr(farmer, key, value)

    soil = payload.get('soil') or {}
    if isinstance(soil, dict):
        if soil.get('type') is not None:
            farmer.soil_type = soil.get('type')
        farmer.soil_ph = soil.get('ph', farmer.soil_ph)
        farmer.soil_nitrogen = soil.get('nitrogen', farmer.soil_nitrogen)
        farmer.soil_phosphorus = soil.get('phosphorus', farmer.soil_phosphorus)
        farmer.soil_potassium = soil.get('potassium', farmer.soil_potassium)
        farmer.soil_moisture = soil.get('moisture', farmer.soil_moisture)
        farmer.soil_health_status = _calculate_soil_health_status(
            farmer.soil_ph,
            farmer.soil_moisture,
            farmer.soil_nitrogen,
            farmer.soil_phosphorus,
            farmer.soil_potassium,
        )

    crop_planning = payload.get('crop_planning') or {}
    if isinstance(crop_planning, dict):
        if crop_planning.get('current_crop') is not None:
            farmer.current_crops = crop_planning.get('current_crop')
        farmer.previous_crop = crop_planning.get('previous_crop', farmer.previous_crop)
        farmer.crop_season = crop_planning.get('season', farmer.crop_season)
        farmer.sowing_date = crop_planning.get('sowing_date', farmer.sowing_date)
        farmer.harvest_date = crop_planning.get('harvest_date', farmer.harvest_date)
        farmer.crop_duration_days = crop_planning.get(
            'duration_days',
            _calculate_crop_duration_days(farmer.sowing_date, farmer.harvest_date),
        )

    analytics = payload.get('analytics') or {}
    if isinstance(analytics, dict):
        farmer.yield_kg = analytics.get('yield_kg', farmer.yield_kg)
        farmer.cost = analytics.get('cost', farmer.cost)
        farmer.revenue = analytics.get('revenue', farmer.revenue)
        farmer.profit = analytics.get(
            'profit',
            (farmer.revenue - farmer.cost) if farmer.revenue is not None and farmer.cost is not None else farmer.profit,
        )

    assets = payload.get('assets') or {}
    if isinstance(assets, dict):
        equipment = assets.get('equipment')
        if isinstance(equipment, list):
            farmer.equipment_owned = _join_csv([str(item) for item in equipment])
        farmer.livestock_count = assets.get('livestock', farmer.livestock_count)
        farmer.storage_capacity_kg = assets.get('storage', farmer.storage_capacity_kg)
        farmer.workers_count = assets.get('workers', farmer.workers_count)

    if farmer.revenue is not None and farmer.cost is not None:
        farmer.profit = farmer.revenue - farmer.cost

    if farmer.farm_image and not farmer.profile_image:
        farmer.profile_image = farmer.farm_image

    farmer.soil_health_status = _calculate_soil_health_status(
        farmer.soil_ph,
        farmer.soil_moisture,
        farmer.soil_nitrogen,
        farmer.soil_phosphorus,
        farmer.soil_potassium,
    )
    farmer.crop_duration_days = _calculate_crop_duration_days(farmer.sowing_date, farmer.harvest_date)
    return farmer


# ==================== FARMER PROFILE ====================

@router.get('/profile', response_model=FarmerOut)
@router.get('/farm', response_model=FarmerOut)
async def get_farmer_profile(
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Get farmer profile"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')
    return _farmer_to_response(farmer)


@router.post('/profile', response_model=FarmerOut)
@router.post('/farm', response_model=FarmerOut)
async def create_farmer_profile(
    data: FarmerIn,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Create or update farmer profile"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    
    if farmer:
        farmer = _apply_farmer_payload(farmer, data)
        farmer.updated_at = datetime.utcnow()
    else:
        farmer = Farmer(user_id=current_user.id)
        farmer = _apply_farmer_payload(farmer, data)
        db.add(farmer)
    
    db.commit()
    log_activity(db, current_user.id, 'update', 'farmer_profile', farmer.id, 
                 'Farmer profile updated', None)
    return _farmer_to_response(farmer)


@router.put('/profile', response_model=FarmerOut)
@router.put('/farm', response_model=FarmerOut)
async def update_farmer_profile(
    data: FarmerIn,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Update farmer profile"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found. Create one first.')
    
    farmer = _apply_farmer_payload(farmer, data)
    farmer.updated_at = datetime.utcnow()
    
    db.commit()
    log_activity(db, current_user.id, 'update', 'farmer_profile', farmer.id,
                 'Farmer profile updated', None)
    return _farmer_to_response(farmer)


@router.post('/upload')
@router.post('/upload-image')
async def upload_farm_image(
    file: UploadFile = File(...),
    crop_type: str | None = Query(default=None),
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Upload a farm image and store the public URL on the farmer profile."""
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail='Only image files are allowed')

    ensure_farm_upload_dir()

    contents = await file.read()
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail='Image size must be 2MB or less')

    file_extension = os.path.splitext(file.filename or 'farm-image.jpg')[1] or '.jpg'
    safe_name = f"farm_{current_user.id}_{datetime.utcnow().timestamp():.0f}{file_extension}"
    storage_path = os.path.join('uploads', 'farms', safe_name)

    with open(storage_path, 'wb') as output_file:
        output_file.write(contents)

    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')

    public_url = f'/uploads/farms/{safe_name}'
    farmer.farm_image = public_url
    if not farmer.profile_image:
        farmer.profile_image = public_url
    farmer.updated_at = datetime.utcnow()

    farm_image = FarmImage(
        user_id=current_user.id,
        image_url=public_url,
        crop_type=crop_type,
    )
    db.add(farm_image)
    db.commit()

    return {'image_url': public_url}


# ==================== CROPS ====================

@router.get('/crops', response_model=list[CropOut])
async def get_farmer_crops(
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Get all crops for current farmer"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')
    
    return db.query(Crop).filter(Crop.farmer_id == farmer.id).all()


@router.post('/crops', response_model=CropOut)
async def create_crop(
    data: CropIn,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Add a new crop"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')
    
    crop = Crop(**data.dict(), farmer_id=farmer.id)
    db.add(crop)
    db.commit()
    
    log_activity(db, current_user.id, 'create', 'crop', crop.id,
                 f'Created crop: {crop.name}', None)
    return crop


@router.delete('/crops/{crop_id}')
async def delete_crop(
    crop_id: int,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Delete a crop"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    crop = db.query(Crop).filter(Crop.id == crop_id, Crop.farmer_id == farmer.id).first()
    
    if not crop:
        raise HTTPException(status_code=404, detail='Crop not found')
    
    db.delete(crop)
    db.commit()
    
    log_activity(db, current_user.id, 'delete', 'crop', crop_id,
                 f'Deleted crop: {crop.name}', None)
    return {'message': 'Crop deleted successfully'}


# ==================== MARKET PRICES ====================

@router.get('/market-prices', response_model=list[MarketPriceOut])
async def get_market_prices(
    crop_name: str | None = Query(None),
    limit: int = Query(100, ge=1, le=150),
    db: Session = Depends(get_db)
):
    """Get market prices for crops"""
    params = {
        'api-key': settings.datagov_api_key,
        'format': 'json',
        'limit': limit,
        'offset': 0,
    }
    if crop_name:
        params['filters[commodity]'] = crop_name

    url = f"https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?{urlencode(params)}"

    try:
        with urlopen(url, timeout=10) as response:
            payload = json.loads(response.read().decode('utf-8'))

        records = payload.get('records', [])
        result: list[dict] = []
        for index, record in enumerate(records):
            market_parts = [record.get('market'), record.get('district'), record.get('state')]
            market_name = ', '.join([part for part in market_parts if part]) or 'Unknown Market'

            raw_price = record.get('modal_price', 0)
            try:
                parsed_price = float(raw_price) / 100
            except (TypeError, ValueError):
                parsed_price = 0.0

            raw_date = record.get('arrival_date')
            parsed_date = datetime.utcnow()
            if raw_date:
                for date_format in ('%d/%m/%Y', '%Y-%m-%d'):
                    try:
                        parsed_date = datetime.strptime(raw_date, date_format)
                        break
                    except ValueError:
                        continue

            result.append({
                'id': index + 1,
                'crop_name': record.get('commodity') or 'Unknown Crop',
                'price': round(parsed_price, 2),
                'market_name': market_name,
                'updated_at': parsed_date,
            })

        if result:
            return result
    except Exception:
        pass

    # Fallback to local DB data if external API fails.
    query = db.query(MarketPrice)
    if crop_name:
        query = query.filter(MarketPrice.crop_name.ilike(f'%{crop_name}%'))
    fallback_rows = query.limit(limit).all()

    if fallback_rows:
        return [_market_price_row_to_response(item, index) for index, item in enumerate(fallback_rows)]

    return _build_market_price_fallback(limit)


@router.get('/market-news', response_model=list[MarketNewsOut])
async def get_market_news(
    limit: int = Query(8, ge=3, le=20),
    current_user: User = Depends(require_farmer)
):
    """Get agriculture and mandi market news for dashboard overview hero."""
    del current_user

    keywords = ['agriculture', 'farming', 'किसान', 'mandi', 'crop', 'irrigation', 'fertilizer']
    query = ' OR '.join(keywords)

    params = {
        'country': 'in',
        'category': 'business',
        'q': query,
        'pageSize': limit,
        'apiKey': settings.news_api_key,
    }

    if settings.news_api_key and settings.news_api_key != 'YOUR_API_KEY':
        url = f"https://newsapi.org/v2/top-headlines?{urlencode(params)}"
        request = Request(url, headers={'User-Agent': 'SAMS/1.0'})
        try:
            with urlopen(request, timeout=10) as response:
                payload = json.loads(response.read().decode('utf-8'))

            articles = payload.get('articles', [])
            result: list[dict] = []
            for article in articles:
                title = article.get('title')
                article_url = article.get('url')
                if not title or not article_url:
                    continue

                published_at = None
                raw_date = article.get('publishedAt')
                if raw_date:
                    try:
                        published_at = datetime.fromisoformat(raw_date.replace('Z', '+00:00'))
                    except ValueError:
                        published_at = None

                result.append({
                    'title': title,
                    'description': article.get('description'),
                    'url': article_url,
                    'image_url': article.get('urlToImage'),
                    'source_name': (article.get('source') or {}).get('name'),
                    'published_at': published_at,
                })

            if result:
                return result
        except Exception:
            pass

    return _build_market_news_fallback(limit)


@router.get('/government-schemes', response_model=list[GovernmentSchemeOut])
async def get_government_schemes(
    ministry: str | None = Query(None),
    state: str | None = Query(None),
    limit: int = Query(80, ge=10, le=200),
    current_user: User = Depends(require_farmer)
):
    """Get latest agriculture-related schemes with optional ministry/state filtering."""
    del current_user

    rows: list[dict] = []
    resource_id = settings.datagov_schemes_resource.strip()
    if resource_id and 'xxxxxxx' not in resource_id:
        params = {
            'api-key': settings.datagov_api_key,
            'format': 'json',
            'limit': limit,
        }
        url = f"https://api.data.gov.in/resource/{resource_id}?{urlencode(params)}"

        try:
            with urlopen(url, timeout=10) as response:
                payload = json.loads(response.read().decode('utf-8'))
            records = payload.get('records', [])
            if isinstance(records, list):
                rows = _build_scheme_rows_from_records([r for r in records if isinstance(r, dict)])
        except Exception:
            rows = []

    rows = _append_important_schemes(rows)

    ministry_filter = (ministry or '').strip().lower()
    state_filter = (state or '').strip().lower()
    if ministry_filter:
        rows = [
            item for item in rows
            if ministry_filter in _normalize_text(item.get('ministry')).lower()
        ]
    if state_filter:
        rows = [
            item for item in rows
            if state_filter in _normalize_text(item.get('state')).lower()
        ]

    return rows[:limit]


# ==================== WEATHER (Mock) ====================

@router.get('/weather')
async def get_weather(
    location: str,
    current_user: User = Depends(require_farmer)
):
    """Get mock weather data for farmer location"""
    # In production, integrate with real weather API (OpenWeatherMap, etc)
    return {
        'location': location,
        'temperature': 28.5,
        'humidity': 65,
        'rainfall': 5.2,
        'wind_speed': 12.3,
        'forecast': [
            {'day': 'Tomorrow', 'temp': 29.0, 'condition': 'Sunny'},
            {'day': 'Day After', 'temp': 27.5, 'condition': 'Cloudy'}
        ],
        'updated_at': datetime.utcnow()
    }


# ==================== ALERTS ====================

@router.get('/alerts', response_model=list[AlertOut])
async def get_farmer_alerts(
    limit: int = Query(25, ge=1, le=100),
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Get active expert alerts for the farmer dashboard."""
    now = datetime.utcnow()
    alerts = db.query(Alert).filter(
        Alert.is_active == True,
        or_(Alert.expiry_date == None, Alert.expiry_date >= now)
    ).order_by(Alert.created_at.desc()).limit(limit).all()
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()

    rows: list[dict] = [
        {
            'id': alert.id,
            'expert_id': alert.expert_id,
            'title': alert.title,
            'description': alert.description,
            'alert_type': alert.alert_type,
            'severity': alert.severity,
            'target_regions': alert.target_regions,
            'affected_crops': alert.affected_crops,
            'recommendations': alert.recommendations,
            'is_active': alert.is_active,
            'created_at': alert.created_at,
            'updated_at': alert.updated_at,
            'expiry_date': alert.expiry_date,
        }
        for alert in alerts
    ]

    if farmer:
        rows.extend(_smart_alerts_to_dashboard_alerts(farmer))

    rows.sort(key=lambda item: item['created_at'], reverse=True)
    return rows[:limit]


# ==================== ADVISORY / ASK EXPERT ====================

@router.get('/advisory', response_model=list[AdvisoryOut])
async def get_farmer_advisory(
    status: str | None = Query(None),
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Get all advisory queries for current farmer"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')
    
    query = db.query(Advisory).filter(Advisory.farmer_id == farmer.id)
    
    if status:
        query = query.filter(Advisory.status == status)
    
    return query.all()


@router.post('/advisory', response_model=AdvisoryOut)
async def create_advisory(
    data: AdvisoryIn,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Submit a new query to experts"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')
    
    advisory = Advisory(
        question=data.question,
        farmer_id=farmer.id,
        status='pending'
    )
    db.add(advisory)
    db.commit()
    
    log_activity(db, current_user.id, 'create', 'advisory', advisory.id,
                 'New advisory question submitted', None)
    return advisory


@router.get('/advisory/{advisory_id}', response_model=AdvisoryDetailOut)
async def get_advisory_detail(
    advisory_id: int,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Get advisory with messages and images"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    advisory = db.query(Advisory).filter(
        Advisory.id == advisory_id,
        Advisory.farmer_id == farmer.id
    ).first()
    
    if not advisory:
        raise HTTPException(status_code=404, detail='Advisory not found')
    
    return advisory


@router.post('/advisory/{advisory_id}/upload-image')
async def upload_advisory_image(
    advisory_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Upload image for advisory query"""
    ensure_upload_dir()
    
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    advisory = db.query(Advisory).filter(
        Advisory.id == advisory_id,
        Advisory.farmer_id == farmer.id
    ).first()
    
    if not advisory:
        raise HTTPException(status_code=404, detail='Advisory not found')
    
    # Save file
    filename = f'{advisory_id}_{datetime.utcnow().timestamp()}_{file.filename}'
    filepath = f'uploads/advisory_images/{filename}'
    
    with open(filepath, 'wb') as f:
        shutil.copyfileobj(file.file, f)
    
    image = AdvisoryImage(advisory_id=advisory_id, image_path=filepath)
    db.add(image)
    db.commit()
    
    log_activity(db, current_user.id, 'create', 'advisory_image', image.id,
                 f'Uploaded image for advisory {advisory_id}', None)
    
    return {'id': image.id, 'image_path': filepath}


@router.post('/advisory/{advisory_id}/message', response_model=AdvisoryMessageOut)
async def send_advisory_message(
    advisory_id: int,
    data: AdvisoryMessageIn,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Send message in advisory chat"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    advisory = db.query(Advisory).filter(
        Advisory.id == advisory_id,
        Advisory.farmer_id == farmer.id
    ).first()
    
    if not advisory:
        raise HTTPException(status_code=404, detail='Advisory not found')
    
    message = AdvisoryMessage(
        advisory_id=advisory_id,
        sender_id=current_user.id,
        message=data.message,
        is_from_expert=False
    )
    db.add(message)
    db.commit()
    
    return message


@router.get('/advisory/{advisory_id}/messages', response_model=list[AdvisoryMessageOut])
async def get_advisory_messages(
    advisory_id: int,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Get all messages for an advisory"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    advisory = db.query(Advisory).filter(
        Advisory.id == advisory_id,
        Advisory.farmer_id == farmer.id
    ).first()
    
    if not advisory:
        raise HTTPException(status_code=404, detail='Advisory not found')
    
    return db.query(AdvisoryMessage).filter(
        AdvisoryMessage.advisory_id == advisory_id
    ).order_by(AdvisoryMessage.created_at).all()


# ==================== CROP INFORMATION ====================

@router.get('/crop-guides', response_model=list[OpenFarmCropOut])
async def get_crop_guides(
    crop_name: str | None = Query(None),
    category: str | None = Query(None),
    limit: int = Query(30, ge=1, le=30),
    db: Session = Depends(get_db)
):
    """Get crop information cards from OpenFarm-style data with a rich fallback."""
    if crop_name:
        live_profile = _fetch_openfarm_crop_profile(crop_name)
        if live_profile:
            return _filter_openfarm_crops_by_category([live_profile], category)

        live_catalog = _fetch_openfarm_crop_catalog(limit=30)
        if live_catalog:
            filtered_live_catalog = [
                item for item in live_catalog
                if crop_name.lower() in _normalize_text(item.get('crop_name')).lower()
            ]
            if filtered_live_catalog:
                return _filter_openfarm_crops_by_category(filtered_live_catalog, category)

        catalog = _build_openfarm_crop_profiles(limit=30)
        catalog = [item for item in catalog if crop_name.lower() in item['crop_name'].lower()]
        return _filter_openfarm_crops_by_category(catalog, category)

    catalog = _fetch_openfarm_crop_catalog(limit=limit)
    if not catalog:
        catalog = _build_openfarm_crop_profiles(limit=limit)
    return _filter_openfarm_crops_by_category(catalog, category)


@router.get('/crop-guides/{crop_id}', response_model=OpenFarmCropOut)
async def get_crop_guide(
    crop_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed crop guide from the default OpenFarm crop catalog."""
    del db

    catalog = _build_openfarm_crop_profiles(limit=30)
    if crop_id < 1 or crop_id > len(catalog):
        raise HTTPException(status_code=404, detail='Crop guide not found')

    return catalog[crop_id - 1]


# ==================== WORKERS / JOB POSTS ====================

@router.get('/jobs', response_model=list[AvailableJobOut])
async def get_available_jobs(
    location: str | None = Query(None),
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Get active job posts"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')

    query = db.query(Job).filter(Job.status.in_(['open', 'active']))

    if location:
        query = query.filter(Job.location.ilike(f'%{location}%'))

    # Do not show jobs posted by the same farmer in Find Work.
    query = query.filter(Job.farmer_id != farmer.id)

    jobs = query.order_by(Job.created_at.desc()).all()
    result: list[AvailableJobOut] = []
    for job in jobs:
        owner = db.query(Farmer).filter(Farmer.id == job.farmer_id).first()
        result.append(
            AvailableJobOut(
                id=job.id,
                farmer_id=job.farmer_id,
                farmer_name=owner.name if owner else 'Unknown Farmer',
                title=job.title,
                description=job.description,
                location=job.location,
                wage=job.wage,
                duration=job.duration,
                status=job.status,
                created_at=job.created_at,
            )
        )

    return result


@router.post('/jobs', response_model=JobOut)
async def post_job(
    data: JobIn,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Farmer posts a job for workers"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')

    job = Job(**data.model_dump(), farmer_id=farmer.id, status='open')
    db.add(job)
    db.commit()

    log_activity(db, current_user.id, 'create', 'job_post', job.id,
                 f'Posted job: {job.title}', None)
    return job


@router.post('/jobs/{job_id}/apply', response_model=ApplicationOut)
async def apply_for_job(
    job_id: int,
    data: ApplicationIn,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Apply to an active job as the logged-in farmer/user."""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    if job.status not in ['open', 'active']:
        raise HTTPException(status_code=400, detail='Only active jobs can be applied to')
    if job.farmer_id == farmer.id:
        raise HTTPException(status_code=400, detail='You cannot apply to your own job')

    existing = db.query(Application).filter(
        Application.job_id == job_id,
        Application.applicant_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail='You already applied to this job')

    application = Application(
        job_id=job_id,
        applicant_id=current_user.id,
        message=data.message,
        status='pending',
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    log_activity(
        db,
        current_user.id,
        'create',
        'application',
        application.id,
        f'Applied to job: {job.title}',
        None,
    )
    return application


@router.get('/applications', response_model=list[FarmerApplicationOut])
async def get_farmer_applications(
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Get applications submitted by the logged-in farmer."""
    applications = db.query(Application).filter(
        Application.applicant_id == current_user.id
    ).order_by(Application.created_at.desc()).all()

    result: list[FarmerApplicationOut] = []
    for app in applications:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        if not job:
            continue
        owner = db.query(Farmer).filter(Farmer.id == job.farmer_id).first()
        result.append(
            FarmerApplicationOut(
                id=app.id,
                job_id=app.job_id,
                job_title=job.title,
                farmer_name=owner.name if owner else 'Unknown Farmer',
                location=job.location,
                wage=job.wage,
                duration=job.duration,
                message=app.message,
                status=app.status,
                created_at=app.created_at,
            )
        )

    return result


@router.get('/workers', response_model=list[WorkerOut])
async def get_available_workers(
    name: str | None = Query(None),
    skill: str | None = Query(None),
    location: str | None = Query(None),
    db: Session = Depends(get_db)
):
    """Get available workers"""
    query = db.query(Worker).filter(Worker.is_blocked == False)
    query = query.filter(
        or_(
            Worker.assigned_job_id.is_(None),
            Worker.availability_status.in_(['available', 'looking_for_work']),
        )
    )

    if name:
        query = query.filter(Worker.name.ilike(f'%{name}%'))

    if skill:
        query = query.filter(
            or_(
                Worker.skills.ilike(f'%{skill}%'),
                Worker.experience.ilike(f'%{skill}%'),
            )
        )

    if location:
        query = query.filter(Worker.location.ilike(f'%{location}%'))

    return query.order_by(Worker.id.desc()).all()


@router.post('/workers', response_model=WorkerOut)
async def create_worker_profile(
    data: WorkerIn,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db),
):
    """Create a worker profile that can appear in worker listings."""
    worker = Worker(**data.model_dump(), is_blocked=False)
    db.add(worker)
    db.commit()
    db.refresh(worker)

    log_activity(
        db,
        current_user.id,
        'create',
        'worker_profile',
        worker.id,
        f'Created worker profile: {worker.name}',
        None,
    )
    return worker


# ==================== FARMER'S OWN JOBS MANAGEMENT ====================

@router.get('/my-jobs', response_model=list[JobOut])
async def get_my_jobs(
    farmer_id: int | None = Query(None),
    status: str | None = Query(None),
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Get all jobs posted by current farmer"""
    farmer = _get_farmer_for_current_user(current_user, db, farmer_id)
    
    query = db.query(Job).filter(Job.farmer_id == farmer.id)
    
    if status:
        query = query.filter(Job.status == status)
    
    return query.order_by(Job.created_at.desc()).all()


@router.get('/job-applications', response_model=list[FarmerJobApplicationOut])
async def get_my_job_applications(
    farmer_id: int | None = Query(None),
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Get applications for jobs posted by the current farmer."""
    farmer = _get_farmer_for_current_user(current_user, db, farmer_id)

    jobs = db.query(Job).filter(Job.farmer_id == farmer.id).order_by(Job.created_at.desc()).all()
    if not jobs:
        return []

    job_by_id = {job.id: job for job in jobs}
    applications = (
        db.query(Application)
        .filter(Application.job_id.in_(job_by_id.keys()))
        .order_by(Application.created_at.desc())
        .all()
    )

    result: list[FarmerJobApplicationOut] = []
    for application in applications:
        job = job_by_id.get(application.job_id)
        if not job:
            continue

        applicant = db.query(User).filter(User.id == application.applicant_id).first()
        if not applicant:
            continue

        applicant_details = _resolve_applicant_profile(applicant, db)
        result.append(
            FarmerJobApplicationOut(
                id=application.id,
                job_id=job.id,
                job_title=job.title,
                job_location=job.location,
                wage=job.wage,
                job_status=job.status,
                applicant_id=applicant.id,
                applicant_name=applicant_details['applicant_name'] or 'Unknown',
                experience=applicant_details['experience'],
                skills=applicant_details['skills'],
                contact_number=applicant_details['contact_number'],
                location=applicant_details['location'],
                status=application.status,
                created_at=application.created_at,
            )
        )

    return result


@router.get('/jobs/{job_id}', response_model=JobOut)
async def get_job_details(
    job_id: int,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Get details of a specific job"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')
    
    job = db.query(Job).filter(Job.id == job_id, Job.farmer_id == farmer.id).first()
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    
    return job


@router.put('/jobs/{job_id}', response_model=JobOut)
async def update_job(
    job_id: int,
    data: JobIn,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Update farmer's own job"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')
    
    job = db.query(Job).filter(Job.id == job_id, Job.farmer_id == farmer.id).first()
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    
    # Update fields
    for key, value in data.dict().items():
        setattr(job, key, value)
    
    db.commit()
    log_activity(db, current_user.id, 'update', 'job_post', job_id,
                 f'Updated job: {job.title}', None)
    return job


@router.delete('/jobs/{job_id}')
async def delete_job(
    job_id: int,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Delete farmer's own job"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')
    
    job = db.query(Job).filter(Job.id == job_id, Job.farmer_id == farmer.id).first()
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    
    job_title = job.title
    db.delete(job)
    db.commit()
    log_activity(db, current_user.id, 'delete', 'job_post', job_id,
                 f'Deleted job: {job_title}', None)
    return {'message': 'Job deleted successfully'}


@router.get('/jobs/{job_id}/applicants', response_model=list[JobApplicantOut])
async def get_job_applicants(
    job_id: int,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Get all applicants for a specific job"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')
    
    job = db.query(Job).filter(Job.id == job_id, Job.farmer_id == farmer.id).first()
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    
    applications = db.query(Application).filter(Application.job_id == job_id).order_by(Application.created_at.desc()).all()

    return [
        JobApplicantOut(
            id=item.id,
            applicant_id=item.applicant_id,
            applicant_name=item.applicant.full_name if item.applicant else 'Unknown Applicant',
            applicant_email=item.applicant.email if item.applicant else '',
            message=item.message,
            status=item.status,
            created_at=item.created_at,
        )
        for item in applications
    ]


@router.get('/worker-applications')
async def get_farmer_worker_applications(
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Get applications submitted by farmer when they apply as a worker"""
    return await get_farmer_applications(current_user=current_user, db=db)


# ==================== EQUIPMENT RENTAL ====================

@router.get('/equipment/available', response_model=list[EquipmentOut])
async def get_available_equipment(
    location: str | None = Query(None),
    db: Session = Depends(get_db)
):
    """Get available equipment for rent"""
    query = db.query(Equipment).filter(Equipment.is_available == True)
    
    if location:
        query = query.filter(Equipment.location.ilike(f'%{location}%'))
    
    return query.all()


@router.post('/equipment', response_model=EquipmentOut)
async def add_equipment_for_rent(
    data: EquipmentIn,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Farmer adds equipment for rent"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')
    
    equipment = Equipment(
        name=data.name,
        description=data.description,
        daily_rent=data.daily_rent,
        location=data.location,
        condition=data.condition,
        owner_id=farmer.id,
        is_available=True,
        is_approved=True
    )
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    
    log_activity(db, current_user.id, 'create', 'equipment', equipment.id,
                 f'Added equipment for rent: {equipment.name}', None)
    return equipment


@router.get('/equipment/my-listings', response_model=list[EquipmentOut])
async def get_my_equipment(
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Get equipment listed by current farmer"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')
    
    return db.query(Equipment).filter(Equipment.owner_id == farmer.id).order_by(Equipment.created_at.desc()).all()


@router.post('/equipment/{equipment_id}/book', response_model=EquipmentBookingOut)
async def book_equipment(
    equipment_id: int,
    data: EquipmentBookingIn,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Book equipment for rent"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')
    
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail='Equipment not found')
    if not equipment.is_available:
        raise HTTPException(status_code=400, detail='Equipment is currently rented')
    
    # Calculate days and total cost
    days = max(1, (data.end_date - data.start_date).days)
    total_cost = days * equipment.daily_rent
    
    booking = EquipmentBooking(
        equipment_id=equipment_id,
        farmer_id=farmer.id,
        start_date=data.start_date,
        end_date=data.end_date,
        total_cost=total_cost,
        status='confirmed'
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    
    log_activity(db, current_user.id, 'create', 'equipment_booking', booking.id,
                 f'Booked equipment {equipment_id}', None)
    return booking


@router.get('/equipment-bookings', response_model=list[EquipmentBookingOut])
async def get_my_bookings(
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Get all equipment bookings for current farmer"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')
    
    # Keep old records backward-compatible with the direct-booking flow.
    db.query(EquipmentBooking).filter(
        EquipmentBooking.farmer_id == farmer.id,
        EquipmentBooking.status.in_(['pending', 'approved'])
    ).update({'status': 'confirmed'}, synchronize_session=False)
    db.commit()

    return db.query(EquipmentBooking).filter(
        EquipmentBooking.farmer_id == farmer.id
    ).order_by(EquipmentBooking.created_at.desc()).all()


@router.delete('/equipment/{equipment_id}')
async def delete_equipment(
    equipment_id: int,
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Delete equipment listing"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id,
        Equipment.owner_id == farmer.id
    ).first()
    
    if not equipment:
        raise HTTPException(status_code=404, detail='Equipment not found')
    
    db.delete(equipment)
    db.commit()
    
    log_activity(db, current_user.id, 'delete', 'equipment', equipment_id,
                 f'Deleted equipment: {equipment.name}', None)
    return {'message': 'Equipment deleted successfully'}


# ==================== FARMING TECHNIQUES ====================

@router.get('/techniques', response_model=list[FarmingTechniqueOut])
async def get_farming_techniques(
    category: str | None = Query(None),
    crop_type: str | None = Query(None),
    db: Session = Depends(get_db)
):
    """Get farming techniques and tips"""
    query = db.query(FarmingTechnique)
    
    if category:
        normalized_category = category.strip().lower()
        query = query.filter(func.lower(FarmingTechnique.category) == normalized_category)
    
    if crop_type:
        query = query.filter(FarmingTechnique.crop_type.ilike(f'%{crop_type}%'))
    
    return query.order_by(FarmingTechnique.is_featured.desc(), FarmingTechnique.created_at.desc()).all()


@router.get('/techniques/featured', response_model=list[FarmingTechniqueOut])
async def get_featured_techniques(
    db: Session = Depends(get_db)
):
    """Get featured farming techniques"""
    return db.query(FarmingTechnique).filter(
        FarmingTechnique.is_featured == True
    ).all()


# ==================== DASHBOARD STATS ====================

@router.get('/dashboard-stats', response_model=FarmerDashboardStatsOut)
async def get_dashboard_stats(
    current_user: User = Depends(require_farmer),
    db: Session = Depends(get_db)
):
    """Get farmer dashboard statistics"""
    farmer = db.query(Farmer).filter(Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail='Farmer profile not found')
    
    active_crops = db.query(Crop).filter(Crop.farmer_id == farmer.id).count()
    pending_requests = db.query(Advisory).filter(
        Advisory.farmer_id == farmer.id,
        Advisory.status == 'pending'
    ).count()
    equipment_borrowed = db.query(EquipmentBooking).filter(
        EquipmentBooking.farmer_id == farmer.id,
        EquipmentBooking.status.in_(['confirmed', 'completed'])
    ).count()
    
    return FarmerDashboardStatsOut(
        total_land=farmer.total_land,
        active_crops=active_crops,
        pending_requests=pending_requests,
        equipment_borrowed=equipment_borrowed,
        techniques_saved=0,  # Can be enhanced with favorites
        avg_soil_health=None  # Can be calculated from soil tests
    )
