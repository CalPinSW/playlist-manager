terraform {
  required_providers {
    azurerm = {
      source = "hashicorp/azurerm"
      version = ">= 3.8"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = "d33b95c7-af3c-4247-9661-aa96d47fccc0"
}

data "azurerm_resource_group" "main" {
  name     = "cohort32-33_CalPin_ProjectExercise"
}

import {
  to  = azurerm_service_plan.main
  id  = "/subscriptions/d33b95c7-af3c-4247-9661-aa96d47fccc0/resourceGroups/cohort32-33_CalPin_ProjectExercise/providers/Microsoft.Web/serverFarms/ASP-cohort3233CalPinProjectExercise-8171"
}

resource "azurerm_service_plan" "main" {
  name                = "ASP-cohort3233CalPinProjectExercise-8171"
  location            = data.azurerm_resource_group.main.location
  resource_group_name = data.azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = "B1"
  tags                = {}
  zone_balancing_enabled = false

  lifecycle {
    prevent_destroy = true
  }
}

data "azurerm_client_config" "main" {}

import {
  to  = azurerm_key_vault.main
  id  = "/subscriptions/d33b95c7-af3c-4247-9661-aa96d47fccc0/resourceGroups/cohort32-33_CalPin_ProjectExercise/providers/Microsoft.KeyVault/vaults/PlayManKeyVault"
}

resource "azurerm_key_vault" "main" {
  name                       = "PlayManKeyVault"
  location                   = data.azurerm_resource_group.main.location
  resource_group_name        = data.azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.main.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 90
  enable_rbac_authorization  = true
}


data "azurerm_key_vault_secret" "spotify_secret" {
  name         = "SpotifySecret"
  key_vault_id = azurerm_key_vault.main.id
}

data "azurerm_key_vault_secret" "flask_secret_key" {
  name         = "FlaskSecretKey"
  key_vault_id = azurerm_key_vault.main.id
}


import {
  to  = azurerm_linux_web_app.frontend
  id  = "/subscriptions/d33b95c7-af3c-4247-9661-aa96d47fccc0/resourceGroups/cohort32-33_CalPin_ProjectExercise/providers/Microsoft.Web/sites/PlayMan"
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

  lifecycle {
    prevent_destroy = true
  }
}

import {
  to  = azurerm_linux_web_app.backend
  id  = "/subscriptions/d33b95c7-af3c-4247-9661-aa96d47fccc0/resourceGroups/cohort32-33_CalPin_ProjectExercise/providers/Microsoft.Web/sites/PlayManBackend"
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
    "SECRET_KEY"                          = data.azurerm_key_vault_secret.flask_secret_key.value
    "SPOTIFY_CLIENT_ID"                   = var.spotify_client_id
    "SPOTIFY_REDIRECT_URI"                = "${var.backend_url}/auth/get-user-code" 
    "SPOTIFY_SECRET"                      = data.azurerm_key_vault_secret.spotify_secret.value
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

  lifecycle {
    prevent_destroy = true
  }
}
