import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

database_url = settings.DATABASE_URL
connect_args = {}

try:
    if str(database_url).startswith("sqlite"):
        connect_args = {"check_same_thread": False}
        engine = create_engine(database_url, connect_args=connect_args)
    else:
        engine = create_engine(
            database_url,
            connect_args=connect_args,
            pool_size=5,
            max_overflow=10,
            pool_recycle=3600,
        )
    # Test the database connection on startup
    with engine.connect() as conn:
        pass
except Exception as e:
    print(f"Warning: Primary database connection failed ({e}).", file=sys.stderr)
    print("Falling back to local SQLite database (task_tracker.db)...", file=sys.stderr)
    sqlite_url = "sqlite:///./task_tracker.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(sqlite_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()