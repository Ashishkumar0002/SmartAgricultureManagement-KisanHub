# SAMS Database Seeding Guide

## Overview
This guide explains how to seed your SAMS database with realistic test data covering all modules.

---

## Prerequisites

1. **Python 3.9+** with required dependencies installed
2. **Database** (SQLite or PostgreSQL)
3. **Virtual environment** activated
4. **Backend directory** (`backend/`) properly set up

---

## Installation

### 1. Install Required Packages

```bash
cd backend

# Install all dependencies (if not already done)
pip install -r requirements.txt

# Key packages needed:
# - sqlalchemy
# - passlib
# - bcrypt
```

### 2. Verify Database Configuration

Check your database URL in `backend/app/core/config.py` or environment variable:

```bash
# For SQLite (default):
export DATABASE_URL=sqlite:///./sams.db

# For PostgreSQL:
export DATABASE_URL=postgresql://user:password@localhost/sams_db
```

---

## Running the Seed Script

### From Command Line

```bash
# Navigate to backend directory
cd backend

# Run the seed script
python seed_data.py
```

### Expected Output

```
🌱 Starting database seeding...

👤 Creating admin user...
✅ Admin created: admin@test.com / admin123

🎓 Creating expert users...
✅ Experts created:
   1. rajesh.expert@test.com (Crop Management)
   2. priya.expert@test.com (Pest Management)
   3. vikram.expert@test.com (Soil Health)

👨‍🌾 Creating farmer users...
✅ Farmers created:
   1. harjeet.farmer@test.com (Ludhiana, Punjab)
   2. ramesh.farmer@test.com (Madhubani, Bihar)
   3. amit.farmer@test.com (Nashik, Maharashtra)
   4. suresh.farmer@test.com (Hisar, Haryana)
   5. mohan.farmer@test.com (Mathura, UP)

... (more data creation messages) ...

✨ DATABASE SEEDING COMPLETED SUCCESSFULLY! ✨
```

---

## Test Credentials

### Admin User
- **Email**: `admin@agro.com`
- **Password**: `admin123`
- **Role**: Admin
- **Access**: All modules, user management, activity logs

### Farmer Users
| Email | Password | Location | Specialization |
|-------|----------|----------|-----------------|
| harjeet.farmer@test.com | farmer123 | Ludhiana, Punjab | Wheat Farming |
| ramesh.farmer@test.com | farmer123 | Madhubani, Bihar | Rice Cultivation |
| amit.farmer@test.com | farmer123 | Nashik, Maharashtra | Mixed Crops |
| suresh.farmer@test.com | farmer123 | Hisar, Haryana | Vegetables |
| mohan.farmer@test.com | farmer123 | Mathura, UP | Dairy + Crops |

### Expert Users
| Email | Password | Specialization | Experience |
|-------|----------|-----------------|------------|
| rajesh.expert@test.com | expert123 | Crop Management | 12 years |
| priya.expert@test.com | expert123 | Pest Management | 10 years |
| vikram.expert@test.com | expert123 | Soil Health | 15 years |

---

## Data Summary

After seeding, your database will contain:

### Users
- **1** Admin user
- **5** Farmer users (with complete profiles)
- **3** Expert users (with specializations)

### Farm Data
- **12** Crops across different farmers
- **5** Different locations (Punjab, Bihar, Maharashtra, Haryana, UP)
- **8** Workers available for hire

### Jobs & Employment
- **8** Job postings (with various statuses)
  - 5 Approved jobs
  - 2 Pending jobs
  - 1 Rejected job
- **9** Job applications (mixed statuses)
  - Approved: 6
  - Pending: 3

### Advisory System
- **5** Farmer queries
  - 2 Answered queries (with expert responses)
  - 3 Pending queries
- **2** Advisory messages (Q&A conversation)

### Equipment
- **7** Equipment listings for rent
  - Tractors, Harvesters, Sprayers, Pumps, etc.
  - Daily rates ranging from ₹500 to ₹5000
- **1** Equipment booking (with approval)

### Content & Guides
- **8** Market prices (real commodities)
- **5** Farming techniques
- **5** Crop guides (with detailed information)
- **3** Alerts (pest, disease, weather)

### Administrative Data
- **1** Expert assignment
- **4** Activity logs
- **1** User rating (5-star review)

---

## Testing Workflow

### Phase 1: Login & Dashboard Verification

**1. Admin Login**
```
Email: admin@test.com
Password: admin123
```
✅ Check:
- Dashboard shows all statistics
- User management lists 11 total users (1 admin, 5 farmers, 3 experts)
- Activity logs show recent activities

**2. Farmer Login**
```
Email: harjeet.farmer@test.com
Password: farmer123
```
✅ Check:
- Farm profile displays correctly
- Dashboard shows statistics (land: 5.0 hectares)
- Crops tab shows 2 crops (Wheat, Rice)
- Location: Ludhiana, Punjab

**3. Expert Login**
```
Email: rajesh.expert@test.com
Password: expert123
```
✅ Check:
- Expert profile displays specialization
- Assigned queries shown
- Can view advisory details

---

### Phase 2: Employment Module Testing

**Test Case 1: View Jobs**
```
Endpoint: GET /employment/jobs
Expected: Returns 8 jobs with mixed statuses
```

**Test Case 2: View Farmer's Jobs**
```
Endpoint: GET /farmer/my-jobs
Login as: harjeet.farmer@test.com
Expected: Returns 2 jobs posted by this farmer
```

**Test Case 3: View Approved Jobs (for applying)**
```
Endpoint: GET /farmer/jobs
Expected: Returns only approved jobs (5 jobs)
Status: "approved"
```

**Test Case 4: Apply for Job**
```
Endpoint: POST /employment/jobs/{job_id}/apply
Body: { "worker_id": 1 }
Expected: Creates application with "pending" status
```

**Test Case 5: View Applications**
```
Endpoint: GET /farmer/jobs/{job_id}/applicants
Expected: Shows all workers who applied for the job
```

---

### Phase 3: Advisory System Testing

**Test Case 6: Submit Advisory Query**
```
Endpoint: POST /farmer/advisory
Body: { "question": "How to improve soil health?" }
Expected: Creates new advisory with "pending" status
```

**Test Case 7: View Advisor Queries**
```
Endpoint: GET /farmer/advisory
Expected: Returns list of queries for logged-in farmer
```

**Test Case 8: Add Advisory Message**
```
Endpoint: POST /farmer/advisory/{advisory_id}/message
Body: { "message": "Can you provide more details?" }
Expected: Creates message in advisory chat
```

---

### Phase 4: Equipment Testing

**Test Case 9: View Available Equipment**
```
Endpoint: GET /farmer/equipment/available
Expected: Returns 7 equipment listings
```

**Test Case 10: Book Equipment**
```
Endpoint: POST /farmer/equipment/{equipment_id}/book
Body: { "start_date": "2024-04-01", "end_date": "2024-04-08" }
Expected: Creates booking with "pending" status
- Cost calculated: daily_rent × days
```

**Test Case 11: View Equipment Bookings**
```
Endpoint: GET /farmer/equipment-bookings
Expected: Returns list of user's bookings
```

---

### Phase 5: Admin Operations

**Test Case 12: Admin - View All Jobs**
```
Endpoint: GET /admin/jobs
Expected: Returns all 8 jobs
Status filter: Can filter by pending/approved/rejected
```

**Test Case 13: Admin - Approve Job**
```
Endpoint: PUT /admin/jobs/{job_id}/approve
Expected: Job status changes from "pending" to "approved"
```

**Test Case 14: Admin - Reject Job**
```
Endpoint: PUT /admin/jobs/{job_id}/reject
Expected: Job status changes to "rejected"
```

**Test Case 15: Admin - View Workers**
```
Endpoint: GET /admin/workers
Expected: Returns all 8 worker profiles
```

---

### Phase 6: Market & Guides Testing

**Test Case 16: View Market Prices**
```
Endpoint: GET /farmer/market-prices
Expected: Returns 8 commodity prices
Include: Wheat, Rice, Sugarcane, Vegetables
```

**Test Case 17: View Crop Guides**
```
Endpoint: GET /farmer/crop-guides
Expected: Returns guides for 5 crops
Include: Wheat, Rice, Sugarcane, Tomato, Onion
```

**Test Case 18: View Farming Techniques**
```
Endpoint: GET /farmer/techniques
Expected: Returns 5 techniques from different experts
```

---

### Phase 7: Frontend Dashboard Testing

**Test Case 19: Admin Dashboard**
- ✅ Stats card shows total users
- ✅ Activity log shows recent actions
- ✅ User management tab lists all users
- ✅ Employment tab shows jobs with filters
- ✅ Charts and statistics render correctly

**Test Case 20: Farmer Dashboard**
- ✅ Overview shows farm statistics
- ✅ My Jobs tab shows posted jobs
- ✅ Post Job form works
- ✅ Applications tab shows applicants
- ✅ Find Work tab shows available jobs
- ✅ Equipment rental shows listings
- ✅ Ask Expert shows queries

**Test Case 21: Expert Dashboard**
- ✅ Dashboard shows assigned queries
- ✅ Can view query details
- ✅ Can add responses/messages
- ✅ Techniques tab shows created techniques

---

## Troubleshooting

### Issue: "Module not found" error

```bash
# Solution: Ensure you're in the backend directory
cd backend

# Verify file exists
ls seed_data.py
```

### Issue: Database connection error

```bash
# Check DATABASE_URL environment variable
echo $DATABASE_URL

# For SQLite, ensure directory exists
mkdir -p database
```

### Issue: Password hashing error

```bash
# Ensure bcrypt is installed
pip install bcrypt

# Or use passlib with bcrypt
pip install passlib[bcrypt]
```

### Issue: Foreign key constraint error

```bash
# For PostgreSQL, verify all referenced tables exist
# Tables should be created by: alembic upgrade head

# For SQLite, check permissions
chmod 644 sams.db
```

### Issue: Data already exists

```bash
# Option 1: Delete and restart
rm sams.db
python seed_data.py

# Option 2: Clear tables (PostgreSQL)
psql -d sams_db -c "TRUNCATE TABLE users CASCADE;"
python seed_data.py
```

---

## Data Relationships

```
User (Admin)
├── No direct farmer/expert profile

User (Farmer) 
├── Farmer Profile
│   ├── Crops (12 total)
│   ├── Jobs (8 total)
│   │   └── Applications (9 total)
│   └── Equipment (7 listings)

User (Expert)
├── Expert Profile
│   ├── Assigned Advisories
│   ├── Farming Techniques
│   └── Alerts

Advisory
├── Messages (2+ per advisory)
├── Images
└── Expert Assignment

Worker
└── Applications (to Jobs)

Equipment
└── Bookings

Market Data
├── Market Prices (8 entries)
├── Crop Guides (5)
└── Farming Techniques (5)
```

---

## Extending the Seed Data

To add more data, edit `seed_data.py`:

```python
# Example: Add more farmers
farmer6_user = create_user(
    db,
    full_name='New Farmer Name',
    email='new.farmer@test.com',
    username='new_farmer',
    password='farmer123',
    role='farmer',
    phone='9999999999'
)

farmer6 = create_farmer(
    db, farmer6_user,
    name='New Farmer Name',
    location='New Location',
    total_land=5.0,
    soil_type='loam',
    irrigation_type='Drip',
    state='New State',
    district='New District'
)

db.commit()
```

---

## Performance Notes

- **Initial Run**: ~5-10 seconds
- **Database Size**: ~500KB (SQLite with seed data)
- **Total Records**: ~130+ across all tables
- **Indexes**: Automatically created by SQLAlchemy

---

## Security Reminder

⚠️ **Important**: This seed data is for testing only!

- ✅ Use unique passwords in production
- ✅ Change default roles and permissions
- ✅ Use stronger hashing algorithms
- ✅ Implement rate limiting
- ✅ Add API authentication tokens

---

## Support

If you encounter issues:

1. Check the error message in terminal
2. Verify database connection
3. Ensure all dependencies installed
4. Check file permissions
5. Review the troubleshooting section above

For detailed logs, run with Python debugging:
```bash
python -u seed_data.py 2>&1 | tee seed.log
```

---

**Happy Testing! 🚀**
