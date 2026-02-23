import { Request, Response, NextFunction } from "express";

// Static admin credentials
const ADMIN_USERNAME = "miyatravels";
const ADMIN_PASSWORD = "admin123@";

// Type definitions for authenticated request
declare global {
  namespace Express {
    interface Request {
      isAuthenticated?: boolean;
      user?: {
        username: string;
      };
    }
  }
}

// Session storage (in-memory for now, can be replaced with Redis)
const activeSessions = new Map<string, { username: string; createdAt: number }>();

/**
 * Login endpoint handler
 */
export function handleLogin(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    // Validate credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Create session token
      const sessionToken = generateToken();
      activeSessions.set(sessionToken, {
        username,
        createdAt: Date.now(),
      });

      // Set cookie with session token
      res.cookie("sessionToken", sessionToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: "/",
      });

      return res.status(200).json({
        message: "Login successful",
        username,
        sessionToken,
      });
    } else {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

/**
 * Logout endpoint handler
 */
export function handleLogout(req: Request, res: Response) {
  try {
    const sessionToken = req.cookies?.sessionToken;

    if (sessionToken) {
      activeSessions.delete(sessionToken);
    }

    res.clearCookie("sessionToken");
    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

/**
 * Authentication middleware
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const sessionToken = req.cookies?.sessionToken;

  if (!sessionToken) {
    req.isAuthenticated = false;
    return next();
  }

  const session = activeSessions.get(sessionToken);

  if (!session) {
    req.isAuthenticated = false;
    res.clearCookie("sessionToken");
    return next();
  }

  // Check if session is expired (24 hours)
  const sessionAge = Date.now() - session.createdAt;
  if (sessionAge > 24 * 60 * 60 * 1000) {
    activeSessions.delete(sessionToken);
    req.isAuthenticated = false;
    res.clearCookie("sessionToken");
    return next();
  }

  // Session is valid
  req.isAuthenticated = true;
  req.user = {
    username: session.username,
  };
  next();
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated) {
    return res.status(401).json({
      message: "Unauthorized - Please login first",
    });
  }
  next();
}

/**
 * Generate random session token
 */
function generateToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Check current session
 */
export function handleGetSession(req: Request, res: Response) {
  if (req.isAuthenticated && req.user) {
    return res.status(200).json({
      authenticated: true,
      username: req.user.username,
    });
  }

  return res.status(200).json({
    authenticated: false,
  });
}
