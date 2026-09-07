import axios from 'axios';

// Base Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Storage keys for local persistence
const STORAGE_KEYS = {
  INSPECTIONS: 'lmc_inspections_v1',
  REPORTS: 'lmc_reports_v1',
  SETTINGS: 'lmc_settings_v1',
  AUTH: 'lmc_auth_user_v1',
};

// Initial realistic mock datasets for Legal Metrology inspections
const INITIAL_INSPECTIONS = [
  {
    id: 'INSP-2026-0891',
    productName: 'NutriDelight Almond Cookies 200g',
    category: 'Food & Confectionery',
    referenceId: 'REF-FMCG-2026-001',
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=60',
    status: 'COMPLIANT',
    confidenceScore: 96.4,
    createdAt: '2026-08-30T10:15:00Z',
    officer: 'Inspector R. Sharma',
    declarations: [
      { key: 'generic_name', label: 'Common / Generic Name', value: 'Almond Biscuits / Cookies', status: 'PASS', confidence: 98, rulePlaceholder: 'Applicable Rule' },
      { key: 'net_quantity', label: 'Net Quantity', value: '200 g (Standard Unit)', status: 'PASS', confidence: 97, rulePlaceholder: 'Applicable Rule' },
      { key: 'mrp', label: 'Maximum Retail Price', value: '₹ 85.00 (Incl. of all taxes)', status: 'PASS', confidence: 99, rulePlaceholder: 'Applicable Rule' },
      { key: 'unit_sale_price', label: 'Unit Sale Price (USP)', value: '₹ 0.425 per g', status: 'PASS', confidence: 94, rulePlaceholder: 'Applicable Rule' },
      { key: 'manufacturer_details', label: 'Manufacturer Name & Address', value: 'NutriBake Foods Pvt. Ltd., Plot 14, Sector 5, IMT Manesar, Gurugram, Haryana - 122050', status: 'PASS', confidence: 95, rulePlaceholder: 'Applicable Rule' },
      { key: 'customer_care', label: 'Consumer Care / Grievance Cell', value: 'Care Manager, Tel: 1800-200-8899, Email: feedback@nutribake.in', status: 'PASS', confidence: 96, rulePlaceholder: 'Applicable Rule' },
      { key: 'date_of_packing', label: 'Month & Year of Mfg / Packing', value: '07/2026', status: 'PASS', confidence: 97, rulePlaceholder: 'Applicable Rule' },
      { key: 'country_of_origin', label: 'Country of Origin', value: 'India', status: 'PASS', confidence: 99, rulePlaceholder: 'Applicable Rule' },
      { key: 'font_height_compliance', label: 'Font & Numeral Size Compliance', value: 'PDP Area: 180 sq.cm | Net Qty Font: 3.2 mm (Compliant)', status: 'PASS', confidence: 92, rulePlaceholder: 'Applicable Rule' }
    ],
    violations: [],
    boundingBoxes: [
      { id: 1, label: 'MRP & Unit Price', x: 62, y: 72, width: 28, height: 12, status: 'PASS' },
      { id: 2, label: 'Net Quantity', x: 15, y: 78, width: 22, height: 9, status: 'PASS' },
      { id: 3, label: 'Manufacturer Address', x: 12, y: 35, width: 45, height: 22, status: 'PASS' },
      { id: 4, label: 'Consumer Care Details', x: 12, y: 60, width: 42, height: 14, status: 'PASS' }
    ],
    review: {
      isReviewed: true,
      officerNotes: 'All mandatory 9 declarations verified. Font heights comply with principal display panel requirements.',
      actionTaken: 'VERIFIED_COMPLIANT'
    }
  },
  {
    id: 'INSP-2026-0892',
    productName: 'GlowSkin Hydrating Face Serum 50ml',
    category: 'Cosmetics & Personal Care',
    referenceId: 'REF-CSM-2026-014',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=60',
    status: 'NON_COMPLIANT',
    confidenceScore: 88.2,
    createdAt: '2026-08-31T14:30:00Z',
    officer: 'Inspector R. Sharma',
    declarations: [
      { key: 'generic_name', label: 'Common / Generic Name', value: 'Facial Serum', status: 'PASS', confidence: 95, rulePlaceholder: 'Applicable Rule' },
      { key: 'net_quantity', label: 'Net Quantity', value: '50 ml', status: 'PASS', confidence: 94, rulePlaceholder: 'Applicable Rule' },
      { key: 'mrp', label: 'Maximum Retail Price', value: '₹ 799.00 (Taxes missing from declaration)', status: 'FAIL', confidence: 92, rulePlaceholder: 'Applicable Rule' },
      { key: 'unit_sale_price', label: 'Unit Sale Price (USP)', value: 'Missing / Not Declared', status: 'FAIL', confidence: 91, rulePlaceholder: 'Applicable Rule' },
      { key: 'manufacturer_details', label: 'Manufacturer Name & Address', value: 'Aura Lab India, B-42 Okhla Phase 1, New Delhi', status: 'PASS', confidence: 90, rulePlaceholder: 'Applicable Rule' },
      { key: 'customer_care', label: 'Consumer Care / Grievance Cell', value: 'Email provided, Telephone number missing', status: 'FAIL', confidence: 89, rulePlaceholder: 'Applicable Rule' },
      { key: 'date_of_packing', label: 'Month & Year of Mfg / Packing', value: '08/2026', status: 'PASS', confidence: 96, rulePlaceholder: 'Applicable Rule' },
      { key: 'country_of_origin', label: 'Country of Origin', value: 'India', status: 'PASS', confidence: 98, rulePlaceholder: 'Applicable Rule' },
      { key: 'font_height_compliance', label: 'Font & Numeral Size Compliance', value: 'PDP Area: 90 sq.cm | Net Qty Font: 1.2 mm (Below Minimum Threshold)', status: 'FAIL', confidence: 85, rulePlaceholder: 'Applicable Rule' }
    ],
    violations: [
      {
        id: 'VIOL-001',
        title: 'Omission of "Inclusive of All Taxes" in MRP Declaration',
        rule: 'Applicable Rule',
        severity: 'HIGH',
        description: 'Retail sale price declaration does not state "inclusive of all taxes" or equivalent statutory phrasing.'
      },
      {
        id: 'VIOL-002',
        title: 'Absence of Unit Sale Price (USP) Declaration',
        rule: 'Applicable Rule',
        severity: 'HIGH',
        description: 'Package lacks mandatory Unit Sale Price (e.g. ₹ per ml) alongside the Maximum Retail Price.'
      },
      {
        id: 'VIOL-003',
        title: 'Incomplete Consumer Care Contact Details',
        rule: 'Applicable Rule',
        severity: 'MEDIUM',
        description: 'Mandatory consumer grievance telephone contact number is absent from consumer care block.'
      },
      {
        id: 'VIOL-004',
        title: 'Non-compliant Numeral Font Height on Principal Display Panel',
        rule: 'Applicable Rule',
        severity: 'MEDIUM',
        description: 'Net quantity numeral height is 1.2 mm, which is below the minimum prescribed height for package PDP area.'
      }
    ],
    boundingBoxes: [
      { id: 1, label: 'MRP (Tax missing)', x: 55, y: 65, width: 35, height: 12, status: 'FAIL' },
      { id: 2, label: 'Net Qty (Font size issue)', x: 18, y: 75, width: 20, height: 8, status: 'FAIL' },
      { id: 3, label: 'Incomplete Consumer Care', x: 15, y: 45, width: 40, height: 18, status: 'FAIL' }
    ],
    review: {
      isReviewed: false,
      officerNotes: '',
      actionTaken: 'PENDING_OFFICER_REVIEW'
    }
  },
  {
    id: 'INSP-2026-0893',
    productName: 'EcoSpark LED Smart Bulb 12W (Imported)',
    category: 'Electronics & Hardware',
    referenceId: 'REF-ELE-2026-089',
    imageUrl: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=600&auto=format&fit=crop&q=60',
    status: 'NEEDS_REVIEW',
    confidenceScore: 74.5,
    createdAt: '2026-09-01T09:45:00Z',
    officer: 'Inspector S. Patel',
    declarations: [
      { key: 'generic_name', label: 'Common / Generic Name', value: 'LED Lamp / Bulb 12W', status: 'PASS', confidence: 93, rulePlaceholder: 'Applicable Rule' },
      { key: 'net_quantity', label: 'Net Quantity', value: '1 Unit', status: 'PASS', confidence: 95, rulePlaceholder: 'Applicable Rule' },
      { key: 'mrp', label: 'Maximum Retail Price', value: '₹ 299.00 (Incl. of all taxes)', status: 'PASS', confidence: 91, rulePlaceholder: 'Applicable Rule' },
      { key: 'unit_sale_price', label: 'Unit Sale Price (USP)', value: '₹ 299.00 per unit', status: 'PASS', confidence: 92, rulePlaceholder: 'Applicable Rule' },
      { key: 'importer_details', label: 'Importer / Packer Details', value: 'Spark Electronics LLP, Andheri East, Mumbai 400069', status: 'PASS', confidence: 88, rulePlaceholder: 'Applicable Rule' },
      { key: 'country_of_origin', label: 'Country of Origin', value: 'Low OCR clarity: "PRC / Vietnam (?)"', status: 'NEEDS_REVIEW', confidence: 58, rulePlaceholder: 'Applicable Rule' },
      { key: 'date_of_import', label: 'Month & Year of Import', value: 'Text partially obscured by barcode sticker', status: 'NEEDS_REVIEW', confidence: 52, rulePlaceholder: 'Applicable Rule' },
      { key: 'customer_care', label: 'Consumer Care / Grievance Cell', value: 'support@sparkled.in | 022-40998877', status: 'PASS', confidence: 90, rulePlaceholder: 'Applicable Rule' }
    ],
    violations: [
      {
        id: 'VIOL-005',
        title: 'Ambiguous Country of Origin Declaration',
        rule: 'Applicable Rule',
        severity: 'MEDIUM',
        description: 'Country of Origin text is faint or partially truncated. Manual officer verification required.'
      },
      {
        id: 'VIOL-006',
        title: 'Obscured Month/Year of Import Declaration',
        rule: 'Applicable Rule',
        severity: 'LOW',
        description: 'Statutory import date is partly covered by secondary warehouse barcode overlay.'
      }
    ],
    boundingBoxes: [
      { id: 1, label: 'Country of Origin (Ambiguous)', x: 45, y: 55, width: 35, height: 14, status: 'NEEDS_REVIEW' },
      { id: 2, label: 'Import Date (Obscured)', x: 45, y: 72, width: 30, height: 12, status: 'NEEDS_REVIEW' }
    ],
    review: {
      isReviewed: false,
      officerNotes: 'High glare detected on imported label panel. Requires officer visual re-confirmation.',
      actionTaken: 'FLAGGED_FOR_MANUAL_AUDIT'
    }
  }
];

// Helper to get stored inspections or initialize
function getStoredInspections() {
  const data = localStorage.getItem(STORAGE_KEYS.INSPECTIONS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(INITIAL_INSPECTIONS));
    return INITIAL_INSPECTIONS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing stored inspections', e);
    return INITIAL_INSPECTIONS;
  }
}

function saveStoredInspections(list) {
  localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(list));
}

// Simulated network delay helper
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

// Exported API Services
export const api = {
  // Authentication
  auth: {
    async login(credentials) {
  try {
    const response = await apiClient.post('/auth/login', {
      username: credentials.username,
      password: credentials.password,
    });

    const data = response.data;
    console.log('REAL LOGIN RESPONSE:', data);

    // Store real JWT token
    localStorage.setItem('auth_token', data.access_token);

    // Store real backend user
    localStorage.setItem(
      STORAGE_KEYS.AUTH,
      JSON.stringify(data.user)
    );

    return {
      success: true,
      user: data.user,
      token: data.access_token,
    };
  } catch (error) {
    console.error('Login error:', error);

    return {
      success: false,
      message:
        error.response?.data?.detail ||
        'Invalid username or password',
    };
  }
},
    async getCurrentUser() {
  const token = localStorage.getItem('auth_token');
  const data = localStorage.getItem(STORAGE_KEYS.AUTH);

  if (!token || !data) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
},
    async logout() {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      return { success: true };
    }
  },

  // Dashboard Summary & Analytics
dashboard: {
  async getStats() {
    try {
      const response = await apiClient.get('/dashboard/stats');

      return {
        totalInspections: response.data.total_inspections,
        compliantCount: response.data.compliant_count,
        nonCompliantCount: response.data.non_compliant_count,
        needsReviewCount: response.data.needs_review_count,
        complianceRate: response.data.compliance_rate,
        recentInspections: (response.data.recent_inspections || []).map(item => ({
  ...item,
  productName: item.product_name,
  createdAt: item.created_at,
  confidenceScore: item.confidence_score,
  imageUrl: item.image_url || null,
})),
        categoryBreakdown: response.data.category_distribution || [],
        frequentViolations: (response.data.violation_distribution || []).map(item => ({
  title: item.field_name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase()),
  count: item.count,
  rulePlaceholder: item.rule_clause_reference || 'Applicable Rule',
})),
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  }
},

  // Inspection Workflow
  inspection: {
    async create(data) {
  try {
    const response = await apiClient.post('/inspections', {
      product_name: data.productName,
      brand_name: data.brandName || null,
      category: data.category,
      package_type: data.packageType || 'Standard Pre-packaged',
      is_imported: data.isImported || false,
      reference_id: data.referenceId || null,
      notes: data.notes || null,
    });

    return response.data;
  } catch (error) {
    console.error('Create inspection error:', error);
    throw error;
  }
},
async uploadImage(inspectionId, file, imageType = 'PDP') {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('image_type', imageType);

    const response = await apiClient.post(
      `/inspections/${inspectionId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
},
async triggerAnalysis(inspectionId) {
  try {
    const response = await apiClient.post(
      '/analysis/trigger',
      {
        inspection_id: inspectionId,
        force_reprocess: false,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Analysis trigger error:', error);
    throw error;
  }
},

async getById(id) {
  try {
    const response = await apiClient.get(`/inspections/${id}`);

    const data = response.data;
    const firstImage = data.images?.[0];

    return {
      ...data,
      imageUrl: firstImage?.url
        ? `${apiClient.defaults.baseURL.replace('/api', '')}${firstImage.url}`
        : null,
    };
  } catch (error) {
    console.error('Get inspection error:', error);
    throw error;
  }
},

    async updateReview(id, reviewPayload) {
      await delay(350);
      const inspections = getStoredInspections();
      const index = inspections.findIndex(i => i.id === id);
      if (index === -1) {
        throw new Error(`Inspection ${id} not found`);
      }
      inspections[index].review = {
        ...inspections[index].review,
        ...reviewPayload,
        isReviewed: true,
        reviewedAt: new Date().toISOString(),
      };
      if (reviewPayload.overrideStatus) {
        inspections[index].status = reviewPayload.overrideStatus;
      }
      saveStoredInspections(inspections);
      return inspections[index];
    }
  },

  // History & Filters
  history: {
    async list(filters = {}) {
      await delay(350);
      let list = getStoredInspections();

      if (filters.status && filters.status !== 'ALL') {
        list = list.filter(item => item.status === filters.status);
      }
      if (filters.category && filters.category !== 'ALL') {
        list = list.filter(item => item.category === filters.category);
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        list = list.filter(item => 
          item.id.toLowerCase().includes(query) ||
          item.productName.toLowerCase().includes(query) ||
          item.referenceId.toLowerCase().includes(query)
        );
      }

      return list;
    }
  },

  // Reports
  reports: {
    async list() {
      await delay(300);
      const inspections = getStoredInspections();
      return inspections.map(i => ({
        reportId: `REP-${i.id.replace('INSP-', '')}`,
        inspectionId: i.id,
        productName: i.productName,
        category: i.category,
        status: i.status,
        dateGenerated: i.createdAt,
        violationsCount: i.violations.length,
        officer: i.officer,
        referenceId: i.referenceId,
      }));
    },

    async getReportDetails(inspectionId) {
      await delay(300);
      const inspections = getStoredInspections();
      const item = inspections.find(i => i.id === inspectionId);
      if (!item) throw new Error('Report not found');

      return {
        reportId: `REP-${item.id.replace('INSP-', '')}`,
        inspection: item,
        generatedAt: new Date().toISOString(),
        department: 'Department of Consumer Affairs, Legal Metrology Division',
        jurisdiction: 'State Enforcement Wing - Zone 04',
        statutoryAuthority: 'Legal Metrology Enforcement Directorate',
        complianceSummary: item.status === 'COMPLIANT' 
          ? 'Package conforms to mandatory declarations requirements.' 
          : item.status === 'NON_COMPLIANT'
          ? 'Package exhibits statutory declaration violations as listed under Applicable Rule.'
          : 'Package exhibits partial declaration ambiguities requiring manual inspection verification.'
      };
    }
  },

  // Settings
  settings: {
    async get() {
      await delay(200);
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
      return {
        officerName: 'Inspector R. Sharma',
        officerId: 'LM-DEL-2024-88',
        zone: 'North Zone - Division 04',
        emailNotifications: true,
        ocrConfidenceThreshold: 85,
        strictFontMeasurement: true,
        autoFlagSlackFill: true,
        simulatedDelayMs: 1500,
        apiEndpoint: 'http://localhost:8000/api/v1',
      };
    },
    async update(newSettings) {
      await delay(300);
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      return newSettings;
    }
  }
};

export default apiClient;
