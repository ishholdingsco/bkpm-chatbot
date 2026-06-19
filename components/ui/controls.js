"use client";
// shadcn-style interactive primitives built on Radix, styled with the existing
// BKPM design tokens (see the `.ui-*` rules in app/midfi-styles.css). These
// replace the hand-rolled toggle/dropdown/dialog markup from the mockups while
// keeping the palette & typography. Accessibility + behavior come from Radix.

import * as RSwitch from "@radix-ui/react-switch";
import * as RDropdown from "@radix-ui/react-dropdown-menu";
import * as RDialog from "@radix-ui/react-dialog";
import * as RTooltip from "@radix-ui/react-tooltip";
import { X } from "lucide-react";

// ─── Switch (toggle) ───
// `color` overrides the "on" track color (per-layer accent on the map panel).
export function Switch({ checked, onCheckedChange, color, "aria-label": ariaLabel }) {
  return (
    <RSwitch.Root
      className="ui-switch"
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={ariaLabel}
      style={color ? { "--switch-on": color } : undefined}
    >
      <RSwitch.Thumb className="ui-switch-thumb" />
    </RSwitch.Root>
  );
}

// ─── Dropdown menu ───
// `trigger` is any element (rendered via asChild). `items` is an array of
// { label, icon: <LucideIcon/>, onSelect } or { separator: true }.
export function DropdownMenu({ trigger, items = [], align = "start", side = "bottom" }) {
  return (
    <RDropdown.Root>
      <RDropdown.Trigger asChild>{trigger}</RDropdown.Trigger>
      <RDropdown.Portal>
        <RDropdown.Content className="ui-menu" align={align} side={side} sideOffset={6}>
          {items.map((it, i) =>
            it.separator ? (
              <RDropdown.Separator key={`sep-${i}`} className="ui-menu-sep" />
            ) : (
              <RDropdown.Item
                key={it.label}
                className="ui-menu-item"
                onSelect={it.onSelect}
              >
                {it.icon && <span className="ui-menu-icon">{it.icon}</span>}
                <span>{it.label}</span>
                {it.hint && <span className="ui-menu-hint">{it.hint}</span>}
              </RDropdown.Item>
            )
          )}
        </RDropdown.Content>
      </RDropdown.Portal>
    </RDropdown.Root>
  );
}

// ─── Dialog (modal) ───
// Controlled (`open`/`onOpenChange`) or trigger-driven. `title` is required for
// a11y; pass `width` to size the panel.
export function Dialog({ open, onOpenChange, trigger, title, description, width = 460, children }) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RDialog.Trigger asChild>{trigger}</RDialog.Trigger>}
      <RDialog.Portal>
        <RDialog.Overlay className="ui-overlay" />
        {/* When there's no description, opt out of Radix's describedby warning. */}
        <RDialog.Content className="ui-dialog" style={{ width }} {...(description ? {} : { "aria-describedby": undefined })}>
          <div className="ui-dialog-head">
            <RDialog.Title className="ui-dialog-title">{title}</RDialog.Title>
            <RDialog.Close asChild>
              <button className="btn btn-ghost btn-sm ui-icon-btn" aria-label="Close">
                <X size={15} strokeWidth={1.75} />
              </button>
            </RDialog.Close>
          </div>
          {description && (
            <RDialog.Description className="ui-dialog-desc">{description}</RDialog.Description>
          )}
          {children}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

// ─── Tooltip ───
// Self-contained provider so callers can drop a <Tooltip> anywhere.
export function Tooltip({ content, children, side = "left" }) {
  return (
    <RTooltip.Provider delayDuration={200}>
      <RTooltip.Root>
        <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
        <RTooltip.Portal>
          <RTooltip.Content className="ui-tooltip" side={side} sideOffset={6}>
            {content}
            <RTooltip.Arrow className="ui-tooltip-arrow" />
          </RTooltip.Content>
        </RTooltip.Portal>
      </RTooltip.Root>
    </RTooltip.Provider>
  );
}
