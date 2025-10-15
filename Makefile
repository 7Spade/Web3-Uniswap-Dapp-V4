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
	yarn install

clean:
	yarn clean

clean:all:
	yarn clean:all

# Development commands
dev:
	yarn dev

anvil:
	yarn anvil

dev:full:
	yarn concurrently "yarn anvil" "yarn dev"

# Build commands
build:
	yarn build

build:contracts:
	yarn forge:build

build:all:
	yarn build:all

# Test commands
test:
	yarn test

test:frontend:
	yarn test:frontend

test:contracts:
	yarn test:contracts

test:coverage:
	yarn coverage

# Deployment commands
deploy:local:
	yarn deploy:local

deploy:testnet:
	yarn deploy:testnet

deploy:mainnet:
	yarn deploy:mainnet

# Verification commands
verify:
	yarn verify:contracts

gas-report:
	yarn gas-report