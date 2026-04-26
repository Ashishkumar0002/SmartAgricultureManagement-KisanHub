from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

RoleType = Literal['admin', 'farmer', 'expert']


class LoginJSON(BaseModel):
    email: str | None = None
    username: str | None = None
    phone: str | None = None
    password: str


class RegisterIn(BaseModel):
    full_name: str
    email: EmailStr
    username: str
    password: str
    role: RoleType


class AuthOut(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    role: RoleType
    username: str


class RegistrationResult(BaseModel):
    message: str
    user_id: int
    role: RoleType


class FarmerRegistrationOut(RegistrationResult):
    farmer_id: int


class ExpertRegistrationOut(RegistrationResult):
    expert_id: int
    approval_status: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    username: str
    role: RoleType

    class Config:
        from_attributes = True


class FarmerIn(BaseModel):
    name: str
    location: str
    total_land: float
    soil_type: str | None = None
    crop_variety: str | None = None
    irrigation_type: str | None = None
    phone: str | None = None
    soil: 'SoilIn | None' = None
    crop_planning: 'CropPlanningIn | None' = None
    analytics: 'AnalyticsIn | None' = None
    assets: 'AssetsIn | None' = None
    farm_image: str | None = None


class SoilIn(BaseModel):
    type: str | None = None
    ph: float | None = None
    nitrogen: float | None = None
    phosphorus: float | None = None
    potassium: float | None = None
    moisture: float | None = None
    health_status: str | None = None


class CropPlanningIn(BaseModel):
    current_crop: str | None = None
    previous_crop: str | None = None
    season: str | None = None
    sowing_date: datetime | None = None
    harvest_date: datetime | None = None
    duration_days: int | None = None


class AnalyticsIn(BaseModel):
    yield_kg: float | None = None
    cost: float | None = None
    revenue: float | None = None
    profit: float | None = None


class AssetsIn(BaseModel):
    equipment: list[str] = Field(default_factory=list)
    livestock: int | None = None
    storage: float | None = None
    workers: int | None = None


class FarmAlertOut(BaseModel):
    message: str
    type: str
    date: datetime

    class Config:
        from_attributes = True


class FarmerOut(FarmerIn):
    id: int
    user_id: int
    profile_image: str | None = None
    alerts: list[FarmAlertOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CropIn(BaseModel):
    name: str
    season: str
    area: float
    farmer_id: int | None = None


class CropOut(CropIn):
    id: int

    class Config:
        from_attributes = True


class CropInfoOut(BaseModel):
    id: int
    name: str
    crop_type: str
    climate_requirements: str
    soil_type: str
    sowing_season: str
    harvesting_time: str
    production_steps: str
    best_practices: str
    water_requirements: str
    fertilizer_recommendations: str
    pest_disease_prevention: str
    expected_yield: str
    market_tips: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdvisoryIn(BaseModel):
    question: str
    farmer_id: int | None = None


class AdvisoryReplyIn(BaseModel):
    response: str


class AdvisoryOut(BaseModel):
    id: int
    question: str
    response: str | None = None
    farmer_id: int | None = None
    expert_id: int | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class MarketPriceOut(BaseModel):
    id: int
    crop_name: str
    price: float
    market_name: str
    updated_at: datetime

    class Config:
        from_attributes = True


class MarketNewsOut(BaseModel):
    title: str
    description: str | None = None
    url: str
    image_url: str | None = None
    source_name: str | None = None
    published_at: datetime | None = None


class GovernmentSchemeOut(BaseModel):
    scheme_name: str
    ministry: str | None = None
    state: str | None = None
    description: str | None = None
    source_url: str | None = None


class MarketSaleIn(BaseModel):
    crop_id: int
    quantity: float
    expected_price: float


class JobIn(BaseModel):
    title: str
    description: str
    wage: float
    location: str
    duration: str | None = None


class JobOut(JobIn):
    id: int
    farmer_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AvailableJobOut(BaseModel):
    id: int
    farmer_id: int
    farmer_name: str
    title: str
    description: str
    location: str
    wage: float
    duration: str | None = None
    status: str
    created_at: datetime


class WorkerIn(BaseModel):
    name: str
    contact: str
    experience: str | None = None
    skills: str | None = None
    location: str | None = None
    bio: str | None = None
    profile_image: str | None = None
    availability_status: str = 'looking_for_work'


class WorkerOut(WorkerIn):
    id: int
    user_id: int | None = None
    assigned_job_id: int | None = None
    is_blocked: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationIn(BaseModel):
    message: str | None = None


class ApplicationOut(BaseModel):
    id: int
    job_id: int
    applicant_id: int
    message: str | None = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminJobOut(BaseModel):
    id: int
    farmer_id: int
    farmer_name: str
    title: str
    description: str
    location: str
    wage: float
    duration: str | None = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminApplicationOut(BaseModel):
    id: int
    job_id: int
    job_title: str
    applicant_id: int
    applicant_name: str
    applicant_email: str
    farmer_name: str
    message: str | None = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityLogIn(BaseModel):
    action: str
    entity_type: str
    entity_id: int | None = None
    description: str
    ip_address: str | None = None


class ActivityLogOut(ActivityLogIn):
    id: int
    user_id: int
    timestamp: datetime

    class Config:
        from_attributes = True


class FarmerApplicationOut(BaseModel):
    id: int
    job_id: int
    job_title: str
    farmer_name: str
    location: str
    wage: float
    duration: str | None = None
    message: str | None = None
    status: str
    created_at: datetime


class WorkerAvailableJobOut(BaseModel):
    id: int
    title: str
    description: str
    location: str
    wage: float
    farmer_name: str
    posted_date: datetime


class WorkerMyJobOut(BaseModel):
    application_id: int
    job_id: int
    job_title: str
    farmer_name: str
    status: Literal['applied', 'accepted', 'rejected', 'working']
    applied_at: datetime
    started_at: datetime | None = None


class WorkerProfileIn(BaseModel):
    name: str
    contact: str
    location: str | None = None
    skills: str | None = None
    experience: str | None = None
    availability_status: Literal['available', 'working', 'looking_for_work'] = 'available'
    profile_image: str | None = None
    bio: str | None = None


class WorkerProfileOut(WorkerProfileIn):
    id: int
    user_id: int | None = None
    assigned_job_id: int | None = None
    created_at: datetime


class FarmerJobApplicationOut(BaseModel):
    id: int
    job_id: int
    job_title: str
    job_location: str
    wage: float
    job_status: str
    applicant_id: int
    applicant_name: str
    experience: str | None = None
    skills: str | None = None
    contact_number: str | None = None
    location: str | None = None
    status: str
    created_at: datetime


class JobApplicantOut(BaseModel):
    id: int
    applicant_id: int
    applicant_name: str
    applicant_email: str
    message: str | None = None
    status: str
    created_at: datetime


class ApplicationStatusUpdateIn(BaseModel):
    status: Literal['accepted', 'rejected']


class ContentIn(BaseModel):
    title: str
    description: str
    category: str  # weather, market, technique, disease_prevention
    location: str | None = None
    metadata: str | None = None


class ContentOut(ContentIn):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EquipmentIn(BaseModel):
    name: str
    description: str
    daily_rent: float
    location: str
    condition: str = 'good'


class EquipmentOut(EquipmentIn):
    id: int
    owner_id: int
    is_available: bool
    is_approved: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ExpertAssignmentIn(BaseModel):
    advisory_id: int
    expert_id: int


class ExpertAssignmentOut(BaseModel):
    id: int
    advisory_id: int
    expert_id: int
    assigned_by: int
    status: str
    assignment_date: datetime
    completion_date: datetime | None = None

    class Config:
        from_attributes = True


class UserRatingIn(BaseModel):
    rated_user_id: int
    rating: int  # 1-5
    review: str | None = None


class UserRatingOut(UserRatingIn):
    id: int
    rater_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SystemAnalyticsOut(BaseModel):
    total_users: int
    total_farmers: int
    total_experts: int
    total_advisories: int
    pending_advisories: int
    avg_expert_response_time_hours: float
    avg_farmer_satisfaction: float
    active_advisories: int


class AdminStatsOut(BaseModel):
    total_farmers: int
    total_experts: int
    total_jobs: int
    total_equipment: int
    approved_equipment: int
    pending_equipment: int


class AdvisoryImageIn(BaseModel):
    pass  # file upload handled separately


class AdvisoryImageOut(BaseModel):
    id: int
    advisory_id: int
    image_path: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class AdvisoryMessageIn(BaseModel):
    advisory_id: int | None = None
    message: str


class AdvisoryMessageOut(AdvisoryMessageIn):
    id: int
    sender_id: int
    is_from_expert: bool
    created_at: datetime

    class Config:
        from_attributes = True


class FarmingTechniqueIn(BaseModel):
    title: str
    description: str
    category: str  # soil, irrigation, pest, fertilizer, etc
    crop_type: str | None = None


class FarmingTechniqueOut(FarmingTechniqueIn):
    id: int
    expert_id: int
    featured_image: str | None = None
    is_featured: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CropGuideIn(BaseModel):
    crop_name: str
    growth_duration_days: int
    water_requirements: str
    climate_conditions: str
    fertilizer_usage: str
    common_diseases: str
    prevention_methods: str
    best_season: str
    avg_yield_per_hectare: float


class CropGuideOut(CropGuideIn):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FertilizerRecommendationOut(BaseModel):
    nitrogen: str
    phosphorus: str
    potassium: str


class OpenFarmCropOut(BaseModel):
    crop_name: str
    category: str
    season: str
    soil_type: str
    temperature: str
    water_requirement: str
    irrigation: str
    fertilizer: FertilizerRecommendationOut
    sowing_time: str
    harvest_time: str
    common_diseases: list[str]
    solutions: list[str]
    source_url: str | None = None


class EquipmentBookingIn(BaseModel):
    equipment_id: int
    start_date: datetime
    end_date: datetime


class EquipmentBookingOut(EquipmentBookingIn):
    id: int
    farmer_id: int
    total_cost: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdvisoryDetailOut(BaseModel):
    id: int
    question: str
    response: str | None = None
    farmer_id: int | None = None
    expert_id: int | None = None
    status: str
    created_at: datetime
    images: list[AdvisoryImageOut] = []
    messages: list[AdvisoryMessageOut] = []

    class Config:
        from_attributes = True


class FarmerDashboardStatsOut(BaseModel):
    total_land: float
    active_crops: int
    pending_requests: int
    equipment_borrowed: int
    techniques_saved: int
    avg_soil_health: float | None = None


class ExpertIn(BaseModel):
    specialization: str
    bio: str | None = None
    years_of_experience: int = 0
    achievements: str | None = None
    research_work: str | None = None


class ExpertOut(ExpertIn):
    id: int
    user_id: int
    profile_image: str | None = None
    phone: str | None = None
    rating: float
    total_queries_resolved: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExpertProfileOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    specialization: str
    bio: str | None = None
    profile_image: str | None = None
    phone: str | None = None
    years_of_experience: int
    achievements: str | None = None
    research_work: str | None = None
    rating: float
    total_queries_resolved: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AlertIn(BaseModel):
    title: str
    description: str
    alert_type: str  # weather, disease, pest, market, etc
    severity: str = 'medium'  # low, medium, high, critical
    target_regions: str
    affected_crops: str | None = None
    recommendations: str | None = None
    expiry_date: datetime | None = None


class AlertOut(AlertIn):
    id: int
    expert_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExpertQueryOut(BaseModel):
    id: int
    question: str
    response: str | None = None
    farmer_id: int | None = None
    farmer_name: str | None = None
    farmer_location: str | None = None
    farmer_soil_type: str | None = None
    farmer_crop_variety: str | None = None
    expert_id: int | None = None
    status: str  # pending, assigned, answered
    created_at: datetime
    images: list[AdvisoryImageOut] = []
    messages: list[AdvisoryMessageOut] = []

    class Config:
        from_attributes = True


class ExpertDashboardStatsOut(BaseModel):
    total_assigned_queries: int
    pending_queries: int
    resolved_queries: int
    alerts_sent: int
    active_alerts: int
    avg_response_time_hours: float
    farmer_satisfaction_rating: float


class ExpertQueryWithFarmerOut(BaseModel):
    id: int
    question: str
    response: str | None = None
    farmer_id: int | None = None
    farmer_name: str | None = None
    farmer_location: str | None = None
    farmer_soil_type: str | None = None
    farmer_crop_variety: str | None = None
    farmer_profile_image: str | None = None
    expert_id: int | None = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ExpertResponseOut(BaseModel):
    query_id: int
    query_title: str
    farmer_name: str | None = None
    response_content: str
    responded_at: datetime

    class Config:
        from_attributes = True
