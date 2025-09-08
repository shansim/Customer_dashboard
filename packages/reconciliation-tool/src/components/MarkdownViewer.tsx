import React, { useState, useRef, useEffect } from 'react';
import { FileText, Eye, Download, X, Menu, ChevronLeft } from 'lucide-react';

interface MarkdownViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<string>('problem');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Handle scroll to update active section
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      if (!contentRef.current) return;

      const container = contentRef.current;
      const scrollTop = container.scrollTop;
      
      // Find which section is currently in view
      let currentSection = 'problem';
      Object.entries(sectionRefs.current).forEach(([sectionId, element]) => {
        if (element) {
          const elementTop = element.offsetTop - container.offsetTop;
          if (scrollTop >= elementTop - 100) {
            currentSection = sectionId;
          }
        }
      });
      
      setActiveSection(currentSection);
    };

    const container = contentRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [isOpen]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      const menuButton = document.getElementById('mobile-menu-button');
      
      if (sidebar && !sidebar.contains(event.target as Node) && 
          menuButton && !menuButton.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsSidebarOpen(false);
      setActiveSection('problem');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const markdownContent = `# Mini Reconciliation Tool - Product Requirements Document
Niobi Software Developer Intern Technical Assessment

## Problem Analysis & Approach

When I approached this challenge, I recognized that building a reconciliation tool requires understanding the real-world complexities treasury teams face. Rather than just comparing two files, I needed to address data quality issues, varying formats, and the need for actionable insights.

I broke down the core problem into four key challenges:
1. Data Ingestion - Handle inconsistent file formats and data quality
2. Transaction Matching - Develop reliable matching algorithms
3. Discrepancy Analysis - Categorize and prioritize differences effectively
4. Result Presentation - Present complex data in an actionable format

## User Flow Guide & Feature Walkthrough

### File Upload & Setup
• **Upload Files**: Drag-and-drop or click to upload Internal System Export and Provider Statement
• **Format Support**: CSV, Excel (.xlsx, .xls), LibreOffice (.ods) files up to 10MB
• **Validation**: Real-time file validation with clear error messages
• **Preview**: Transaction count and file details displayed after successful upload

### Analysis Process
• **Initiate**: Click "Analyze Transactions" when both files are uploaded
• **Processing**: Real-time progress indicator during analysis (1-3 seconds typical)
• **Matching**: Reference-based matching with automatic data normalization
• **Results**: Comprehensive dashboard with summary statistics and visual charts

### Dashboard Overview
• **Summary Cards**: Total transactions, amounts, and match rates with visual progress bars
• **Circle Chart**: Interactive visualization showing transaction distribution by category
• **Color Coding**: Green (perfect matches), Yellow (issues), Purple (duplicates), Red (unmatched)
• **Key Metrics**: Overall match rate, discrepancy counts, and financial totals

### Transaction Categories
• **Matched Transactions**: Found in both files with filtering options (All/Perfect/Issues)
• **Internal Only**: Missing from provider - potential processing failures
• **Provider Only**: Missing from internal - possible unauthorized transactions
• **Duplicates**: Multiple instances of same reference ID with risk assessment

### Advanced Analysis Features
• **Full-Screen Views**: Detailed transaction examination with pagination (50 per page)
• **Smart Filtering**: Search across reference, description, currency fields
• **Sorting**: Click any column header to sort ascending/descending
• **Export Options**: Multiple CSV formats with action recommendations

### Export Capabilities
• **Perfect Matches**: Clean verification reports for confirmed transactions
• **Issues Summary**: Key discrepancies for quick management review
• **Issues Detailed**: Complete analysis with investigation steps
• **All Issues**: Combined report of all discrepancies and unmatched transactions
• **Duplicates**: Risk-based analysis with financial impact assessment

### Data Quality Features
• **Reference Normalization**: Automatic trimming and case standardization
• **Error Handling**: Graceful processing of malformed data with user guidance
• **Validation**: File format, size, and structure verification
• **Performance**: Optimized for datasets up to 10,000+ transactions

### Professional Workflow
• **Automated Filenames**: Timestamped exports for audit trails
• **Risk Prioritization**: High/Medium/Low severity classification
• **Action Recommendations**: Specific next steps for each discrepancy type
• **Responsive Design**: Works seamlessly on desktop and mobile devices

## Development Strategy

### Task 1: Core Foundation
I started with the essential requirements - file upload capability and basic transaction matching using "transaction_reference" as the primary key. This established the fundamental workflow before adding complexity.

### Task 2: Data Quality Handling
Testing revealed that real-world data has formatting inconsistencies. References like "TXN-001", "txn-001", and " TXN-001 " should match but weren't. I implemented reference normalization (trim whitespace, convert to uppercase) to ensure reliable matching.

### Task 3: Enhanced Functionality
I expanded beyond CSV support to include Excel (.xlsx, .xls) and LibreOffice (.ods) formats, recognizing that treasury teams work with various file types. I also added comprehensive discrepancy detection beyond simple presence/absence matching.

### Task 4: Production Features
The final phase focused on making the tool enterprise-ready with comprehensive export capabilities, duplicate detection, visual dashboards, and robust error handling.

## Challenges Overcome

### Business Logic Challenges

#### Challenge 1: Inconsistent Data Formatting
**Problem**: Reference IDs with varying case, whitespace, and formatting
**Solution**: Implemented comprehensive normalization strategy (trim, uppercase conversion)
**Impact**: Eliminated false negatives in transaction matching

#### Challenge 2: Multiple File Format Support
**Problem**: Treasury teams work with CSV, Excel, and other formats
**Solution**: Integrated multiple parsing libraries with unified data processing pipeline
**Impact**: Reduced user friction and increased tool adoption potential

#### Challenge 3: Discrepancy Prioritization
**Problem**: All differences treated equally, causing information overload
**Solution**: Implemented severity-based classification with percentage thresholds
**Impact**: Enables teams to focus on significant discrepancies first

#### Challenge 4: Duplicate Transaction Detection
**Problem**: Multiple instances of same transaction can indicate processing errors
**Solution**: Built risk-based categorization system with financial impact analysis
**Impact**: Proactive identification of potential double-processing issues

#### Challenge 5: Complex Data Presentation
**Problem**: Large datasets with multiple discrepancy types overwhelming users
**Solution**: Created layered interface with summary dashboard and detailed drill-down
**Impact**: Improved usability and actionable insight generation

### Technical Implementation Challenges

#### Challenge 6: Export Dropdown Z-Index & Positioning Issues
**Problem**: Export dropdowns were appearing behind other UI elements and positioning incorrectly in full-screen views
**Technical Solution**: 
• Implemented portal-style dropdowns with \`z-index: 9999\` and \`position: fixed\`
• Used \`getBoundingClientRect()\` for dynamic positioning relative to trigger buttons
• Created backdrop overlay for proper click-outside detection
**Impact**: Resolved UI layering conflicts and improved user experience

#### Challenge 7: Memory Optimization Through Debouncing
**Problem**: Real-time search across large datasets caused performance degradation and excessive re-renders
**Technical Solution**:
• Implemented 300ms debounced search with \`useRef\` for timeout management
• Separated search input state from actual filter state to prevent lag
• Added loading indicators during search processing
**Impact**: Eliminated performance bottlenecks and improved responsiveness

#### Challenge 8: Smart Auto-Retract Dropdown Behavior
**Problem**: Export dropdowns remained open when users scrolled or moved mouse away, creating poor UX
**Technical Solution**:
• Implemented comprehensive event listeners for mouse movement, scroll, and keyboard events
• Added geometric calculations to detect when mouse leaves combined button+dropdown area
• Proper cleanup of event listeners to prevent memory leaks
**Impact**: Created intuitive dropdown behavior that feels natural to users

#### Challenge 9: Filter State Management Across Components
**Problem**: Filter changes in nested components weren't properly propagating, causing UI inconsistencies
**Technical Solution**:
• Implemented proper event handling with \`preventDefault()\` and \`stopPropagation()\`
• Used \`useCallback\` hooks to prevent unnecessary re-renders
• Added debug logging to track filter state changes
**Impact**: Ensured reliable filter functionality across all components

#### Challenge 10: Performance Optimization for Large Datasets
**Problem**: Rendering thousands of transactions caused browser lag and poor user experience
**Technical Solution**:
• Implemented multi-stage memoization with \`useMemo\` for filtering and sorting
• Added pagination with 50 items per page
• Used \`React.memo\` for expensive components
• Optimized comparison functions for better sorting performance
**Impact**: Maintained smooth performance even with 10,000+ transaction datasets

#### Challenge 11: Complex State Management in Full-Screen Views
**Problem**: Managing multiple filter states, search terms, and pagination across different transaction types
**Technical Solution**:
• Implemented centralized state management with proper cleanup on modal close
• Used \`useEffect\` hooks for state synchronization
• Added proper dependency arrays to prevent infinite re-renders
**Impact**: Stable, predictable behavior across all full-screen transaction views

#### Challenge 12: Responsive Design with Complex Tables
**Problem**: Transaction tables with many columns becoming unusable on smaller screens
**Technical Solution**:
• Implemented horizontal scrolling with sticky headers
• Used responsive text sizing and padding
• Added mobile-first design principles with progressive enhancement
**Impact**: Consistent usability across all device sizes

## Core Features Implemented

### ✅ Required Features
• File Upload System: Drag-and-drop interface supporting two file inputs
• Transaction Comparison: Reference-based matching with data normalization
• Three-Category Classification:
  ○ ✅ Matched Transactions: Found in both files (with/without discrepancies)
  ○ ⚠️ Internal Only: Present in internal file, missing from provider
  ○ ❌ Provider Only: Present in provider file, missing from internal

### 🚀 Value-Added Features
• Multi-Format Support: CSV, Excel (.xlsx, .xls), LibreOffice (.ods) files
• Advanced Discrepancy Detection: Amount differences, status mismatches, currency discrepancies, timestamp analysis
• Duplicate Transaction Analysis: Risk-based categorization with financial impact assessment
• Comprehensive Export System: 14-column detailed analysis with action recommendations
• Interactive Dashboard: Visual charts, real-time statistics, and summary metrics
• Full-Screen Analysis Views: Detailed transaction examination with advanced filtering
• Smart Export Dropdowns: Context-aware export options with auto-retraction
• Responsive Design: Mobile-first approach with adaptive layouts
• Real-time Search: Instant filtering across multiple transaction fields
• Progressive Disclosure: Minimizable panels and layered information architecture

## Technical Decisions & Rationale

### Multi-Format File Processing
**Decision**: Support CSV, Excel, and LibreOffice formats
**Rationale**: Treasury teams use various tools; requiring format conversion creates friction
**Implementation**: PapaParse for CSV, SheetJS for spreadsheet formats

### Reference-Based Matching Algorithm
**Decision**: Use transaction_reference as primary matching key with normalization
**Rationale**: Reference IDs are designed to be unique identifiers across systems
**Implementation**: Hash map approach for O(1) lookup performance with trim/uppercase normalization

### Severity-Based Discrepancy Classification
**Decision**: Categorize discrepancies by severity (Perfect, Minor, Major)
**Rationale**: Not all differences require immediate attention; 5% threshold separates minor from major
**Implementation**: Percentage-based thresholds with configurable tolerance levels

## Technical Architecture

### Frontend Stack
- React 18 with TypeScript for type safety
- Tailwind CSS for responsive, modern UI
- Lucide React for consistent iconography
- PapaParse for CSV processing
- SheetJS for Excel/LibreOffice support

### Required Columns
The system expects these core fields in uploaded files:
- transaction_reference: Primary matching key
- amount: Financial comparison
- currency: Currency validation
- status: Status comparison
- timestamp: Time-based analysis
- description: Additional context
- customer_id: Optional customer tracking
- provider_id: Optional provider tracking
- fees: Optional fee analysis

## Key Assumptions Made

### Data Format Assumptions
• File Structure: Headers in first row, consistent column naming
• Required Fields: "transaction_reference", amount, status, currency minimum required
• Reference Format: Alphanumeric strings normalized during processing
• Amount Precision: 2 decimal places for currency calculations
• Timestamp Format: Consistent timezone across both files

### Business Logic Assumptions
• Currency Handling: Direct comparison without FX conversion
• Discrepancy Thresholds: 5% for amount differences, 5 minutes for timestamp tolerance
• Duplicate Definition: Multiple transactions with identical reference IDs
• Risk Assessment: Duplicate count and data consistency determine risk level

### Technical Constraints
• Processing Environment: Modern browser with JavaScript enabled
• File Size Limitations: 50MB per file for optimal performance
• Memory Management: Client-side processing with streaming for large datasets
• Data Privacy: No server-side storage or transmission of sensitive financial data

## Future Improvements

### Immediate Enhancements
• **Fuzzy Matching**: Handle typos and formatting variations in reference IDs
• **Custom Matching Rules**: User-defined criteria beyond reference-based matching
• **Batch Processing**: Support multiple provider files in single reconciliation
• **Enhanced Error Reporting**: More granular validation and user guidance

### Advanced Features
• **API Integration**: Direct connections to payment processors and banking systems
• **Historical Analysis**: Trend tracking and reconciliation performance metrics
• **Automated Workflows**: Scheduled reconciliations with alert notifications
• **Multi-currency Support**: Real-time FX rate integration for currency conversion

### Enterprise Capabilities
• **Role-based Access**: Different permission levels for team members
• **Audit Trails**: Complete reconciliation history and change tracking
• **Integration APIs**: RESTful endpoints for external system connectivity
• **Advanced Analytics**: Predictive analysis and anomaly detection

### AI-Powered Reconciliation Engine
• **Intelligent Pattern Recognition**: Machine learning models for historical data analysis
• **Fuzzy Matching Algorithm**: AI-powered similarity scoring for near-matches (90%+ confidence)
• **Anomaly Detection**: Statistical models to flag unusual transaction patterns
• **Predictive Analysis**: Forecast potential discrepancies before they occur

### Automated Flagging & Alert System
• **Real-time Risk Assessment**: Dynamic risk scoring based on multiple factors
• **Four-tier Alert System**: Critical/Medium/Low/Info alert levels with configurable thresholds
• **Pattern-based Flagging**: Identify suspicious transaction sequences
• **Velocity Checks**: Flag unusual transaction frequency or amounts

### Smart Workflow Automation
• **Auto-categorization**: AI automatically categorizes transactions by type and risk
• **Batch Processing**: Intelligent batching based on transaction characteristics
• **Automated Retry Logic**: Failed matches processed automatically with audit trail
• **Exception Handling**: Smart error recovery and escalation procedures

### Machine Learning Enhancements
• **Continuous Learning**: System learns from user feedback to improve future matching
• **Weekly Model Retraining**: Automatic model updates based on new data patterns
• **A/B Testing**: Algorithm optimization through performance comparison
• **Fraud Detection**: ML models trained to identify potentially fraudulent transactions

### Advanced Analytics & Insights
• **AI-Generated Summaries**: Natural language explanations of reconciliation results
• **Trend Explanations**: AI explains why certain patterns are occurring
• **Recommendation Engine**: Suggests process improvements based on data analysis
• **Performance Benchmarking**: Compare against industry standards and historical data

## Business Impact & Value

### Operational Efficiency
- Time Savings: Automated reconciliation vs manual comparison
- Error Reduction: Systematic detection vs human oversight
- Scalability: Handle increasing transaction volumes
- Consistency: Standardized reconciliation process

### Financial Control
- Discrepancy Detection: Early identification of financial discrepancies
- Risk Mitigation: Proactive duplicate and error detection
- Compliance: Audit trail and documentation
- Cost Reduction: Reduced manual reconciliation effort

### Decision Support
- Data Insights: Clear visibility into reconciliation performance
- Trend Analysis: Historical reconciliation patterns
- Actionable Intelligence: Prioritized discrepancy resolution
- Reporting: Comprehensive export capabilities for stakeholders`;

  const sections = [
    { id: 'problem', title: 'Problem & Solution', icon: '🎯' },
    { id: 'userflow', title: 'User Flow Guide', icon: '👤' },
    { id: 'development', title: 'Development Strategy', icon: '🛠️' },
    { id: 'challenges', title: 'Challenges Overcome', icon: '⚡' },
    { id: 'features', title: 'Core Features', icon: '✅' },
    { id: 'decisions', title: 'Technical Decisions', icon: '⚖️' },
    { id: 'architecture', title: 'Technical Architecture', icon: '🏗️' },
    { id: 'assumptions', title: 'Assumptions', icon: '💭' },
    { id: 'improvements', title: 'Future Improvements', icon: '🚀' },
    { id: 'impact', title: 'Business Impact', icon: '💼' }
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setIsSidebarOpen(false); // Close mobile sidebar when navigating
    const element = sectionRefs.current[sectionId];
    if (element && contentRef.current) {
      const container = contentRef.current;
      const elementTop = element.offsetTop - container.offsetTop;
      container.scrollTo({
        top: elementTop - 20, // 20px offset for better visibility
        behavior: 'smooth'
      });
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mini_reconciliation_documentation.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatContent = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let currentSection = '';

    lines.forEach((line, index) => {
      // Main title
      if (line.startsWith('# ')) {
        const title = line.substring(2);
        elements.push(
          <div key={index} ref={el => sectionRefs.current['problem'] = el}>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">{title}</h1>
          </div>
        );
        currentSection = 'problem';
        return;
      }

      // Section headers
      if (line.startsWith('## ')) {
        const title = line.substring(3);
        let sectionId = '';
        
        if (title.includes('Problem Analysis')) sectionId = 'problem';
        else if (title.includes('User Flow Guide')) sectionId = 'userflow';
        else if (title.includes('Development Strategy')) sectionId = 'development';
        else if (title.includes('Challenges Overcome')) sectionId = 'challenges';
        else if (title.includes('Core Features')) sectionId = 'features';
        else if (title.includes('Technical Decisions')) sectionId = 'decisions';
        else if (title.includes('Technical Architecture')) sectionId = 'architecture';
        else if (title.includes('Key Assumptions')) sectionId = 'assumptions';
        else if (title.includes('Future Improvements')) sectionId = 'improvements';
        else if (title.includes('Business Impact')) sectionId = 'impact';

        if (sectionId) {
          elements.push(
            <div key={index} ref={el => sectionRefs.current[sectionId] = el} className="mt-8 sm:mt-10 lg:mt-12 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-3 sm:mb-4 pb-2 border-b-2 border-teal-200">{title}</h2>
            </div>
          );
          currentSection = sectionId;
        }
        return;
      }

      // Subsection headers
      if (line.startsWith('### ')) {
        const title = line.substring(4);
        elements.push(
          <h3 key={index} className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 sm:mb-3 mt-4 sm:mt-6">{title}</h3>
        );
        return;
      }

      // Sub-subsection headers (for challenge categories)
      if (line.startsWith('#### ')) {
        const title = line.substring(5);
        elements.push(
          <h4 key={index} className="text-base sm:text-lg font-semibold text-teal-700 mb-2 mt-3 sm:mt-4">{title}</h4>
        );
        return;
      }

      // Bold text with decision/rationale/implementation
      if (line.includes('**')) {
        const parts = line.split('**');
        elements.push(
          <p key={index} className="mb-2 sm:mb-3 leading-relaxed text-sm sm:text-base">
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i} className="font-semibold text-gray-900">{part}</strong> : part
            )}
          </p>
        );
        return;
      }

      // Bullet points with special formatting
      if (line.startsWith('• ')) {
        const content = line.substring(2);
        if (content.includes(':')) {
          const [title, description] = content.split(':', 2);
          elements.push(
            <li key={index} className="mb-2 ml-3 sm:ml-4 text-sm sm:text-base">
              <strong className="text-gray-900">{title}:</strong>
              <span className="text-gray-700">{description}</span>
            </li>
          );
        } else {
          elements.push(
            <li key={index} className="mb-2 ml-3 sm:ml-4 text-gray-700 text-sm sm:text-base">{content}</li>
          );
        }
        return;
      }

      // Numbered lists
      if (/^\d+\./.test(line)) {
        const content = line.substring(line.indexOf('.') + 1).trim();
        elements.push(
          <li key={index} className="mb-2 ml-3 sm:ml-4 text-gray-700 text-sm sm:text-base">{content}</li>
        );
        return;
      }

      // Sub-bullet points
      if (line.startsWith('  ○ ')) {
        const content = line.substring(4);
        elements.push(
          <li key={index} className="mb-1 ml-6 sm:ml-8 text-gray-600 text-xs sm:text-sm list-disc">{content}</li>
        );
        return;
      }

      // Dash bullet points
      if (line.startsWith('- ')) {
        const content = line.substring(2);
        elements.push(
          <li key={index} className="mb-1 ml-3 sm:ml-4 text-gray-700 list-disc text-sm sm:text-base">{content}</li>
        );
        return;
      }

      // Empty lines
      if (line.trim() === '') {
        elements.push(<div key={index} className="mb-1 sm:mb-2"></div>);
        return;
      }

      // Regular paragraphs
      if (line.trim() !== '') {
        elements.push(
          <p key={index} className="mb-2 sm:mb-3 text-gray-700 leading-relaxed text-sm sm:text-base">{line}</p>
        );
      }
    });

    return elements;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-none max-h-none flex relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsSidebarOpen(false)} />
            <div 
              id="mobile-sidebar"
              className="absolute left-0 top-0 h-full w-80 bg-gradient-to-b from-teal-50 to-emerald-50 border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out"
            >
              {/* Mobile Sidebar Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600 mr-2" />
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">PRD</h2>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={downloadMarkdown}
                    className="flex items-center px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 text-sm"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>
              
              {/* Mobile Sidebar Navigation */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-all duration-200 ${
                        activeSection === section.id
                          ? 'bg-teal-100 text-teal-800 border border-teal-200 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="mr-3 text-base sm:text-lg flex-shrink-0">{section.icon}</span>
                      <span className="text-xs sm:text-sm font-medium leading-tight">{section.title}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden lg:flex w-80 bg-gradient-to-b from-teal-50 to-emerald-50 border-r border-gray-200 flex-col">
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-teal-600 mr-2" />
                <h2 className="text-lg font-bold text-gray-900">PRD</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={downloadMarkdown}
                className="flex items-center px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 text-sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </button>
            </div>
          </div>
          
          {/* Desktop Scrollable Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-all duration-200 ${
                    activeSection === section.id
                      ? 'bg-teal-100 text-teal-800 border border-teal-200 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3 text-lg flex-shrink-0">{section.icon}</span>
                  <span className="text-sm font-medium leading-tight">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header with Mobile Menu Button */}
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {/* Mobile Menu Button */}
                <button
                  id="mobile-menu-button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 mr-3 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <Menu className="h-5 w-5 text-gray-600" />
                </button>
                
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 mr-2" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Product Requirements Document</h3>
              </div>
              
              {/* Desktop Close Button */}
              <button
                onClick={onClose}
                className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
              
              {/* Mobile Close Button */}
              <button
                onClick={onClose}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            {/* Mobile Subtitle */}
            <div className="mt-2 lg:hidden">
              <div className="text-xs sm:text-sm text-gray-500">
                Niobi Software Developer Intern Technical Assessment
              </div>
            </div>
            
            {/* Desktop Subtitle */}
            <div className="hidden lg:block">
              <div className="text-sm text-gray-500 mt-1">
                Niobi Software Developer Intern Technical Assessment
              </div>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto scroll-smooth">
            <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
              <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
                {formatContent(markdownContent)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};