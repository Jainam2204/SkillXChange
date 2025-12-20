# Test Suite Documentation

This directory contains comprehensive unit and integration tests for the SkillXChange backend.

## Test Structure

```
test/
├── unit/                           # Unit tests for individual components
│   ├── middleware/                 # Middleware unit tests
│   │   ├── checkBanned.test.js
│   │   └── errorHandler.test.js
│   ├── services/                   # Service unit tests
│   │   ├── authService.test.js
│   ├── controllers/                # Controller unit tests
│   │   └── reportController.test.js
│   └── validators.test.js          # Password and validation logic tests
├── integration/                    # Integration tests for API endpoints
│   ├── auth.integration.test.js
│   ├── message.integration.test.js
├── register.test.js                # Registration endpoint tests
├── login.test.js                   # Login endpoint tests
├── setup.js                        # Global test setup
└── README.md                       # This file
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npm test -- register.test.js
npm test -- test/integration/password-validation.integration.test.js
```

### Run with coverage
```bash
npm test -- --coverage
```

## Test Categories

### Unit Tests

#### Middleware Tests

- **checkBanned.test.js**: Banned user check middleware
  - Allows non-banned users
  - Blocks banned users
  - Handles undefined user

- **errorHandler.test.js**: Error handling middleware
  - Error response formatting
  - CORS header setting
  - Development vs production error details

#### Service Tests
- **authService.test.js**: Authentication service logic
  - User registration
  - User login
  - Email verification
  - Profile retrieval

#### Controller Tests

- **reportController.test.js**: Report controller
  - Reporting users
  - Checking report status
  - Getting report stats

#### Validator Tests
- **validators.test.js**: Input validation tests
  - Password validation regex patterns
  - Verification code validation
  - All validation edge cases

### Integration Tests
- **auth.integration.test.js**: Full authentication flow tests
- **message.integration.test.js**: Message sending and retrieval

### Endpoint Tests
- **register.test.js**: Registration endpoint with various validation scenarios
- **login.test.js**: Login endpoint with credential validation
- **verification.test.js**: Email verification endpoint tests

## Password Validation Rules

The password must meet ALL of the following criteria:
- Length: 6-14 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character from: `@$!%*?&`

### Valid Password Examples
- `Password123!`
- `Test@456`
- `MyPass$789`
- `Secure1*`

### Invalid Password Examples
- `password123!` (no uppercase)
- `PASSWORD123!` (no lowercase)
- `Password!` (no digit)
- `Password123` (no special character)
- `Pass1!` (too short, < 6 chars)
- `Password123!@#` (too long, > 14 chars)

## Verification Code Validation Rules

- Must be exactly 6 digits
- Numbers only (0-9)
- No letters or special characters allowed

### Valid Examples
- `123456`
- `000000`
- `999999`

### Invalid Examples
- `12345` (too short)
- `1234567` (too long)
- `12345a` (contains letter)
- `12345!` (contains special character)

## Test Environment Setup

Tests use MongoDB Memory Server for isolated testing. Make sure you have:

1. `.env.test` file with `MONGO_URI_TEST` (optional, uses in-memory DB by default)
2. All dependencies installed: `npm install`

## Writing New Tests

When adding new features, follow these guidelines:

1. **Unit Tests**: Test individual functions/validators in isolation
2. **Integration Tests**: Test full API endpoints with database interactions
3. **Naming**: Use descriptive test names: `should [expected behavior] when [condition]`
4. **Cleanup**: Always clean up test data in `afterEach` or `afterAll`
5. **Mocking**: Mock external services (email, payment, etc.) to avoid side effects

## Example Test Structure

```javascript
describe('Feature Name', () => {
  beforeAll(async () => {
    // Setup: connect to DB, create test data
  });

  afterEach(async () => {
    // Cleanup: remove test data
  });

  afterAll(async () => {
    // Teardown: close connections
  });

  it('should [expected behavior]', async () => {
    // Arrange
    const input = { ... };
    
    // Act
    const result = await functionUnderTest(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```


