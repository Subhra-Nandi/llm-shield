from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings
from app.db.models import Base

# asyncpg doesn't accept ?sslmode=require in the URL
# SSL must be passed as a connect_arg instead
# Strip any sslmode/channel_binding params from the URL first
def _clean_url(url: str) -> str:
    """Remove psycopg2-style params that asyncpg doesn't understand."""
    if "?" in url:
        base, params = url.split("?", 1)
        # Filter out params asyncpg can't handle
        filtered = "&".join(
            p for p in params.split("&")
            if not p.startswith("sslmode")
            and not p.startswith("channel_binding")
        )
        return f"{base}?{filtered}" if filtered else base
    return url

clean_url = _clean_url(settings.database_url)

engine = create_async_engine(
    clean_url,
    pool_size=5,
    max_overflow=10,
    echo=False,
    connect_args={"ssl": "require"},  # asyncpg SSL syntax
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created/verified.")

async def close_db():
    await engine.dispose()
    print("Database connection pool closed.")