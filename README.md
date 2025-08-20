# Stroke Team App

## Draft storage schema

Drafts saved to `localStorage` are wrapped in an object with a `version` number.  The
current schema version is **1**, stored as `{ version: 1, data: <payload> }`.
Older drafts without a version are automatically migrated when loaded.
