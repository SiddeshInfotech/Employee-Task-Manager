from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL


class Settings(BaseSettings):
    PROJECT_NAME: str = "Employee Task Tracker"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_JWT_KEY_FOR_EMPLOYEE_TASK_TRACKER"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    DB_HOST: str
    DB_PORT: int
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    DB_CHARSET: str = "utf8mb4"

    # SMTP Email Settings (Gmail)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_EMAIL: str = ""
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

    @property
    def DATABASE_URL(self):
        return URL.create(
            drivername="mysql+pymysql",
            username=self.DB_USER,
            password=self.DB_PASSWORD,
            host=self.DB_HOST,
            port=self.DB_PORT,
            database=self.DB_NAME,
            query={"charset": self.DB_CHARSET},
        )


settings = Settings()