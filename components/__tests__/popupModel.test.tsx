import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import CancelModal from '../popupmodel/popupModel';

describe('CancelModal', () => {
  it('shows its texts and calls onConfirm / onClose', async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    await render(<CancelModal visible title="Mark as Paid?" message="Order ID: A" confirmText="Paid" cancelText="Back" onConfirm={onConfirm} onClose={onClose} />);
    expect(screen.getByText('Mark as Paid?')).toBeTruthy();
    await fireEvent.press(screen.getByText('Paid'));
    await fireEvent.press(screen.getByText('Back'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
