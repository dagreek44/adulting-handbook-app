
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

const Header = () => {
  const { signOut, user } = useAuth();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Adulting</h1>
          <p className="text-sm text-gray-600">Because life doesn't come with a manual</p>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <span className="text-sm text-gray-600">
                Welcome back!
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
