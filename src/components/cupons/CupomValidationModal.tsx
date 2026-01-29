import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Ticket } from 'lucide-react';
import CupomValidationCard from './CupomValidationCard';

interface CupomValidationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledCupomCode?: string;
  onCupomUsed?: (valorAdicionado: number) => void;
}

const CupomValidationModal: React.FC<CupomValidationModalProps> = ({
  isOpen,
  onOpenChange,
  prefilledCupomCode,
  onCupomUsed,
}) => {
  const handleCupomUsed = (valorAdicionado: number) => {
    onCupomUsed?.(valorAdicionado);
    onOpenChange(false); // Close modal after successful use
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                Aplicar Cupom
              </span>
              {prefilledCupomCode && (
                <p className="text-sm text-muted-foreground font-normal mt-1">
                  Código: {prefilledCupomCode}
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <CupomValidationCard 
            onCupomUsed={handleCupomUsed}
            prefilledCupomCode={prefilledCupomCode}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CupomValidationModal;