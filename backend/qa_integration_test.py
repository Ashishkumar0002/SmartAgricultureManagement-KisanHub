import json
import os
import sys
import time
from datetime import datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Ensure backend package import works regardless of CWD
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app.main import app
from app.db import Base, engine
from app.models import Expert, User


Base.metadata.create_all(bind=engine)
client = TestClient(app)

results: list[dict] = []


def record(name: str, ok: bool, status: int | None = None, detail: str = "") -> None:
    results.append(
        {
            "name": name,
            "ok": bool(ok),
            "status": status,
            "detail": detail[:400],
        }
    )


def expect(name: str, response, expected_status: int) -> bool:
    ok = response.status_code == expected_status
    record(name, ok, response.status_code, response.text)
    return ok


def extract_token(response) -> str | None:
    if response.status_code != 200:
        return None
    token = response.json().get("access_token")
    if isinstance(token, str) and len(token) > 20:
        return token
    return None


suffix = str(int(time.time()))
pwd = "Pass@12345"

admin_email = f"admin_{suffix}@example.com"
farmer1_email = f"farmer1_{suffix}@example.com"
farmer2_email = f"farmer2_{suffix}@example.com"
expert_email = f"expert_{suffix}@example.com"

# ==================== AUTH ====================
r = client.post(
    "/auth/register",
    json={
        "full_name": "Admin QA",
        "email": admin_email,
        "username": admin_email,
        "password": pwd,
        "role": "admin",
    },
)
expect("auth.register.admin", r, 200)

r = client.post(
    "/register/farmer",
    files={
        "full_name": (None, "Farmer One"),
        "email": (None, farmer1_email),
        "phone": (None, "9999999999"),
        "password": (None, pwd),
        "state": (None, "Punjab"),
        "district": (None, "Mohali"),
        "village": (None, "Village A"),
        "total_land_acres": (None, "5"),
        "soil_type": (None, "loam"),
        "irrigation_type": (None, "drip"),
        "water_source": (None, "canal"),
        "crop_types": (None, "wheat"),
        "current_crops": (None, "wheat"),
        "farming_experience_years": (None, "7"),
    },
)
expect("auth.register.farmer1", r, 200)

r = client.post(
    "/register/farmer",
    files={
        "full_name": (None, "Farmer Two"),
        "email": (None, farmer2_email),
        "phone": (None, "8888888888"),
        "password": (None, pwd),
        "state": (None, "Punjab"),
        "district": (None, "Ludhiana"),
        "village": (None, "Village B"),
        "total_land_acres": (None, "4"),
        "soil_type": (None, "clay"),
        "irrigation_type": (None, "flood"),
        "water_source": (None, "well"),
        "crop_types": (None, "rice"),
        "current_crops": (None, "rice"),
        "farming_experience_years": (None, "4"),
    },
)
expect("auth.register.farmer2", r, 200)

r = client.post(
    "/register/expert",
    files={
        "full_name": (None, "Expert One"),
        "email": (None, expert_email),
        "phone": (None, "7777777777"),
        "password": (None, pwd),
        "qualification": (None, "MSc Agriculture"),
        "specialization": (None, "Pest Management"),
        "years_of_experience": (None, "10"),
        "working_organization": (None, "Agri Lab"),
        "service_areas": (None, "Punjab"),
        "languages_known": (None, "Hindi,English"),
        "bio": (None, "Expert bio"),
        "id_proof_file": ("id.txt", b"id-proof", "text/plain"),
    },
)
expect("auth.register.expert", r, 200)

admin_login = client.post("/auth/login", json={"email": admin_email, "password": pwd})
expect("auth.login.admin", admin_login, 200)
admin_token = extract_token(admin_login)
record("auth.jwt.admin", admin_token is not None, admin_login.status_code, "token generated")

farmer1_login = client.post("/auth/login", json={"email": farmer1_email, "password": pwd})
expect("auth.login.farmer1", farmer1_login, 200)
farmer1_token = extract_token(farmer1_login)
record("auth.jwt.farmer1", farmer1_token is not None, farmer1_login.status_code, "token generated")

farmer2_login = client.post("/auth/login", json={"email": farmer2_email, "password": pwd})
expect("auth.login.farmer2", farmer2_login, 200)
farmer2_token = extract_token(farmer2_login)
record("auth.jwt.farmer2", farmer2_token is not None, farmer2_login.status_code, "token generated")

expert_login = client.post("/auth/login", json={"email": expert_email, "password": pwd})
expect("auth.login.expert", expert_login, 200)

wrong_login = client.post("/auth/login", json={"email": farmer1_email, "password": "wrong-pass"})
record(
    "auth.login.wrong_credentials",
    wrong_login.status_code == 401,
    wrong_login.status_code,
    wrong_login.text,
)

expert_token = extract_token(expert_login)
record("auth.jwt.expert", expert_token is not None, expert_login.status_code, "token generated")

admin_headers = {"Authorization": f"Bearer {admin_token}"}
farmer1_headers = {"Authorization": f"Bearer {farmer1_token}"}
farmer2_headers = {"Authorization": f"Bearer {farmer2_token}"}
expert_headers = {"Authorization": f"Bearer {expert_token}"}

# ==================== ADMIN ====================
expect("admin.users.list", client.get("/admin/users", headers=admin_headers), 200)
delete_missing = client.delete("/admin/users/99999999", headers=admin_headers)
record(
    "admin.users.delete_missing",
    delete_missing.status_code == 404,
    delete_missing.status_code,
    delete_missing.text,
)

# ==================== FARMER + JOB FLOW ====================
advisory = client.post("/farmer/advisory", headers=farmer1_headers, json={"question": "Leaves turning yellow"})
expect("farmer.ask_expert.submit", advisory, 200)
advisory_id = advisory.json().get("id") if advisory.status_code == 200 else None

update_profile = client.put(
    "/farmer/profile",
    headers=farmer1_headers,
    json={
        "name": "Farmer One Updated",
        "location": "Village A",
        "total_land": 6,
        "soil_type": "loam",
        "crop_variety": "wheat",
        "irrigation_type": "drip",
        "phone": "9999999999",
    },
)
expect("farmer.profile.update", update_profile, 200)
expect("farmer.profile.view", client.get("/farmer/profile", headers=farmer1_headers), 200)

job_post = client.post(
    "/farmer/jobs",
    headers=farmer1_headers,
    json={
        "title": "Need 2 workers",
        "description": "Harvest work",
        "wage": 550,
        "location": "Mohali",
        "duration": "3 days",
    },
)
expect("farmer.jobs.post", job_post, 200)
job_id = job_post.json().get("id") if job_post.status_code == 200 else None

job_post_reject = client.post(
    "/farmer/jobs",
    headers=farmer1_headers,
    json={
        "title": "Need temporary worker",
        "description": "One day task",
        "wage": 400,
        "location": "Mohali",
        "duration": "1 day",
    },
)
expect("farmer.jobs.post.second", job_post_reject, 200)
job_reject_id = job_post_reject.json().get("id") if job_post_reject.status_code == 200 else None

if job_id:
    application_create = client.post(
        f"/farmer/jobs/{job_id}/apply",
        headers=farmer2_headers,
        json={"message": "I can do this"},
    )
    expect("farmer.jobs.apply.other_user", application_create, 200)
    application_id = application_create.json().get("id") if application_create.status_code == 200 else None

    expect("admin.applications.view", client.get("/admin/applications", headers=admin_headers), 200)
    if application_id:
        expect(
            "admin.applications.update_status",
            client.put(
                f"/admin/applications/{application_id}/status",
                headers=admin_headers,
                json={"status": "accepted"},
            ),
            200,
        )

    expect("employment.jobs.list.admin", client.get("/employment/jobs", headers=admin_headers), 200)
    expect("employment.jobs.list.farmer", client.get("/employment/jobs", headers=farmer2_headers), 200)

    expect("farmer.jobs.track_status", client.get("/farmer/applications", headers=farmer2_headers), 200)
    expect("farmer.jobs.owner_view_applicants", client.get(f"/farmer/jobs/{job_id}/applicants", headers=farmer1_headers), 200)

# ==================== EQUIPMENT FLOW ====================
add_eq = client.post(
    "/farmer/equipment",
    headers=farmer1_headers,
    json={
        "name": "Tractor T1",
        "description": "Good condition",
        "daily_rent": 1200,
        "location": "Mohali",
        "condition": "good",
    },
)
expect("farmer.equipment.add", add_eq, 200)
eq_id = add_eq.json().get("id") if add_eq.status_code == 200 else None

if eq_id:
    expect("farmer.equipment.browse", client.get("/farmer/equipment/available", headers=farmer2_headers), 200)

    start = datetime.utcnow() + timedelta(days=1)
    end = start + timedelta(days=2)
    book = client.post(
        f"/farmer/equipment/{eq_id}/book",
        headers=farmer2_headers,
        json={
            "equipment_id": eq_id,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
        },
    )
    expect("farmer.equipment.book", book, 200)
    expect("farmer.equipment.view_bookings", client.get("/farmer/equipment-bookings", headers=farmer2_headers), 200)

# ==================== EXPERT FLOW ====================
if advisory_id:
    with Session(engine) as db:
        ex_user = db.query(User).filter(User.email == expert_email).first()
        ex = db.query(Expert).filter(Expert.user_id == ex_user.id).first() if ex_user else None
        ex_id = ex.id if ex else 0

    assign = client.post(
        "/admin/expert-assignments",
        headers=admin_headers,
        json={"advisory_id": advisory_id, "expert_id": ex_id},
    )
    expect("admin.expert.assign", assign, 200)

    expect("expert.queries.list", client.get("/expert/queries", headers=expert_headers), 200)
    expect(
        "expert.queries.respond",
        client.post(
            f"/expert/queries/{advisory_id}/message",
            headers=expert_headers,
            json={"advisory_id": advisory_id, "message": "Apply zinc spray"},
        ),
        200,
    )

    farmer_view = client.get(f"/farmer/advisory/{advisory_id}", headers=farmer1_headers)
    ok = farmer_view.status_code == 200 and bool(farmer_view.json().get("response"))
    record("farmer.ask_expert.view_response", ok, farmer_view.status_code, farmer_view.text)

expect(
    "expert.techniques.add",
    client.post(
        "/expert/techniques",
        headers=expert_headers,
        json={
            "title": "Integrated pest management",
            "description": "Use traps and bio-control",
            "category": "pest",
            "crop_type": "wheat",
        },
    ),
    200,
)
technique_id = None
technique_create = client.post(
    "/expert/techniques",
    headers=expert_headers,
    json={
        "title": "Soil moisture method",
        "description": "Use mulching",
        "category": "soil",
        "crop_type": "rice",
    },
)
expect("expert.techniques.add.second", technique_create, 200)
if technique_create.status_code == 200:
    technique_id = technique_create.json().get("id")

if technique_id:
    expect(
        "expert.techniques.update",
        client.put(
            f"/expert/techniques/{technique_id}",
            headers=expert_headers,
            json={
                "title": "Soil moisture method updated",
                "description": "Use mulching and moisture checks",
                "category": "soil",
                "crop_type": "rice",
            },
        ),
        200,
    )
    record(
        "expert.techniques.delete",
        client.delete(f"/expert/techniques/{technique_id}", headers=expert_headers).status_code == 200,
    )

expect(
    "expert.alerts.create",
    client.post(
        "/expert/alerts",
        headers=expert_headers,
        json={
            "title": "Rust disease alert",
            "description": "High humidity risk",
            "alert_type": "disease",
            "severity": "high",
            "target_regions": "Punjab",
            "affected_crops": "wheat",
            "recommendations": "Preventive fungicide",
        },
    ),
    200,
)
alert_id = None
alert_create = client.post(
    "/expert/alerts",
    headers=expert_headers,
    json={
        "title": "Pest advisory",
        "description": "Monitor for stem borer",
        "alert_type": "pest",
        "severity": "medium",
        "target_regions": "Punjab",
        "affected_crops": "rice",
        "recommendations": "Use pheromone traps",
    },
)
expect("expert.alerts.create.second", alert_create, 200)
if alert_create.status_code == 200:
    alert_id = alert_create.json().get("id")

if alert_id:
    expect(
        "expert.alerts.update",
        client.put(
            f"/expert/alerts/{alert_id}",
            headers=expert_headers,
            json={
                "title": "Pest advisory updated",
                "description": "Monitor stem borer closely",
                "alert_type": "pest",
                "severity": "high",
                "target_regions": "Punjab",
                "affected_crops": "rice",
                "recommendations": "Use pheromone traps and field scouting",
            },
        ),
        200,
    )
    record(
        "expert.alerts.deactivate",
        client.delete(f"/expert/alerts/{alert_id}", headers=expert_headers).status_code == 200,
    )

# ==================== RBAC ====================
record(
    "rbac.farmer_cannot_access_admin",
    client.get("/admin/users", headers=farmer1_headers).status_code == 403,
)
record(
    "rbac.farmer_cannot_access_expert",
    client.get("/expert/queries", headers=farmer1_headers).status_code == 403,
)

failed = [x for x in results if not x["ok"]]
summary = {
    "total": len(results),
    "passed": len(results) - len(failed),
    "failed": len(failed),
    "failed_tests": failed,
}
print(json.dumps(summary, indent=2))
