import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { ModalActions } from './ModalActions';

export interface UnsavedChangesDialogProps {
  id: string;
  isOpen: boolean;
  language: 'bn' | 'en';
  onKeepEditing: () => void;
  onDiscard: () => void;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  id,
  isOpen,
  language,
  onKeepEditing,
  onDiscard,
}) => (
  <Modal
    id={id}
    isOpen={isOpen}
    onClose={onKeepEditing}
    closeOnBackdrop={false}
    closeOnEscape={true}
    maxWidth="sm"
    zIndexClass="z-[70]"
    language={language}
    title={language === 'bn' ? 'অসম্পূর্ণ তথ্য বাতিল করবেন?' : 'Discard unsaved information?'}
    description={
      language === 'bn'
        ? 'এখন বন্ধ করলে এই ফর্মে লেখা তথ্য সংরক্ষিত থাকবে না।'
        : 'If you close now, the information entered in this form will not be saved.'
    }
    headerIcon={<AlertTriangle className="w-5 h-5" aria-hidden="true" />}
    showCloseButton={false}
    footer={
      <ModalActions
        primary={{
          id: `${id}-discard-btn`,
          type: 'button',
          variant: 'destructive',
          size: 'md',
          onClick: onDiscard,
          label: language === 'bn' ? 'তথ্য বাতিল করুন' : 'Discard and close',
        }}
        secondary={{
          id: `${id}-keep-editing-btn`,
          type: 'button',
          size: 'md',
          onClick: onKeepEditing,
          label: language === 'bn' ? 'সম্পাদনা চালিয়ে যান' : 'Keep editing',
        }}
      />
    }
  >
    <p className="type-body text-ui-content-secondary">
      {language === 'bn'
        ? 'আপনি ফিরে গিয়ে তথ্য দেওয়া চালিয়ে যেতে পারেন, অথবা লেখা তথ্য মুছে ফর্মটি বন্ধ করতে পারেন।'
        : 'You can return to the form and continue editing, or discard the entered information and close it.'}
    </p>
  </Modal>
);
