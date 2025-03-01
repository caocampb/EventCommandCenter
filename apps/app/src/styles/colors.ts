/**
 * Linear-inspired color palette for Event Command Center
 * Provides semantic color variables for consistent usage throughout the app
 */

export const colors = {
  // Backgrounds
  background: {
    page: '#101014',      // Slightly warmer black than pure #000
    card: '#141419',      // Subtle card backgrounds
    hover: '#1A1A21',     // Hover state
    input: '#0C0C10',     // Input fields  
  },
  
  // Borders
  border: {
    subtle: '#1F1F27',    // Subtle separators
    strong: '#2A2A35',    // More prominent borders
  },
  
  // Text
  text: {
    primary: '#FFFFFF',   // Headers, important text
    secondary: '#A9A9BC', // Description text (warmer than gray)
    tertiary: '#74748B',  // Less important text
  },
  
  // Status colors - each with background (10% opacity) and text variations
  status: {
    confirmed: {
      bg: 'rgba(52, 199, 145, 0.12)',  // #34C791 with opacity
      text: '#34C791'                  // Mint green
    },
    draft: {
      bg: 'rgba(130, 130, 150, 0.15)',  // #828296 with opacity
      text: '#AEAEBE'                   // Neutral warm gray
    },
    cancelled: {
      bg: 'rgba(237, 107, 107, 0.12)',  // #ED6B6B with opacity
      text: '#ED6B6B'                   // Soft red
    },
    pending: {
      bg: 'rgba(246, 189, 96, 0.12)',   // #F6BD60 with opacity
      text: '#F6BD60'                   // Warm amber
    },
    inProgress: {
      bg: 'rgba(125, 111, 255, 0.12)',  // #7D6FFF with opacity
      text: '#7D6FFF'                   // Medium purple
    }
  },
  
  // Primary action color
  primary: {
    default: '#5E6AD2',   // Purple
    hover: '#6872E5',     // Lighter version for hover
    active: '#4F5ABF'     // Darker version for active state
  }
};

/**
 * Helper function to get status-based styles
 */
export function getStatusStyles(status: 'confirmed' | 'draft' | 'cancelled' | 'pending' | 'inProgress') {
  return {
    background: colors.status[status]?.bg || colors.status.draft.bg,
    color: colors.status[status]?.text || colors.status.draft.text
  };
} 