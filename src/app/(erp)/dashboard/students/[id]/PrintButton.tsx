"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PrintButton() {
  return (
    <Button variant="gold" onClick={() => window.print()} className="print:hidden">
      <Printer size={16} /> Print ID card
    </Button>
  );
}
