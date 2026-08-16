"""
Alembic environment configuration.

Wired directly to our SQLAlchemy Base and app settings, so migrations are
generated from our actual model definitions (app/models/) rather than a
separately hand-maintained schema.
"""
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.db.config import settings
from app.db.session import Base
from app.models import Surah, Verse, Tafsir, User, Bookmark, MemorizationProgress  # noqa: F401

config = context.config
# Escape literal '%' in the URL - configparser treats '%' as the start of
# an interpolation sequence, so a password containing '%' would otherwise
# crash when set here. '%%' is configparser's escape for a literal '%'.
config.set_main_option("sqlalchemy.url", settings.database_url.replace("%", "%%"))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
