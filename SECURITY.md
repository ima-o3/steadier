# Security and privacy reports

Steadier is a personal development prototype and is **not yet a production security-audited application**.

Please do not open public issues containing tokens, personal calendar records, medical/wellbeing entries, private screenshots, signing credentials or device identifiers. Report a suspected vulnerability privately to the repository owner through GitHub rather than posting exploit details in a public issue.

The app stores personal records locally using SQLCipher-configured SQLite and device-managed key storage. Native encryption, backup/recovery and signed-distribution behaviour still require complete physical-device verification. Exported JSON is **unencrypted** and should be treated as sensitive.

See [privacy and safety](docs/privacy-and-safety.md) and [validation](docs/validation.md). Never include real user records or secrets in test fixtures or bug reports.
