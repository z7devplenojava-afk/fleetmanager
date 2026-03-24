# Changelog

## v0.215.0 - 2025-10-06

### Added
- Operational management tables: vacation_coverages, absences, work_post_assignments, specific_activities (migration V215__create_operational_management_tables.sql).
- PDF merge feature: backend PdfMergeService, PdfMergeController, DTO PdfMergeResultDTO.
- Frontend: MergeDocumentsModal.tsx, pdfMergeService.ts, operational services and dashboard integrations.

### Changed
- Re-enabled operational repositories, services, and controllers.
- Adjusted dashboard utilities: formatNumber, formatCurrency.
- Corrected repository method names and queries for consistency with entities.

### Fixed
- Backend startup issues related to repository property mismatches.
- Frontend build errors due to missing services/components.

### Infrastructure
- Ensured backend runs on port 8081 with test profile per project standard.
