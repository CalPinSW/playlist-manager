output "frontend_webapp_url" {
  value = "https://${azurerm_linux_web_app.frontend.default_hostname}"
}

output "frontend_webhook" {
  value = "https://${azurerm_linux_web_app.frontend.site_credential[0].name}:${azurerm_linux_web_app.frontend.site_credential[0].password}@${azurerm_linux_web_app.frontend.name}.scm.azurewebsites.net/docker/hook"
  sensitive = true
}

output "backend_webhook" {
  value = "https://${azurerm_linux_web_app.backend.site_credential[0].name}:${azurerm_linux_web_app.backend.site_credential[0].password}@${azurerm_linux_web_app.backend.name}.scm.azurewebsites.net/docker/hook"
  sensitive = true
}