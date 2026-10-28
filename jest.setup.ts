// Native modules don't exist under Jest: replace them with the libraries' own fakes.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// RN 0.88 serves `AssetRegistry` from a private module that jest-expo's stub does not cover.
jest.mock('react-native/src/private/assets/AssetRegistry', () => ({ AssetRegistry: jest.requireMock('react-native/asset-registry') }));

require('react-native-gesture-handler/jestSetup');

// Google fonts need the native font loader, which never resolves under Jest: report them as loaded.
jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: () => [true, null],
  Nunito_400Regular: 'Nunito_400Regular',
  Nunito_700Bold: 'Nunito_700Bold',
}));
jest.mock('@expo-google-fonts/raleway', () => ({
  useFonts: () => [true, null],
  Raleway_700Bold: 'Raleway_700Bold',
}));

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
