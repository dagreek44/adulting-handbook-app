import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
  requiresClick?: boolean;
  action?: string;
}

interface OnboardingTourProps {
  isActive: boolean;
  onComplete: () => void;
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenFamily?: () => void;
  isEditMode?: boolean;
  setIsEditMode?: (mode: boolean) => void;
}

const OnboardingTour = ({ 
  isActive, 
  onComplete, 
  currentTab, 
  onNavigate,
  onOpenFamily,
  isEditMode,
  setIsEditMode
}: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [waitingForFamilyClose, setWaitingForFamilyClose] = useState(false);
  const observerRef = useRef<MutationObserver | null>(null);

  const steps: TourStep[] = [
    {
      target: '[data-tour="reminders-tab"]',
      title: 'Reminders',
      description: 'Click here to view and manage your reminders.',
      requiresClick: true,
      action: 'navigate-reminders',
    },
    {
      target: '[data-tour="family-button"]',
      title: 'Family',
      description: 'Add your family members to share and assign reminders.',
      requiresClick: true,
      action: 'open-family',
    },
    {
      target: '[data-tour="edit-reminders"]',
      title: '+/- Adulting Reminders',
      description: 'Browse and enable default reminders for your home and life.',
      requiresClick: true,
      action: 'complete',
    },
  ];

  const scrollToElement = useCallback((element: Element) => {
    const rect = element.getBoundingClientRect();
    const isInViewport = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
    
    if (!isInViewport) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const updateTargetPosition = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;

    const element = document.querySelector(step.target);
    if (element) {
      scrollToElement(element);
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
      }, 100);
    } else {
      setTargetRect(null);
    }
  }, [currentStep, scrollToElement]);

  // Watch for family modal close
  useEffect(() => {
    if (!waitingForFamilyClose) return;

    const checkFamilyModal = () => {
      const familyModal = document.querySelector('[data-tour="family-modal"]');
      if (!familyModal) {
        setWaitingForFamilyClose(false);
        setCurrentStep(2); // Move to step 3
        setTimeout(updateTargetPosition, 300);
      }
    };

    const interval = setInterval(checkFamilyModal, 200);
    return () => clearInterval(interval);
  }, [waitingForFamilyClose, updateTargetPosition]);

  useEffect(() => {
    if (!isActive || waitingForFamilyClose) {
      if (!waitingForFamilyClose) setIsVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      updateTargetPosition();
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [isActive, currentStep, currentTab, isEditMode, updateTargetPosition, waitingForFamilyClose]);

  useEffect(() => {
    if (!isActive || !isVisible || waitingForFamilyClose) return;

    const handleUpdate = () => {
      requestAnimationFrame(() => {
        updateTargetPosition();
      });
    };
    
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);
    
    observerRef.current = new MutationObserver(handleUpdate);
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    
    const interval = setInterval(handleUpdate, 200);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      clearInterval(interval);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isActive, isVisible, updateTargetPosition, waitingForFamilyClose]);

  const handleNext = () => {
    const step = steps[currentStep];
    
    switch (step?.action) {
      case 'navigate-reminders':
        onNavigate('reminders');
        setCurrentStep(1);
        setTimeout(updateTargetPosition, 300);
        break;
      case 'open-family':
        if (onOpenFamily) {
          onOpenFamily();
          setWaitingForFamilyClose(true);
          setIsVisible(false);
        }
        break;
      case 'complete':
        if (setIsEditMode) setIsEditMode(true);
        onComplete();
        return;
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (targetRect) {
      const clickX = e.clientX;
      const clickY = e.clientY;
      
      if (
        clickX >= targetRect.left - 8 &&
        clickX <= targetRect.right + 8 &&
        clickY >= targetRect.top - 8 &&
        clickY <= targetRect.bottom + 8
      ) {
        handleNext();
      }
    }
  };

  if (!isActive || !isVisible || waitingForFamilyClose) return null;

  const step = steps[currentStep];

  const getTooltipPosition = () => {
    if (!targetRect) return { left: 20, top: 100 };
    
    const tooltipWidth = 280;
    const tooltipHeight = 150;
    const padding = 16;
    
    let left = targetRect.left;
    let top = targetRect.bottom + padding;
    
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }
    
    if (top + tooltipHeight > window.innerHeight - padding) {
      top = targetRect.top - tooltipHeight - padding;
    }
    
    return { left, top };
  };

  const tooltipPos = getTooltipPosition();

  return (
    <div className="fixed inset-0 z-[100]" onClick={handleOverlayClick}>
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

      {targetRect && (
        <div
          className="fixed border-2 border-primary rounded-xl pointer-events-none animate-pulse"
          style={{
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {targetRect && (
        <div
          className="fixed bg-white rounded-xl shadow-2xl p-4 max-w-xs z-[101]"
          style={{
            left: tooltipPos.left,
            top: tooltipPos.top,
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
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip Tour
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingTour;
