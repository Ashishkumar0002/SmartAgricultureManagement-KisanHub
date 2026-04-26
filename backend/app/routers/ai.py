from __future__ import annotations

import asyncio
from typing import Any, Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from app.models import User
from app.services.ai_service import ai_service
from app.services.deps import get_current_user

router = APIRouter(prefix="/api/ai", tags=["ai"])


class AdvisorRequest(BaseModel):
    ph: float = Field(..., ge=0, le=14)
    n: float = Field(..., ge=0)
    p: float = Field(..., ge=0)
    k: float = Field(..., ge=0)
    moisture: float = Field(..., ge=0, le=100)
    crop: str = Field(..., min_length=1, max_length=120)
    location: str = Field(..., min_length=1, max_length=160)


class AdvisorResponse(BaseModel):
    cropRecommendation: str
    fertilizer: str
    irrigation: str
    warnings: str


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=1000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    history: list[ChatHistoryItem] = Field(default_factory=list)
    language: str | None = Field(default=None, max_length=24)


class ChatResponse(BaseModel):
    reply: str


class InsightsRequest(BaseModel):
    yield_value: float = Field(..., alias="yield", ge=0)
    cost: float = Field(..., ge=0)
    revenue: float = Field(..., ge=0)


class InsightsResponse(BaseModel):
    profit: float
    profitAnalysis: str
    incomeSuggestions: str
    costOptimization: str


class SmartAlertsRequest(BaseModel):
    ph: float | None = Field(default=None, ge=0, le=14)
    moisture: float | None = Field(default=None, ge=0, le=100)
    crop: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=160)
    weather: dict[str, Any] | None = None


class SmartAlertsResponse(BaseModel):
    alerts: list[str]


class ImageAnalysisResponse(BaseModel):
    disease: str
    cause: str
    treatment: str
    prevention: str


class GenerateExpertResponseRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    crop: str | None = Field(default=None, max_length=120)
    soil: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=160)
    regenerate: bool = False


class GenerateExpertResponseResponse(BaseModel):
    success: bool
    aiResponse: str


@router.post("/advisor", response_model=AdvisorResponse)
def get_smart_farm_advice(
    payload: AdvisorRequest,
    _: User = Depends(get_current_user),
) -> AdvisorResponse:
    try:
        result = ai_service.smart_farm_advisor(payload.model_dump())
        return AdvisorResponse(**result)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate AI advisor response: {exc}",
        ) from exc


@router.post("/chat", response_model=ChatResponse)
def ai_chat(
    payload: ChatRequest,
    _: User = Depends(get_current_user),
) -> ChatResponse:
    try:
        history = [item.model_dump() for item in payload.history]
        reply = ai_service.chat(
            message=payload.message,
            history=history,
            language=payload.language,
        )
        return ChatResponse(reply=reply)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate AI chat response: {exc}",
        ) from exc


@router.post("/insights", response_model=InsightsResponse)
def ai_insights(
    payload: InsightsRequest,
    _: User = Depends(get_current_user),
) -> InsightsResponse:
    try:
        result = ai_service.farm_insights(
            {
                "yield": payload.yield_value,
                "cost": payload.cost,
                "revenue": payload.revenue,
            }
        )
        return InsightsResponse(**result)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate AI insights: {exc}",
        ) from exc


@router.post("/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_crop_image(
    file: UploadFile = File(...),
    crop: str | None = None,
    location: str | None = None,
    _: User = Depends(get_current_user),
) -> ImageAnalysisResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image uploads are allowed.",
        )

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty image file.")

    # Keep payload small for API cost and performance.
    if len(image_bytes) > 4 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image exceeds 4MB limit.",
        )

    try:
        result = ai_service.analyze_crop_image(
            image_bytes=image_bytes,
            mime_type=file.content_type,
            location=location,
            crop=crop,
        )
        return ImageAnalysisResponse(**result)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to analyze image: {exc}",
        ) from exc


@router.post("/smart-alerts", response_model=SmartAlertsResponse)
def ai_smart_alerts(
    payload: SmartAlertsRequest,
    _: User = Depends(get_current_user),
) -> SmartAlertsResponse:
    try:
        alerts = ai_service.smart_alerts(payload.model_dump(exclude_none=True))
        return SmartAlertsResponse(alerts=alerts)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate smart alerts: {exc}",
        ) from exc


@router.post("/generate-response", response_model=GenerateExpertResponseResponse)
async def generate_expert_response(
    payload: GenerateExpertResponseRequest,
    _: User = Depends(get_current_user),
) -> GenerateExpertResponseResponse:
    if not payload.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query is required to generate AI response.",
        )

    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                ai_service.generate_expert_response,
                payload.model_dump(),
                regenerate=payload.regenerate,
            ),
            timeout=18,
        )
        return GenerateExpertResponseResponse(success=True, aiResponse=result)
    except TimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI response generation timed out. Please try again.",
        ) from exc
    except Exception as exc:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate expert response: {exc}",
        ) from exc
