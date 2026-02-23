import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login, loading, error, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!username || !password) {
      setLocalError("Username and password are required");
      return;
    }

    try {
      await login(username, password);
      // Navigation will happen via the useEffect hook above
    } catch (err) {
      // Error is already set by the login function
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex-col justify-between p-8">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <img
              src="https://miyatravels.com/logo.png"
              alt="MiyaTravels Logo"
              className="h-10 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <div className="text-lg font-bold text-white">MiyaTravels</div>
              <div className="text-blue-100 text-xs font-medium">Agency Management</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Welcome to MiyaTravels Admin
          </h1>
          <p className="text-blue-100 text-base mb-6">
            Manage your travel bookings, services, and operations with ease.
          </p>
        </div>
        <div className="space-y-3 border-t border-blue-400 pt-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Fast & Reliable</p>
              <p className="text-blue-100 text-xs">Secure access to all your data</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Highly Secure</p>
              <p className="text-blue-100 text-xs">Protected with enterprise-grade security</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <CardContent className="p-6">
            {/* Logo */}
            <div className="mb-6 text-center">
              <div className="flex justify-center mb-4">
                <img
                  src="https://miyatravels.com/logo.png"
                  alt="MiyaTravels Logo"
                  className="h-14 w-auto max-w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">MiyaTravels</h1>
              <p className="text-teal-600 text-xs font-medium">Agency Management</p>
            </div>

            {/* Heading */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-gray-600 text-xs mt-1">Sign in to manage your travel services</p>
            </div>

            {/* Error Alert */}
            {(error || localError) && (
              <Alert variant="destructive" className="mb-4 border-red-300 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2 text-sm">{error || localError}</AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-xs font-semibold text-gray-700">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 rounded-lg transition hover:shadow-lg disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-5 pt-5 border-t border-gray-200 text-center">
              <p className="text-gray-600 text-xs">
                © 2026 MiyaTravels. <span className="text-gray-400">All rights reserved.</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
