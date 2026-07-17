from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Employee Task Tracker"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_JWT_KEY_FOR_EMPLOYEE_TASK_TRACKER"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    DATABASE_URL: str

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env"
    )

settings = Settings()