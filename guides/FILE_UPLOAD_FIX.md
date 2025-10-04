# File Upload Fix for Mobile Devices

## Issue Reported
When clicking "Upload from files" on mobile, the camera was opening instead of the file picker/gallery.

## Root Cause
The `<input type="file">` element had a `capture="environment"` attribute on line 438 of `src/app/report/ReportForm.tsx`.

### What `capture` attribute does:
- **With `capture="environment"`**: Forces the device to open the back camera immediately
- **Without `capture`**: Opens file picker (gallery/file browser) allowing user to choose existing files

## Fix Applied

### Before (Line 433-438):
```tsx
<input
  ref={fileInputRef}
  type="file"
  name="photo"
  accept="image/*"
  capture="environment"  // ❌ This forced camera to open
  onChange={async (e) => {
```

### After (Line 433-438):
```tsx
<input
  ref={fileInputRef}
  type="file"
  name="photo"
  accept="image/*"
  // ✅ capture removed - now opens file picker
  onChange={async (e) => {
```

## User Experience Now

### Two Separate Buttons:
1. **"Take photo (camera)"** button
   - Opens device camera via MediaDevices API
   - Live video preview
   - Manual capture button
   - Automatically gets GPS on capture

2. **"Upload from files"** button
   - Opens file picker/gallery ✅ FIXED
   - User can select existing photos
   - Automatically gets GPS on file selection
   - Embeds GPS into photo EXIF data

## Testing

### On Phone (After Page Refresh):
1. Open app: http://localhost:3000
2. Click "Report Issue"
3. Click "Upload from files"
4. **Expected:** File picker/gallery opens (not camera)
5. **Expected:** You can browse and select existing photos

### Test Created:
- File: `tests/unit/ReportForm.file-upload.test.tsx`
- Verifies: `capture` attribute is NOT present on file input
- Ensures: File picker opens instead of forcing camera

## Technical Details

### HTML Input File Behavior:
```html
<!-- Opens file picker (correct for "upload") -->
<input type="file" accept="image/*">

<!-- Forces camera (correct for "take photo") -->
<input type="file" accept="image/*" capture="environment">

<!-- Forces front camera -->
<input type="file" accept="image/*" capture="user">
```

### Why We Have Both Options:
- **Camera button**: For real-time photo capture at incident location
- **Upload button**: For existing photos (e.g., photo taken earlier)

## Browser Support

### `capture` attribute:
- Chrome Android: ✅ Supported
- Safari iOS: ✅ Supported
- Firefox Android: ✅ Supported
- Desktop browsers: ⚠️ Ignored (no camera access)

### File picker (without `capture`):
- All browsers: ✅ Supported
- Mobile: Opens gallery/file browser
- Desktop: Opens file explorer

## Production Considerations

### Best Practice:
Always provide **two separate inputs** for mobile web apps:
1. One WITH `capture` for camera
2. One WITHOUT `capture` for file upload

### Why Not Use Same Input?
- User experience: Clear separation of intent
- Accessibility: Screen readers can distinguish actions
- Flexibility: User chooses their preferred method
- Testing: Easier to test each flow independently

## TDD Approach (Test-Driven Development)

### Test Written First:
```typescript
it('file input should NOT have capture attribute', () => {
  const { container } = render(<ReportForm />);
  const fileInput = container.querySelector('input[type="file"]');
  
  // CRITICAL: capture should NOT be present
  expect(fileInput.hasAttribute('capture')).toBe(false);
});
```

### Then Fix Applied:
Removed `capture="environment"` from line 438

### Why This Matters:
- Test prevents regression (someone accidentally adding capture back)
- Documents expected behavior
- CI/CD can catch this bug automatically

## Verification Steps

### On Phone:
```
1. Refresh page (Cmd+R or pull down to refresh)
2. Click "Report Issue"
3. Click "Upload from files"
4. ✅ File picker/gallery should open
5. ✅ Can select existing photos
```

### On Laptop Chrome DevTools:
```
1. Open chrome://inspect#devices
2. Click "Inspect" on phone's localhost:3000 tab
3. In Elements tab, find: <input type="file">
4. Verify: No `capture` attribute present
```

## Git Commit Message

```
fix: remove capture attribute from file upload input

The "Upload from files" button was opening camera instead of
file picker on mobile devices due to capture="environment"
attribute on the file input element.

Changes:
- Remove capture attribute from file input (line 438)
- Add test to verify capture is not present
- Ensures file picker opens for uploads
- Camera button still uses MediaDevices API for live capture

Fixes: Mobile file upload user experience
Test: tests/unit/ReportForm.file-upload.test.tsx

Following TDD: Test written first, then fix applied
```

## Why This Bug Happened

### Original Intent:
The `capture` attribute was likely added to ensure mobile users could take photos.

### Unintended Consequence:
It made the "Upload from files" button unusable - it always opened camera, never file picker.

### Proper Solution:
- **Camera button**: Uses `navigator.mediaDevices.getUserMedia()` API (lines 236-261)
- **Upload button**: Uses plain `<input type="file">` without capture (line 433-470)

This provides both options without conflicts.

## Related Code

### Camera Implementation (Correct):
```tsx
// Lines 236-261
const onStartCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } }
  });
  // ... video preview and manual capture
};
```

### File Upload Implementation (Now Correct):
```tsx
// Lines 433-470
<input
  type="file"
  accept="image/*"
  // No capture attribute
  onChange={handleFileSelect}
/>
```

## Impact

### Before Fix:
- ❌ "Upload from files" unusable on mobile
- ❌ Users couldn't select existing photos
- ❌ Forced to retake photos even if already have one

### After Fix:
- ✅ "Upload from files" opens gallery
- ✅ Users can select existing photos
- ✅ Both camera and upload work independently
- ✅ Better user experience

## Interview Talking Points

### Why This Fix Matters:
1. **User Experience**: Respects user's choice of input method
2. **Accessibility**: Clear separation of actions
3. **Mobile-First Design**: Understanding HTML attributes for mobile
4. **TDD Practice**: Test written to prevent regression
5. **Production Ready**: Proper error handling and fallbacks

### Technical Knowledge Demonstrated:
- HTML5 file input attributes
- Mobile web behavior differences
- Progressive enhancement
- MediaDevices API vs file input
- Test-driven development

## Next Steps

1. ✅ Fix applied
2. ⏳ Verify on phone (refresh page)
3. ⏳ Test file upload works
4. ⏳ Test camera still works
5. ⏳ Run full test suite
6. ⏳ Git commit with proper message
7. ⏳ Document in test results

---

**Status:** Fix complete, ready for testing on device
**File Changed:** `src/app/report/ReportForm.tsx` (line 438)
**Test Added:** `tests/unit/ReportForm.file-upload.test.tsx`
