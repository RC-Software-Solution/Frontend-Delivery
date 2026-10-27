import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import FailReasonModal from '../failReasonModal/failReasonModal';

it('needs a reason before Mark failed works, and submits it trimmed', async () => {
  const onSubmit = jest.fn();
  await render(<FailReasonModal visible orderId="B" onCancel={jest.fn()} onSubmit={onSubmit} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Mark failed' }));
  expect(onSubmit).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByTestId('fail-reason-input'), '  Not at hostel ');
  await fireEvent.press(screen.getByRole('button', { name: 'Mark failed' }));
  expect(onSubmit).toHaveBeenCalledWith('Not at hostel');
});

it('starts empty each time it is opened', async () => {
  const props = { orderId: 'B', onCancel: jest.fn(), onSubmit: jest.fn() };
  const view = await render(<FailReasonModal visible {...props} />);
  await fireEvent.changeText(screen.getByTestId('fail-reason-input'), 'Not at hostel');
  await view.rerender(<FailReasonModal visible={false} {...props} />);
  await view.rerender(<FailReasonModal visible {...props} />);
  expect(screen.getByTestId('fail-reason-input').props.value).toBe('');
});
