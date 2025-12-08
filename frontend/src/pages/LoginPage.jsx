import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare ,Users, Image,GitBranch, Settings} from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="h-screen  grid grid-cols-3">
      {/* Left Side - Form */}
      <div className="flex justify-center items-center bg-base-100 ">
        <div className="w-full max-w-md p-6 sm:p-12">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20
              transition-colors"
              >
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Welcome Back</h1>
              <p className="text-base-content/60">Sign in to your account</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type="email"
                  className={`input input-bordered w-full pl-10`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input input-bordered w-full pl-10`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-base-content/40" />
                  ) : (
                    <Eye className="h-5 w-5 text-base-content/40" />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-base-content/60">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="link link-primary">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Pattern */}
      <AuthImagePattern
        title={"Welcome back!"}
        subtitle={"Sign in to continue your conversations and catch up with your messages."}
      />

      {/* Right Side - Features */}
<div className="bg-gradient-to-br from-primary/5 via-base-200 to-base-100 flex flex-col justify-center p-12 space-y-8">
  <h2 className="text-3xl font-bold text-base-content mb-4">
    Why join FamJam?
  </h2>
  <div className="grid gap-6">
    {/* Feature 1 */}
    <div className="flex items-start gap-4 p-4 rounded-xl bg-base-100 shadow hover:shadow-md transition">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Users className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold">Family Groups</h3>
        <p className="text-sm opacity-70">
          Create or join family groups to stay connected.
        </p>
      </div>
    </div>

    {/* Feature 2 */}
    <div className="flex items-start gap-4 p-4 rounded-xl bg-base-100 shadow hover:shadow-md transition">
      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
        <GitBranch className="h-6 w-6 text-success" />
      </div>
      <div>
        <h3 className="font-semibold">Family Trees</h3>
        <p className="text-sm opacity-70">
          Visualize and explore your family lineage interactively.
        </p>
      </div>
    </div>

    {/* Feature 3 */}
    <div className="flex items-start gap-4 p-4 rounded-xl bg-base-100 shadow hover:shadow-md transition">
      <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
        <Image className="h-6 w-6 text-info" />
      </div>
      <div>
        <h3 className="font-semibold">Photo Albums</h3>
        <p className="text-sm opacity-70">
          Upload and share memorable moments with your family.
        </p>
      </div>
    </div>

    {/* Feature 4 */}
    <div className="flex items-start gap-4 p-4 rounded-xl bg-base-100 shadow hover:shadow-md transition">
      <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
        <Settings className="h-6 w-6 text-warning" />
      </div>
      <div>
        <h3 className="font-semibold">Simple Management</h3>
        <p className="text-sm opacity-70">
          Manage members, roles, and permissions with ease.
        </p>
      </div>
    </div>
  </div>
</div>

    </div>
  );
};
export default LoginPage;
