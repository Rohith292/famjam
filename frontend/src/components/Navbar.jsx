import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Palette, Settings, User, Trash2,TreeDeciduous } from "lucide-react";
import { useState } from "react";
import DeleteConfirmationModal from "../components/family/DeleteConfirmationModal"; // adjust path if needed

const Navbar = () => {
  const { logout, deleteAccount, authUser } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSpecialMapPath =
    location.pathname.startsWith("/share/") || location.pathname.startsWith("/map/");
  const isLoginPage = location.pathname === "/login";
  const isSignupPage = location.pathname === "/signup";

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    await deleteAccount(); // calls zustand → backend → clears auth
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-all"
            >
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <TreeDeciduous className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">FamJam</h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Show "Back to My Map" button */}
            {authUser && isSpecialMapPath && (
              <button
                onClick={() => navigate("/")}
                className="btn btn-sm gap-2 transition-colors btn-outline btn-info"
              >
                Back to My Map
              </button>
            )}

            <Link to={"/settings"} className="btn btn-sm gap-2 transition-colors">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Themes</span>
            </Link>

            {authUser ? (
              <>
                <Link to={"/profile"} className="btn btn-sm gap-2">
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button className="flex gap-2 items-center btn btn-sm" onClick={logout}>
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>

                <button
                  className="flex gap-2 items-center btn btn-sm "
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  <Trash2 className="size-5" />
                  <span className="hidden sm:inline">Delete Account</span>
                </button>

                {/* Confirmation Modal */}
                <DeleteConfirmationModal
                  isOpen={isDeleteModalOpen}
                  onClose={() => setIsDeleteModalOpen(false)}
                  memberName={authUser?.fullName || "your account"}
                  onConfirm={handleDeleteConfirm}
                  isDeleting={isDeleting}
                />
              </>
            ) : (
              <>
                {!isLoginPage && (
                  <Link to="/login" className="btn btn-sm gap-2">
                    Login
                  </Link>
                )}
                {!isSignupPage && (
                  <Link to="/signup" className="btn btn-sm gap-2">
                    Sign Up
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
