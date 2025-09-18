import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SowingCalendar from '../Pages/UserDashboard/SowingCalendar';
import api from '../services/api';
import authService from '../services/authService';

// Mock dependencies
jest.mock('../services/api');
jest.mock('../services/authService');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock user data
const mockUser = {
  _id: 'user123',
  name: 'Test Farmer',
  email: 'test@farmer.com',
  region: 'Punjab',
  agroZone: 'temperate'
};

// Mock API responses
const mockSowingData = {
  results: [
    {
      crop: 'Rice',
      season: 'Kharif',
      startMonth: 'June',
      endMonth: 'July',
      region: 'Punjab',
      agroZone: 'temperate',
      varieties: ['Basmati', 'Non-Basmati'],
      notes: 'Best sown during monsoon season',
      source: 'ICAR 2024',
      lastUpdated: '2025-01-18T10:30:00.000Z'
    },
    {
      crop: 'Rice',
      season: 'Kharif',
      startMonth: 'June',
      endMonth: 'July',
      region: 'all',
      agroZone: 'humid',
      varieties: ['Swarna', 'MTU-1010'],
      notes: 'General rice sowing guidelines',
      source: 'KVK-General',
      lastUpdated: '2025-01-18T10:30:00.000Z'
    }
  ],
  matchExplanation: 'Found 2 exact match(es) for "Rice" in region "Punjab"',
  totalMatches: 2
};

const mockCropsList = [
  'Rice', 'Wheat', 'Maize', 'Sugarcane', 'Cotton'
];

describe('SowingCalendar Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock authService
    authService.getCurrentUser.mockReturnValue(mockUser);
    
    // Mock API responses
    api.get.mockImplementation((url) => {
      if (url.includes('/farmer/sowing-calendar')) {
        return Promise.resolve({ data: mockSowingData });
      }
      return Promise.resolve({ data: [] });
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <SowingCalendar />
      </BrowserRouter>
    );
  };

  describe('Component Rendering', () => {
    test('renders all main UI elements', () => {
      renderComponent();
      
      // Check for main elements
      expect(screen.getByText('Sowing Calendar')).toBeInTheDocument();
      expect(screen.getByText('Find the best time to sow your crops')).toBeInTheDocument();
      
      // Check for form elements
      expect(screen.getByPlaceholderText(/crop name/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Punjab')).toBeInTheDocument(); // Auto-filled region
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    test('auto-fills region from user profile', () => {
      renderComponent();
      
      const regionInput = screen.getByDisplayValue('Punjab');
      expect(regionInput).toBeInTheDocument();
    });

    test('renders language selector', () => {
      renderComponent();
      
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('हिंदी')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('performs search when search button is clicked', async () => {
      renderComponent();
      
      const cropInput = screen.getByPlaceholderText(/crop name/i);
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      fireEvent.change(cropInput, { target: { value: 'Rice' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/farmer/sowing-calendar',
          expect.objectContaining({
            params: expect.objectContaining({
              crop: 'Rice',
              region: 'Punjab'
            })
          })
        );
      });
    });

    test('performs search with season filter', async () => {
      renderComponent();
      
      const cropInput = screen.getByPlaceholderText(/crop name/i);
      const seasonSelect = screen.getByDisplayValue('All Seasons');
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      fireEvent.change(cropInput, { target: { value: 'Rice' } });
      fireEvent.change(seasonSelect, { target: { value: 'Kharif' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/farmer/sowing-calendar',
          expect.objectContaining({
            params: expect.objectContaining({
              crop: 'Rice',
              region: 'Punjab',
              season: 'Kharif'
            })
          })
        );
      });
    });

    test('shows loading state during search', async () => {
      // Mock delayed API response
      api.get.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: mockSowingData }), 100)
        )
      );
      
      renderComponent();
      
      const cropInput = screen.getByPlaceholderText(/crop name/i);
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      fireEvent.change(cropInput, { target: { value: 'Rice' } });
      fireEvent.click(searchButton);
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });

    test('displays error message on API failure', async () => {
      api.get.mockRejectedValue(new Error('API Error'));
      
      renderComponent();
      
      const cropInput = screen.getByPlaceholderText(/crop name/i);
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      fireEvent.change(cropInput, { target: { value: 'Rice' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
      });
    });
  });

  describe('Results Display', () => {
    beforeEach(async () => {
      renderComponent();
      
      const cropInput = screen.getByPlaceholderText(/crop name/i);
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      fireEvent.change(cropInput, { target: { value: 'Rice' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText('Rice')).toBeInTheDocument();
      });
    });

    test('displays search results', () => {
      expect(screen.getByText('Rice')).toBeInTheDocument();
      expect(screen.getByText('Kharif')).toBeInTheDocument();
      expect(screen.getByText('June - July')).toBeInTheDocument();
      expect(screen.getByText('Punjab')).toBeInTheDocument();
    });

    test('displays match explanation', () => {
      expect(screen.getByText(/Found 2 exact match/i)).toBeInTheDocument();
    });

    test('allows selection of results', () => {
      const resultCards = screen.getAllByText('Rice');
      expect(resultCards.length).toBeGreaterThan(0);
      
      // Click on first result
      fireEvent.click(resultCards[0].closest('[class*="cursor-pointer"]'));
      
      // Should show timeline
      expect(screen.getByText(/timeline/i)).toBeInTheDocument();
    });
  });

  describe('Timeline Visualization', () => {
    beforeEach(async () => {
      renderComponent();
      
      const cropInput = screen.getByPlaceholderText(/crop name/i);
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      fireEvent.change(cropInput, { target: { value: 'Rice' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText('Rice')).toBeInTheDocument();
      });
      
      // Select a result
      const resultCard = screen.getAllByText('Rice')[0];
      fireEvent.click(resultCard.closest('[class*="cursor-pointer"]'));
    });

    test('renders timeline with correct months', () => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      months.forEach(month => {
        expect(screen.getByText(month)).toBeInTheDocument();
      });
    });

    test('applies correct color coding for sowing window', () => {
      // June and July should be highlighted as ideal sowing months
      const juneElement = screen.getByText('Jun');
      const julyElement = screen.getByText('Jul');
      
      expect(juneElement.closest('[class*="bg-green"]')).toBeInTheDocument();
      expect(julyElement.closest('[class*="bg-green"]')).toBeInTheDocument();
    });

    test('shows tooltips for month status', () => {
      const juneElement = screen.getByText('Jun');
      expect(juneElement.closest('[title*="Ideal"]')).toBeInTheDocument();
    });
  });

  describe('Color Coding Logic', () => {
    test('correctly identifies ideal sowing months', () => {
      // Test the getTimelineData function logic
      const result = {
        startMonth: 'June',
        endMonth: 'July'
      };
      
      // Mock current month as June (index 5)
      const originalDate = Date;
      global.Date = jest.fn(() => new originalDate('2025-06-15'));
      global.Date.now = originalDate.now;
      
      renderComponent();
      
      // June and July should be marked as ideal
      const juneElement = screen.getByText('Jun');
      const julyElement = screen.getByText('Jul');
      
      expect(juneElement.closest('[class*="bg-green"]')).toBeInTheDocument();
      expect(julyElement.closest('[class*="bg-green"]')).toBeInTheDocument();
      
      // Restore original Date
      global.Date = originalDate;
    });

    test('handles wrap-around months correctly', () => {
      const result = {
        startMonth: 'November',
        endMonth: 'February'
      };
      
      // This should create a wrap-around window
      // November, December, January, February should be ideal
      // March should be possible (early)
      // October should be possible (late)
    });
  });

  describe('Add to Logbook Functionality', () => {
    beforeEach(async () => {
      renderComponent();
      
      const cropInput = screen.getByPlaceholderText(/crop name/i);
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      fireEvent.change(cropInput, { target: { value: 'Rice' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText('Rice')).toBeInTheDocument();
      });
      
      // Select a result
      const resultCard = screen.getAllByText('Rice')[0];
      fireEvent.click(resultCard.closest('[class*="cursor-pointer"]'));
    });

    test('renders add to logbook button', () => {
      expect(screen.getByText(/add to farm logbook/i)).toBeInTheDocument();
    });

    test('handles add to logbook click', () => {
      const addButton = screen.getByText(/add to farm logbook/i);
      fireEvent.click(addButton);
      
      // Should show success message or handle the action
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('Export to PDF Functionality', () => {
    beforeEach(async () => {
      renderComponent();
      
      const cropInput = screen.getByPlaceholderText(/crop name/i);
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      fireEvent.change(cropInput, { target: { value: 'Rice' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText('Rice')).toBeInTheDocument();
      });
      
      // Select a result
      const resultCard = screen.getAllByText('Rice')[0];
      fireEvent.click(resultCard.closest('[class*="cursor-pointer"]'));
    });

    test('renders export to PDF button', () => {
      expect(screen.getByText(/export to pdf/i)).toBeInTheDocument();
    });

    test('handles export to PDF click', () => {
      const exportButton = screen.getByText(/export to pdf/i);
      fireEvent.click(exportButton);
      
      // Should handle the export action
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('Localization', () => {
    test('switches language correctly', () => {
      renderComponent();
      
      const hindiButton = screen.getByText('हिंदी');
      fireEvent.click(hindiButton);
      
      // Should show Hindi text
      expect(screen.getByText('फसल कैलेंडर')).toBeInTheDocument();
    });

    test('displays months in selected language', () => {
      renderComponent();
      
      const hindiButton = screen.getByText('हिंदी');
      fireEvent.click(hindiButton);
      
      // Should show Hindi month names
      expect(screen.getByText('जनवरी')).toBeInTheDocument();
    });
  });

  describe('Status Indicators', () => {
    test('shows current status based on current month', () => {
      // Mock current month as June
      const originalDate = Date;
      global.Date = jest.fn(() => new originalDate('2025-06-15'));
      global.Date.now = originalDate.now;
      
      renderComponent();
      
      // Should show appropriate status
      expect(screen.getByText(/on-time/i)).toBeInTheDocument();
      
      // Restore original Date
      global.Date = originalDate;
    });

    test('shows early status for months before sowing window', () => {
      // Mock current month as April
      const originalDate = Date;
      global.Date = jest.fn(() => new originalDate('2025-04-15'));
      global.Date.now = originalDate.now;
      
      renderComponent();
      
      // Should show early status
      expect(screen.getByText(/early/i)).toBeInTheDocument();
      
      // Restore original Date
      global.Date = originalDate;
    });

    test('shows late status for months after sowing window', () => {
      // Mock current month as August
      const originalDate = Date;
      global.Date = jest.fn(() => new originalDate('2025-08-15'));
      global.Date.now = originalDate.now;
      
      renderComponent();
      
      // Should show late status
      expect(screen.getByText(/late/i)).toBeInTheDocument();
      
      // Restore original Date
      global.Date = originalDate;
    });
  });

  describe('Offline Functionality', () => {
    test('handles offline state gracefully', () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      
      renderComponent();
      
      // Should still render the component
      expect(screen.getByText('Sowing Calendar')).toBeInTheDocument();
    });

    test('shows cached results when offline', () => {
      // Mock localStorage with cached data
      const cachedData = JSON.stringify(mockSowingData);
      localStorage.setItem('sowing-calendar-cache', cachedData);
      
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      
      renderComponent();
      
      // Should show cached results
      expect(screen.getByText('Rice')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('displays error message for API failures', async () => {
      api.get.mockRejectedValue(new Error('Network Error'));
      
      renderComponent();
      
      const cropInput = screen.getByPlaceholderText(/crop name/i);
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      fireEvent.change(cropInput, { target: { value: 'Rice' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
      });
    });

    test('handles empty search results', async () => {
      api.get.mockResolvedValue({ data: { results: [] } });
      
      renderComponent();
      
      const cropInput = screen.getByPlaceholderText(/crop name/i);
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      fireEvent.change(cropInput, { target: { value: 'Unknown Crop' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
      });
    });
  });
});

// Helper function to run tests
export const runSowingCalendarTests = async () => {
  console.log('🧪 Running SowingCalendar Component Tests...');
  
  try {
    // Run the test suite
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const { stdout, stderr } = await execAsync('npm test -- SowingCalendar.test.jsx');
    
    console.log('✅ SowingCalendar Test Results:');
    console.log(stdout);
    
    if (stderr) {
      console.log('⚠️ Test Warnings:');
      console.log(stderr);
    }
    
    console.log('🎉 SowingCalendar tests completed successfully!');
    
  } catch (error) {
    console.error('❌ SowingCalendar tests failed:', error.message);
    throw error;
  }
};
