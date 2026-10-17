# Security policy

## Supported versions

Only the hosted server at `https://stormap.ai/mcp` and the latest release in this repository are supported. The Docker image is a thin stdio bridge (`mcp-remote`, pinned) to that hosted server; it holds no keys and stores no data.

## Reporting a vulnerability

Please report security issues privately through GitHub: open this repository's **Security** tab and choose **Report a vulnerability**. Do not open a public issue for security problems.

Include what you found, how to reproduce it, and the impact you expect. You should get a first reply within 5 business days. Confirmed issues are fixed on the hosted server first, then noted in the release notes here.

## What the server does and does not do

- All tools are read-only lookups of public data (package registries, SEC EDGAR, public web pages, DNS and RDAP). `company_changes` additionally starts tracking a company's public pages; it never changes anything outside Stormap.
- Tools never pay, sign or move funds. Paid calls over x402 are paid by the caller's own wallet; this server only receives payment.
- No personal data about individuals is returned. Fetches respect `robots.txt` and block private and internal network addresses.
- API keys are optional and are stored only as hashes.
