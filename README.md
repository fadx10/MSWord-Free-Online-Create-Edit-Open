# Word Online — Free Browser-Based MS Word & `.docx` Document Editor

[![React](https://img.shields.io/badge/React-19-185ABD?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![DOCX](https://img.shields.io/badge/Format-.docx%20%7C%20HTML%20%7C%20PDF-107C41)](#import--export-formats)
[![Live App](https://img.shields.io/badge/Live_App-Use_Online_Free-185ABD)](https://digitalphablet.com/ms-office-online-free/)

> **Live Public URL:** Use it free directly in your browser at **[https://digitalphablet.com/ms-office-online-free/](https://digitalphablet.com/ms-office-online-free/)**

**Word Online** is a free, open-source, browser-based **Microsoft Word document editor** that lets anyone **create, open, edit, format, and export `.docx` files** directly in the browser—with no installation, no account, and no server uploads.

Designed around the familiar **Microsoft Word Fluent Ribbon interface**, page rulers, right-click context menu, File Backstage view, and bottom zoom status bar, it delivers an instant desktop-grade writing experience in React and TypeScript.

---

## Key Features

### Familiar Microsoft Word Interface
- **Cobalt-Blue Program Frame & Quick Access Toolbar**: One-click **Save (`.docx`)**, **Undo**, **Redo**, **New Document**, **Open File**, **Print**, editable document title (`Document1 - Word`), live command search bar, and Ribbon collapse toggle.
- **Complete 9-Tab Fluent Ribbon + File Backstage**:
  - **File**: Classic Word Backstage view (`Home`, `New`, `Open`, `Info`, `Save As / Export`, `Print / PDF`) with drag-and-drop `.docx` import and local recent documents.
  - **Home**: Clipboard (`Cut`, `Copy`, `Paste`, `Format Painter`), Font (`Font Family`, `Font Size`, `Increase/Decrease`, `Change Case`, `Clear Formatting`, `Bold`, `Italic`, `Underline`, `Strikethrough`, `Subscript`, `Superscript`, `Highlight`, `Font Color`), Paragraph (`Bullets`, `Numbering`, `Checklist`, `Indent/Outdent`, `Line Spacing`, `Alignment`, `Shading`), live **Styles Gallery** (`Normal`, `Heading 1–3`, `Title`, `Quote`), and `Find / Replace / Select All`.
  - **Insert**: Blank Page, Page Break, interactive **8×8 Table Grid Picker**, local image insertion, Callout Box, Horizontal Line, Hyperlinks, Header & Footer toggle, Date & Time, and Quick Symbols (`©`, `®`, `™`, `€`, `±`, `→`, etc.).
  - **Draw**: Built-in **Freehand Sketch & Signature Pad** (pen color & thickness controls) plus highlighter markers.
  - **Design**: Document themes, page paper colors, page borders (`Box`, `Shadow`, `Double`), and diagonal watermarks (`CONFIDENTIAL`, `DRAFT`, `DO NOT COPY`, or custom text).
  - **Layout**: Margins (`Normal`, `Narrow`, `Moderate`, `Wide`), Orientation (`Portrait`, `Landscape`), Paper Size (`Letter`, `A4`, `Legal`), Multi-column text (`1`, `2`, `3` columns), and paragraph spacing.
  - **References**: Auto-generated **Table of Contents** from document headings, numbered **Footnotes**, and **APA Citation Builder**.
  - **Mailings**: Insert merge tokens (`«FirstName»`, `«LastName»`, `«Company»`, `«Email»`, `«Date»`) and run **Finish & Merge**.
  - **Review**: Built-in **Spelling & Repeated-Word Proofing**, **Word Count** statistics dialog, **Read Aloud** (Web Speech API), and threaded **Comments** sidebar.
  - **View**: **Read Mode**, **Print Layout**, **Web Layout**, **Ruler** toggle, **Margin Guides**, **Navigation Pane**, and zoom presets (`75%`, `100%`, `125%`, `150%`, `Page Width`).
- **Horizontal & Vertical Page Rulers**: Dynamically synchronized with active paper size, margins, and zoom level.
- **Authentic Right-Click Context Menu**: Quick menu search bar, mini formatting strip (`B`, `I`, `U`, highlight, font color), `Cut`, `Copy`, `Paste Options`, `New Comment`, `Link`, `Find`, `Read Aloud`, `Clear Formatting`, and contextual **Table Row/Column Actions** when inside a table.
- **Bottom Status Bar**: Live page count, clickable word count, proofing language, View Mode icons, and an interactive **50%–200% Zoom Slider**.

---

## Import & Export Formats

All file parsing and generation runs **100% client-side in your browser**:

| Action | Supported Formats | Engine |
| :--- | :--- | :--- |
| **Open / Import** | `.docx`, `.html`, `.htm`, `.md`, `.txt` | Style-preserving OOXML parser ([`jszip`](https://www.npmjs.com/package/jszip)) + [`mammoth`](https://www.npmjs.com/package/mammoth) fallback |
| **Download / Export** | `.docx` (OpenXML), `.html`, `.txt` | [`docx`](https://www.npmjs.com/package/docx) |
| **Print / PDF** | Clean print-ready pages | Dedicated `@media print` stylesheet |
| **Auto-Save** | Recent documents & settings (toggleable in **File → Options**) | Browser `localStorage` |

---

## Included Document Templates

Start immediately from **File → New** with built-in templates:
1. **Blank document**
2. **Quarterly Business Report** *(executive summary + KPI table)*
3. **Modern Chronological Resume**
4. **Project Meeting Minutes** *(agenda + action items table)*
5. **Formal Business Letter**
6. **Academic Paper (APA Style)** *(double-spaced with header & citations)*

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + S` / `Cmd + S` | Download document as `.docx` |
| `Ctrl + O` / `Cmd + O` | Open `.docx`, `.html`, `.md`, or `.txt` file |
| `Ctrl + F` / `Cmd + F` | Open Navigation Pane → Find |
| `Ctrl + H` / `Cmd + H` | Open Navigation Pane → Replace |
| `Ctrl + P` / `Cmd + P` | Print or Save as PDF |
| `Ctrl + B` / `I` / `U` | Bold / Italic / Underline |
| `Ctrl + L` / `E` / `R` / `J` | Align Left / Center / Right / Justify |

---

## Getting Started (Local Development)

### Prerequisites
- **Node.js** 18+ and **npm**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/word-online-docx-editor.git
cd word-online-docx-editor

# 2. Install dependencies
npm install

# 3. Start the development server (runs on http://localhost:3000)
npm run dev
```

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start Vite development server on port `3000` |
| `npm run build` | Build production bundle into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run TypeScript type-checking (`tsc --noEmit`) |

---

## Project Structure

```text
├── index.html                   # App entry HTML & typography imports
├── package.json                 # Dependencies & npm scripts
└── src/
    ├── App.tsx                  # Main Word workspace state, shortcuts & orchestration
    ├── index.css                # Fluent/Word page styles, zoom slider & @media print rules
    ├── types/
    │   ├── word.ts              # Document, Ribbon, Page, Margin & Theme types
    │   └── mammoth.d.ts         # TypeScript declarations for mammoth browser bundle
    ├── data/
    │   └── templates.ts         # Starter document & 6 built-in Word templates
    ├── utils/
    │   ├── docxEngine.ts        # .docx/.html/.md/.txt import & OpenXML .docx export
    │   ├── docxImporter.ts      # Style-preserving OOXML parser for imported .docx & .html
    │   ├── tableHelpers.ts      # Merge/split cells, table borders & Auto-Fit layout helpers
    │   └── editorHelpers.ts     # Word count stats, indentation, search highlights & proofing
    └── components/
        ├── TitleBar.tsx         # Blue Word title bar, QAT & command search
        ├── Ribbon.tsx           # 9-tab Microsoft Word Fluent Ribbon
        ├── Rulers.tsx           # Horizontal & vertical page margin rulers
        ├── EditorCanvas.tsx     # Paper sheet, margin crop marks, headers/footers & dropzone
        ├── ContextMenu.tsx      # Right-click menu with paste options & table tools
        ├── FileBackstage.tsx    # File Backstage view (Home, New, Open, Info, Export)
        ├── NavigationPane.tsx   # Headings outline + Find & Replace sidebar
        ├── CommentsPane.tsx     # Threaded document comments sidebar
        ├── Dialogs.tsx          # Word Count, Link, Draw Pad, Watermark, Citation & Mail Merge
        └── StatusBar.tsx        # Bottom status bar with View Modes & Zoom slider
```

---

## Frequently Asked Questions

**Can I open and edit `.docx` files online without Microsoft Word installed?**
Yes. Click **File → Open** (or drag and drop any `.docx` file directly onto the page) to load headings, paragraphs, lists, tables, and images into the editor, make your changes, and download an updated `.docx` file.

**Are my documents uploaded to any server?**
No. Everything—including `.docx` parsing (`mammoth`), `.docx` generation (`docx`), and recent document auto-saving (`localStorage`)—runs locally inside your browser.

**Can I save my document as a PDF?**
Yes. Use **File → Print / PDF** (or press `Ctrl+P` / `Cmd+P`) and choose **Save as PDF** in your browser's print dialog. The built-in print stylesheet hides all toolbars and rulers so only your formatted document pages print.

---

## Contributing

Contributions, bug reports, and feature suggestions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Run `npm run lint` and `npm run build` to verify your changes
4. Open a Pull Request

---

## License

This project is open source and available under the [Apache-2.0 License](https://www.apache.org/licenses/LICENSE-2.0).
