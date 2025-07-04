import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ServiceOption {
  key: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  href?: string; // Optional navigation path for modular routing
}

interface ServiceSelectionModalProps {
  open: boolean;
  onClose: () => void;
  services: ServiceOption[];
  onSelect: (service: ServiceOption) => void;
}

export function ServiceSelectionModal({ open, onClose, services, onSelect }: ServiceSelectionModalProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, service: ServiceOption) => {
    if (e.key === "Enter" || e.key === " ") {
      onSelect(service);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select a Service</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {services.map((service) => (
            <div
              key={service.key}
              tabIndex={0}
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => onSelect(service)}
              onKeyDown={(e) => handleKeyDown(e, service)}
              role="button"
              aria-label={`Select ${service.name}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {service.icon}
                <span className="font-semibold text-lg">{service.name}</span>
              </div>
              <div className="text-gray-600 text-sm">{service.description}</div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
