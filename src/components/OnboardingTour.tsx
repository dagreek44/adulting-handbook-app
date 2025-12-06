import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
  requiresClick?: boolean;
  action?: string; // 'navigate' | 'click' | 'expand'
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

  const steps: TourStep[] = [
    {
      target: '[data-tour="upcoming-tasks"]',
      title: 'Upcoming Tasks',
      description: 'Click here to view and manage all your upcoming reminders and tasks.',
      requiresClick: true,
      action: 'navigate-reminders',
    },
    {
      target: '[data-tour="edit-reminders"]',
      title: '+/- Adulting Reminders',
      description: 'Add a series of common adulting reminders for your home and life.',
      requiresClick: true,
      action: 'open-edit-mode',
    },
    {
      target: '[data-tour="category-Household"]',
      title: 'Household Category',
      description: 'Expand this category to see household maintenance reminders.',
      requiresClick: true,
      action: 'expand-household',
    },
    {
      target: '[data-tour="subcategory-Safety"]',
      title: 'Safety Subcategory',
      description: 'Expand the Safety section to see important safety reminders.',
      requiresClick: true,
      action: 'expand-safety',
    },
    {
      target: '[data-tour="reminder-smoke-detectors"]',
      title: 'Test Smoke Detectors',
      description: 'Enable this reminder to stay safe! Click the checkbox to add it.',
      requiresClick: true,
      action: 'enable-reminder',
    },
    {
      target: '[data-tour="done-button"]',
      title: 'Save Your Reminders',
      description: 'Click Done to save your enabled reminders.',
      requiresClick: true,
      action: 'click-done',
    },
    {
      target: '[data-tour="family-button"]',
      title: 'Family',
      description: 'Add your family members to track and assign reminders to each other.',
      requiresClick: true,
      action: 'open-family',
    },
    {
      target: '[data-tour="invite-family"]',
      title: 'Invite Family Member',
      description: 'Click here to invite a family member to your household.',
      requiresClick: true,
      action: 'complete',
    },
  ];

  const updateTargetPosition = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isActive) {
      setIsVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      updateTargetPosition();
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [isActive, currentStep, currentTab, isEditMode, updateTargetPosition]);

  // Update position on scroll and resize
  useEffect(() => {
    if (!isActive || !isVisible) return;

    const handleUpdate = () => updateTargetPosition();
    
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);
    
    // Poll for position changes (handles animations and dynamic content)
    const interval = setInterval(handleUpdate, 100);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      clearInterval(interval);
    };
  }, [isActive, isVisible, updateTargetPosition]);

  const handleNext = () => {
    const step = steps[currentStep];
    
    // Perform action based on step
    switch (step?.action) {
      case 'navigate-reminders':
        onNavigate('reminders');
        break;
      case 'open-edit-mode':
        if (setIsEditMode) setIsEditMode(true);
        break;
      case 'expand-household':
        // Click the Household category button
        const householdBtn = document.querySelector('[data-tour="category-Household"]');
        if (householdBtn) (householdBtn as HTMLElement).click();
        break;
      case 'expand-safety':
        // Click the Safety subcategory button
        const safetyBtn = document.querySelector('[data-tour="subcategory-Safety"]');
        if (safetyBtn) (safetyBtn as HTMLElement).click();
        break;
      case 'enable-reminder':
        // Click the smoke detector checkbox
        const checkbox = document.querySelector('[data-tour="reminder-smoke-detectors"] input[type="checkbox"]');
        if (checkbox) (checkbox as HTMLElement).click();
        break;
      case 'click-done':
        const doneBtn = document.querySelector('[data-tour="done-button"]');
        if (doneBtn) (doneBtn as HTMLElement).click();
        break;
      case 'open-family':
        if (onOpenFamily) onOpenFamily();
        break;
      case 'complete':
        onComplete();
        return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Check if click is within the highlighted area
    if (targetRect) {
      const clickX = e.clientX;
      const clickY = e.clientY;
      
      if (
        clickX >= targetRect.left - 8 &&
        clickX <= targetRect.right + 8 &&
        clickY >= targetRect.top - 8 &&
        clickY <= targetRect.bottom + 8
      ) {
        // User clicked on the highlighted element, advance tour
        handleNext();
      }
    }
  };

  if (!isActive || !isVisible) return null;

  const step = steps[currentStep];

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!targetRect) return { left: 20, top: 100 };
    
    const tooltipWidth = 280;
    const tooltipHeight = 150;
    const padding = 16;
    
    let left = targetRect.left;
    let top = targetRect.bottom + padding;
    
    // Keep tooltip within viewport horizontally
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }
    
    // If tooltip would go off bottom, show above target
    if (top + tooltipHeight > window.innerHeight - padding) {
      top = targetRect.top - tooltipHeight - padding;
    }
    
    return { left, top };
  };

  const tooltipPos = getTooltipPosition();

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
          className="fixed border-2 border-primary rounded-xl pointer-events-none animate-pulse"
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
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip Tour
              </Button>
              <Button size="sm" onClick={handleNext}>
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingTour;
