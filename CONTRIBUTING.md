# Contributing to nothrow-ts

Thank you for your interest in contributing to nothrow-ts! This guide will help you get started with development and understand our automated CI/CD process.

## Development Setup

1. **Fork and clone** the repository
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run tests** to ensure everything works:
   ```bash
   npm test
   ```

## Development Workflow

### Making Changes

1. Create a new branch from `main`
2. Make your changes following existing patterns
3. Add tests for new features
4. Ensure all checks pass:
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```
5. Submit a pull request

### Code Standards

- Follow existing TypeScript patterns
- Maintain 100% type safety
- Add comprehensive tests for new features
- Update documentation for API changes
- Follow the established project structure

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning and changelog generation:

### Commit Types

- `feat:` - New features (triggers minor version bump)
- `fix:` - Bug fixes (triggers patch version bump)
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring without feature changes
- `test:` - Adding or updating tests
- `chore:` - Build process, tooling, or dependency updates

### Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the commit body:

```
feat: redesign Result API

BREAKING CHANGE: Result.unwrap() now throws custom error instead of generic Error
```

This triggers a major version bump.

### Examples

```bash
git commit -m "feat: add retry combinator for async operations"
git commit -m "fix: handle edge case in generator error propagation"
git commit -m "docs: update README with new examples"
```

## Automated CI/CD Pipeline

### Pull Request Workflow

When you submit a PR, GitHub Actions automatically:

1. **Runs tests** across multiple Node.js versions
2. **Checks linting** and code formatting
3. **Validates TypeScript** compilation
4. **Builds the package** to ensure no build errors
5. **Provides feedback** on the PR with results

### Release Workflow

When changes are merged to `main`:

1. **Semantic Release** analyzes commit messages
2. **Determines version bump** based on conventional commits
3. **Generates changelog** from commit history
4. **Updates package.json** version
5. **Creates GitHub release** with release notes
6. **Publishes to npm** automatically
7. **Creates git tag** for the release

### Required Secrets

For maintainers, the repository needs these GitHub secrets:

- `NPM_TOKEN`: npm granular access token with publish permissions

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- Unit tests in `src/__tests__/`
- Test files follow `*.test.ts` naming
- Use Vitest for testing framework
- Aim for comprehensive coverage of all features


## Building and Publishing

### Local Development

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run typecheck

# Run tests
npm run test

# Build package
npm run build
```

## Project Structure

```
src/
├── __tests__/           # Test files
│   ├── result.test.ts
│   ├── option.test.ts
│   └── generator.test.ts
├── result.ts            # Result type implementation
├── option.ts            # Option type implementation
└── index.ts             # Public API exports

.github/
└── workflows/
    └── release.yml      # CI/CD pipeline

docs/                    # Additional documentation
```

## Release Process

Releases are fully automated based on conventional commits:

1. **Patch** (0.1.0 → 0.1.1): `fix:` commits
2. **Minor** (0.1.0 → 0.2.0): `feat:` commits  
3. **Major** (0.1.0 → 1.0.0): `BREAKING CHANGE:` in commit body

### Manual Release (Emergency)

If automated release fails, maintainers can manually release:

```bash
npm run build
npm publish --otp=<your-otp>
git tag v<version>
git push --tags
```

## Getting Help

- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: All PRs require review before merging

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming environment for all contributors

Thank you for contributing to nothrow-ts!
