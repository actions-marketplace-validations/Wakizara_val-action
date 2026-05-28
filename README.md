# Val QA scan — GitHub Action

Run [Val](https://val.nyx-intelligence.com), the QA agent for vibecoded apps, on every PR. Val drives a real browser against your preview URL, catches broken links, dead buttons, busted layouts, accessibility violations, and posts a report as a PR comment.

## Requires a Val subscription

Val is a paid product. Get a license key at [val.nyx-intelligence.com](https://val.nyx-intelligence.com), store it as a repository secret (e.g. `VAL_LICENSE_KEY`), and pass it to the action.

## Quick start

```yaml
name: Val QA
on: pull_request

jobs:
  qa:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy preview
        id: deploy
        # ... your preview deployment step (Vercel, Netlify, etc.) ...
        # outputs.url should be the preview URL

      - name: Val scan
        uses: nyx-intelligence/val-action@v1
        with:
          url: ${{ steps.deploy.outputs.url }}
          license-key: ${{ secrets.VAL_LICENSE_KEY }}
          devices: 'desktop,iPhone 14'
          fail-on: 'high'
```

## Inputs

| Name | Default | Description |
|---|---|---|
| `url` | (required) | The URL Val should scan. Pass your preview deployment URL. |
| `license-key` | (required) | Your Val license key (`vk_...`). Get one at [val.nyx-intelligence.com](https://val.nyx-intelligence.com). |
| `max-pages` | `12` | Maximum same-origin pages to crawl. |
| `devices` | `desktop` | Comma-separated device profiles, e.g. `desktop,iPhone 14,Pixel 7`. |
| `fail-on` | `high` | Severity that fails the action: `high`, `medium`, `low`, or `never`. |
| `comment` | `true` | Post the report as a PR comment (`true` / `false`). |
| `github-token` | `${{ github.token }}` | Token used to post the PR comment. |

## Outputs

| Name | Description |
|---|---|
| `high` | Number of high-severity findings. |
| `medium` | Number of medium-severity findings. |
| `low` | Number of low-severity findings. |
| `report-path` | Path to the raw report file. |

## What Val checks

- Broken links and 4xx/5xx responses
- Uncaught JS errors and console errors
- Broken/missing images
- Horizontal layout overflow on mobile
- Clipped text in fixed containers
- Cumulative Layout Shift (janky load)
- A11y essentials: missing alt, unnamed buttons, unlabeled inputs, missing `<html lang>`
- Multi-device: catches bugs that appear only on mobile or only on desktop

## Permissions

The action needs `pull-requests: write` to post comments:

```yaml
permissions:
  contents: read
  pull-requests: write
```
