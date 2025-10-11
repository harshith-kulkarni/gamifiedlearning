# Flashcard Layout Controls

## Overview
The flashcard viewer now includes comprehensive layout controls similar to PDF viewers, allowing users to customize the appearance and size of flashcards for optimal readability and comfort.

## Features

### 🎛️ Layout Control Panel
- **Toggle Button**: Click "Layout" in the header to open/close controls
- **Compact Mode**: Quick toggle between normal and compact views
- **Real-time Updates**: Changes apply instantly without page refresh
- **Persistent Settings**: Layout preferences are saved to localStorage

### 📏 Adjustable Parameters

#### Card Height
- **Range**: 300px - 700px
- **Default**: 500px
- **Use Case**: Adjust for different screen sizes and content lengths

#### Card Width
- **Range**: 60% - 100% of available space
- **Default**: 100%
- **Use Case**: Create narrower cards for better focus or wider for more content

#### Font Size
- **Range**: 70% - 150% scaling
- **Default**: 100%
- **Use Case**: Improve readability for different users and devices

#### Spacing/Padding
- **Range**: 50% - 150% of default
- **Default**: 100%
- **Use Case**: Adjust whitespace for better visual comfort

### ⌨️ Keyboard Shortcuts

#### Navigation & Actions
- `←/→` - Navigate between cards
- `Space` - Flip card
- `Esc` - Back to PDF
- `Ctrl+S` - Save marked cards
- `Ctrl+K` - Mark as known
- `Ctrl+R` - Mark for review

#### Layout Controls
- `Ctrl+L` - Toggle layout controls panel
- `Ctrl+C` - Toggle compact mode
- `Ctrl+/Ctrl+-` - Increase/decrease font size

### 🎨 Visual Enhancements

#### Dynamic Styling
- Cards resize smoothly with animations
- Text scales proportionally
- Spacing adjusts automatically
- Maintains aspect ratios

#### Responsive Design
- Works on all screen sizes
- Touch-friendly controls
- Mobile-optimized sliders
- Accessible button sizes

## Usage Examples

### For Small Screens
```
Height: 350px
Width: 90%
Font Size: 85%
Spacing: 75%
Compact: On
```

### For Large Displays
```
Height: 600px
Width: 80%
Font Size: 120%
Spacing: 125%
Compact: Off
```

### For Accessibility
```
Height: 500px
Width: 100%
Font Size: 150%
Spacing: 150%
Compact: Off
```

## Technical Implementation

### State Management
- Uses React useState with localStorage persistence
- Memoized calculations for performance
- Optimized re-renders with useCallback

### Dynamic Styles
- CSS-in-JS for real-time updates
- Calculated styles based on settings
- Smooth transitions and animations

### Performance
- Debounced slider updates
- Memoized style calculations
- Efficient DOM updates

## Components

### Main Components
- `FlashcardViewer` - Enhanced with layout controls
- `FlashcardLayoutDemo` - Demonstration component
- `FlashcardViewerTest` - Testing component

### UI Elements
- Radix UI Slider components
- Custom control buttons
- Responsive grid layout
- Accessible form controls

## Browser Support
- Modern browsers with CSS Grid support
- localStorage for settings persistence
- Touch events for mobile devices
- Keyboard navigation support

## Future Enhancements
- Theme-based presets
- Export/import settings
- Advanced typography controls
- Animation speed controls
- Custom color schemes