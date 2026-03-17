# Design Decisions

## Color System

### Primary Color: Slate (#0F172A) — Earth-Toned Industrial
**Decision**: Use deep Slate Navy as the primary brand color per the UXL "Earth-Toned Industrial" specification.

**Rationale**:
- **Specification Compliance**: Matches the UXL-defined Slate (#0F172A) primary token
- **Industrial Aesthetic**: Deep slate navy conveys authority, precision, and professional rigor appropriate for an audit platform
- **Contrast**: Provides excellent contrast ratios (>7:1) against white foreground, exceeding WCAG AAA
- **Data Density**: Dark, authoritative primary recedes appropriately in data-heavy tables and charts, letting content lead
- **Trust Signaling**: Slate communicates stability, reliability, and institutional trust — critical for financial/legal workflows
- **Sidebar Treatment**: The dark slate sidebar creates a clear spatial hierarchy, anchoring navigation and freeing the content area

### Color Palette Strategy
The complete color system includes:
- **Primary (Slate #0F172A)**: Buttons, sidebar background, active states, headings
- **Secondary (Slate-500 #64748b)**: Supporting text, secondary actions, labels
- **Accent (Slate-100 #e8ecf4)**: Hover states, selected row backgrounds, chips
- **Success (Green #16a34a)**: Recovered discrepancies, positive variances, paid invoices
- **Warning (Amber #d97706)**: Pending items, at-risk deadlines, caution states
- **Error/Destructive (Red #ef4444)**: Open discrepancies, overdue invoices, critical issues
- **Info (Steel Blue #0e6fa5)**: Informational messages, in-review states, neutral highlights

### Implementation
Color tokens are defined in `src/lib/colors.ts` with multiple shades (50-900) for a sophisticated hierarchy. The system supports:
- Light and dark modes
- High contrast accessibility requirements
- Consistent visual feedback across all components
- Clear status communication through color semantics

---

## Component Architecture

### UI Components
All base components follow shadcn/ui patterns with:
- Full TypeScript support
- Accessibility compliance (WCAG 2.1 AA)
- Responsive design
- Dark mode support
- Composable API

### Custom Components
Domain-specific components built for lease audit workflows:
- **StatCard**: KPI display with variance indicators
- **VarianceIndicator**: Color-coded variance display
- **StatusBadge**: Status indicators for discrepancies and invoices
- **Timeline**: Activity and status change history
- **ConfidenceMeter**: Data quality confidence display
- **SyncIndicator**: Real-time sync status for PWA functionality
- **OfflineBanner**: Offline mode indicator

---

## PWA & Offline Support

### Sync Indicator
Shows real-time sync status:
- **Idle**: Last sync time displayed
- **Syncing**: Active sync animation
- **Success**: Brief success feedback
- **Error**: Sync failure notification

### Offline Banner
Persistent notification when offline:
- Appears at top of application
- Auto-hides when connection restored
- Informs users that changes will sync when online

---

## Navigation Structure

### Primary Navigation (Sidebar)
13 main sections accessible from any authenticated page:
1. Dashboard - Overview and KPIs
2. Portfolios - Portfolio management
3. Properties - Property listings
4. Leases - Lease management and details
5. Discrepancies - Issues and disputes
6. CAM Audit - CAM reconciliations
7. Documents - Lease and reference documents
8. Invoices - Invoice tracking
9. Calendar - Important dates and deadlines
10. Reports - Audit reports
11. Exports - Export and download data
12. Settings - User and organization settings
13. Admin - Administrative controls

### Route Structure
Routes follow the SIL specification with `/dashboard/*` for authenticated routes and `/auth/*` for authentication:

**Authenticated Routes:**
- `/dashboard/overview` - Dashboard overview
- `/dashboard/portfolios`, `/dashboard/portfolios/:id` - Portfolio list and detail
- `/dashboard/properties`, `/dashboard/properties/:id` - Property list and detail
- `/dashboard/leases`, `/dashboard/leases/:id`, `/dashboard/leases/upload` - Lease list, detail, and upload
- `/dashboard/discrepancies`, `/dashboard/discrepancies/:id` - Discrepancy list and detail
- `/dashboard/cam-reconciliations`, `/dashboard/cam-reconciliations/:id` - CAM list and detail
- `/dashboard/documents` - Document library
- `/dashboard/invoices` - Invoice tracking
- `/dashboard/calendar` - Calendar view
- `/dashboard/reports`, `/dashboard/reports/:id` - Report list and detail
- `/dashboard/exports`, `/dashboard/exports/new` - Export management
- `/dashboard/settings` - Settings page
- `/dashboard/admin` - Admin panel

**Authentication Routes:**
- `/auth/login` - User login
- `/auth/register` - User registration
- `/auth/forgot-password` - Password recovery
- `/auth/reset-password` - Password reset

---

## Data Display

### Tables
- Responsive with horizontal scroll on mobile
- Sortable columns
- Filterable by status and search term
- Pagination for large datasets
- Skeleton loaders for data fetching

### Charts
- Line charts for trends (recovery, rates)
- Bar charts for comparisons
- Pie charts for portfolio composition
- Sparklines for quick metrics
- Responsive and interactive

### Status Indicators
- **Leases**: Active, Expired, Pending, Terminated
- **Discrepancies**: Open, In-Review, Resolved, Recovered, Dismissed, False-Positive
- **Invoices**: Paid, Pending, Overdue, Disputed
- **Reports**: Draft, Reviewed, Final, Distributed
- **CAM**: Draft, Submitted, Approved, Finalized, Rejected

---

## Form Design

### Input Validation
- Real-time field validation using react-hook-form
- Visual error states with helpful messages
- Required field indicators
- Input masking where appropriate

### Form Modals
- New Lease Modal
- Edit Lease Modal
- New Discrepancy Modal
- New Report Modal
- New CAM Modal
- File Upload Modal

---

## Accessibility

### Compliance
- WCAG 2.1 Level AA standards
- Keyboard navigation support
- Screen reader compatible
- Color contrast ratios ≥ 4.5:1 for normal text
- Focus management and visible focus indicators

### Components
- ARIA labels and descriptions
- Semantic HTML
- Proper heading hierarchy
- Skip navigation links
- Form labels and instructions

---

## Performance

### Code Splitting
- Route-based code splitting with React Router
- Dynamic imports for modals and heavy components
- Lazy loading for data tables

### Build Optimization
- Tree-shaking of unused components
- CSS optimization via Tailwind
- JavaScript minification and compression
- Asset optimization

---

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ JavaScript support
- CSS Grid and Flexbox support
- LocalStorage for preferences
- Service Worker for PWA functionality

---

## Future Considerations
1. Real-time collaboration features
2. Advanced search with full-text indexing
3. Custom dashboard widgets
4. Automated report generation
5. Integration with external systems
6. Mobile app using React Native
