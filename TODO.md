# TODO - Fix Selector Errors in Action Recorder Plugin

## Problem Analysis
The errors show that element IDs contain JavaScript function code (from Angular/React frameworks) which breaks CSS selector parsing:
- Example problematic ID: `input_function r(){if(St(n),n.value===mo){let o=null;throw new C(-950,o)}return n.value}_subscriber-type_aon-choice_0`

## Plan
1. ✅ Create this TODO file
2. ✅ Add `isValidCssSelector()` function to validate if a string is a valid CSS selector
3. ✅ Add `escapeCssSelector()` function to properly escape problematic selectors
4. ✅ Modify `getUniqueSelector()` to validate and escape IDs before using them
5. ✅ Add robust fallback mechanism for dynamic IDs
6. ✅ Test the fix

## Changes Made in content.js
- Added `isValidCssSelector()` - validates CSS selectors before using them
- Added `escapeCssSelector()` - escapes problematic characters in selectors
- Modified `getUniqueSelector()` to:
  - Validate ID as CSS selector before using it
  - Skip IDs containing JS code (`{}()[];<>`)
  - Filter out Angular dynamic classes (ng-*)
  - Added priority for radio/checkbox with type+name selector
  - Added fallback for labels using `for` attribute
  - Added fallback using element text content for labels/options
- Improved `findElement()` with multiple fallback strategies:
  - Support for `:contains()` pseudo-selector
  - Direct ID lookup fallback
  - Label lookup by `for` attribute
  - Radio/checkbox lookup by name attribute

## What the Fix Does
1. When recording an action, the plugin now checks if the element's ID is a valid CSS selector
2. If the ID contains JavaScript code (like `{}()[];<>), it skips using the ID and falls back to other selectors
3. For radio/checkbox elements, it prioritizes `input[type="radio"][name="x"]` style selectors
4. Dynamic Angular classes (ng-*) are filtered out when generating stable selectors
5. The `findElement()` function now has multiple fallbacks to locate elements when the primary selector fails

## Testing
To test the fix:
1. Reload the extension in Chrome (chrome://extensions → Reload)
2. Record a new scenario on the problematic page
3. Play back the scenario to verify all actions execute correctly

