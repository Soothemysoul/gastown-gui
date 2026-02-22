/**
 * Gas Town GUI - Tooltip Utility
 *
 * Positions tooltips properly using fixed positioning to avoid z-index issues.
 */

const TOOLTIP_POSITION_STYLE_ID = 'tooltip-position-style';
const EDGE_MARGIN_PX = 10;
const TOOLTIP_APPROX_HEIGHT_PX = 60;
const TOOLTIP_MAX_WIDTH_PX = 200;
const DYNAMIC_TOOLTIP_ID = 'dynamic-tooltip';
const DYNAMIC_TOOLTIP_MAX_WIDTH_PX = 280;

/**
 * Initialize tooltip positioning for all [data-tooltip] elements
 */
export function initTooltips() {
  // Use event delegation for tooltips
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
}

/**
 * Handle mouse over to position tooltip
 */
function handleMouseOver(e) {
  const el = e.target.closest('[data-tooltip]');
  if (!el || !el.dataset.tooltip) return;

  positionTooltip(el);
}

/**
 * Handle mouse out to hide tooltip
 */
function handleMouseOut(e) {
  const el = e.target.closest('[data-tooltip]');
  if (!el) return;
}

/**
 * Position the tooltip based on the element's position
 */
function positionTooltip(el) {
  const rect = el.getBoundingClientRect();

  // Calculate best position
  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;

  // Create a style element for this specific tooltip position
  let styleEl = document.getElementById(TOOLTIP_POSITION_STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = TOOLTIP_POSITION_STYLE_ID;
    document.head.appendChild(styleEl);
  }

  // Calculate tooltip position (prefer above, fall back to below)
  let top, left;
  const tooltipHeight = TOOLTIP_APPROX_HEIGHT_PX; // Approximate height
  const tooltipWidth = TOOLTIP_MAX_WIDTH_PX; // Max width from CSS

  if (spaceAbove > tooltipHeight + EDGE_MARGIN_PX) {
    // Position above
    top = rect.top - tooltipHeight - EDGE_MARGIN_PX;
  } else {
    // Position below
    top = rect.bottom + EDGE_MARGIN_PX;
  }

  // Center horizontally, but keep on screen
  left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
  left = Math.max(EDGE_MARGIN_PX, Math.min(left, window.innerWidth - tooltipWidth - EDGE_MARGIN_PX));

  // Apply position via CSS custom properties
  el.style.setProperty('--tooltip-top', `${top}px`);
  el.style.setProperty('--tooltip-left', `${left}px`);

  // Update the global style for ::after positioning
  styleEl.textContent = `
    [data-tooltip]:hover::after {
      top: var(--tooltip-top, auto);
      left: var(--tooltip-left, 50%);
      bottom: auto;
      transform: none;
    }
    [data-tooltip]:hover::before {
      display: none; /* Hide arrow for now since positioning is complex */
    }
  `;
}

/**
 * Manually show a tooltip at a specific position
 */
export function showTooltipAt(text, x, y) {
  const existing = document.getElementById(DYNAMIC_TOOLTIP_ID);
  if (existing) existing.remove();

  const tooltip = document.createElement('div');
  tooltip.id = DYNAMIC_TOOLTIP_ID;
  tooltip.className = 'dynamic-tooltip';
  tooltip.textContent = text;
  tooltip.style.cssText = `
    position: fixed;
    top: ${y}px;
    left: ${x}px;
    padding: 8px 12px;
    font-size: 12px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: var(--z-tooltip);
    pointer-events: none;
    max-width: ${DYNAMIC_TOOLTIP_MAX_WIDTH_PX}px;
    animation: fadeIn 0.15s ease;
  `;

  document.body.appendChild(tooltip);

  // Adjust position if off-screen
  const rect = tooltip.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    tooltip.style.left = `${window.innerWidth - rect.width - EDGE_MARGIN_PX}px`;
  }
  if (rect.bottom > window.innerHeight) {
    tooltip.style.top = `${y - rect.height - EDGE_MARGIN_PX}px`;
  }

  return tooltip;
}

/**
 * Hide dynamic tooltip
 */
export function hideTooltip() {
  const existing = document.getElementById(DYNAMIC_TOOLTIP_ID);
  if (existing) existing.remove();
}
