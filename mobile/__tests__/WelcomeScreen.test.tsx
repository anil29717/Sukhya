import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WelcomeScreen from '@/app/index';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';

// Mock react-redux hooks
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    useRouter: jest.fn(),
    Link: ({ children, href }: any) => {
      return <View testID={`link-${href}`}>{children}</View>;
    },
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20, left: 0, right: 0 }),
}));

// Mock vector icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }: any) => <Text>Icon:{name}</Text>,
  };
});

// Mock tokenStorage
jest.mock('@/api/storage', () => ({
  tokenStorage: {
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
  ACCESS_TOKEN_KEY: 'access_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
}));

describe('WelcomeScreen', () => {
  let mockPush: jest.Mock;
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  it('renders correctly when unauthenticated', () => {
    // Mock selector to return unauthenticated state
    (useSelector as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    const { getByText, queryByText } = render(<WelcomeScreen />);

    // Assert branding/info elements
    expect(getByText('Lumina Health')).toBeTruthy();
    expect(getByText('Premium healthcare at your fingertips')).toBeTruthy();

    // Assert unauthenticated authBox view
    expect(getByText('Access Lumina Services')).toBeTruthy();
    expect(getByText('Sign In / Register')).toBeTruthy();

    // Assert authenticated elements are not shown
    expect(queryByText('Enter Dashboard')).toBeNull();
    expect(queryByText('Sign Out')).toBeNull();
  });

  it('renders correctly when authenticated as a patient', () => {
    // Mock selector to return authenticated patient state
    (useSelector as jest.Mock).mockReturnValue({
      user: {
        id: 1,
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'patient',
      },
      isAuthenticated: true,
    });

    const { getByText, queryByText } = render(<WelcomeScreen />);

    // Assert patient info is displayed
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('PATIENT')).toBeTruthy();

    // Assert dashboard navigation is available
    const enterDashboardBtn = getByText('Enter Dashboard');
    expect(enterDashboardBtn).toBeTruthy();

    // Trigger dashboard navigation click
    fireEvent.press(enterDashboardBtn);
    expect(mockPush).toHaveBeenCalledWith('/(patient)/(tabs)');

    // Verify Sign Out button is visible
    expect(getByText('Sign Out')).toBeTruthy();

    // Sign In/Register should not be visible
    expect(queryByText('Access Lumina Services')).toBeNull();
  });

  it('renders correctly when authenticated as a doctor and logs out successfully', async () => {
    // Mock selector to return authenticated doctor state
    (useSelector as jest.Mock).mockReturnValue({
      user: {
        id: 2,
        full_name: 'Dr. Smith',
        email: 'smith@lumina.com',
        role: 'doctor',
      },
      isAuthenticated: true,
    });

    const { getByText } = render(<WelcomeScreen />);

    expect(getByText('Dr. Smith')).toBeTruthy();
    expect(getByText('DOCTOR')).toBeTruthy();

    // Trigger dashboard navigation click
    const enterDashboardBtn = getByText('Enter Dashboard');
    fireEvent.press(enterDashboardBtn);
    expect(mockPush).toHaveBeenCalledWith('/(doctor)/(tabs)');

    // Trigger logout
    const signOutBtn = getByText('Sign Out');
    fireEvent.press(signOutBtn);

    // Verify action was dispatched
    await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
  });
});
