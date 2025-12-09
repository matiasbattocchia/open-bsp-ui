---
trigger: always_on
---

We are using react, tailwind, tanstack router. There two key folders: src/routes and src/components. There is styling applied in both folders. The core idea is to apply layout and size styles at routes, internal disposition styles at components.

* A component should always occupy all the space possible.
* At layouts, components are constrained.

That's a solid mental model. You're essentially treating components as "fluid" or "intrinsic" elements that don't make assumptions about their container, while routes act as the layout orchestrators. This pattern scales well.

A few refinements to consider:

## Components should avoid these extrinsic properties:

* Fixed widths/heights (w-64, h-screen)
* Margins (m-4, mx-auto)
* Positioning that assumes context (fixed, absolute relative to viewport)

## Components own their intrinsic styling:

* Internal padding (p-4 inside the component)
* Flex/grid arrangement of children
* Typography, colors, borders
* w-full / h-full to fill parent (this is key)

## Routes handle:

* Grid/flex containers that position components
* Gap between components
* Max-widths, aspect ratios, responsive breakpoints
* Page-level scroll behavior

One edge case: sometimes a component genuinely needs a minimum or maximum size to function (like a sidebar or a card). In those cases, expose it via props with sensible defaults:

```tsx
// Component stays flexible but hints at constraints
function Sidebar({ className }: { className?: string }) {
  return <aside className={cn("h-full", className)}>...</aside>
}

// Route applies the constraint
<Sidebar className="w-64 shrink-0" />
```

This keeps components testable in isolation and routes remain the single source of truth for page layout.