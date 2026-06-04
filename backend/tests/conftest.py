import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.models import User, Role, RoleName
from app.core.startup import seed_roles, seed_default_admin

# In-memory SQLite for isolated test runs
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session() -> Session:
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        seed_roles(db)
        seed_default_admin(db)
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session: Session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def test_patient(db_session: Session) -> User:
    from app.services import auth_service
    from app.schemas.auth import UserRegisterRequest
    
    reg_data = UserRegisterRequest(
        email="test_patient@example.com",
        password="Password123",
        full_name="Test Patient",
        phone="+1555123456",
        language_preference="en"
    )
    user = auth_service.register_patient(db_session, reg_data)
    return user

@pytest.fixture(scope="function")
def test_doctor(db_session: Session) -> User:
    from app.services import auth_service
    from app.schemas.auth import UserRegisterRequest
    
    reg_data = UserRegisterRequest(
        email="test_doctor@example.com",
        password="Password123",
        full_name="Test Doctor",
        phone="+1555987654",
        language_preference="en"
    )
    user = auth_service.register_doctor(db_session, reg_data)
    
    # Auto-approve doctor for login
    user.is_approved = True
    db_session.commit()
    db_session.refresh(user)
    
    # Update existing specialization & fee via profile
    from app.models import Doctor
    doctor_profile = db_session.query(Doctor).filter(Doctor.user_id == user.id).first()
    if not doctor_profile:
        doctor_profile = Doctor(user_id=user.id)
        db_session.add(doctor_profile)
    doctor_profile.specialization = "Cardiology"
    doctor_profile.qualification = "MD"
    doctor_profile.experience_years = 10
    doctor_profile.consultation_fee = 150.0
    db_session.commit()
    
    return user

@pytest.fixture(scope="function")
def patient_headers(test_patient: User) -> dict:
    token = create_access_token(subject=str(test_patient.id), role=test_patient.role.name)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def doctor_headers(test_doctor: User) -> dict:
    token = create_access_token(subject=str(test_doctor.id), role=test_doctor.role.name)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def admin_headers(db_session: Session) -> dict:
    admin_user = db_session.query(User).join(Role).filter(Role.name == RoleName.ADMIN.value).first()
    token = create_access_token(subject=str(admin_user.id), role=admin_user.role.name)
    return {"Authorization": f"Bearer {token}"}
