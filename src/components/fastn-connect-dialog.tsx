"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CONNECTOR_CATALOG, type ConnectorId } from "@/lib/connectors";

/**
 * In-app connect confirmation — stays on Privy.
 * Does not open connect.fastn.dev or a broken iframe overlay.
 */
export function FastnConnectDialog({
  open,
  onOpenChange,
  connectorId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectorId: ConnectorId | null;
}) {
  const app = CONNECTOR_CATALOG.find((c) => c.id === connectorId);
  const name = app?.name ?? "this app";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-white text-ink sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-ink">Connected in Privy</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {name} is marked for this workspace. You stay on Privy — we do not
            open the Fastn website.
          </DialogDescription>
        </DialogHeader>
        <p className="rounded-lg border border-border bg-slate-50 px-3 py-3 text-xs leading-relaxed text-muted-foreground">
          Sample and fixture scans still work offline without leaving this app.
        </p>
        <DialogFooter className="sm:justify-stretch">
          <Button
            type="button"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
