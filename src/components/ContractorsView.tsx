import { ArrowLeft, Briefcase, Globe, Sparkles } from 'lucide-react';

interface ContractorsViewProps {
  onBack: () => void;
  city?: string;
}

const ContractorsView = ({ onBack, city }: ContractorsViewProps) => {
  const searchLocation = city ? `local+contractors+in+${encodeURIComponent(city)}` : 'local+contractors+near+me';

  const handleFindContractors = () => {
    window.open(`https://www.google.com/search?q=${searchLocation}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center text-sage font-medium hover:text-sage-dark transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Home
      </button>

      <div className="bg-white p-6 rounded-3xl shadow-lg">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-purple-500 text-white">
            <Briefcase className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Find Local Contractors</h1>
            <p className="mt-2 text-sm text-gray-600 max-w-2xl">
              Discover local contractors who can support a new project or help you complete the reminders and tasks already on your list.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-gray-100 p-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-sage/10 text-sage mb-4">
              <Globe className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Search Locally</h2>
            <p className="text-sm text-gray-600 mt-2">
              Find contractors near you for home, garden, or personal assistance projects.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 p-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-sage/10 text-sage mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Use Your Reminders</h2>
            <p className="text-sm text-gray-600 mt-2">
              Share your existing reminder list with contractors so they understand the work and can help you get it done.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleFindContractors}
            className="w-full inline-flex items-center justify-center rounded-2xl bg-sage px-5 py-3 text-sm font-semibold text-white hover:bg-sage/90 transition-colors"
          >
            Search Local Contractors
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractorsView;
