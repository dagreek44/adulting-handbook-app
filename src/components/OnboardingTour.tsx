import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
  action?: () => void;
  waitForClick?: boolean;
}

interface OnboardingTourProps {
  isActive: boolean;
  onComplete: () => void;
  currentTab: string;
  onNavigate: (tab: string) => void;
}

const OnboardingTour = ({ isActive, onComplete, currentTab, onNavigate }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const steps: TourStep[] = [
    {
      target: '[data-tour="upcoming-tasks"]',
      title: 'Upcoming Tasks',
      description: 'Click here to view and manage all your upcoming reminders and tasks.',
      waitForClick: true,
    },
    {
      target: '[data-tour="edit-reminders"]',
      title: '+/- Adult Reminders',
      description: 'Add a series of common adulting reminders for your home and life.',
      waitForClick: true,
    },
    {
      target: '[data-tour="family-button"]',
      title: 'Family',
      description: 'Add your family members to track and assign reminders to each other.',
      waitForClick: false,
    },
  ];

  useEffect(() => {
    if (!isActive) {
      setIsVisible(false);
      return;
    }

    // Delay to let the DOM render
    const timer = setTimeout(() => {
      updateTargetPosition();
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [isActive, currentStep, currentTab]);

  useEffect(() => {
    const handleResize = () => updateTargetPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentStep]);

  const updateTargetPosition = () => {
    const step = steps[currentStep];
    if (!step) return;

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      
      // Navigate if needed for next step
      if (currentStep === 0) {
        onNavigate('reminders');
      }
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only handle clicks on the highlighted area if waitForClick is true
    if (steps[currentStep]?.waitForClick && targetRect) {
      const clickX = e.clientX;
      const clickY = e.clientY;
      
      if (
        clickX >= targetRect.left &&
        clickX <= targetRect.right &&
        clickY >= targetRect.top &&
        clickY <= targetRect.bottom
      ) {
        handleNext();
      }
    }
  };

  if (!isActive || !isVisible) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100]" onClick={handleOverlayClick}>
      {/* Dark overlay with hole for highlighted element */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Highlight border around target */}
      {targetRect && (
        <div
          className="absolute border-2 border-primary rounded-xl pointer-events-none animate-pulse"
          style={{
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Tooltip */}
      {targetRect && (
        <div
          className="absolute bg-white rounded-xl shadow-2xl p-4 max-w-xs z-[101]"
          style={{
            left: Math.min(targetRect.left, window.innerWidth - 280),
            top: targetRect.bottom + 16,
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-gray-900">{step.title}</h3>
            <Button variant="ghost" size="sm" onClick={handleSkip} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-gray-600 text-sm mb-4">{step.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              {currentStep + 1} of {steps.length}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip Tour
              </Button>
              {!step.waitForClick && (
                <Button size="sm" onClick={handleNext}>
                  {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                </Button>
              )}
              {step.waitForClick && (
                <span className="text-xs text-primary font-medium self-center">
                  Click to continue →
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingTour;
