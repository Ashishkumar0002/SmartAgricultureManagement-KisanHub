# Smart Agriculture Management - KisanHub

## Description
Smart Agriculture Management - KisanHub is a full-stack agriculture platform designed to modernize farm operations and decision-making. The system connects farmers, experts, workers, and administrators, enabling efficient crop management, expert advisory, employment coordination, and market insight in a single digital ecosystem.

## Problem Statement
Many farmers face critical challenges that limit productivity and profitability:
- Limited access to accurate crop advisory and agronomic knowledge
- Difficulty tracking farm activities, crop schedules, and production data
- Poor market visibility, pricing uncertainty, and low bargaining power
- Inefficient labor coordination and workforce management
- Difficulty managing documents, records, and regulatory requirements
- Limited support for role-based access and coordinated decision-making

## Solution
KisanHub solves these problems by using modern web technologies to create a collaborative agricultural management platform.
- Centralizes farm, crop, market, employment, and advisory data
- Provides role-based dashboards for farmers, experts, and admins
- Uses digital forms and workflows to collect farm and crop information
- Offers market price insights and product selling tools
- Enables advisory requests and expert response management
- Handles authentication, authorization, and data storage securely

## Objectives
The primary goals of KisanHub are:
- Provide farmers with digital tools for farm and crop management
- Improve advisory precision through expert consultation workflows
- Support labor planning, job posting, and worker allocation
- Offer market intelligence and selling assistance for agricultural products
- Enable administrators to monitor platform usage and maintain data quality
- Facilitate data-driven agriculture through unified record keeping

## How It Helps Farmers
KisanHub brings practical benefits to farmers by:
- Improving decision-making with accessible crop and farm data
- Delivering targeted crop advice through expert advisory workflows
- Providing current market price information for better sales decisions
- Simplifying farm management, worker coordination, and record keeping
- Reducing time spent on manual paperwork and fragmented communication
- Supporting more efficient use of resources and improved yield planning

## Methodology
### System workflow
1. Data input
   - Farmers register and complete profile setup
   - Farm details, crop information, soil and yield metrics are entered
   - Experts and admins register via secure onboarding flows
   - Jobs, worker profiles, and market listings are submitted
2. Processing
   - User authentication and role validation secure access
   - Input data is stored in the backend database
   - APIs retrieve farm, crop, advisory, market, and employment records
   - Route guards enforce role-based UI access in the frontend
3. Output
   - Farmers view dashboards, crop reports, and advisory status
   - Experts respond to advisory requests and review farm data
   - Admins monitor user activity and platform analytics
   - Market prices and selling records surface in the farmer interface

### Workflow summary
`Data input → Backend processing → Secure storage → Frontend output`

## Features
- Role-based login and registration for farmers, experts, admins, and workers
- Farmer dashboard with farm and crop management
- Crop information, soil tracking, and yield reporting
- Expert advisory request and response module
- Employment module for job posts and worker management
- Market price display and product selling tools
- Admin dashboard and user management pages
- File upload support for documents and profile media
- Backend API documentation with Swagger UI
- Automatic database schema creation and migration helpers

## Technologies & Software Used
### Frontend
- Angular 21
- TypeScript
- SCSS
- Angular Router for navigation and guards

### Backend
- FastAPI
- Python
- SQLAlchemy ORM
- Pydantic / Pydantic Settings
- Uvicorn web server

### Database
- SQLite (default local database)
- Configurable via `DATABASE_URL` for PostgreSQL or other SQL databases

### Tools
- npm
- Git
- VS Code
- Prettier
- Concurrently

## Feasibility Study
### Technical feasibility
- Uses proven web technologies (Angular + FastAPI)
- Supports local startup with SQLite and environment-based configuration
- Modular backend routers simplify maintenance and future extensions
- Built-in FastAPI docs make API usage transparent and testable

### Economic feasibility
- Low-cost infrastructure for development and initial deployment
- Uses open-source frameworks and libraries
- Reduces manual labor through digital farm management and advisory processes
- Supports scalability as adoption grows

### Operational feasibility
- Designed for practical farmer and admin workflows
- Supports multiple user roles and secure access control
- Offers clear UI sections for distinct agricultural tasks
- Can be deployed as a local or cloud-hosted web application

## Future Scope
Potential improvements and expansions include:
- Integrating real-time weather and satellite data
- Adding machine learning for crop disease prediction
- Supporting more localized market insights and commodity trends
- Adding mobile-friendly or progressive web app support
- Implementing advanced analytics dashboards for yield forecasting
- Adding multi-language support for broader adoption
- Building notification and alert systems for crop and labor events

## Installation & Setup
### Prerequisites
- Node.js (LTS)
- npm
- Python 3.10+
- pip
- Git

### Frontend setup
```bash
git clone https://github.com/Ashishkumar0002/SmartAgricultureManagement-KisanHub.git
cd SAMS
npm install
npm start
```
The frontend launches at `http://127.0.0.1:4200`.

### Backend setup
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
The backend runs at `http://127.0.0.1:8000`.

### Run both together
```bash
npm run start:full
```
This command starts the frontend and backend concurrently.

## Usage
### Farmer usage
- Register as a farmer and login
- Create or update farm and crop records
- Submit advisory requests for crop and soil issues
- View market prices and post products for sale
- Manage worker assignments and farm activity details

### Expert usage
- Register as an expert and login
- Review farmer advisory requests
- Provide guidance through the advisory dashboard
- Access crop information and farm data for decision support

### Admin usage
- Login as an admin
- Monitor users and platform activity
- Manage farmer, expert, and worker records
- Review system health and analytics

## Screenshots
> Add screenshots here once the UI is available.

## Contributing
Contributions are welcome. To contribute:
1. Fork the repository
2. Create a feature branch
3. Commit changes and push
4. Open a pull request with a clear description

## License
This project is open-source. Add the appropriate license details here.

## Author
Ashishkumar0002
