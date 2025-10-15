# Web3 DApp Makefile
# Provides convenient commands for managing the monorepo

.PHONY: help install dev build test clean deploy verify

# Default target
help:
	@echo "Web3 DApp Monorepo Commands:"
	@echo ""
	@echo "Setup:"
	@echo "  install          Install all dependencies"
	@echo "  clean            Clean build artifacts"
	@echo "  clean:all        Clean everything including node_modules"
	@echo ""
	@echo "Development:"
	@echo "  dev              Start frontend development server"
	@echo "  anvil            Start local Anvil blockchain"
	@echo "  dev:full         Start both frontend and Anvil"
	@echo ""
	@echo "Building:"
	@echo "  build            Build frontend"
	@echo "  build:contracts  Build smart contracts"
	@echo "  build:all        Build everything"
	@echo ""
	@echo "Testing:"
	@echo "  test             Run all tests"
	@echo "  test:frontend    Run frontend tests"
	@echo "  test:contracts   Run contract tests"
	@echo "  test:coverage    Run contract tests with coverage"
	@echo ""
	@echo "Deployment:"
	@echo "  deploy:local     Deploy contracts to local Anvil"
	@echo "  deploy:testnet   Deploy contracts to testnet"
	@echo "  deploy:mainnet   Deploy contracts to mainnet"
	@echo ""
	@echo "Verification:"
	@echo "  verify           Verify deployed contracts"
	@echo "  gas-report       Generate gas usage report"

# Setup commands
install:
	npm install

clean:
	npm run clean

clean:all:
	npm run clean:all

# Development commands
dev:
	npm run dev

anvil:
	npm run anvil

dev:full:
	npm run concurrently --silent -- -c "npm:anvil" "npm:dev"

# Build commands
build:
	npm run build

build:contracts:
	npm run forge:build

build:all:
	npm run build:all

# Test commands
test:
	npm run test

test:frontend:
	npm run test:frontend

test:contracts:
	npm run test:contracts

test:coverage:
	npm run coverage

# Deployment commands
deploy:local:
	npm run deploy:local

deploy:testnet:
	npm run deploy:testnet

deploy:mainnet:
	npm run deploy:mainnet

# Verification commands
verify:
	npm run verify:contracts

gas-report:
	npm run gas-report