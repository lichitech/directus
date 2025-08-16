# Multi-Tenancy

Directus can be configured to serve multiple isolated projects from a single instance. This is achieved through a multi-tenant setup where each tenant can have its own completely separate configuration, including databases, file storage, and more. Tenant selection is determined by the hostname of the incoming request.

## Configuration

Multi-tenancy is configured entirely through environment variables.

### 1. Define Tenants

First, you need to map hostnames to unique tenant IDs. This is done by configuring a `PUBLIC_URL` for each tenant. Directus will match the hostname of the incoming request to the hostname of a tenant's `PUBLIC_URL` to identify the tenant.

### 2. Configure Tenant-Specific Overrides

For each tenant ID you define, you can override any of the standard Directus environment variables. This is done by creating a new set of variables prefixed with `TENANT_<TENANT_ID>_`. These variables will override the default configuration when a request for that tenant is received.

- **Variable Format**: `TENANT_<TENANT_ID>_<VARIABLE_NAME>`

**Example:**

Let's assume a default configuration and two tenants: `tenant1` and `tenant2`.

```bash
# --- Default/Base Configuration ---
DB_CLIENT="pg"
DB_HOST="db.example.com"
DB_DATABASE="directus_default"
DB_USER="directus_default_user"
DB_PASSWORD="password"
STORAGE_LOCATIONS="local"
EMAIL_FROM="noreply@example.com"

# --- Tenant 1 Configuration ---
TENANT_TENANT1_PUBLIC_URL="https://tenant1.example.com"

# Override the database for tenant1
TENANT_TENANT1_DB_DATABASE="directus_tenant1"
TENANT_TENANT1_DB_USER="directus_tenant1_user"
TENANT_TENANT1_DB_PASSWORD="password_t1"

# --- Tenant 2 Configuration ---
TENANT_TENANT2_PUBLIC_URL="https://tenant2.example.com"

# Tenant 2 uses a different database and a different file storage location
TENANT_TENANT2_DB_DATABASE="directus_tenant2"
TENANT_TENANT2_DB_USER="directus_tenant2_user"
TENANT_TENANT2_DB_PASSWORD="password_t2"
TENANT_TENANT2_STORAGE_LOCATIONS="s3"
TENANT_TENANT2_STORAGE_S3_BUCKET="tenant2-bucket"
# ... other S3 variables for tenant2
```

This system is generic. Any environment variable can be overridden for a specific tenant, not just database credentials.

## Runtime Behavior

When a request is made to the Directus API, it will:

1. Find the corresponding tenant ID from the `X-Tenant-ID` http request header.
2. If a tenant is found, it will load the default configuration and then apply any `TENANT_<TENANT_ID>_*` overrides for that request.
3. If no tenant matches the hostname, it will use the default configuration.

## CLI Usage

Managing tenants via the CLI is done using the standard commands, with the addition of a global `--tenant` flag. When this flag is used, the command will run using that tenant's specific configuration.

### Targeting a Single Tenant

To run a command for a specific tenant, use the `--tenant <id>` flag.

**Examples:**

```bash
# Run the latest migrations for "tenant1" using its database configuration
npx directus database migrate:latest --tenant tenant1

# Apply a schema snapshot to "tenant2"
npx directus schema apply ./snapshot.yaml --tenant tenant2
```

### Bootstrapping

The `bootstrap` command has special behavior in a multi-tenant environment to simplify initialization.

#### Bootstrap a Single Tenant

You can initialize a single tenant's database by providing the `--tenant` flag.

```bash
# Initialize the database and create an admin user for "tenant1"
npx directus bootstrap --tenant tenant1
```

#### Bootstrap All Tenants

If you run the `bootstrap` command **without** the `--tenant` flag, Directus will automatically detect all tenants from the `TENANT_*` environment variables and run the bootstrap process for **each one sequentially**, including the default (base) database.

```bash
# This will initialize the default database AND the databases for
# tenant1, tenant2, and any other configured tenants.
npx directus bootstrap
```

This is a powerful way to set up an entire multi-tenant instance with a single command.
