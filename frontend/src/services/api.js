import axios from 'axios';

// Base Axios instance
const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
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

// Storage keys
const STORAGE_KEYS = {
  INSPECTIONS: 'lmc_inspections_v1',
  REPORTS: 'lmc_reports_v1',
  SETTINGS: 'lmc_settings_v1',
  AUTH: 'lmc_auth_user_v1',
};

// -----------------------------------------------------------------------------
// Existing mock/local data used by Reports/Settings only.
// History now uses the real backend API.
// -----------------------------------------------------------------------------

const INITIAL_INSPECTIONS = [
  {
    id: 'INSP-2026-0891',
    productName: 'NutriDelight Almond Cookies 200g',
    category: 'Food & Confectionery',
    referenceId: 'REF-FMCG-2026-001',
    imageUrl:
      'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=60',
    status: 'COMPLIANT',
    confidenceScore: 96.4,
    createdAt: '2026-08-30T10:15:00Z',
    officer: 'Inspector R. Sharma',
    declarations: [],
    violations: [],
    boundingBoxes: [],
    review: {
      isReviewed: true,
      officerNotes:
        'All mandatory 9 declarations verified. Font heights comply with principal display panel requirements.',
      actionTaken: 'VERIFIED_COMPLIANT',
    },
  },
  {
    id: 'INSP-2026-0892',
    productName: 'GlowSkin Hydrating Face Serum 50ml',
    category: 'Cosmetics & Personal Care',
    referenceId: 'REF-CSM-2026-014',
    imageUrl:
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=60',
    status: 'NON_COMPLIANT',
    confidenceScore: 88.2,
    createdAt: '2026-08-31T14:30:00Z',
    officer: 'Inspector R. Sharma',
    declarations: [],
    violations: [],
    boundingBoxes: [],
    review: {
      isReviewed: false,
      officerNotes: '',
      actionTaken: 'PENDING_OFFICER_REVIEW',
    },
  },
  {
    id: 'INSP-2026-0893',
    productName: 'EcoSpark LED Smart Bulb 12W (Imported)',
    category: 'Electronics & Hardware',
    referenceId: 'REF-ELE-2026-089',
    imageUrl:
      'https://images.unsplash.com/photo-1550985616-10810253b84d?w=600&auto=format&fit=crop&q=60',
    status: 'NEEDS_REVIEW',
    confidenceScore: 74.5,
    createdAt: '2026-09-01T09:45:00Z',
    officer: 'Inspector S. Patel',
    declarations: [],
    violations: [],
    boundingBoxes: [],
    review: {
      isReviewed: false,
      officerNotes:
        'High glare detected on imported label panel. Requires officer visual re-confirmation.',
      actionTaken: 'FLAGGED_FOR_MANUAL_AUDIT',
    },
  },
];

function getStoredInspections() {
  const data = localStorage.getItem(STORAGE_KEYS.INSPECTIONS);

  if (!data) {
    localStorage.setItem(
      STORAGE_KEYS.INSPECTIONS,
      JSON.stringify(INITIAL_INSPECTIONS)
    );
    return INITIAL_INSPECTIONS;
  }

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing stored inspections', error);
    return INITIAL_INSPECTIONS;
  }
}

function saveStoredInspections(list) {
  localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(list));
}

const delay = (ms = 400) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// -----------------------------------------------------------------------------
// API
// -----------------------------------------------------------------------------

export const api = {
  // ===========================================================================
  // Authentication
  // ===========================================================================

  auth: {
    async login(credentials) {
      try {
        const response = await apiClient.post('/auth/login', {
          username: credentials.username,
          password: credentials.password,
        });

        const data = response.data;

        console.log('REAL LOGIN RESPONSE:', data);

        localStorage.setItem('auth_token', data.access_token);

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
      } catch (error) {
        return null;
      }
    },

    async logout() {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      localStorage.removeItem('auth_token');

      return {
        success: true,
      };
    },
  },

  // ===========================================================================
  // Dashboard
  // ===========================================================================

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

          recentInspections: (
            response.data.recent_inspections || []
          ).map((item) => ({
            ...item,
            productName: item.product_name,
            createdAt: item.created_at,
            confidenceScore: item.confidence_score,
            imageUrl: item.image_url || null,
          })),

          categoryBreakdown:
            response.data.category_distribution || [],

          frequentViolations: (
            response.data.violation_distribution || []
          ).map((item) => ({
            title: item.field_name
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (char) => char.toUpperCase()),
            count: item.count,
            rulePlaceholder:
              item.rule_clause_reference || 'Applicable Rule',
          })),
        };
      } catch (error) {
        console.error('Dashboard stats error:', error);
        throw error;
      }
    },
  },

  // ===========================================================================
  // Inspection Workflow
  // ===========================================================================

  inspection: {
    async create(data) {
      try {
        const response = await apiClient.post('/inspections', {
          product_name: data.productName,
          brand_name: data.brandName || null,
          category: data.category,
          package_type:
            data.packageType || 'Standard Pre-packaged',
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
    const images = data.images || [];
    const firstImage = images[0];

    const findings = data.findings || [];

    // Only failed findings are actual violations.
    const violations = findings
      .filter((finding) => finding.result === 'FAIL')
      .map((finding) => ({
        id: finding.id,
        title:
          finding.field_name ||
          finding.field ||
          'Compliance Violation',
        field:
          finding.field_name ||
          finding.field ||
          null,
        reason:
          finding.reason ||
          'The declaration did not satisfy the applicable compliance rule.',
        result: finding.result,
        confidence: finding.confidence,
        ruleId: finding.rule_id,
        ruleVersion: finding.rule_version,
        evidenceImageId: finding.evidence_image_id,
        boundingBox: finding.bounding_box,
      }));

    return {
      ...data,
      images,
      imageUrl: firstImage?.url
        ? `${apiClient.defaults.baseURL.replace('/api', '')}${firstImage.url}`
        : null,
      violations,
    };
  } catch (error) {
    console.error('Get inspection error:', error);
    throw error;
  }
},

    // -------------------------------------------------------------------------
    // Officer Review
    // Uses the REAL backend /reviews API.
    // -------------------------------------------------------------------------

 async updateReview(id, reviewPayload) {
  try {
    const response = await apiClient.post(
      `/reviews?inspection_id=${encodeURIComponent(id)}`,
      {
        action_type: reviewPayload.actionType,
        new_status: reviewPayload.newStatus,
        comments: reviewPayload.comments || null,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Update review error:', error);

    // Convert FastAPI validation errors into a safe string
    const detail = error.response?.data?.detail;

    let message = 'Failed to save officer review';

    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail
        .map(item => item.msg || 'Validation error')
        .join(', ');
    } else if (detail) {
      message = JSON.stringify(detail);
    }

    throw new Error(message);
  }
},

    async getReviews(id) {
      try {
        const response = await apiClient.get(
          `/reviews/${id}`
        );

        return response.data || [];
      } catch (error) {
        console.error('Get reviews error:', error);
        throw error;
      }
    },
  },

  // ===========================================================================
  // History & Filters
  // ===========================================================================

  history: {
    async list(filters = {}) {
      try {
        const params = {
          page: filters.page || 1,
          page_size: filters.pageSize || 100,
        };

        if (filters.search?.trim()) {
          params.search = filters.search.trim();
        }

        if (
          filters.status &&
          filters.status !== 'ALL'
        ) {
          params.overall_status = filters.status;
        }

        if (
          filters.category &&
          filters.category !== 'ALL'
        ) {
          params.category = filters.category;
        }

        const response = await apiClient.get(
          '/inspections',
          {
            params,
          }
        );

        return (response.data || []).map((item) => ({
          id: item.inspection_code || item.id,
          backendId: item.id,

          referenceId:
            item.reference_id || '—',

          productName:
            item.product_name || 'Unknown Product',

          category:
            item.category || '—',

          status:
            item.overall_status ||
            item.status ||
            'NEEDS_REVIEW',

          confidenceScore:
            Number(item.confidence_score || 0),

          createdAt: item.created_at,

          imageUrl: null,

          violations: [],

          officer: 'Inspector',
        }));
      } catch (error) {
        console.error('History API error:', error);
        throw error;
      }
    },
  },

  // ===========================================================================
  // Reports
  // ===========================================================================

  reports: {
    async list() {
      await delay(300);

      const inspections = getStoredInspections();

      return inspections.map((item) => ({
        reportId: `REP-${item.id.replace(
          'INSP-',
          ''
        )}`,

        inspectionId: item.id,
        productName: item.productName,
        category: item.category,
        status: item.status,
        dateGenerated: item.createdAt,
        violationsCount: item.violations.length,
        officer: item.officer,
        referenceId: item.referenceId,
      }));
    },

    async getReportDetails(inspectionId) {
      await delay(300);

      const inspections = getStoredInspections();

      const item = inspections.find(
        (i) => i.id === inspectionId
      );

      if (!item) {
        throw new Error('Report not found');
      }

      return {
        reportId: `REP-${item.id.replace(
          'INSP-',
          ''
        )}`,

        inspection: item,

        generatedAt: new Date().toISOString(),

        department:
          'Department of Consumer Affairs, Legal Metrology Division',

        jurisdiction:
          'State Enforcement Wing - Zone 04',

        statutoryAuthority:
          'Legal Metrology Enforcement Directorate',

        complianceSummary:
          item.status === 'COMPLIANT'
            ? 'Package conforms to mandatory declarations requirements.'
            : item.status === 'NON_COMPLIANT'
            ? 'Package exhibits statutory declaration violations as listed under Applicable Rule.'
            : 'Package exhibits partial declaration ambiguities requiring manual inspection verification.',
      };
    },
  },

  // ===========================================================================
  // Settings
  // ===========================================================================

  settings: {
    async get() {
      await delay(200);

      const saved = localStorage.getItem(
        STORAGE_KEYS.SETTINGS
      );

      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (error) {
          // Fall through to defaults
        }
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
        apiEndpoint:
          'http://localhost:8000/api/v1',
      };
    },

    async update(newSettings) {
      await delay(300);

      localStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(newSettings)
      );

      return newSettings;
    },
  },
};

export default apiClient;