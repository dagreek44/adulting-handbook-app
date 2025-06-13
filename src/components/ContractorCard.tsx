import { Star, MapPin, Wrench } from 'lucide-react';

interface ContractorCardProps {
  name: string;
  specialty: string;
  rating: number;
  location: string;
  priceRange: string;
  completedJobs: number;
  imageUrl?: string;
}

const ContractorCard = ({ 
  name, 
  specialty, 
  rating, 
  location, 
  priceRange, 
  completedJobs,
  imageUrl 
}: ContractorCardProps) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer">
      <div className="flex items-start space-x-3 mb-3">
        <div className="w-12 h-12 bg-sage rounded-full flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <Wrench className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-800">{name}</h3>
          <p className="text-sage text-sm font-medium">{specialty}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center mb-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm font-medium">{rating}</span>
          </div>
          <span className="text-xs text-gray-500">{completedJobs} jobs</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center text-gray-500">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">{location}</span>
        </div>
        <div className="flex items-center text-sage font-semibold">
          <DollarSign className="w-4 h-4" />
          <span className="text-sm">{priceRange}</span>
        </div>
      </div>
      
      <button className="w-full mt-3 bg-sage text-white py-2 rounded-lg font-medium hover:bg-sage/90 transition-colors">
        Request Quote
      </button>
    </div>
  );
};

export default ContractorCard;
