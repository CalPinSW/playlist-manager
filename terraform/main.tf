terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.8"
    }
  }
  backend "azurerm" {
      resource_group_name  = "cohort32-33_CalPin_ProjectExercise"
      storage_account_name = "playman"
      container_name       = "playman"
      key                  = "terraform.tfstate"
  }
}

provider "azurerm" {
  features {}
  subscription_id = "d33b95c7-af3c-4247-9661-aa96d47fccc0"
}

data "azurerm_resource_group" "main" {
  name     = "cohort32-33_CalPin_ProjectExercise"
}


resource "azurerm_service_plan" "main" {
  name                = "ASP-cohort3233CalPinProjectExercise-8171"
  location            = data.azurerm_resource_group.main.location
  resource_group_name = data.azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = "B1"
  tags                = {}
  zone_balancing_enabled = false
}


resource "azurerm_storage_account" "tfstate" {
  name                     = "playman"
  resource_group_name      = data.azurerm_resource_group.main.name
  location                 = data.azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  allow_nested_items_to_be_public = false

  tags = {
    environment = "staging"
  }
}

resource "azurerm_storage_container" "tfstate" {
  name                  = "playman"
  storage_account_id = azurerm_storage_account.tfstate.id
  container_access_type = "private"
}

data "azurerm_client_config" "main" {}


resource "azurerm_key_vault" "main" {
  name                       = "PlayManKeyVault1"
  location                   = data.azurerm_resource_group.main.location
  resource_group_name        = data.azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.main.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7

  access_policy {
    tenant_id = data.azurerm_client_config.main.tenant_id
    object_id = data.azurerm_client_config.main.object_id

    key_permissions    = ["List", "Create", "Delete", "Get", "Purge", "Recover", "Update", "GetRotationPolicy", "SetRotationPolicy"]
    secret_permissions = ["List", "Set", "Get", "Purge", "Recover"]
  }
}


resource "azurerm_key_vault_secret" "spotify_secret" {
  name         = "SpotifySecret"
  value        = var.spotify_secret
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "flask_secret_key" {
  name         = "FlaskSecretKey"
  value        = var.flask_secret_key
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_linux_web_app" "frontend" {
  name                = "PlayMan"
  location            = data.azurerm_resource_group.main.location
  resource_group_name = data.azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.main.id

  app_settings = {
    "BACKEND_URL"                         = var.backend_url
    "DOCKER_ENABLE_CI"                    = "true"
    "FRONTEND_URL"                        = var.frontend_url
    "NODE_ENV"                            = "production"
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
  }
  https_only = true

  logs {
    detailed_error_messages = false
    failed_request_tracing  = false

    http_logs {
      file_system {
        retention_in_days = 0
        retention_in_mb   = 35
      }
    }
  }

  site_config {
    always_on = false
    ftps_state = "FtpsOnly"

    application_stack {
      docker_image_name     = "calpin/playlist-manager-frontend:prod"
      docker_registry_url   = "https://index.docker.io"
    }
  }
}

resource "azurerm_linux_web_app" "backend" {
  name                = "PlayManBackend"
  location            = data.azurerm_resource_group.main.location
  resource_group_name = data.azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.main.id

  app_settings = {
    "BACKEND_URL"                         = var.backend_url
    "DB_CONNECTION_STRING"                = var.db_connection_string
    "DOCKER_ENABLE_CI"                    = "true"
    "FLASK_APP"                           = "src/app" 
    "FLASK_DEBUG"                         = "false" 
    "FRONTEND_URL"                        = var.frontend_url
    "MUSICBRAINZ_URL"                     = var.musicbrainz_url
    "MUSICBRAINZ_USER_AGENT"              = var.musicbrainz_user_agent
    "SECRET_KEY"                          = azurerm_key_vault_secret.flask_secret_key.value
    "SPOTIFY_CLIENT_ID"                   = var.spotify_client_id
    "SPOTIFY_REDIRECT_URI"                = "${var.backend_url}/auth/get-user-code" 
    "SPOTIFY_SECRET"                      = azurerm_key_vault_secret.spotify_secret.value
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
  }
  https_only = true

  site_config {
    always_on = false
    ftps_state = "FtpsOnly"
    cors {
      allowed_origins = ["https://playman.azurewebsites.net"]
      support_credentials = true
    }
    application_stack {
      docker_image_name     = "calpin/playlist-manager-backend:prod"
      docker_registry_url   = "https://index.docker.io"
    }
  }

  logs {
    detailed_error_messages = false
    failed_request_tracing = false

    http_logs {
      file_system {
        retention_in_days = 1
        retention_in_mb = 35
      }
    }
  }
  depends_on = [ azurerm_key_vault_secret.flask_secret_key, azurerm_key_vault_secret.spotify_secret ]
}
