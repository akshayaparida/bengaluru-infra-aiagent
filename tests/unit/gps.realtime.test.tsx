/* @vitest-environment jsdom */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReportForm from "../../src/app/report/ReportForm";

/**
 * Test: Real-time GPS location detection
 * 
 * This test verifies that:
 * 1. GPS location is fetched fresh when capturing a photo
 * 2. Accuracy is displayed to the user
 * 3. High accuracy is attempted first, with fallback
 * 4. Location is never cached/fixed - always fresh
 */

describe("Real-time GPS Location Detection", () => {
  let mockGeolocation: any;
  
  beforeEach(() => {
    // Mock the geolocation API
    mockGeolocation = {
      getCurrentPosition: vi.fn()
    };
    
    // @ts-ignore
    global.navigator.geolocation = mockGeolocation;
    
    // Mock fetch for form submission
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "test-id" })
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should get fresh GPS location when clicking 'Get GPS location' button", async () => {
    // Simulate different coordinates each call to verify fresh location
    let callCount = 0;
    mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
      callCount++;
      // Return different coordinates each time to prove it's fresh
      const coords = {
        latitude: 12.9716 + (callCount * 0.001), // Slightly different each time
        longitude: 77.5946 + (callCount * 0.001),
        accuracy: 10 + (callCount * 5) // Accuracy varies
      };
      success({ coords });
    });

    render(<ReportForm />);
    
    // Click the GPS location button
    const gpsButton = screen.getByText("📍 Get GPS location");
    fireEvent.click(gpsButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/Getting high-accuracy GPS location/i)).toBeInTheDocument();
    });

    // Should display location with accuracy
    await waitFor(() => {
      expect(screen.getByText(/Location acquired/i)).toBeInTheDocument();
    });
    
    // Verify fresh location was fetched (enableHighAccuracy: true, maximumAge: 0)
    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({
        enableHighAccuracy: true,
        maximumAge: 0 // This ensures no cached location
      })
    );
  });

  it("should always get fresh location when taking a photo (not use cached)", async () => {
    let locationCallCount = 0;
    
    // Mock getUserMedia for camera
    const mockStream = {
      getTracks: () => [{
        stop: vi.fn()
      }]
    };
    
    // @ts-ignore
    global.navigator.mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(mockStream)
    };

    // Mock location - return different coords each time
    mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
      locationCallCount++;
      const coords = {
        // Different location each call
        latitude: 12.9352 + (locationCallCount * 0.001),
        longitude: 77.6245 + (locationCallCount * 0.001),
        accuracy: 15
      };
      success({ coords });
    });

    render(<ReportForm />);
    
    // Start camera
    const cameraButton = screen.getByText("Take photo (camera)");
    fireEvent.click(cameraButton);
    
    await waitFor(() => {
      expect(screen.getByText("Capture")).toBeInTheDocument();
    });

    // Capture photo - this should trigger fresh GPS fetch
    const captureButton = screen.getByText("Capture");
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(screen.getByText(/Acquiring GPS location for photo/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify fresh location was requested (maximumAge: 0)
    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({
        enableHighAccuracy: true,
        maximumAge: 0 // Fresh location, not cached
      })
    );
    
    // Location should have been called at least once
    expect(locationCallCount).toBeGreaterThan(0);
  });

  it("should display accuracy level and warn if accuracy is low", async () => {
    // Mock low accuracy GPS response
    mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
      success({
        coords: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 75 // Low accuracy (> 50m)
        }
      });
    });

    render(<ReportForm />);
    
    const gpsButton = screen.getByText("📍 Get GPS location");
    fireEvent.click(gpsButton);

    // Should show accuracy in the message
    await waitFor(() => {
      expect(screen.getByText(/accuracy: 75m/i)).toBeInTheDocument();
    });

    // Should show warning for low accuracy
    await waitFor(() => {
      expect(screen.getByText(/Low accuracy/i)).toBeInTheDocument();
    });
  });

  it("should fallback to standard GPS if high accuracy fails", async () => {
    let attemptCount = 0;
    
    mockGeolocation.getCurrentPosition.mockImplementation((success: any, error: any, options: any) => {
      attemptCount++;
      
      if (attemptCount === 1 && options.enableHighAccuracy) {
        // First attempt with high accuracy fails
        error({ message: "High accuracy denied" });
      } else {
        // Fallback to standard accuracy succeeds
        success({
          coords: {
            latitude: 12.9698,
            longitude: 77.7500,
            accuracy: 100 // Lower accuracy
          }
        });
      }
    });

    render(<ReportForm />);
    
    const gpsButton = screen.getByText("📍 Get GPS location");
    fireEvent.click(gpsButton);

    // Should show fallback message
    await waitFor(() => {
      expect(screen.getByText(/Falling back to standard GPS/i)).toBeInTheDocument();
    });

    // Should eventually get location
    await waitFor(() => {
      expect(screen.getByText(/Location acquired/i)).toBeInTheDocument();
    });
    
    // Should have attempted twice
    expect(attemptCount).toBe(2);
  });

  it("should not allow submission without GPS location", async () => {
    // Mock GPS failure
    mockGeolocation.getCurrentPosition.mockImplementation((success: any, error: any) => {
      error({ message: "Location services disabled" });
    });

    render(<ReportForm />);
    
    // Add description and try to submit without location
    const textarea = screen.getByPlaceholderText(/describe the issue/i);
    fireEvent.change(textarea, { target: { value: "Test issue" } });
    
    // Create a mock file
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(input);

    // Try to submit
    const submitButton = screen.getByText("Submit report");
    fireEvent.click(submitButton);

    // Should show error about missing GPS
    await waitFor(() => {
      expect(screen.getByText(/Cannot submit without GPS location/i)).toBeInTheDocument();
    });
    
    // Should not have submitted
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should show GPS coordinates with 6 decimal places precision", async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
      success({
        coords: {
          latitude: 12.971623,
          longitude: 77.594687,
          accuracy: 8
        }
      });
    });

    render(<ReportForm />);
    
    const gpsButton = screen.getByText("📍 Get GPS location");
    fireEvent.click(gpsButton);

    // Should display with 6 decimal places
    await waitFor(() => {
      expect(screen.getByText(/12\.971623/)).toBeInTheDocument();
      expect(screen.getByText(/77\.594687/)).toBeInTheDocument();
    });
  });
});