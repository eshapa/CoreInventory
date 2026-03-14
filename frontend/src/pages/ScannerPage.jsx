import * as React from "react";
import { useState } from "react";
import { 
  Camera, 
  Package, 
  MapPin, 
  Layers, 
  ArrowDownToLine, 
  Truck, 
  ArrowRightLeft, 
  SlidersHorizontal 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScannerPage() {
  const [scanned, setScanned] = useState(false);

  return (
    <div className="space-y-6 max-w-lg mx-auto animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">QR / Barcode Scanner</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Scan product codes for quick actions
        </p>
      </div>

      {/* Camera Window / Scan Simulation Area */}
      <div
        className="glass-card rounded-2xl overflow-hidden aspect-square flex items-center justify-center cursor-pointer relative border-2 border-transparent hover:border-primary/20 transition-all shadow-xl"
        onClick={() => setScanned(true)}
      >
        {!scanned ? (
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground font-medium">Tap to simulate scan</p>
            <p className="text-xs text-muted-foreground mt-1">
              Point camera at QR or barcode
            </p>
            
            {/* Corner Bracket Overlays for "Scanner" look */}
            <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-primary/40 rounded-tl-lg" />
            <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-primary/40 rounded-tr-lg" />
            <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-primary/40 rounded-bl-lg" />
            <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-primary/40 rounded-br-lg" />
            
            {/* Scan Line Animation */}
            <div className="absolute left-0 right-0 h-[2px] bg-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.5)] animate-[scan_3s_linear_infinite]" 
                 style={{ top: '50%' }} />
          </div>
        ) : (
          <div className="w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-lg bg-green-500/10">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-green-600 font-semibold tracking-wide uppercase">
                  Product Found
                </p>
                <h3 className="font-bold text-foreground text-lg">Steel Bolts M10</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/40 rounded-lg p-3 border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">SKU</p>
                <p className="font-mono font-semibold text-sm">SB-M10-001</p>
              </div>
              <div className="bg-secondary/40 rounded-lg p-3 border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Current Stock</p>
                <p className="font-semibold text-sm">450 boxes</p>
              </div>
              <div className="bg-secondary/40 rounded-lg p-3 flex items-center gap-2 border border-border/50">
                <MapPin className="w-3.5 h-3.5 text-primary/60" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Location</p>
                  <p className="font-semibold text-sm">A-12-3</p>
                </div>
              </div>
              <div className="bg-secondary/40 rounded-lg p-3 flex items-center gap-2 border border-border/50">
                <Layers className="w-3.5 h-3.5 text-primary/60" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Warehouse</p>
                  <p className="font-semibold text-sm">WH-A</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button size="sm" className="gap-2">
                <ArrowDownToLine className="w-4 h-4" /> Receive
              </Button>
              <Button size="sm" variant="outline" className="gap-2">
                <Truck className="w-4 h-4" /> Deliver
              </Button>
              <Button size="sm" variant="outline" className="gap-2">
                <ArrowRightLeft className="w-4 h-4" /> Transfer
              </Button>
              <Button size="sm" variant="outline" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Adjust
              </Button>
            </div>

            <Button 
              variant="secondary" 
              className="w-full mt-2" 
              onClick={(e) => {
                e.stopPropagation(); // Prevent re-triggering scan on click
                setScanned(false);
              }}
            >
              Scan Another
            </Button>
          </div>
        )}
      </div>
      
      <p className="text-center text-xs text-muted-foreground">
        Secure scanning powered by CoreInventory Lens
      </p>
    </div>
  );
}