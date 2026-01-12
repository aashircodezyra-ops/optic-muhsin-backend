# OptikGoal API Documentation

Complete API endpoint documentation with request/response formats, error codes, and examples.

## Base URL
```
http://localhost:5000/api
```

## Response Format

All API responses follow a standardized format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]  // Optional: validation errors
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation:**
- `name`: Required, 2-50 characters, alphanumeric and spaces only
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isVIP": false,
      "vipExpiry": null
    }
  }
}
```

**Error Responses:**
- `400` - Validation failed (missing/invalid fields)
- `409` - Email already exists
- `500` - Internal server error

---

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation:**
- `email`: Required, valid email format
- `password`: Required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isVIP": false,
      "vipExpiry": null
    }
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `401` - Invalid email or password
- `500` - Internal server error

---

### GET /api/auth/me
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isVIP": false,
      "vipExpiry": null
    }
  }
}
```

**Error Responses:**
- `401` - Unauthorized (invalid/missing token)
- `404` - User not found
- `500` - Internal server error

---

## Comments Endpoints

### POST /api/comments/create
Create a new comment (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "message": "Great match!",
  "matchId": "12345"  // Optional
}
```

**Validation:**
- `message`: Required, 2-1000 characters
- `matchId`: Optional string

**Success Response (201):**
```json
{
  "success": true,
  "message": "Comment posted successfully",
  "data": {
    "comment": {
      "_id": "comment_id",
      "userId": "user_id",
      "matchId": "12345",
      "message": "Great match!",
      "username": "John Doe",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "isSpam": false,
      "isFlagged": false
    }
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `401` - Unauthorized
- `429` - Too many requests (5 second cooldown)
- `500` - Internal server error

**Spam Detection:**
If comment is detected as spam, returns `200` with:
```json
{
  "success": false,
  "message": "Your comment looks like spam and was not posted.",
  "errors": { "isSpam": true }
}
```

---

### GET /api/comments/list
Get list of comments (public endpoint).

**Query Parameters:**
- `matchId` (optional): Filter comments by match ID
- `limit` (optional, default: 50): Maximum number of comments

**Example:**
```
GET /api/comments/list?matchId=12345&limit=20
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Comments retrieved successfully",
  "data": {
    "comments": [
      {
        "_id": "comment_id",
        "userId": "user_id",
        "matchId": "12345",
        "message": "Great match!",
        "username": "John Doe",
        "likes": 5,
        "likedBy": ["user_id_1", "user_id_2"],
        "reports": 0,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

**Error Responses:**
- `500` - Internal server error

---

### POST /api/comments/:id/like
Like or unlike a comment (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Comment liked",
  "data": {
    "comment": {
      "_id": "comment_id",
      "likes": 6,
      "isLiked": true
    }
  }
}
```

**Error Responses:**
- `400` - Comment ID is required
- `401` - Unauthorized
- `404` - Comment not found
- `500` - Internal server error

---

### POST /api/comments/:id/report
Report a comment (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Comment reported successfully",
  "data": {
    "comment": {
      "_id": "comment_id",
      "reports": 1,
      "isFlagged": false
    }
  }
}
```

**Note:** Comments are automatically flagged after 3 reports.

**Error Responses:**
- `400` - Comment ID is required / Already reported
- `401` - Unauthorized
- `404` - Comment not found
- `500` - Internal server error

---

## Admin Endpoints

### POST /api/admin/login
Admin login.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin_password"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "admin_jwt_token",
  "user": {
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `401` - Invalid credentials
- `500` - Internal server error

---

### GET /api/admin/users
Get all users (admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page
- `search` (optional): Search by name or email
- `status` (optional): Filter by status (all, VIP, Regular, Banned)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `500` - Internal server error

**Note:** Admin users are excluded from the results.

---

### GET /api/admin/users/:id
Get user by ID (admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isVIP": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden
- `404` - User not found
- `500` - Internal server error

---

### PUT /api/admin/users/:id
Update user (admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "role": "user",
  "isVIP": true
}
```

**Validation:**
- Cannot change user role to admin through this endpoint
- Cannot modify admin users

**Success Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": { ... }
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `401` - Unauthorized
- `403` - Forbidden / Cannot modify admin users
- `404` - User not found
- `500` - Internal server error

---

### DELETE /api/admin/users/:id
Delete user (admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden / Cannot delete admin users
- `404` - User not found
- `500` - Internal server error

---

### GET /api/admin/comments
Get all comments (admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 50)
- `search` (optional): Search by username
- `filter` (optional): Filter by type (all, normal, spam, flagged)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "comments": [ ... ],
    "pagination": { ... }
  },
  "count": 10
}
```

---

### DELETE /api/admin/comments/:id
Delete comment (admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

## Predictions Endpoints

### GET /api/predictions/all
Get all public predictions.

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 50)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "predictions": [ ... ],
    "pagination": { ... }
  }
}
```

---

### GET /api/predictions/:id
Get single prediction by ID.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "prediction": {
      "_id": "prediction_id",
      "matchId": "12345",
      "homeTeam": "Team A",
      "awayTeam": "Team B",
      "tip": "Over 2.5",
      "confidence": 75,
      "league": "Premier League",
      "matchStart": "2024-01-01T19:00:00.000Z",
      "source": "api-football",
      "predictionType": "banker"
    }
  }
}
```

**Error Responses:**
- `400` - Invalid prediction ID format
- `401` - Unauthorized (for VIP predictions)
- `403` - VIP membership required
- `404` - Prediction not found
- `500` - Internal server error

---

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Comments**: 1 request per 5 seconds per user
- **Authentication**: 100 requests per 15 minutes per IP

---

## Error Handling

All errors follow the standardized format:

```json
{
  "success": false,
  "message": "Error description"
}
```

For validation errors:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Field 1 is required",
    "Field 2 must be at least 6 characters"
  ]
}
```

---

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained from:
- `/api/auth/register` - Returns token on successful registration
- `/api/auth/login` - Returns token on successful login
- `/api/admin/login` - Returns admin token

---

## Logging

All API requests are logged with:
- Request method and path
- User ID (if authenticated)
- Timestamp
- Error details (if any)

Logs include:
- Successful operations
- Failed authentication attempts
- Validation errors
- System errors

---

## Testing

Test endpoints using:
- Postman
- cURL
- Frontend application
- API testing tools

Example cURL:
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get comments (with token)
curl -X GET http://localhost:5000/api/comments/list \
  -H "Authorization: Bearer <token>"
```

---

## Notes

1. All timestamps are in ISO 8601 format (UTC)
2. All IDs are MongoDB ObjectIds (24 character hex strings)
3. Passwords are never returned in responses
4. Admin users are excluded from user management endpoints
5. Rate limiting applies to prevent abuse
6. Spam protection is active for comments
7. VIP predictions require active VIP membership

