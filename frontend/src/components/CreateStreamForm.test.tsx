import React from 'react';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { estimateCreateStreamFee, getConfig } from '../services/api';
import { CreateStreamForm } from '../components/CreateStreamForm';

const VALID_ADDRESS_1 = 'GBX5ZID6H4G365G7O4W6U4E6U4E6U4E6U4E6U4E6U4E6U4E6U4E6U4E6';
const VALID_ADDRESS_2 = 'GDBX5ZID6H4G365G7O4W6U4E6U4E6U4E6U4E6U4E6U4E6U4E6U4E6U4E';

vi.mock('../services/api', () => ({
  estimateCreateStreamFee: vi.fn(),
  getConfig: vi.fn(),
}));

function fillValidStreamForm(amount = '100', duration = '60') {
  fireEvent.change(screen.getByLabelText(/Sender Account/i), {
    target: { value: VALID_ADDRESS_1 },
  });
  fireEvent.change(screen.getByLabelText(/Recipient Account/i), {
    target: { value: VALID_ADDRESS_2 },
  });
  fireEvent.change(screen.getByLabelText(/Total Amount/i), {
    target: { value: amount },
  });
  fireEvent.change(screen.getByLabelText(/Duration/i), {
    target: { value: duration },
  });
}

describe('CreateStreamForm Component', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(getConfig).mockResolvedValue({ allowedAssets: ['USDC', 'XLM'] });
    vi.mocked(estimateCreateStreamFee).mockResolvedValue({
      feeStroops: 12345,
      feeXlm: '0.0012345',
    });
  });

  it('renders all required form fields', () => {
    render(<CreateStreamForm onCreate={vi.fn()} walletAddress={VALID_ADDRESS_1} />);

    expect(screen.getByLabelText(/Sender Account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Recipient Account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Asset Code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Total Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start In/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cliff Period/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Stream/i })).toBeInTheDocument();
  });

  it('validates cliff period must be less than stream duration', async () => {
    render(<CreateStreamForm onCreate={vi.fn()} walletAddress={VALID_ADDRESS_1} />);

    const cliffInput = screen.getByLabelText(/Cliff Period/i);
    fireEvent.change(cliffInput, { target: { value: '2' } });
    // Duration is 1440 minutes = 1 day. Cliff of 2 days > 1 day duration
    const durationInput = screen.getByLabelText(/Duration/i);
    fireEvent.change(durationInput, { target: { value: '1440' } });
    fireEvent.blur(cliffInput);

    expect(screen.getByText(/Cliff must be less than the stream duration/i)).toBeInTheDocument();
  });

  it('previews the simulated fee before confirming a valid stream', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CreateStreamForm onCreate={onCreate} walletAddress={VALID_ADDRESS_1} />);

    fillValidStreamForm();

    const submitButton = screen.getByRole('button', { name: /Create Stream/i });
    expect(submitButton).not.toBeDisabled();
    
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(estimateCreateStreamFee).toHaveBeenCalledWith(expect.objectContaining({
        sender: VALID_ADDRESS_1,
        recipient: VALID_ADDRESS_2,
        totalAmount: 100,
        durationSeconds: 3600,
      }));
    });
    expect(onCreate).not.toHaveBeenCalled();
    expect(await screen.findByText(/Network fee estimate/i)).toBeInTheDocument();
    expect(screen.getByText('100 USDC')).toBeInTheDocument();
    expect(screen.getByText('100.000000 USDC/hour')).toBeInTheDocument();
    expect(screen.getByText('0.0012345 XLM')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Confirm$/i }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
        sender: VALID_ADDRESS_1,
        recipient: VALID_ADDRESS_2,
        totalAmount: 100,
        durationSeconds: 3600, // 60 minutes * 60
      }));
    });
  });

  it('shows an inline error when fee simulation fails', async () => {
    vi.mocked(estimateCreateStreamFee).mockRejectedValueOnce(new Error('RPC failed'));
    render(<CreateStreamForm onCreate={vi.fn()} walletAddress={VALID_ADDRESS_1} />);

    fillValidStreamForm();

    fireEvent.click(screen.getByRole('button', { name: /Create Stream/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('RPC failed');
  });

  it('shows error and disables submit when duration is less than 1 minute (60s)', async () => {
    render(<CreateStreamForm onCreate={vi.fn()} walletAddress={VALID_ADDRESS_1} />);

    const durationInput = screen.getByLabelText(/Duration/i);
    fireEvent.change(durationInput, { target: { value: '0' } });
    fireEvent.blur(durationInput);

    expect(screen.getByText(/Duration must be at least 1 minute/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Stream/i })).toBeDisabled();
  });

  it('shows error when total amount is 0 or negative', async () => {
    const user = userEvent.setup();
    render(<CreateStreamForm onCreate={vi.fn()} walletAddress={VALID_ADDRESS_1} />);

    const amountInput = screen.getByLabelText(/Total Amount/i);
    await user.clear(amountInput);
    await user.type(amountInput, '0');
    
    const submitButton = screen.getByRole('button', { name: /Create Stream/i });
    await user.click(submitButton);

    expect(screen.getByText(/greater than zero/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('shows error for invalid Stellar address format', async () => {
    const user = userEvent.setup();
    render(<CreateStreamForm onCreate={vi.fn()} walletAddress={VALID_ADDRESS_1} />);

    const senderInput = screen.getByLabelText(/Sender Account/i);
    await user.clear(senderInput);
    await user.type(senderInput, 'INVALID_ADDRESS');
    
    const submitButton = screen.getByRole('button', { name: /Create Stream/i });
    await user.click(submitButton);

    expect(screen.getByText(/valid Stellar account ID/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state during submission', async () => {
    // Create a promise that we can control
    let resolveSubmit: (value: void | PromiseLike<void>) => void;
    const onCreate = vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolveSubmit = resolve;
    }));
    
    render(<CreateStreamForm onCreate={onCreate} walletAddress={VALID_ADDRESS_1} />);

    fillValidStreamForm();

    fireEvent.click(screen.getByRole('button', { name: /Create Stream/i }));
    const confirmButton = await screen.findByRole('button', { name: /^Confirm$/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(confirmButton).toBeDisabled();
      expect(confirmButton).toHaveTextContent(/Creating/i);
      expect(confirmButton).toHaveAttribute('aria-busy', 'true');
    });

    // Finish submission
    await waitFor(() => {
      if (resolveSubmit) resolveSubmit();
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('displays API error message when submission fails', async () => {
    render(
      <CreateStreamForm 
        onCreate={vi.fn()} 
        walletAddress={VALID_ADDRESS_1} 
        apiError="Network request failed" 
      />
    );

    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    expect(screen.getByText(/Could not reach the StellarFlow API/i)).toBeInTheDocument();
  });

  it('allows retry of fee estimation when estimation fails', async () => {
    // First call fails, second succeeds
    vi.mocked(estimateCreateStreamFee)
      .mockRejectedValueOnce(new Error('RPC timeout'))
      .mockResolvedValueOnce({
        feeStroops: 12345,
        feeXlm: '0.0012345',
      });

    render(<CreateStreamForm onCreate={vi.fn()} walletAddress={VALID_ADDRESS_1} />);

    fillValidStreamForm();

    // Click "Create Stream" — should fail
    fireEvent.click(screen.getByRole('button', { name: /Create Stream/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('RPC timeout');
    expect(estimateCreateStreamFee).toHaveBeenCalledTimes(1);

    // Click "Retry Estimation"
    const retryButton = await screen.findByRole('button', { name: /Retry Estimation/i });
    fireEvent.click(retryButton);

    // Should call estimateCreateStreamFee again and show fee preview
    await waitFor(() => {
      expect(estimateCreateStreamFee).toHaveBeenCalledTimes(2);
    });
    
    expect(await screen.findByText(/Network fee estimate/i)).toBeInTheDocument();
    expect(screen.getByText('100 USDC')).toBeInTheDocument();
  });

  it('allows retry of stream creation when confirmation fails', async () => {
    // onCreate fails first time, succeeds on retry
    const onCreate = vi.fn()
      .mockRejectedValueOnce(new Error('Insufficient balance'))
      .mockResolvedValueOnce(undefined);

    render(<CreateStreamForm onCreate={onCreate} walletAddress={VALID_ADDRESS_1} />);

    fillValidStreamForm();

    // Submit form to get fee preview
    fireEvent.click(screen.getByRole('button', { name: /Create Stream/i }));
    
    // Wait for modal to open
    const confirmButton = await screen.findByRole('button', { name: /^Confirm$/i });
    
    // First confirmation — should fail
    fireEvent.click(confirmButton);

    expect(await screen.findByRole('alert')).toHaveTextContent(/insufficient balance/i);
    expect(onCreate).toHaveBeenCalledTimes(1);

    // Click "Retry Confirmation"
    const retryButton = await screen.findByRole('button', { name: /Retry Confirmation/i });
    fireEvent.click(retryButton);

    // Should call onCreate again and close modal on success
    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('allows editing form after confirmation failure', async () => {
    const onCreate = vi.fn().mockRejectedValueOnce(new Error('Transaction failed'));

    render(<CreateStreamForm onCreate={onCreate} walletAddress={VALID_ADDRESS_1} />);

    fillValidStreamForm('100', '60');

    // Submit form to get fee preview
    fireEvent.click(screen.getByRole('button', { name: /Create Stream/i }));
    
    // Wait for modal to open
    await screen.findByRole('button', { name: /^Confirm$/i });

    // Confirm — should fail
    fireEvent.click(screen.getByRole('button', { name: /^Confirm$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Transaction failed');

    // Click "Edit" button (which appears when there's an error)
    const editButton = await screen.findByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Form values should still be present
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  it('prevents duplicate confirmations by disabling button during submission', async () => {
    let resolveSubmit: (value: void | PromiseLike<void>) => void;
    const onCreate = vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolveSubmit = resolve;
    }));

    render(<CreateStreamForm onCreate={onCreate} walletAddress={VALID_ADDRESS_1} />);

    fillValidStreamForm();

    fireEvent.click(screen.getByRole('button', { name: /Create Stream/i }));
    const confirmButton = await screen.findByRole('button', { name: /^Confirm$/i });

    // First click
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(confirmButton).toBeDisabled();
    });

    // Try to click again while disabled
    fireEvent.click(confirmButton);

    // onCreate should still only have been called once
    expect(onCreate).toHaveBeenCalledTimes(1);

    // Resolve the submission
    await waitFor(() => {
      if (resolveSubmit) resolveSubmit();
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('preserves form input through fee estimation error and retry', async () => {
    vi.mocked(estimateCreateStreamFee)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        feeStroops: 12345,
        feeXlm: '0.0012345',
      });

    render(<CreateStreamForm onCreate={vi.fn()} walletAddress={VALID_ADDRESS_1} />);

    const senderInput = screen.getByLabelText(/Sender Account/i) as HTMLInputElement;
    const recipientInput = screen.getByLabelText(/Recipient Account/i) as HTMLInputElement;
    const amountInput = screen.getByLabelText(/Total Amount/i) as HTMLInputElement;

    fillValidStreamForm('250', '120');

    // Try to submit — fails
    fireEvent.click(screen.getByRole('button', { name: /Create Stream/i }));
    await screen.findByRole('alert');

    // Verify input is still there
    expect(senderInput.value).toBe(VALID_ADDRESS_1);
    expect(recipientInput.value).toBe(VALID_ADDRESS_2);
    expect(amountInput.value).toBe('250');

    // Retry
    fireEvent.click(await screen.findByRole('button', { name: /Retry Estimation/i }));

    // Modal should open with the same data
    await waitFor(() => {
      expect(screen.getByText('250 USDC')).toBeInTheDocument();
    });
  });
  it('allows stream creation without connected wallet when valid sender address is provided', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CreateStreamForm onCreate={onCreate} walletAddress={null} />);

    fillValidStreamForm('500', '60');

    const submitButton = screen.getByRole('button', { name: /Create Stream/i });
    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(estimateCreateStreamFee).toHaveBeenCalledWith(
        expect.objectContaining({
          sender: VALID_ADDRESS_1,
          recipient: VALID_ADDRESS_2,
          totalAmount: 500,
        })
      );
    });

    const confirmButton = await screen.findByRole('button', { name: /^Confirm$/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          sender: VALID_ADDRESS_1,
          recipient: VALID_ADDRESS_2,
          totalAmount: 500,
        })
      );
    });
  });

  it('populates demo keys when clicking Demo Key buttons', async () => {
    render(<CreateStreamForm onCreate={vi.fn()} walletAddress={null} />);

    const demoButtons = screen.getAllByRole('button', { name: /Demo Key/i });
    expect(demoButtons.length).toBe(2);

    fireEvent.click(demoButtons[0]);
    fireEvent.click(demoButtons[1]);

    const senderInput = screen.getByLabelText(/Sender Account/i) as HTMLInputElement;
    const recipientInput = screen.getByLabelText(/Recipient Account/i) as HTMLInputElement;

    expect(senderInput.value).toBe('GCGOP727E2L5FRWXPXBPMYCA4DY7I23OR5OIXHPL3RDKEZFD2GJHTUVP');
    expect(recipientInput.value).toBe('GDIMKSYZWZ6KGL5D6EVVDZYLX6EW4TJXMWF6XO3Q4Y7M3JGALJDXCUG7');
  });
  it('switches to Payroll Bulk mode and allows batch creation with demo team', async () => {
    const onCreateBatch = vi.fn().mockResolvedValue(undefined);
    render(<CreateStreamForm onCreate={vi.fn()} onCreateBatch={onCreateBatch} walletAddress={VALID_ADDRESS_1} />);

    fireEvent.click(screen.getByRole('button', { name: /Payroll Bulk/i }));

    expect(screen.getByText(/Employee Payroll List/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Load Demo Team/i }));

    expect(screen.getByText(/Employee Payroll List \(3\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Payroll Outflow/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Create Payroll Streams \(3\)/i });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onCreateBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            recipient: "GCGOP727E2L5FRWXPXBPMYCA4DY7I23OR5OIXHPL3RDKEZFD2GJHTUVP",
            totalAmount: 3500,
          }),
        ])
      );
    });
  });

  it('allows pasting and importing CSV in Payroll Bulk mode', async () => {
    render(<CreateStreamForm onCreate={vi.fn()} walletAddress={VALID_ADDRESS_1} />);

    fireEvent.click(screen.getByRole('button', { name: /Payroll Bulk/i }));
    fireEvent.click(screen.getByRole('button', { name: /Paste CSV/i }));

    const textarea = screen.getByPlaceholderText(/recipient,name,amount/i);
    fireEvent.change(textarea, {
      target: {
        value: "recipient,name,amount,durationDays,cliffDays\nGCGOP727E2L5FRWXPXBPMYCA4DY7I23OR5OIXHPL3RDKEZFD2GJHTUVP,CustomWorker,5000,14,0",
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /Parse & Import CSV/i }));

    expect(screen.getByText(/CustomWorker/i)).toBeInTheDocument();
    expect(screen.getByText(/5,000 USDC/i)).toBeInTheDocument();
  });
});
