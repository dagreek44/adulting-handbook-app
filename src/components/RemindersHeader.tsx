import SharedHeader from './SharedHeader';

interface RemindersHeaderProps {
  setIsFamilyModalOpen: (open: boolean) => void;
}

const RemindersHeader = ({ 
  setIsFamilyModalOpen 
}: RemindersHeaderProps) => {
  return (
    <SharedHeader
      title="Reminders"
      setIsFamilyModalOpen={setIsFamilyModalOpen}
    />
  );
};

export default RemindersHeader;
