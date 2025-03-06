/**
 * Linear-inspired color palette for Event Command Center
 * Provides semantic color variables for consistent usage throughout the app
 */

// Theme-based color system
export const colors = {
  // Backgrounds
  background: {
    page: {
      light: '#F7F7F9',     // Light off-white with slight blue tint
      dark: '#101014',      // Slightly warmer black than pure #000
    },
    card: {
      light: '#FFFFFF',     // Pure white for cards  
      dark: '#141419',      // Subtle card backgrounds
    },
    hover: {
      light: '#F5F5F8',     // Very light blue-gray for hover
      dark: '#1A1A21',      // Hover state
    },
    input: {
      light: '#FFFFFF',     // White background with border for inputs
      dark: '#0C0C10',      // Input fields  
    },
  },
  
  // Borders
  border: {
    subtle: {
      light: '#EBEBEF',     // Very light gray with blue tint
      dark: '#1F1F27',      // Subtle separators
    },
    strong: {
      light: '#D8D8E0',     // Light gray for stronger borders
      dark: '#2A2A35',      // More prominent borders
    },
  },
  
  // Text
  text: {
    primary: {
      light: '#111111',     // Very dark gray for primary text
      dark: '#FFFFFF',      // Headers, important text
    },
    secondary: {
      light: '#6D6D7C',     // Medium gray for secondary text
      dark: '#A9A9BC',      // Description text (warmer than gray)
    },
    tertiary: {
      light: '#8A8A96',     // Lighter gray for tertiary text
      dark: '#74748B',      // Less important text
    },
  },
  
  // Status colors - each with background (8% opacity in light, 12% in dark) and text variations
  status: {
    confirmed: {
      bg: {
        light: 'rgba(52, 199, 145, 0.08)',  
        dark: 'rgba(52, 199, 145, 0.12)',
      },
      text: {
        light: '#0F9D6D',
        dark: '#34C791',
      }
    },
    draft: {
      bg: {
        light: 'rgba(130, 130, 150, 0.08)',
        dark: 'rgba(130, 130, 150, 0.15)',
      },
      text: {
        light: '#696996',
        dark: '#AEAEBE',
      }
    },
    cancelled: {
      bg: {
        light: 'rgba(237, 107, 107, 0.08)',
        dark: 'rgba(237, 107, 107, 0.12)',
      },
      text: {
        light: '#D95353',
        dark: '#ED6B6B',
      }
    },
    pending: {
      bg: {
        light: 'rgba(246, 189, 96, 0.08)',
        dark: 'rgba(246, 189, 96, 0.12)',
      },
      text: {
        light: '#E5A43B',
        dark: '#F6BD60',
      }
    },
    inProgress: {
      bg: {
        light: 'rgba(125, 111, 255, 0.08)',
        dark: 'rgba(125, 111, 255, 0.12)',
      },
      text: {
        light: '#5F51DB',
        dark: '#7D6FFF',
      }
    }
  },
  
  // Primary action color
  primary: {
    default: {
      light: '#5E6AD2',    // Keep this recognizable across themes
      dark: '#5E6AD2',
    },
    hover: {
      light: '#4D59C3',    // Slightly darker for hover on light bg
      dark: '#6872E5',     // Lighter version for hover
    },
    active: {
      light: '#3D49B0',    // Even darker for active state on light bg
      dark: '#4F5ABF',     // Darker version for active state
    }
  }
};

/**
 * Helper function to get the color value for the current theme
 */
export function getColor(path: string, theme: 'light' | 'dark' = 'dark') {
  const parts = path.split('.');
  let result: any = colors;
  
  for (const part of parts) {
    if (result[part] === undefined) {
      console.warn(`Color path "${path}" is invalid`);
      return '';
    }
    result = result[part];
  }
  
  if (typeof result === 'string') {
    return result;
  }
  
  if (result[theme] !== undefined) {
    return result[theme];
  }
  
  console.warn(`Theme "${theme}" not found for color path "${path}"`);
  return '';
}

/**
 * Helper function to get status-based styles
 */
export function getStatusStyles(status: 'confirmed' | 'draft' | 'cancelled' | 'pending' | 'inProgress', theme: 'light' | 'dark' = 'dark') {
  return {
    background: colors.status[status]?.bg[theme] || colors.status.draft.bg[theme],
    color: colors.status[status]?.text[theme] || colors.status.draft.text[theme]
  };
} 