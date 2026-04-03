resource "azurerm_resource_group" "app" {
  name     = "fuzzy-tiers-showcase-rg"
  location = var.location
}
