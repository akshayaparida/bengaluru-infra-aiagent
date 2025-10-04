import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReportForm from '@/app/report/ReportForm';

describe('ReportForm - File Upload vs Camera', () => {
  it('should have separate buttons for camera and file upload', () => {
    render(<ReportForm />);
    
    // Two separate buttons should exist
    const cameraBtn = screen.getByText('Take photo (camera)');
    const uploadBtn = screen.getByText('Upload from files');
    
    expect(cameraBtn).toBeTruthy();
    expect(uploadBtn).toBeTruthy();
  });

  it('file input should NOT have capture attribute (allows file picker on mobile)', () => {
    const { container } = render(<ReportForm />);
    
    // Find the hidden file input
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    expect(fileInput).toBeTruthy();
    expect(fileInput.accept).toBe('image/*');
    
    // CRITICAL: capture attribute should NOT be present
    // This ensures file picker opens instead of forcing camera
    expect(fileInput.hasAttribute('capture')).toBe(false);
  });

  it('file input should accept images', () => {
    const { container } = render(<ReportForm />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    expect(fileInput.accept).toBe('image/*');
  });
});
