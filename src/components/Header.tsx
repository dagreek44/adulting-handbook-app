
import { useState } from 'react';
import { Home, LogOut, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const { userProfile, signOut, createMissingUserProfile, user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  const handleCreateProfile = async () => {
    await createMissingUserProfile();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-sage p-2 rounded-lg">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Adulting</h1>
            <p className="text-sm text-gray-600">Master life's essentials</p>
          </div>
        </div>
        
        {user && (
          <div className="relative">
            {userProfile ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-sage rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userProfile.first_name.charAt(0)}{userProfile.last_name.charAt(0)}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {userProfile.first_name}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-lg transition-colors border border-orange-200"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-orange-700">
                  Setup Profile
                </span>
              </button>
            )}
            
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {userProfile ? (
                  <>
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {userProfile.first_name} {userProfile.last_name}
                      </p>
                      <p className="text-xs text-gray-500">@{userProfile.username}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-orange-700">Profile Setup Required</p>
                      <p className="text-xs text-gray-500">Complete your profile to access all features</p>
                    </div>
                    <button
                      onClick={handleCreateProfile}
                      className="w-full flex items-center px-4 py-2 text-sm text-orange-600 hover:bg-orange-50"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Create Profile
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
