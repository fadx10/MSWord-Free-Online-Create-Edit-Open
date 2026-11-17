import { DEFAULT_DOCUMENT_SETTINGS, DocumentSettings } from '../types/word';

import { buildChecklistItemHtml } from '../utils/editorHelpers';

export interface WordTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  accentColor: string;
  headerText: string;
  footerText: string;
  settings: Partial<DocumentSettings>;
  contentHtml: string;
}

export const WORD_TEMPLATES: WordTemplate[] = [
  {
    id: 'blank',
    name: 'Blank document',
    category: 'General',
    description: 'Start fresh with a clean Microsoft Word page.',
    accentColor: '#185ABD',
    headerText: '',
    footerText: '',
    settings: {},
    contentHtml: `<p><br /></p>`,
  },
  {
    id: 'business-report',
    name: 'Quarterly Business Report',
    category: 'Business',
    description: 'Executive summary, KPI table, and structured findings.',
    accentColor: '#0F6CBD',
    headerText: 'Q4 Strategic Operations Review',
    footerText: 'Internal Operations Review',
    settings: {
      margins: 'normal',
      theme: 'office',
      showHeaderFooter: true,
    },
    contentHtml: `
      <h4 class="word-title">Quarterly Operations Report</h4>
      <p class="word-subtitle">Performance Review &amp; Strategic Priorities — Fiscal Q4</p>
      <h1>1. Executive Summary</h1>
      <p>Overall operational throughput increased by <strong>18.4%</strong> over the previous quarter following workflow automation across regional fulfillment centers. Customer satisfaction remained steady at <strong>94.2%</strong> while unit delivery costs declined by 6.1%.</p>
      <h1>2. Key Performance Metrics</h1>
      <table>
        <thead>
          <tr>
            <th>Department</th>
            <th>Q3 Actual</th>
            <th>Q4 Target</th>
            <th>Q4 Actual</th>
            <th>Variance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>North America Operations</td>
            <td>$1,420,000</td>
            <td>$1,500,000</td>
            <td>$1,585,000</td>
            <td>+5.7%</td>
          </tr>
          <tr>
            <td>European Distribution</td>
            <td>$980,000</td>
            <td>$1,050,000</td>
            <td>$1,092,000</td>
            <td>+4.0%</td>
          </tr>
          <tr>
            <td>Enterprise Support</td>
            <td>91.5% CSAT</td>
            <td>93.0% CSAT</td>
            <td>94.2% CSAT</td>
            <td>+1.2 pts</td>
          </tr>
        </tbody>
      </table>
      <h1>3. Next Quarter Priorities</h1>
      <ul>
        <li>Complete migration of legacy inventory ledgers to the unified regional platform.</li>
        <li>Expand supplier redundancy across two secondary logistics hubs.</li>
        <li>Publish revised onboarding playbooks for newly hired team leads.</li>
      </ul>
    `,
  },
  {
    id: 'project-proposal',
    name: 'Project Proposal & Scope',
    category: 'Business',
    description: 'Client pitch with objectives, milestones table, and budget.',
    accentColor: '#185ABD',
    headerText: 'Project Proposal — Website & Portal Modernization',
    footerText: 'Prepared by Advisory Solutions · Page {PAGE} of {NUMPAGES}',
    settings: {
      margins: 'normal',
      theme: 'office',
      showHeaderFooter: true,
    },
    contentHtml: `
      <h4 class="word-title">Project Proposal</h4>
      <p class="word-subtitle">Customer Portal Redesign &amp; Self-Service Workflow Upgrade</p>
      <p><strong>Prepared For:</strong> Northstar Retail Group &nbsp;|&nbsp; <strong>Prepared By:</strong> Horizon Digital Studio &nbsp;|&nbsp; <strong>Date:</strong> November 17, 2026</p>
      <h2>1. Executive Overview</h2>
      <p>This proposal outlines a 10-week engagement to modernize Northstar Retail Group's customer self-service portal, streamline account onboarding, and reduce support ticket volume by an estimated 30% within six months of launch.</p>
      <h2>2. Scope &amp; Deliverables</h2>
      <ul>
        <li>Comprehensive UX audit of existing checkout and order tracking journeys.</li>
        <li>Responsive component library aligned with brand accessibility standards (WCAG AA).</li>
        <li>Interactive order modification, return scheduling, and automated status notifications.</li>
      </ul>
      <h2>3. Timeline &amp; Milestones</h2>
      <table>
        <thead>
          <tr>
            <th>Phase</th>
            <th>Key Deliverable</th>
            <th>Duration</th>
            <th>Investment</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Phase 1: Discovery</td>
            <td>Stakeholder interviews &amp; technical architecture</td>
            <td>Weeks 1–2</td>
            <td>$6,500</td>
          </tr>
          <tr>
            <td>Phase 2: Design</td>
            <td>Interactive wireframes &amp; visual system</td>
            <td>Weeks 3–5</td>
            <td>$11,000</td>
          </tr>
          <tr>
            <td>Phase 3: Build &amp; QA</td>
            <td>Frontend implementation, UAT &amp; launch support</td>
            <td>Weeks 6–10</td>
            <td>$18,500</td>
          </tr>
        </tbody>
      </table>
      <div class="word-callout"><strong>Next Step:</strong> Sign and return the attached Statement of Work by December 1 to reserve the Q1 engineering sprint window.</div>
    `,
  },
  {
    id: 'client-invoice',
    name: 'Professional Service Invoice',
    category: 'Business',
    description: 'Itemized billing sheet with totals and payment instructions.',
    accentColor: '#0E7490',
    headerText: '',
    footerText: 'Thank you for your business — Payment due within 30 days',
    settings: {
      margins: 'normal',
      theme: 'facet',
      showHeaderFooter: true,
    },
    contentHtml: `
      <h4 class="word-title">INVOICE</h4>
      <p class="word-subtitle">Invoice #INV-2026-1048 &nbsp;·&nbsp; Issued: November 17, 2026 &nbsp;·&nbsp; Due: December 17, 2026</p>
      <table>
        <tbody>
          <tr>
            <td><strong>From:</strong><br />Cascade Creative Partners LLC<br />210 Pine Street, Suite 400<br />Portland, OR 97204<br />billing@cascadecreative.example</td>
            <td><strong>Bill To:</strong><br />Meridian Logistics Corp.<br />Attn: Accounts Payable<br />900 Waterfront Way<br />Seattle, WA 98101</td>
          </tr>
        </tbody>
      </table>
      <h2>Services Rendered</h2>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty / Hours</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Brand Identity &amp; Typography Guidelines</td>
            <td>24 hrs</td>
            <td>$140.00</td>
            <td>$3,360.00</td>
          </tr>
          <tr>
            <td>Annual Report Layout &amp; Print Prepress</td>
            <td>16 hrs</td>
            <td>$125.00</td>
            <td>$2,000.00</td>
          </tr>
          <tr>
            <td>Custom Iconography &amp; Chart Assets (20x)</td>
            <td>1</td>
            <td>$850.00</td>
            <td>$850.00</td>
          </tr>
          <tr>
            <td><strong>Subtotal</strong></td>
            <td></td>
            <td></td>
            <td><strong>$6,210.00</strong></td>
          </tr>
          <tr>
            <td>Tax (0% — B2B Exempt)</td>
            <td></td>
            <td></td>
            <td>$0.00</td>
          </tr>
          <tr>
            <td><strong>Total Amount Due (USD)</strong></td>
            <td></td>
            <td></td>
            <td><strong>$6,210.00</strong></td>
          </tr>
        </tbody>
      </table>
      <h2>Payment Instructions</h2>
      <p>Please remit payment via ACH transfer or check payable to <strong>Cascade Creative Partners LLC</strong>. Reference <strong>INV-2026-1048</strong> on all remittance notices.</p>
    `,
  },
  {
    id: 'sop-guide',
    name: 'Standard Operating Procedure',
    category: 'Business',
    description: 'Process playbook with metadata table and sign-off checklist.',
    accentColor: '#4338CA',
    headerText: 'SOP-OPS-014 · Standard Operating Procedure',
    footerText: 'Operations Quality Manual · Page {PAGE}',
    settings: {
      margins: 'normal',
      theme: 'office',
      showHeaderFooter: true,
    },
    contentHtml: `
      <h4 class="word-title">Standard Operating Procedure</h4>
      <p class="word-subtitle">Customer Onboarding &amp; Production Account Provisioning</p>
      <table>
        <tbody>
          <tr>
            <td><strong>Document ID:</strong> SOP-OPS-014</td>
            <td><strong>Version:</strong> 2.1</td>
          </tr>
          <tr>
            <td><strong>Owner:</strong> Implementation Team</td>
            <td><strong>Effective Date:</strong> November 17, 2026</td>
          </tr>
        </tbody>
      </table>
      <h2>1. Purpose &amp; Scope</h2>
      <p>This procedure defines the mandatory steps for provisioning enterprise workspaces, verifying security controls, and completing customer handoff within 48 hours of contract signature.</p>
      <h2>2. Verification Checklist</h2>
      ${buildChecklistItemHtml('Confirm signed agreement and billing contact details in CRM.', true)}
      ${buildChecklistItemHtml('Provision dedicated tenant environment and configure SSO domain.', false)}
      ${buildChecklistItemHtml('Run automated smoke tests for user login and data export.', false)}
      ${buildChecklistItemHtml('Send welcome kit and schedule 30-minute kickoff call.', false)}
      <h2>3. Escalation Path</h2>
      <p>If any provisioning check fails twice, log an internal ticket under <strong>Priority P2</strong> and notify the Infrastructure On-Call Lead immediately.</p>
    `,
  },
  {
    id: 'modern-resume',
    name: 'Modern Chronological Resume',
    category: 'Career',
    description: 'Clean single-column resume ready for .docx export.',
    accentColor: '#2B3A55',
    headerText: '',
    footerText: '',
    settings: {
      margins: 'narrow',
      theme: 'integral',
    },
    contentHtml: `
      <h4 class="word-title">Jordan Alvarez</h4>
      <p style="color:#595959;margin-bottom:10pt;">Senior Product Designer · Seattle, WA · jordan.alvarez@example.com · (206) 555-0194</p>
      <hr />
      <h3>Professional Summary</h3>
      <p>Product designer with 8+ years of experience crafting enterprise productivity suites, design systems, and collaborative document workflows. Proven track record shipping accessible interfaces used by millions daily.</p>
      <h3>Experience</h3>
      <p><strong>Lead Product Designer — Northwind Software</strong> (2022 – Present)</p>
      <ul>
        <li>Directed the redesign of the core desktop &amp; web editor ribbon, reducing formatting task time by 24%.</li>
        <li>Established cross-platform typography and WCAG AA contrast tokens across 14 product squads.</li>
      </ul>
      <p><strong>Product Designer — Contoso Cloud</strong> (2019 – 2022)</p>
      <ul>
        <li>Designed real-time commenting, document outline navigation, and table creation interactions.</li>
        <li>Conducted 40+ usability sessions to streamline first-time file import flows.</li>
      </ul>
      <h3>Education</h3>
      <p><strong>B.S. in Human-Centered Design &amp; Engineering</strong> — University of Washington</p>
      <h3>Core Skills</h3>
      <p>Interaction Design · Design Systems · Typography · Prototyping · Usability Research · Accessibility (WCAG)</p>
    `,
  },
  {
    id: 'cover-letter',
    name: 'Job Application Cover Letter',
    category: 'Career',
    description: 'Tailored cover letter formatted to match modern resumes.',
    accentColor: '#1E3A8A',
    headerText: '',
    footerText: '',
    settings: {
      margins: 'normal',
      theme: 'integral',
    },
    contentHtml: `
      <h4 class="word-title">Jordan Alvarez</h4>
      <p style="color:#595959;margin-bottom:12pt;">Seattle, WA · jordan.alvarez@example.com · (206) 555-0194</p>
      <hr />
      <p>November 17, 2026</p>
      <p><strong>Hiring Committee</strong><br />Pacific Horizon Labs<br />1200 Third Avenue, Suite 800<br />Seattle, WA 98101</p>
      <p><strong>Re: Application for Staff Product Designer</strong></p>
      <p>Dear Hiring Manager,</p>
      <p>I am excited to apply for the Staff Product Designer role at Pacific Horizon Labs. Having spent the past eight years designing high-density document authoring tools and collaborative enterprise software, I admire your team's commitment to speed, clarity, and thoughtful craftsmanship.</p>
      <p>In my current role as Lead Product Designer at Northwind Software, I led the overhaul of our primary workspace toolbar and typography controls, cutting average formatting time by 24% across daily active users while maintaining full WCAG AA accessibility compliance.</p>
      <p>I would welcome the opportunity to discuss how my background in design systems, user research, and cross-functional delivery can support your upcoming product roadmap. Thank you for your time and consideration.</p>
      <p><br /></p>
      <p>Sincerely,<br /><strong>Jordan Alvarez</strong></p>
    `,
  },
  {
    id: 'meeting-minutes',
    name: 'Project Meeting Minutes',
    category: 'Teamwork',
    description: 'Structured agenda, attendees, and action item table.',
    accentColor: '#107C41',
    headerText: 'Weekly Product Sync',
    footerText: 'Prepared for Project Stakeholders',
    settings: {
      margins: 'normal',
      theme: 'facet',
    },
    contentHtml: `
      <h4 class="word-title">Meeting Minutes</h4>
      <p class="word-subtitle">Product Architecture &amp; Launch Readiness Sync</p>
      <p><strong>Date:</strong> November 16, 2026 &nbsp;|&nbsp; <strong>Location:</strong> Conference Room 4B / Online</p>
      <p><strong>Attendees:</strong> Elena Rostova, Marcus Chen, Priya Nair, David Kim</p>
      <h2>Agenda Topics</h2>
      <ol>
        <li>Review file import/export accuracy across .docx and HTML formats.</li>
        <li>Finalize Q4 documentation schedule and support handoff.</li>
        <li>Assign owners for remaining QA verification items.</li>
      </ol>
      <h2>Action Items</h2>
      <table>
        <thead>
          <tr>
            <th>Action Item</th>
            <th>Owner</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Validate table cell padding during .docx export</td>
            <td>Marcus Chen</td>
            <td>Nov 20, 2026</td>
            <td>In Progress</td>
          </tr>
          <tr>
            <td>Publish updated user keyboard shortcut reference</td>
            <td>Priya Nair</td>
            <td>Nov 22, 2026</td>
            <td>Scheduled</td>
          </tr>
          <tr>
            <td>Sign off on print layout margin tolerances</td>
            <td>Elena Rostova</td>
            <td>Nov 24, 2026</td>
            <td>Pending</td>
          </tr>
        </tbody>
      </table>
    `,
  },
  {
    id: 'product-prd',
    name: 'Product Requirements (PRD)',
    category: 'Teamwork',
    description: 'Feature spec with goals, requirements table, and QA ticks.',
    accentColor: '#0369A1',
    headerText: 'Product Requirements Document',
    footerText: 'Engineering & Product Alignment · Page {PAGE}',
    settings: {
      margins: 'normal',
      theme: 'office',
      showHeaderFooter: true,
    },
    contentHtml: `
      <h4 class="word-title">Product Requirements Document</h4>
      <p class="word-subtitle">Feature: Interactive Checklists &amp; Rich Symbol Picker (v2.4)</p>
      <p><strong>Product Manager:</strong> Priya Nair &nbsp;|&nbsp; <strong>Engineering Lead:</strong> David Kim &nbsp;|&nbsp; <strong>Target Release:</strong> Q4 2026</p>
      <h2>1. Problem Statement</h2>
      <p>Users drafting project plans, formulas, and international invoices frequently leave the editor to copy mathematical operators, currency signs, or checkboxes from external tools, slowing down document creation.</p>
      <h2>2. Functional Requirements</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Requirement</th>
            <th>Priority</th>
            <th>Acceptance Criteria</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>FR-01</td>
            <td>Searchable Symbol Gallery</td>
            <td>P0</td>
            <td>Filter Math, Currency, and Emoji symbols by keyword and insert at caret.</td>
          </tr>
          <tr>
            <td>FR-02</td>
            <td>Interactive Tick Boxes</td>
            <td>P0</td>
            <td>Toggleable checkboxes persist state and export as ☑ / ☐ in .docx.</td>
          </tr>
          <tr>
            <td>FR-03</td>
            <td>Auto-Fit Table Columns</td>
            <td>P1</td>
            <td>Right-click context option switches table sizing between fixed and content fit.</td>
          </tr>
        </tbody>
      </table>
      <h2>3. Launch Readiness Sign-Off</h2>
      ${buildChecklistItemHtml('Unit & TypeScript validation passes without warnings.', true)}
      ${buildChecklistItemHtml('Round-trip .docx import/export verified across Microsoft Word.', false)}
      ${buildChecklistItemHtml('Release notes and keyboard shortcuts updated.', false)}
    `,
  },
  {
    id: 'weekly-planner',
    name: 'Weekly Planner & Checklist',
    category: 'Personal',
    description: 'Interactive tick-box task list and Monday–Friday schedule.',
    accentColor: '#059669',
    headerText: 'Weekly Focus & Schedule',
    footerText: 'Personal Productivity Planner',
    settings: {
      margins: 'narrow',
      theme: 'facet',
    },
    contentHtml: `
      <h4 class="word-title">Weekly Planner</h4>
      <p class="word-subtitle">Week of November 17 – November 23, 2026</p>
      <h2>Top 3 Priorities</h2>
      ${buildChecklistItemHtml('Finalize Q4 project budget review before Thursday 2:00 PM.', false)}
      ${buildChecklistItemHtml('Draft team quarterly goals and share for feedback.', false)}
      ${buildChecklistItemHtml('Book travel and hotel reservations for December summit.', true)}
      <h2>Daily Schedule</h2>
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Morning Focus</th>
            <th>Afternoon Focus</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Monday</strong></td>
            <td>Sprint kickoff &amp; inbox triage</td>
            <td>Deep work: architecture memo</td>
            <td>No meetings after 3 PM</td>
          </tr>
          <tr>
            <td><strong>Tuesday</strong></td>
            <td>Client status call (10:00 AM)</td>
            <td>Design review &amp; feedback</td>
            <td>Prepare slide summary</td>
          </tr>
          <tr>
            <td><strong>Wednesday</strong></td>
            <td>Budget reconciliation</td>
            <td>1:1 check-ins</td>
            <td>Send agenda early</td>
          </tr>
          <tr>
            <td><strong>Thursday</strong></td>
            <td>Executive presentation prep</td>
            <td>Q4 budget review (2:00 PM)</td>
            <td>Bring printed handouts</td>
          </tr>
          <tr>
            <td><strong>Friday</strong></td>
            <td>QA sign-off &amp; wrap-up</td>
            <td>Weekly retrospective &amp; planning</td>
            <td>Clear pending tasks</td>
          </tr>
        </tbody>
      </table>
    `,
  },
  {
    id: 'formal-letter',
    name: 'Formal Business Letter',
    category: 'Correspondence',
    description: 'Classic letterhead format with clean spacing.',
    accentColor: '#7A1C1C',
    headerText: '',
    footerText: '',
    settings: {
      margins: 'normal',
      theme: 'editorial',
    },
    contentHtml: `
      <p><strong>Aurelia Consulting Group</strong><br />450 Market Street, Suite 1200<br />San Francisco, CA 94105</p>
      <p><br /></p>
      <p>November 16, 2026</p>
      <p><br /></p>
      <p><strong>Ms. Claire Bennett</strong><br />Director of Operations<br />Fabrikam Logistics Inc.<br />780 Harbor Boulevard<br />Boston, MA 02110</p>
      <p><br /></p>
      <p>Dear Ms. Bennett,</p>
      <p>Thank you for taking the time to meet with our advisory team earlier this week regarding the upcoming supply chain modernization initiative. We are pleased to enclose our preliminary scope outline and milestone schedule for your review.</p>
      <p>Based on our discovery workshops, we recommend initiating Phase 1 with a focused four-week audit of regional warehouse dispatch procedures. This approach minimizes disruption to ongoing holiday shipments while establishing measurable baseline metrics.</p>
      <p>Please let me know if Tuesday or Thursday next week works best to review the proposed timeline with your leadership group.</p>
      <p><br /></p>
      <p>Sincerely,</p>
      <p><br /></p>
      <p><strong>Samuel Vance</strong><br />Managing Partner, Aurelia Consulting Group</p>
    `,
  },
  {
    id: 'academic-essay',
    name: 'Academic Paper (APA Style)',
    category: 'Education',
    description: 'Double-spaced scholarly paper with citations section.',
    accentColor: '#185ABD',
    headerText: 'DIGITAL TYPOGRAPHY IN MODERN WORKSPACES',
    footerText: 'Page {PAGE}',
    settings: {
      margins: 'normal',
      lineSpacing: 2.0,
      showHeaderFooter: true,
    },
    contentHtml: `
      <p style="text-align:center;"><strong>Readability and Spatial Structure in Browser-Based Document Editors</strong></p>
      <p style="text-align:center;">Alex Morgan<br />Department of Information Design, Pacific University</p>
      <p><br /></p>
      <h2>Abstract</h2>
      <p>Modern knowledge workers increasingly author, review, and distribute formatted documents within web browsers rather than native desktop binaries. This paper examines how spatial cues—including physical paper proportions, margin rulers, and hierarchical ribbon toolbars—preserve cognitive orientation and reduce formatting errors during extended writing sessions.</p>
      <h2>Introduction</h2>
      <p>Early web text editors prioritized lightweight markup over visual fidelity, creating friction when documents moved between browser drafts and formal print or .docx deliverables. Contemporary client-side rendering engines bridge this gap by combining WYSIWYG pagination metaphors with lossless OpenXML serialization.</p>
      <blockquote>"Consistent spatial anchors allow writers to focus on argument structure rather than fighting unpredictable layout shifts." (Henderson, 2024)</blockquote>
      <h2>References</h2>
      <p>Henderson, M. (2024). <em>Designing legible productivity interfaces</em>. University Press.</p>
    `,
  },
  {
    id: 'lab-report',
    name: 'Science & Lab Report',
    category: 'Education',
    description: 'Hypothesis, apparatus, results table, and conclusion.',
    accentColor: '#0F766E',
    headerText: 'CHEM-204 · Laboratory Analysis Report',
    footerText: 'Faculty of Applied Sciences · Page {PAGE} of {NUMPAGES}',
    settings: {
      margins: 'normal',
      theme: 'office',
      showHeaderFooter: true,
    },
    contentHtml: `
      <h4 class="word-title">Laboratory Report</h4>
      <p class="word-subtitle">Experiment #04: Thermal Conductivity Across Composite Alloys</p>
      <p><strong>Researcher:</strong> Maya Lin &nbsp;|&nbsp; <strong>Course:</strong> Materials Engineering 204 &nbsp;|&nbsp; <strong>Date:</strong> November 17, 2026</p>
      <h2>1. Objective &amp; Hypothesis</h2>
      <p>To measure steady-state heat transfer coefficients across three aluminum-ceramic composite samples and verify whether ceramic volume fraction correlates inversely with thermal conductivity (k).</p>
      <h2>2. Experimental Measurements</h2>
      <table>
        <thead>
          <tr>
            <th>Sample ID</th>
            <th>Ceramic Ratio (%)</th>
            <th>ΔT (°C)</th>
            <th>Measured k (W/m·K)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Alloy-A (Control)</td>
            <td>0%</td>
            <td>14.2 °C</td>
            <td>205.4</td>
          </tr>
          <tr>
            <td>Composite-B</td>
            <td>15%</td>
            <td>21.8 °C</td>
            <td>142.7</td>
          </tr>
          <tr>
            <td>Composite-C</td>
            <td>30%</td>
            <td>31.5 °C</td>
            <td>96.1</td>
          </tr>
        </tbody>
      </table>
      <h2>3. Discussion &amp; Conclusion</h2>
      <p>Measured results support the initial hypothesis: increasing ceramic reinforcement from 0% to 30% reduced thermal conductivity by 53.2% within a ±2.1% instrumentation tolerance.</p>
    `,
  },
  {
    id: 'company-newsletter',
    name: 'Company Newsletter',
    category: 'Marketing',
    description: 'Team updates, feature highlights, and upcoming dates.',
    accentColor: '#B45309',
    headerText: 'Northwind Monthly Dispatch',
    footerText: 'Internal Team Newsletter · Issue #42',
    settings: {
      margins: 'normal',
      theme: 'editorial',
      showHeaderFooter: true,
    },
    contentHtml: `
      <h4 class="word-title">The Monthly Dispatch</h4>
      <p class="word-subtitle">Issue #42 · November 2026 · Engineering, Design &amp; Community Highlights</p>
      <hr />
      <h2>Spotlight: Zero-Friction Document Workflows</h2>
      <p>This month our product and platform teams shipped native styling preservation for imported Word documents, interactive checklists, and a searchable symbol gallery—helping teams move seamlessly between browser drafts and desktop deliverables.</p>
      <div class="word-callout"><strong>Team Milestone:</strong> Customer satisfaction reached 95.4% across Q4 onboarding surveys—our highest score of the year!</div>
      <h2>Upcoming Events &amp; Key Dates</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Event</th>
            <th>Host / Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Nov 21</td>
            <td>Product Design Show &amp; Tell</td>
            <td>Main Auditorium &amp; Livestream</td>
          </tr>
          <tr>
            <td>Dec 03</td>
            <td>Annual Town Hall &amp; Awards</td>
            <td>All-Hands Virtual</td>
          </tr>
          <tr>
            <td>Dec 12</td>
            <td>Winter Engineering Hackathon</td>
            <td>Building 2 Commons</td>
          </tr>
        </tbody>
      </table>
    `,
  },
  {
    id: 'service-agreement',
    name: 'Simple Service Agreement',
    category: 'Legal',
    description: 'Clean contract outline with terms and signature blocks.',
    accentColor: '#374151',
    headerText: 'Independent Consulting Agreement',
    footerText: 'Agreement Reference #SA-2026 · Page {PAGE} of {NUMPAGES}',
    settings: {
      margins: 'normal',
      theme: 'editorial',
      showHeaderFooter: true,
    },
    contentHtml: `
      <h4 class="word-title">Service Agreement</h4>
      <p class="word-subtitle">Standard Independent Consulting &amp; Deliverable Terms</p>
      <p>This Service Agreement ("Agreement") is entered into as of <strong>November 17, 2026</strong>, by and between <strong>Client Organization Inc.</strong> ("Client") and <strong>Service Provider LLC</strong> ("Provider").</p>
      <h2>1. Scope of Services</h2>
      <p>Provider agrees to perform the advisory and technical deliverables described in Exhibit A in a diligent, professional manner consistent with prevailing industry standards.</p>
      <h2>2. Compensation &amp; Payment Terms</h2>
      <p>Client shall pay Provider according to the fee schedule set forth in Exhibit A. Undisputed invoices are payable within thirty (30) calendar days of receipt.</p>
      <h2>3. Confidentiality &amp; Ownership</h2>
      <p>Each party agrees to protect proprietary information disclosed during the engagement and use such information solely to fulfill obligations under this Agreement. Upon full payment, final custom deliverables become the property of Client.</p>
      <h2>4. Signatures</h2>
      <table>
        <tbody>
          <tr>
            <td><strong>For Client Organization Inc.</strong><br /><br />Signature: ________________________<br />Name &amp; Title:<br />Date:</td>
            <td><strong>For Service Provider LLC</strong><br /><br />Signature: ________________________<br />Name &amp; Title:<br />Date:</td>
          </tr>
        </tbody>
      </table>
    `,
  },
];

export const INITIAL_STARTER_HTML = `<p style="color:#104a9e;font-size:18pt;">This is the document.</p><p>Start typing right here, use the Microsoft Word ribbon above to format text, insert tables or images, right-click anywhere for quick actions, or open an existing <strong>.docx</strong> file from your computer via <strong>File → Open</strong>.</p>`;

export function mergeTemplateSettings(partial: Partial<DocumentSettings>): DocumentSettings {
  return {
    ...DEFAULT_DOCUMENT_SETTINGS,
    ...partial,
  };
}
