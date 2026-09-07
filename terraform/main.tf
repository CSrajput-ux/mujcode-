# ==============================================================================
# MujCode Enterprise Disaster Recovery & Infrastructure Provisioning
# ==============================================================================
# This Terraform configuration provides the capability to rebuild the entire 
# AWS EKS cluster and RDS databases in minutes in case of a catastrophic failure.

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS Region to deploy to"
  default     = "us-east-1"
}

variable "db_password" {
  description = "Database administrator password for RDS PostgreSQL"
  type        = string
  sensitive   = true
  default     = "ChangeMeInProduction123!"
}

# ------------------------------------------------------------------------------
# 1. Kubernetes Cluster (Amazon EKS)
# ------------------------------------------------------------------------------
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "mujcode-production"
  cluster_version = "1.29"

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.intra_subnets

  # EKS Managed Node Group(s)
  eks_managed_node_groups = {
    mujcode_api_nodes = {
      min_size     = 3
      max_size     = 15
      desired_size = 3
      instance_types = ["t3.medium", "m5.large"]
      capacity_type  = "ON_DEMAND"
    }
    mujcode_compiler_nodes = {
      min_size     = 5
      max_size     = 25
      desired_size = 5
      instance_types = ["c5.xlarge", "c5a.xlarge"]
      capacity_type  = "SPOT" # Cost optimization for compiler workers
      taints = {
        dedicated = {
          key    = "workload"
          value  = "compiler"
          effect = "NO_SCHEDULE"
        }
      }
    }
  }
}

# ------------------------------------------------------------------------------
# 2. Database (Amazon RDS PostgreSQL)
# ------------------------------------------------------------------------------
resource "aws_db_instance" "mujcode_postgres" {
  identifier             = "mujcode-db-prod"
  engine                 = "postgres"
  engine_version         = "15"
  instance_class         = "db.r6g.large"
  allocated_storage      = 100
  storage_type           = "gp3"
  
  db_name                = "mujcode_db"
  username               = "mujcode_admin"
  password               = var.db_password # Injected via TF_VAR_db_password

  # Disaster Recovery settings
  backup_retention_period = 7 # Retain automated backups for 7 days
  backup_window           = "03:00-04:00"
  copy_tags_to_snapshot   = true
  multi_az                = true # High Availability across availability zones

  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.default.name
  
  skip_final_snapshot    = false
  final_snapshot_identifier = "mujcode-db-final-snapshot"
}

# ------------------------------------------------------------------------------
# 3. VPC & Network Infrastructure
# ------------------------------------------------------------------------------
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "mujcode-vpc"
  cidr = "10.0.0.0/16"

  azs              = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets   = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  intra_subnets    = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]
  database_subnets = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false
}

# ------------------------------------------------------------------------------
# 4. Database Security Group & Subnet Group
# ------------------------------------------------------------------------------
resource "aws_security_group" "db_sg" {
  name        = "mujcode-db-sg"
  description = "Allow inbound PostgreSQL traffic from VPC"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "PostgreSQL from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "mujcode-db-sg"
  }
}

resource "aws_db_subnet_group" "default" {
  name        = "mujcode-db-subnet-group"
  subnet_ids  = module.vpc.database_subnets
  description = "Database Subnet Group for MujCode RDS PostgreSQL"

  tags = {
    Name = "mujcode-db-subnet-group"
  }
}

