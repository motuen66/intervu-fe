# Common Typography Usage Guide

## Purpose

This folder includes reusable typography primitives to keep hierarchy consistent across the app.

## Which Component To Use

- `PageHeader`: page-level title area (title, subtitle, actions, back).
- `SectionHeading`: title for sections/cards/blocks inside a page.
- `AppText`: body and metadata text styles (`body`, `bodyStrong`, `label`, `caption`, `muted`, `overline`).

## Rules

- Do not add new page headings with raw `Typography variant="h*"` in feature pages.
- Do not hardcode heading `fontSize` or `fontWeight` at usage sites.
- Use `Box`/`Stack` for spacing and layout around typography components.
- Keep raw `Typography` for narrow inline needs only (table cells, tiny inline metrics, etc.).

## Quick Examples

- Page title: `<PageHeader title="Candidates" subtitle="Manage candidate records" />`
- Section title: `<SectionHeading title="Profile Settings" />`
- Body copy: `<AppText variant="body">Update your contact details here.</AppText>`
