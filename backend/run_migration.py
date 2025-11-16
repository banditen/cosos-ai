"""Run database migration for artifacts tables."""

from pathlib import Path

# Read migration file
migration_path = Path(__file__).parent / "database" / "migrations" / "003_create_artifacts_tables.sql"

with open(migration_path, 'r') as f:
    migration_sql = f.read()

print(migration_sql)

