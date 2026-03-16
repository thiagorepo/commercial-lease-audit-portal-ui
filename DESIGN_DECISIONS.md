# Design Decisions

## Color System

### Primary Color: Orange (#e05d38)
**Decision**: Use orange as the primary brand color instead of blue.

**Rationale**:
- **Professional Context**: Orange conveys warmth, reliability, and professionalism while remaining distinct from the oversaturated blue market
- **Accessibility**: Orange provides excellent contrast ratios with white and light backgrounds, meeting WCAG AA and AAA standards
- **Industry Differentiation**: Orange is less common in financial/audit software, creating immediate visual distinction from competitors
- **Psychological Impact**: Orange is associated with:
  - Enthusiasm and engagement
  - Trust and stability
  - Energy and optimism
  - Action and alertness
- **Dashboard Usability**: Orange stands out in data-heavy interfaces without being overwhelming
- **Brand Identity**: Creates a unique, memorable visual identity for the LeaseAudit platform

### Color Palette Strategy
The complete color system includes:
- **Primary (Orange)**: Primary CTAs, active states, emphasis
- **Secondary (Slate)**: Supporting elements, less critical actions
- **Success (Green)**: Positive states, completed discrepancies, recovery indicators
- **Warning (Amber)**: Caution, pending reviews, at-risk items
- **Error (Red)**: Critical issues, discrepancies, problems requiring immediate attention
- **Accent (Orange)**: Highlights and decorative elements

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
All routes follow RESTful conventions:
- `/` - Dashboard
- `/portfolios`, `/portfolios/:id` - Portfolio list and detail
- `/properties`, `/properties/:id` - Property list and detail
- `/leases`, `/leases/:id` - Lease list and detail
- `/discrepancies`, `/discrepancies/:id` - Discrepancy list and detail
- `/cam-reconciliations`, `/cam-reconciliations/:id` - CAM list and detail
- `/documents` - Document library
- `/invoices` - Invoice tracking
- `/calendar` - Calendar view
- `/reports`, `/reports/:id` - Report list and detail
- `/exports`, `/exports/new` - Export management
- `/settings` - Settings page
- `/admin` - Admin panel

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
