
import { useState } from 'react';
import { ArrowLeft, Home, DollarSign, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const PostJob = () => {
  const [formData, setFormData] = useState({
    squareFootage: '',
    description: '',
    budget: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.squareFootage || !formData.description || !formData.budget) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Job Posted Successfully! 🎉",
      description: "We'll match you with qualified contractors in your area.",
      duration: 3000,
    });

    // Reset form
    setFormData({
      squareFootage: '',
      description: '',
      budget: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        {/* Header */}
        <div className="bg-sage text-white p-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => window.history.back()}
              className="p-2 hover:bg-sage-light/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Post a Job</h1>
          </div>
        </div>

        {/* Form */}
        <div className="p-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Home className="w-8 h-8 text-sage" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Tell us about your project</h2>
              <p className="text-gray-600 text-sm">Get matched with qualified contractors in your area</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Square Footage */}
              <div>
                <label htmlFor="squareFootage" className="block text-sm font-medium text-gray-700 mb-2">
                  Room Size (Square Feet) *
                </label>
                <Input
                  id="squareFootage"
                  type="number"
                  placeholder="e.g. 150"
                  value={formData.squareFootage}
                  onChange={(e) => handleInputChange('squareFootage', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Job Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <Textarea
                  id="description"
                  placeholder="Describe what work needs to be done, materials needed, timeline, etc."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full h-32 resize-none"
                />
              </div>

              {/* Budget */}
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Budget *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="budget"
                    type="text"
                    placeholder="e.g. 500-1000"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    className="w-full pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter a range or specific amount</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-sage text-white py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors"
              >
                Post Job & Get Quotes
              </button>
            </form>

            {/* Additional Info */}
            <div className="mt-6 p-4 bg-blue-soft/10 rounded-lg">
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">What happens next?</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• We'll match you with 3-5 qualified contractors</li>
                    <li>• Contractors will reach out within 24 hours</li>
                    <li>• Compare quotes and choose the best fit</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJob;
