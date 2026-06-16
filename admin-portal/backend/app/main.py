from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.database import SessionLocal
from app.core.startup import backfill_emergency_profiles, backfill_role_profiles, seed_default_admin, seed_roles

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        seed_roles(db)
        seed_default_admin(db)
        backfill_role_profiles(db)
        backfill_emergency_profiles(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## Healthcare Platform API — Phase 1

Core platform API — Phase 1 complete (Sprints 1–7).

Authentication, patients, doctors, appointments, EHR, prescriptions, notifications, and admin portal.

### How to test in Swagger UI

1. **Register** a patient or doctor
2. **Login** as admin (`admin@example.com` / `Admin@123456`) to approve doctors
3. Click **Authorize** with `Bearer <access_token>`
4. Test role-specific endpoints under **Patients**, **Doctors**, and **Admin — Doctors**
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter: Bearer &lt;access_token&gt;",
        }
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi
