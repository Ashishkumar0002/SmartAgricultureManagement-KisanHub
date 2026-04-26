from app.db import SessionLocal
from app.models import User, Expert, Alert

db = SessionLocal()

# Check all users
users = db.query(User).all()
print(f"Total users in DB: {len(users)}")
for u in users[:5]:
    print(f"  - {u.id}: {u.email} ({u.role})")

# Check experts
experts = db.query(Expert).all()
print(f"\nTotal experts in DB: {len(experts)}")
for e in experts[:5]:
    print(f"  - {e.id}: {e.name}")

# Check all alerts
alerts = db.query(Alert).all()
print(f"\nTotal alerts in DB: {len(alerts)}")
print(f"Active alerts: {db.query(Alert).filter(Alert.is_active == True).count()}")
for a in alerts[:5]:
    print(f"  - {a.id}: {a.title} (active={a.is_active})")

db.close()
