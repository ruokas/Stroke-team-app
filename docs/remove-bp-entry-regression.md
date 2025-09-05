# Remove BP Entry Regression Test

A regression occurred when the remove button for blood pressure entries lacked
`type="button"`. When inside a form with an invalid or empty weight field, the
button behaved as a submit button and native validation blocked the click, so
the entry could not be removed.

`test/removeBpEntry.test.js` simulates real user interaction by clicking on the
DOM nodes. It verifies that entries can be removed even when the weight input is
invalid or empty, ensuring the button remains `type="button"`.
