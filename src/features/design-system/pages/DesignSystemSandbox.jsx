import { useState } from 'react';
import {
  ClaudeThemeProvider,
  Heading,
  Text,
  Code,
  Button,
  IconButton,
  Badge,
  Divider,
  Spinner,
  Link,
  Avatar,
  InputField,
  TextareaField,
  SelectField,
  SearchField,
  Checkbox,
  Radio,
  Switch,
  FormRow,
  EmptyState,
  Tabs,
  Breadcrumb,
  Tag,
  BaseCard,
  KpiCard,
  Modal,
  DataGrid,
  Toolbar,
  PaginationBar,
  SectionShell,
  ModelComparisonGrid,
  ModelComparisonCard,
  Navbar,
  ToastProvider,
  useToast,
  Drawer,
} from '../../../common/design-system';

/* ── Section wrapper ── */
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <Heading variant="sub" style={{ marginBottom: 16, borderBottom: '1px solid var(--claude-color-border-cream)', paddingBottom: 8 }}>
        {title}
      </Heading>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
        {children}
      </div>
    </div>
  );
}

/* ── Toast demo inner (needs useToast hook) ── */
function ToastDemo() {
  const toast = useToast();
  return (
    <Section title="Toast">
      <Button onClick={() => toast('Profile saved successfully!', { variant: 'success' })}>Success Toast</Button>
      <Button variant="secondary" onClick={() => toast('Something went wrong.', { variant: 'error' })}>Error Toast</Button>
      <Button variant="ghost" onClick={() => toast('Interview scheduled for tomorrow.', { variant: 'info' })}>Info Toast</Button>
    </Section>
  );
}

/* ── DataGrid sample data ── */
const GRID_COLS = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'Active' ? 'success' : 'neutral'}>{v}</Badge> },
  { key: 'score', label: 'Score' },
];
const GRID_ROWS = [
  { id: 1, name: 'Alice Nguyen', role: 'Frontend Engineer', status: 'Active', score: '92/100' },
  { id: 2, name: 'Bob Tran', role: 'Backend Engineer', status: 'Inactive', score: '78/100' },
  { id: 3, name: 'Carol Le', role: 'Product Manager', status: 'Active', score: '88/100' },
];

/* ── Main sandbox ── */
export default function DesignSystemSandbox() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [checkVal, setCheckVal] = useState(false);
  const [radioVal, setRadioVal] = useState('a');
  const [switchVal, setSwitchVal] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/home' },
    { label: 'Questions', href: '/questions' },
    { label: 'Sandbox', href: '/design-system', active: true },
  ];

  return (
    <ToastProvider>
      <ClaudeThemeProvider dark={darkMode} style={{ minHeight: '100vh' }}>
        {/* Navbar */}
        <Navbar
          brand={<Heading variant="sub-sm" as="span">Intervu DS</Heading>}
          links={navLinks}
          dark={darkMode}
          cta={
            <Button size="sm" onClick={() => setDarkMode((d) => !d)}>
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </Button>
          }
        />

        <SectionShell style={{ paddingTop: 40 }}>
          {/* Breadcrumb */}
          <Breadcrumb items={[
            { label: 'Home', href: '/home' },
            { label: 'Design System', href: '/design-system' },
            { label: 'Sandbox' },
          ]} style={{ marginBottom: 32 }} />

          {/* Header */}
          <Heading variant="display" style={{ marginBottom: 8 }}>Design System Sandbox</Heading>
          <Text variant="body-lg" style={{ marginBottom: 48, color: 'var(--claude-color-text-secondary)' }}>
            All components rendered inside <Code>ClaudeThemeProvider</Code>. Parchment background should fill only this wrapper.
          </Text>

          {/* Typography */}
          <Section title="Typography — Headings">
            <div style={{ width: '100%' }}>
              <Heading variant="display">Display Heading</Heading>
              <Heading variant="section">Section Heading</Heading>
              <Heading variant="sub-lg">Sub-LG Heading</Heading>
              <Heading variant="sub">Sub Heading</Heading>
              <Heading variant="sub-sm">Sub-SM Heading</Heading>
              <Heading variant="feature">Feature Heading</Heading>
            </div>
          </Section>

          <Section title="Typography — Text">
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Text variant="body-lg">Body Large — main content prose</Text>
              <Text variant="body">Body — standard paragraph text</Text>
              <Text variant="body-sm">Body Small — compact lists</Text>
              <Text variant="body-serif">Body Serif — editorial pull-quote</Text>
              <Text variant="caption">Caption — figure descriptions</Text>
              <Text variant="label">Label — form labels</Text>
              <Text variant="overline">Overline — section classifiers</Text>
              <Text variant="micro">Micro — legal / timestamps</Text>
              <Text secondary>Secondary color text</Text>
              <Text tertiary>Tertiary color text</Text>
            </div>
          </Section>

          <Section title="Code">
            <Code>const x = 42;</Code>
            <Code block>{`function greet(name) {\n  return \`Hello, \${name}!\`;\n}`}</Code>
          </Section>

          <Divider style={{ marginBottom: 32 }} />

          {/* Buttons */}
          <Section title="Buttons">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="dark">Dark</Button>
            <Button variant="white">White</Button>
            <Button variant="ghost">Ghost</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </Section>

          <Section title="Icon Buttons">
            <IconButton aria-label="Close" variant="ghost">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </IconButton>
            <IconButton aria-label="Add" variant="filled">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </IconButton>
          </Section>

          {/* Badges */}
          <Section title="Badges">
            <Badge>Neutral</Badge>
            <Badge variant="brand">Brand</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
          </Section>

          {/* Tags */}
          <Section title="Tags">
            <Tag>React</Tag>
            <Tag active>TypeScript</Tag>
            <Tag removable onRemove={() => {}}>Node.js</Tag>
            <Tag interactive onClick={() => {}}>Python</Tag>
          </Section>

          {/* Spinners */}
          <Section title="Spinners">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </Section>

          {/* Avatar */}
          <Section title="Avatars">
            <Avatar size="sm" initials="AN" />
            <Avatar size="md" initials="BT" />
            <Avatar size="lg" initials="CL" />
          </Section>

          {/* Link */}
          <Section title="Links">
            <Link href="#">Default link</Link>
            <Link href="#" inverted style={{ background: 'var(--claude-color-surface-near-black)', padding: '4px 8px', borderRadius: 4 }}>Inverted link</Link>
          </Section>

          <Divider style={{ marginBottom: 32 }} />

          {/* Form fields */}
          <Section title="Form Fields">
            <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <InputField label="Full Name" placeholder="Alice Nguyen" hint="Your display name" />
              <InputField label="Email" type="email" placeholder="alice@example.com" required />
              <InputField label="With Error" defaultValue="bad-input" error="This field is required" />
              <TextareaField label="Bio" placeholder="Tell us about yourself…" rows={3} />
              <SelectField label="Role" options={[
                { value: '', label: 'Select role…' },
                { value: 'frontend', label: 'Frontend Engineer' },
                { value: 'backend', label: 'Backend Engineer' },
                { value: 'pm', label: 'Product Manager' },
              ]} />
              <SearchField
                label="Search questions"
                placeholder="Type to search…"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onClear={() => setSearchVal('')}
              />
            </div>
          </Section>

          <Section title="Boolean Controls">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Checkbox
                label="Remember me"
                checked={checkVal}
                onChange={(e) => setCheckVal(e.target.checked)}
              />
              <Radio
                name="demo-radio"
                value="a"
                label="Option A"
                checked={radioVal === 'a'}
                onChange={() => setRadioVal('a')}
              />
              <Radio
                name="demo-radio"
                value="b"
                label="Option B"
                checked={radioVal === 'b'}
                onChange={() => setRadioVal('b')}
              />
              <Switch
                label="Enable notifications"
                checked={switchVal}
                onChange={(e) => setSwitchVal(e.target.checked)}
              />
            </div>
          </Section>

          <Section title="Form Row">
            <div style={{ width: '100%', maxWidth: 600 }}>
              <FormRow label="Inline layout" inline>
                <InputField placeholder="First" style={{ flex: 1 }} />
                <InputField placeholder="Last" style={{ flex: 1 }} />
              </FormRow>
            </div>
          </Section>

          <Divider style={{ marginBottom: 32 }} />

          {/* Tabs */}
          <Section title="Tabs">
            <div style={{ width: '100%' }}>
              <Tabs tabs={[
                { key: 'overview', label: 'Overview', content: <Text style={{ padding: '16px 0' }}>Overview content here.</Text> },
                { key: 'details', label: 'Details', content: <Text style={{ padding: '16px 0' }}>Details content here.</Text> },
                { key: 'history', label: 'History', content: <Text style={{ padding: '16px 0' }}>History content here.</Text> },
              ]} />
            </div>
          </Section>

          <Divider style={{ marginBottom: 32 }} />

          {/* Cards */}
          <Section title="Base Cards">
            <BaseCard style={{ width: 220 }}>
              <Text>Default card</Text>
            </BaseCard>
            <BaseCard elevated style={{ width: 220 }}>
              <Text>Elevated card</Text>
            </BaseCard>
            <BaseCard interactive style={{ width: 220 }}>
              <Text>Interactive card</Text>
            </BaseCard>
            <BaseCard featured style={{ width: 220 }}>
              <Text>Featured card</Text>
            </BaseCard>
          </Section>

          <Section title="KPI Cards">
            <KpiCard label="Total Interviews" value="1,284" delta="+12%" deltaDirection="up" />
            <KpiCard label="Pass Rate" value="74%" delta="-2%" deltaDirection="down" />
            <KpiCard label="Avg Score" value="87.4" delta="0%" deltaDirection="neutral" />
          </Section>

          {/* Model Comparison */}
          <Section title="Model Comparison">
            <div style={{ width: '100%' }}>
              <ModelComparisonGrid>
                <ModelComparisonCard title="Starter" price="$0" description="Perfect for individuals exploring mock interviews." features={['5 sessions/month', 'Text feedback', 'Basic analytics']} cta="Get started" />
                <ModelComparisonCard featured title="Pro" price="$29/mo" description="For serious candidates preparing for top-tier roles." features={['Unlimited sessions', 'AI feedback', 'Advanced analytics', 'Priority support']} cta="Start free trial" />
                <ModelComparisonCard title="Enterprise" price="Custom" description="For teams and organizations at scale." features={['Custom seats', 'SSO & audit logs', 'Dedicated success manager']} cta="Contact sales" />
              </ModelComparisonGrid>
            </div>
          </Section>

          <Divider style={{ marginBottom: 32 }} />

          {/* Data Grid */}
          <Section title="Data Grid">
            <div style={{ width: '100%' }}>
              <DataGrid columns={GRID_COLS} rows={GRID_ROWS} striped />
            </div>
          </Section>

          {/* Toolbar + Pagination */}
          <Section title="Toolbar &amp; Pagination">
            <div style={{ width: '100%' }}>
              <Toolbar
                group={<SearchField placeholder="Search…" />}
                actions={<Button size="sm">Add Row</Button>}
              />
              <PaginationBar page={page} pageCount={8} onPageChange={setPage} />
            </div>
          </Section>

          <Divider style={{ marginBottom: 32 }} />

          {/* Empty State */}
          <Section title="Empty State">
            <EmptyState
              title="No interviews yet"
              body="Once you schedule your first session, it will appear here."
              actions={<Button>Schedule Interview</Button>}
            />
          </Section>

          <Divider style={{ marginBottom: 32 }} />

          {/* Modal / Drawer */}
          <Section title="Modal &amp; Drawer">
            <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
            <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
          </Section>

          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Confirm Action"
            footer={
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button onClick={() => setModalOpen(false)}>Confirm</Button>
              </div>
            }
          >
            <Text>Are you sure you want to proceed? This action cannot be undone.</Text>
          </Modal>

          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Filters">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
              <SelectField label="Role" options={[
                { value: '', label: 'All roles' },
                { value: 'frontend', label: 'Frontend' },
                { value: 'backend', label: 'Backend' },
              ]} />
              <SelectField label="Status" options={[
                { value: '', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]} />
              <Button>Apply Filters</Button>
            </div>
          </Drawer>

          {/* Toast demo */}
          <ToastDemo />

          <Divider style={{ marginBottom: 32 }} />

          {/* Section Shell demo note */}
          <Text variant="caption" secondary style={{ marginBottom: 48 }}>
            This page itself is rendered inside <Code>SectionShell</Code> + <Code>ClaudeThemeProvider</Code>. Everything above uses only <Code>--claude-*</Code> CSS tokens — no MUI, no hardcoded hex values.
          </Text>
        </SectionShell>
      </ClaudeThemeProvider>
    </ToastProvider>
  );
}
