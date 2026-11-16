import { DEFAULT_DOCUMENT_SETTINGS, DocumentSettings } from '../types/word';

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
    footerText: 'Page 1',
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
];

export const INITIAL_STARTER_HTML = `<p style="color:#104a9e;font-size:18pt;">This is the document.</p><p>Start typing right here, use the Microsoft Word ribbon above to format text, insert tables or images, right-click anywhere for quick actions, or open an existing <strong>.docx</strong> file from your computer via <strong>File → Open</strong>.</p>`;

export function mergeTemplateSettings(partial: Partial<DocumentSettings>): DocumentSettings {
  return {
    ...DEFAULT_DOCUMENT_SETTINGS,
    ...partial,
  };
}
