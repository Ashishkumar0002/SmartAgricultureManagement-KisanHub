# KisanHub

## What is KisanHub
KisanHub is a Smart Agriculture Management platform that connects farmers, experts, workers, and administrators in one system. It helps farmers manage farm activities, get advisory support, find employment opportunities, and access market information through a unified web application.

## Basic Project Information
- Project name: Smart Agriculture Management - KisanHub
- Repository owner: Ashishkumar0002
- Repository: SmartAgricultureManagement-KisanHub
- Branch: main
- Type: Full-stack web platform for agriculture workflows
- Main users: Farmers, Experts, Workers, Admins
- Core goals:
	- Improve farmer support through expert advisory
	- Provide job and worker coordination
	- Enable farm and crop management in one place
	- Provide admin-level monitoring and analytics

## Features
- Farmer management and farmer dashboard
- Expert advisory and ask-an-expert workflows
- Employment module for jobs and workers
- Market price and market insights features
- Crop and farm management tools
- Admin dashboard for analytics, user management, and platform monitoring
- Authentication and role-based access for Farmer, Expert, and Admin users

## Tech Stack
- Frontend: Angular, TypeScript, SCSS
- Backend: FastAPI (Python)
- Database: SQLAlchemy ORM with relational database support
- Auth and security: JWT-based authentication
- Tooling: Angular CLI, npm, Python virtual environment

## Project and File Structure
The project is organized into a frontend Angular app and a backend FastAPI service.

```text
SAMS/
|- angular.json
|- package.json
|- proxy.conf.json
|- README.md
|- tsconfig.app.json
|- tsconfig.json
|- tsconfig.spec.json
|
|- backend/
|  |- README.md
|  |- requirements.txt
|  |- seed_data.py
|  |- SEEDING_GUIDE.md
|  |- app/
|  |  |- main.py
|  |  |- db.py
|  |  |- models.py
|  |  |- schemas.py
|  |  |- core/
|  |  |  |- config.py
|  |  |- routers/
|  |  |  |- auth.py
|  |  |  |- admin.py
|  |  |  |- farmer.py
|  |  |  |- farmers.py
|  |  |  |- expert.py
|  |  |  |- advisory.py
|  |  |  |- employment.py
|  |  |  |- market.py
|  |  |  |- crops.py
|  |  |- services/
|  |     |- deps.py
|  |     |- security.py
|  |- uploads/
|
|- public/
|- src/
|  |- main.ts
|  |- styles.scss
|  |- app/
|  |  |- app.config.ts
|  |  |- app.routes.ts
|  |  |- core/
|  |  |  |- guards/
|  |  |  |- interceptors/
|  |  |  |- services/
|  |  |- features/
|  |  |  |- auth/
|  |  |  |- admin/
|  |  |  |- farmer/
|  |  |  |- expert/
|  |  |  |- advisory/
|  |  |  |- employment/
|  |  |  |- market/
|  |  |  |- dashboard/
|  |  |  |- landing/
|  |  |- shared/
|  |     |- components/
|  |     |- models/
|  |     |- styles/
|  |- assets/
|  |- environments/
```

## Prerequisites
- Node.js (LTS) and npm
- Python 3.10+ and pip
- Git

## Start Project
Follow these steps to run both backend and frontend locally.

1. Clone and open the project
	- git clone https://github.com/Ashishkumar0002/SmartAgricultureManagement-KisanHub.git
	- cd SAMS

2. Install frontend dependencies
	- npm install

3. Set up backend virtual environment
	- cd backend
	- python -m venv .venv
	- For PowerShell: .\\.venv\\Scripts\\Activate.ps1
	- pip install -r requirements.txt

4. Run backend server
	- uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

5. Run frontend server (new terminal from project root)
	- cd SAMS
	- npm start

6. Open application
	- Frontend: http://localhost:4200
	- Backend API docs: http://localhost:8000/docs

## Useful Commands
- Start frontend: npm start
- Run frontend tests: npm test
- Build frontend: npm run build

## Notes
- Keep backend and frontend terminals running at the same time.
- If API calls fail from frontend, verify proxy settings in proxy.conf.json and backend port.
