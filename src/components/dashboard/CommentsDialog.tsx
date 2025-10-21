import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
}

export const CommentsDialog = ({ open, onOpenChange, planId }: CommentsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-white p-12">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-6 w-6" />
          <span className="sr-only">Close</span>
        </button>

        <div className="space-y-8">
          <DialogHeader>
            <DialogTitle className="text-4xl font-bold text-foreground">
              Comentários
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-muted/50 rounded-xl p-6 min-h-[200px]">
              <p className="text-foreground/80 text-base whitespace-pre-wrap">
                {/* Comments will be loaded from database */}
                Nenhum comentário disponível.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
