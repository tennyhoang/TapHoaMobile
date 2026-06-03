import { haptics } from '@/lib/haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium' },
  NotificationFeedbackType: { Success: 'Success', Error: 'Error' },
}));

const Haptics = jest.requireMock('expo-haptics');

describe('haptics', () => {
  it('light calls impactAsync with Light style', () => {
    haptics.light();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('Light');
  });

  it('medium calls impactAsync with Medium style', () => {
    haptics.medium();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('Medium');
  });

  it('success calls notificationAsync with Success type', () => {
    haptics.success();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('Success');
  });

  it('error calls notificationAsync with Error type', () => {
    haptics.error();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('Error');
  });

  it('selection calls selectionAsync', () => {
    haptics.selection();
    expect(Haptics.selectionAsync).toHaveBeenCalled();
  });
});
