const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── In-Memory Database (no real DB needed for this project) ──
let users = [
  { id: 1, name: "Rahul Sharma", email: "rahul@example.com", role: "admin" },
  { id: 2, name: "Priya Singh", email: "priya@example.com", role: "user" },
];
let nextId = 3;

// ─── HELPER: Validate Email Format ───────────────────────────
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ══════════════════════════════════════════════════════════════
//  ROUTE 1: GET /  → Health Check
// ══════════════════════════════════════════════════════════════
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "DecodeLabs API is running 🚀",
    version: "1.0.0",
    endpoints: {
      "GET  /users": "Get all users",
      "GET  /users/:id": "Get a single user by ID",
      "POST /users": "Create a new user",
      "PUT  /users/:id": "Update a user",
      "DELETE /users/:id": "Delete a user",
    },
  });
});

// ══════════════════════════════════════════════════════════════
//  ROUTE 2: GET /users  → Get all users
// ══════════════════════════════════════════════════════════════
app.get("/users", (req, res) => {
  res.status(200).json({
    status: "success",
    count: users.length,
    data: users,
  });
});

// ══════════════════════════════════════════════════════════════
//  ROUTE 3: GET /users/:id  → Get single user
// ══════════════════════════════════════════════════════════════
app.get("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);

  // Syntactic Validation: is ID a number?
  if (isNaN(id)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid ID format. ID must be a number.",
    });
  }

  const user = users.find((u) => u.id === id);

  // Semantic Validation: does user exist?
  if (!user) {
    return res.status(404).json({
      status: "error",
      message: `User with ID ${id} not found.`,
    });
  }

  res.status(200).json({
    status: "success",
    data: user,
  });
});

// ══════════════════════════════════════════════════════════════
//  ROUTE 4: POST /users  → Create new user
// ══════════════════════════════════════════════════════════════
app.post("/users", (req, res) => {
  const { name, email, role } = req.body;

  // ── Validation Layer (The Gatekeeper Rule) ─────────────────

  // 1. Check required fields exist
  if (!name || !email) {
    return res.status(400).json({
      status: "error",
      message: "Bad Request: 'name' and 'email' are required fields.",
    });
  }

  // 2. Check name is a non-empty string
  if (typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({
      status: "error",
      message: "Bad Request: 'name' must be at least 2 characters long.",
    });
  }

  // 3. Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({
      status: "error",
      message: "Bad Request: 'email' format is invalid.",
    });
  }

  // 4. Check for duplicate email (Semantic Validation)
  const emailExists = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (emailExists) {
    return res.status(409).json({
      status: "error",
      message: "Conflict: A user with this email already exists.",
    });
  }

  // ── Create & Store User ────────────────────────────────────
  const newUser = {
    id: nextId++,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    role: role || "user", // Default role = "user"
  };

  users.push(newUser);

  // 201 Created — correct status for new resource
  res.status(201).json({
    status: "success",
    message: "User created successfully.",
    data: newUser,
  });
});

// ══════════════════════════════════════════════════════════════
//  ROUTE 5: PUT /users/:id  → Update a user
// ══════════════════════════════════════════════════════════════
app.put("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid ID format. ID must be a number.",
    });
  }

  const userIndex = users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({
      status: "error",
      message: `User with ID ${id} not found.`,
    });
  }

  const { name, email, role } = req.body;

  // Validate email if provided
  if (email && !isValidEmail(email)) {
    return res.status(400).json({
      status: "error",
      message: "Bad Request: 'email' format is invalid.",
    });
  }

  // Check duplicate email (excluding current user)
  if (email) {
    const emailExists = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== id
    );
    if (emailExists) {
      return res.status(409).json({
        status: "error",
        message: "Conflict: Another user with this email already exists.",
      });
    }
  }

  // Update only provided fields
  users[userIndex] = {
    ...users[userIndex],
    name: name ? name.trim() : users[userIndex].name,
    email: email ? email.toLowerCase().trim() : users[userIndex].email,
    role: role || users[userIndex].role,
  };

  res.status(200).json({
    status: "success",
    message: "User updated successfully.",
    data: users[userIndex],
  });
});

// ══════════════════════════════════════════════════════════════
//  ROUTE 6: DELETE /users/:id  → Delete a user
// ══════════════════════════════════════════════════════════════
app.delete("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid ID format. ID must be a number.",
    });
  }

  const userIndex = users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({
      status: "error",
      message: `User with ID ${id} not found.`,
    });
  }

  const deletedUser = users.splice(userIndex, 1)[0];

  // 200 with confirmation (or 204 No Content is also valid)
  res.status(200).json({
    status: "success",
    message: `User "${deletedUser.name}" deleted successfully.`,
    data: deletedUser,
  });
});

// ══════════════════════════════════════════════════════════════
//  ROUTE 7: Catch-all → 404 for unknown routes
// ══════════════════════════════════════════════════════════════
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── Global Error Handler (500 Internal Server Error) ────────
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({
    status: "error",
    message: "Internal Server Error. Something went wrong on the server.",
  });
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ DecodeLabs API running at http://localhost:${PORT}`);
  console.log(`📖 API Docs available at http://localhost:${PORT}/`);
});
