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

# resource "azurerm_linux_web_app" "frontend" {
#   name                = "CalPin-Hello-World-Test"
#   location            = data.azurerm_resource_group.main.location
#   resource_group_name = data.azurerm_resource_group.main.name
#   service_plan_id     = azurerm_service_plan.main.id

#   site_config {
#     application_stack {
#       docker_image_name     = "appsvcsample/python-helloworld:latest"
#       docker_registry_url   = "https://index.docker.io"
#     }
#   }
# }


