provider "neon" {
  api_key = var.neon_api_key
}


resource "neon_project" "playman" {
  name = "PlayMan"
  history_retention_seconds=86400
}

resource "neon_endpoint" "main" {
  project_id = neon_project.playman.id
  branch_id  = neon_branch.main.id

  autoscaling_limit_min_cu = 0.25
  autoscaling_limit_max_cu = 0.25
}

resource "neon_branch" "main" {
  project_id = neon_project.playman.id
  name       = "main"
}

resource "neon_role" "playman_owner" {
  project_id = neon_project.playman.id
  branch_id  = neon_branch.main.id
  name       = "playman_owner"
}

resource "neon_database" "main" {
  project_id = neon_project.playman.id
  branch_id  = neon_branch.main.id
  owner_name = neon_role.playman_owner.name
  name       = "playman"
}
