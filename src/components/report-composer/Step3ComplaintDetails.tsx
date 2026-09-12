import React, { useState, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import {
  Shield,
  FileText,
  MapPin,
  Paperclip,
  ChevronDown,
  Lock,
  Info,
  Calendar,
  Clock,
  Repeat,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Coins,
} from 'lucide-react';
import { SectionKey } from '../../theme/tokens';
import { DraftReport, ReportLocationData, MentionedParty, isMeaningfulMentionedParty } from '../../services/types';
import { VisitorSessionService } from '../../services/visitorSessionService';
import {
  SEGMENT_SUBCATEGORIES,
  INTIMATE_WHAT_HAPPENED_OPTIONS,
  INTIMATE_PLATFORMS,
} from '../../data/reportOptions';
import {
  getReportSubjectConfig,
  SubjectTypeValue,
} from '../../data/reportSubjectOptions';
import {
  DIVISIONS,
  DivisionInfo,
  DistrictInfo,
  getDistrictsByDivision,
  getDivisionByStoredName,
  getDistrictByStoredName,
} from '../../data/districts';
import {
  UpazilaInfo,
  getUpazilasByDistrict,
  getUpazilaByStoredName,
} from '../../data/upazilas';
import { Accordion } from '../ui/Accordion';
import { Toggle } from '../ui/Toggle';
import { ImageAttachmentPicker, AttachedImagePreview } from '../media/ImageAttachmentPicker';

export interface Step3Handle {
  validateAndProceed: () => boolean;
}

export type ReporterLocationGateState =
  | 'checking'
  | 'required'
  | 'requesting'
  | 'verified'
  | 'denied'
  | 'unavailable';

export interface Step3ComplaintDetailsProps {
  segment: SectionKey;
  formData: DraftReport;
  pendingImages: AttachedImagePreview[];
  onPendingImagesChange: (images: AttachedImagePreview[]) => void;
  onUpdateFormData: (updates: Partial<DraftReport>) => void;
  onBack?: () => void;
  onNext?: () => void;
  initialOpenSection?: 'narrative' | 'location' | 'identity' | 'parties' | 'attachments';
  language: 'bn' | 'en';
}

const getLocalToday = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const RICKSHAW_OPERATOR_OPTIONS: { value: SubjectTypeValue; labelBn: string; labelEn: string }[] = [
  {
    value: 'business',
    labelBn: 'চার্জিং স্টেশন / গ্যারেজ',
    labelEn: 'Charging Station / Garage',
  },
  {
    value: 'individual',
    labelBn: 'পরিচালনাকারী ব্যক্তি',
    labelEn: 'Individual Operator',
  },
  {
    value: 'organization',
    labelBn: 'প্রতিষ্ঠান / ভবন কর্তৃপক্ষ',
    labelEn: 'Organization / Building Authority',
  },
  {
    value: 'unknown',
    labelBn: 'অজ্ঞাত / নিশ্চিত নই',
    labelEn: 'Unknown / Not Sure',
  },
];

export const Step3ComplaintDetails = forwardRef<Step3Handle, Step3ComplaintDetailsProps>(
  (
    {
      segment,
      formData,
      pendingImages,
      onPendingImagesChange,
      onUpdateFormData,
      initialOpenSection,
      language,
    },
    ref
  ) => {
    const todayLocal = getLocalToday();

    // Segment structure conditions
    const showsPartySection = segment === 'rickshaw' || segment === 'extortion';
    const showsIdentitySection = segment === 'harassment';
    const isUtilityReport = (segment as string) === 'utility' || segment === 'load_shedding';
    const isLoadShedding = isUtilityReport && formData.subcategoryId === 'load-shedding-outage';
    const isGasShortage = isUtilityReport && formData.subcategoryId === 'gas-shortage';
    const isExcessElectricityBill = isUtilityReport && formData.subcategoryId === 'excess-electricity-bill';

    // Determine active subcategory option & context
    const currentSubcategoryOption = (SEGMENT_SUBCATEGORIES[segment] || []).find(
      (s) => s.id === formData.subcategoryId
    );
    const isDigitalHarassment =
      segment === 'harassment' &&
      (currentSubcategoryOption?.categoryGroup === 'digital_intimate' ||
        currentSubcategoryOption?.id === 'blackmail-coercion');

    // Contextual subject configuration for Rickshaw & Extortion
    const subjectConfig = getReportSubjectConfig(segment, formData.subcategoryId);

    // Conditional: hide frequency for Illegal Charging Station reports
    const hideFrequency =
      segment === 'rickshaw' && formData.subcategoryId === 'charging-station-location';

    // Charging station unified operator party logic
    const isChargingStationOperator =
      segment === 'rickshaw' &&
      (formData.subcategoryId === 'charging-station-location' || !formData.subcategoryId);

    const hasChargingStationOperatorData = Boolean(
      formData.reportedSubject?.trim() ||
      formData.roleOrDesignation?.trim() ||
      formData.publicProfileHandle?.trim() ||
      formData.identifyingDescription?.trim() ||
      formData.organization?.trim()
    );

    const hasExtortionPrimaryPartyData = Boolean(
      formData.reportedSubject?.trim() ||
      formData.roleOrDesignation?.trim() ||
      formData.organization?.trim() ||
      formData.publicProfileHandle?.trim() ||
      formData.identifyingDescription?.trim()
    );

    const hasExtortionPartyData = Boolean(
      hasExtortionPrimaryPartyData ||
      (formData.mentionedParties && formData.mentionedParties.some(isMeaningfulMentionedParty))
    );

    const handleOperatorNameChange = (val: string) => {
      if (formData.subjectType === 'organization') {
        onUpdateFormData({
          reportedSubject: val,
          organization: val,
        });
      } else {
        onUpdateFormData({
          reportedSubject: val,
          organization: undefined,
        });
      }
    };

    // Normalize old draft for charging station operator where only organization was set
    useEffect(() => {
      if (isChargingStationOperator) {
        if (!formData.reportedSubject?.trim() && formData.organization?.trim()) {
          onUpdateFormData({
            reportedSubject: formData.organization.trim(),
            organization: formData.subjectType === 'organization' ? formData.organization.trim() : undefined,
          });
        }
      }
    }, [isChargingStationOperator, formData.reportedSubject, formData.organization, formData.subjectType, onUpdateFormData]);

    // Accordion visibility states - Core sections are open/non-collapsible
    const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => ({
      narrative: true,
      location: true,
      identity: showsIdentitySection,
      parties: isChargingStationOperator
        ? (hasChargingStationOperatorData || initialOpenSection === 'parties')
        : segment === 'extortion'
        ? (hasExtortionPartyData || initialOpenSection === 'parties')
        : showsPartySection,
      attachments: isUtilityReport && !isExcessElectricityBill ? false : initialOpenSection === 'attachments',
    }));

    // Auto-expand parties if operator data is loaded/restored asynchronously
    const prevHasOperatorDataRef = React.useRef(hasChargingStationOperatorData);
    useEffect(() => {
      if (isChargingStationOperator && !prevHasOperatorDataRef.current && hasChargingStationOperatorData) {
        setOpenSections((prev) => ({ ...prev, parties: true }));
      }
      prevHasOperatorDataRef.current = hasChargingStationOperatorData;
    }, [isChargingStationOperator, hasChargingStationOperatorData]);

    // Auto-expand extortion parties if data is restored/loaded asynchronously
    const prevHasExtortionDataRef = React.useRef(hasExtortionPartyData);
    useEffect(() => {
      if (segment === 'extortion' && !prevHasExtortionDataRef.current && hasExtortionPartyData) {
        setOpenSections((prev) => ({ ...prev, parties: true }));
      }
      prevHasExtortionDataRef.current = hasExtortionPartyData;
    }, [segment, hasExtortionPartyData]);

    // Auto-open specific accordion if requested (e.g. from Review edit link)
    useEffect(() => {
      if (initialOpenSection) {
        setOpenSections((prev) => ({
          ...prev,
          [initialOpenSection]: true,
        }));
        const elem = document.getElementById(`composer-section-${initialOpenSection}`);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, [initialOpenSection]);

    // Validation errors state
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reporter device location gate state
    const [reporterGateState, setReporterGateState] = useState<ReporterLocationGateState>(() => {
      if (VisitorSessionService.hasValidCurrentReporterLocation()) {
        return 'verified';
      }
      return 'checking';
    });

    useEffect(() => {
      let isMounted = true;

      // If valid session reporter location already exists, unlock immediately
      if (VisitorSessionService.hasValidCurrentReporterLocation()) {
        setReporterGateState('verified');
        return;
      }

      // Check browser permission status if supported
      const checkInitialPermission = async () => {
        try {
          const status = await VisitorSessionService.queryPermissionStatus();
          if (!isMounted) return;

          if (status === 'granted') {
            // Browser permission already granted, attempt capture automatically without prompt
            setReporterGateState('requesting');
            const res = await VisitorSessionService.captureReporterDeviceLocation();
            if (!isMounted) return;
            if (res.success && res.coords) {
              setReporterGateState('verified');
            } else if (res.errorType === 'denied') {
              setReporterGateState('denied');
            } else {
              setReporterGateState('unavailable');
            }
          } else if (status === 'denied') {
            setReporterGateState('denied');
          } else {
            // 'prompt' or 'unavailable' (Permissions API not supported)
            setReporterGateState('required');
          }
        } catch {
          if (isMounted) {
            setReporterGateState('required');
          }
        }
      };

      checkInitialPermission();

      return () => {
        isMounted = false;
      };
    }, []);

    const handleRequestDeviceLocation = async () => {
      setReporterGateState('requesting');
      try {
        const res = await VisitorSessionService.captureReporterDeviceLocation();
        if (res.success && res.coords) {
          setReporterGateState('verified');
          setErrors((prev) => {
            if (!prev.reporterLocation) return prev;
            const updated = { ...prev };
            delete updated.reporterLocation;
            return updated;
          });
        } else if (res.errorType === 'denied') {
          setReporterGateState('denied');
        } else {
          setReporterGateState('unavailable');
        }
      } catch {
        setReporterGateState('unavailable');
      }
    };

    const isLocationLocked = reporterGateState !== 'verified';

    // Progressive disclosure states
    const [showTitleField, setShowTitleField] = useState<boolean>(false);
    const [showIdentifyingDetails, setShowIdentifyingDetails] = useState<boolean>(false);

    // Toggle specific accordion
    const toggleSection = (secKey: string) => {
      if (secKey === 'narrative' || secKey === 'location') return;
      if (showsPartySection && secKey === 'parties' && !isChargingStationOperator && segment !== 'extortion') return;
      if (showsIdentitySection && secKey === 'identity') return;
      setOpenSections((prev) => ({
        ...prev,
        [secKey]: !prev[secKey],
      }));
    };

    // Location Handlers
    const handleManualLocationChange = (locUpdates: Partial<ReportLocationData>) => {
      if (isLocationLocked) return;

      const updatedLoc: ReportLocationData = {
        formattedAddress: formData.location?.formattedAddress || '',
        division: formData.location?.division || '',
        district: formData.location?.district || '',
        upazilaOrThana: formData.location?.upazilaOrThana || '',
        area: formData.location?.area || '',
        road: formData.location?.road || '',
        landmark: formData.location?.landmark || '',
        lat: formData.location?.lat,
        lng: formData.location?.lng,
        placeId: formData.location?.placeId,
        ...locUpdates,
      };

      onUpdateFormData({ location: updatedLoc });

      if (locUpdates.division && errors.division) {
        setErrors((prev) => ({ ...prev, division: '' }));
      }
      if (locUpdates.district && errors.district) {
        setErrors((prev) => ({ ...prev, district: '' }));
      }
      if (locUpdates.upazilaOrThana && errors.upazilaOrThana) {
        setErrors((prev) => ({ ...prev, upazilaOrThana: '' }));
      }
      if ('formattedAddress' in locUpdates && errors.formattedAddress) {
        setErrors((prev) => ({ ...prev, formattedAddress: '' }));
      }
    };

    // Safe historical draft recovery: preserve old draft address parts if formattedAddress is blank (non-utility only)
    useEffect(() => {
      if (!isUtilityReport && formData.location && !formData.location.formattedAddress) {
        const historicalParts = [
          formData.location.road,
          formData.location.area,
          formData.location.landmark,
        ].filter((s) => Boolean(s && s.trim()));
        if (historicalParts.length > 0) {
          onUpdateFormData({
            location: {
              ...formData.location,
              formattedAddress: historicalParts.join(', '),
            },
          });
        }
      }
    }, [isUtilityReport]);

    // Clear stale address-specific location data for utility complaints
    useEffect(() => {
      if (isUtilityReport && formData.location) {
        const hasStaleAddressData = Boolean(
          formData.location.formattedAddress ||
          formData.location.road ||
          formData.location.area ||
          formData.location.landmark ||
          formData.location.placeId
        );
        if (hasStaleAddressData) {
          onUpdateFormData({
            location: {
              ...formData.location,
              formattedAddress: '',
              road: '',
              area: '',
              landmark: '',
              placeId: undefined,
            },
          });
        }
      }
    }, [isUtilityReport, formData.location, onUpdateFormData]);

    // Privacy toggles (Harassment only)
    const isIdentityPrivate = formData.privacyChoice === 'anonymous';
    const isPublicIdentityRequested = formData.privacyChoice === 'public_identity';

    const handlePrimaryPrivacyToggle = (keepPrivate: boolean) => {
      if (keepPrivate) {
        onUpdateFormData({
          privacyChoice: 'anonymous',
          confirmPublicIdentity: false,
        });
      } else {
        onUpdateFormData({
          privacyChoice: 'admin_only',
          confirmPublicIdentity: false,
        });
      }
    };

    const handlePublicIdentityToggle = (requestPublic: boolean) => {
      if (requestPublic) {
        onUpdateFormData({
          privacyChoice: 'public_identity',
          confirmPublicIdentity: true,
        });
      } else {
        onUpdateFormData({
          privacyChoice: 'admin_only',
          confirmPublicIdentity: false,
        });
      }
    };

    // Mentioned Parties Handlers (Extortion only)
    const handleAddAdditionalParty = () => {
      const newParty: MentionedParty = {
        id: `party-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'unknown',
        name: '',
        roleOrDesignation: '',
        organization: '',
        phoneOrContact: '',
        identifyingDescription: '',
      };
      const updated = [...(formData.mentionedParties || []), newParty];
      onUpdateFormData({ mentionedParties: updated });
    };

    const handleRemoveAdditionalParty = (id: string) => {
      const updated = (formData.mentionedParties || []).filter((p) => p.id !== id);
      onUpdateFormData({ mentionedParties: updated });
    };

    const handleUpdateAdditionalParty = (id: string, updates: Partial<MentionedParty>) => {
      const updated = (formData.mentionedParties || []).map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      onUpdateFormData({ mentionedParties: updated });
    };

    // Resolved administrative levels for safe dropdown binding and dependent resets
    const resolvedDivision = useMemo(() => {
      return getDivisionByStoredName(formData.location?.division);
    }, [formData.location?.division]);

    const availableDistricts = useMemo(() => {
      return resolvedDivision ? getDistrictsByDivision(resolvedDivision.id) : [];
    }, [resolvedDivision]);

    const resolvedDistrict = useMemo(() => {
      if (!resolvedDivision) return undefined;
      const dist = getDistrictByStoredName(formData.location?.district);
      if (dist && dist.divisionId.toLowerCase() === resolvedDivision.id.toLowerCase()) {
        return dist;
      }
      return undefined;
    }, [resolvedDivision, formData.location?.district]);

    const availableUpazilas = useMemo(() => {
      return resolvedDistrict ? getUpazilasByDistrict(resolvedDistrict.id) : [];
    }, [resolvedDistrict]);

    const resolvedUpazila = useMemo(() => {
      if (!resolvedDistrict) return undefined;
      return getUpazilaByStoredName(formData.location?.upazilaOrThana, resolvedDistrict.id);
    }, [resolvedDistrict, formData.location?.upazilaOrThana]);

    const handleDivisionChange = (newDivisionNameEn: string) => {
      if (isLocationLocked) return;
      if (!newDivisionNameEn) {
        handleManualLocationChange({
          division: '',
          district: '',
          upazilaOrThana: '',
        });
        return;
      }

      const newDivObj = getDivisionByStoredName(newDivisionNameEn);
      if (!newDivObj) {
        handleManualLocationChange({
          division: '',
          district: '',
          upazilaOrThana: '',
        });
        return;
      }

      // Check whether the existing District belongs to the new Division
      const currentDistObj = getDistrictByStoredName(formData.location?.district);
      const isDistrictStillValid = Boolean(
        currentDistObj && currentDistObj.divisionId.toLowerCase() === newDivObj.id.toLowerCase()
      );

      let newDistrict = '';
      let newUpazila = '';

      if (isDistrictStillValid && currentDistObj) {
        newDistrict = currentDistObj.nameEn;
        const currentUpazilaObj = getUpazilaByStoredName(
          formData.location?.upazilaOrThana,
          currentDistObj.id
        );
        if (currentUpazilaObj) {
          newUpazila = currentUpazilaObj.nameEn;
        }
      }

      handleManualLocationChange({
        division: newDivObj.nameEn,
        district: newDistrict,
        upazilaOrThana: newUpazila,
      });
    };

    const handleDistrictChange = (newDistrictNameEn: string) => {
      if (isLocationLocked) return;
      if (!newDistrictNameEn) {
        handleManualLocationChange({
          district: '',
          upazilaOrThana: '',
        });
        return;
      }

      const distObj = getDistrictByStoredName(newDistrictNameEn);
      if (!distObj || (resolvedDivision && distObj.divisionId.toLowerCase() !== resolvedDivision.id.toLowerCase())) {
        handleManualLocationChange({
          district: '',
          upazilaOrThana: '',
        });
        return;
      }

      const isSameDistrict = resolvedDistrict && resolvedDistrict.id === distObj.id;

      handleManualLocationChange({
        district: distObj.nameEn,
        upazilaOrThana: isSameDistrict && resolvedUpazila ? resolvedUpazila.nameEn : '',
      });
    };

    const handleUpazilaChange = (newUpazilaNameEn: string) => {
      if (isLocationLocked) return;
      if (!newUpazilaNameEn) {
        handleManualLocationChange({ upazilaOrThana: '' });
        return;
      }

      const upazilaObj = getUpazilaByStoredName(newUpazilaNameEn, resolvedDistrict?.id);
      handleManualLocationChange({
        upazilaOrThana: upazilaObj ? upazilaObj.nameEn : newUpazilaNameEn,
      });
    };

    // Validation & Progress Logic
    const validateAndProceed = (): boolean => {
      const newErrors: Record<string, string> = {};

      if (isUtilityReport) {
        // Auto-populate title if empty before validating
        let effectiveTitle = formData.title?.trim();
        if (!effectiveTitle && currentSubcategoryOption) {
          effectiveTitle = language === 'bn' ? currentSubcategoryOption.nameBn : currentSubcategoryOption.nameEn;
          onUpdateFormData({ title: effectiveTitle });
        }
        if (!effectiveTitle) {
          effectiveTitle = isExcessElectricityBill
            ? (language === 'bn' ? 'অতিরিক্ত বিদ্যুৎ বিল' : 'Excess Electricity Bill')
            : isLoadShedding
            ? (language === 'bn' ? 'লোডশেডিং' : 'Load Shedding')
            : (language === 'bn' ? 'গ্যাস সংকট' : 'Gas Shortage');
          onUpdateFormData({ title: effectiveTitle });
        }

        if (isExcessElectricityBill) {
          // 1. Validate Recent Bill Month (Required)
          if (!formData.recentBillMonth?.trim()) {
            newErrors.recentBillMonth =
              language === 'bn' ? 'সাম্প্রতিক বিলের মাস নির্বাচন করুন' : 'Recent bill month is required';
          }

          // 2. Validate Recent Bill Amount (Required, numeric > 0)
          const rawRecentAmt = formData.recentBillAmount;
          const numRecentAmt = Number(rawRecentAmt);
          if (rawRecentAmt === undefined || rawRecentAmt === null || String(rawRecentAmt).trim() === '') {
            newErrors.recentBillAmount =
              language === 'bn' ? 'সাম্প্রতিক বিলের পরিমাণ লিখুন' : 'Recent bill amount is required';
          } else if (isNaN(numRecentAmt) || numRecentAmt <= 0) {
            newErrors.recentBillAmount =
              language === 'bn' ? 'সঠিক ধনাত্মক সংখ্যা লিখুন' : 'Enter a valid positive number';
          }

          // 3. Validate Previous Bill Month (Required)
          if (!formData.previousBillMonth?.trim()) {
            newErrors.previousBillMonth =
              language === 'bn' ? 'আগের বিলের মাস নির্বাচন করুন' : 'Previous bill month is required';
          }

          // 4. Validate Previous Bill Amount (Required, numeric > 0)
          const rawPrevAmt = formData.previousBillAmount;
          const numPrevAmt = Number(rawPrevAmt);
          if (rawPrevAmt === undefined || rawPrevAmt === null || String(rawPrevAmt).trim() === '') {
            newErrors.previousBillAmount =
              language === 'bn' ? 'আগের বিলের পরিমাণ লিখুন' : 'Previous bill amount is required';
          } else if (isNaN(numPrevAmt) || numPrevAmt <= 0) {
            newErrors.previousBillAmount =
              language === 'bn' ? 'সঠিক ধনাত্মক সংখ্যা লিখুন' : 'Enter a valid positive number';
          }
        } else {
          // 1. Validate Date (Required)
          if (!formData.incidentDate) {
            newErrors.incidentDate = isLoadShedding
              ? (language === 'bn' ? 'লোডশেডিংয়ের তারিখ নির্বাচন করুন' : 'Load shedding date is required')
              : (language === 'bn' ? 'গ্যাস সংকটের তারিখ নির্বাচন করুন' : 'Gas shortage date is required');
          } else if (formData.incidentDate > todayLocal) {
            newErrors.incidentDate =
              language === 'bn'
                ? 'ভবিষ্যতের তারিখ নির্বাচন করা যাবে না'
                : 'Future dates are not allowed';
          }

          // 2. Validate Start Time (Required)
          if (!formData.incidentTime?.trim()) {
            newErrors.incidentTime =
              language === 'bn' ? 'শুরুর সময় নির্বাচন করুন' : 'Start time is required';
          }

          // 3. Validate End Time (Optional, but if both provided, validate end time > start time)
          if (formData.incidentTime?.trim() && formData.utilityEndTime?.trim()) {
            if (formData.utilityEndTime.trim() <= formData.incidentTime.trim()) {
              newErrors.utilityEndTime =
                language === 'bn'
                  ? 'শেষ সময় শুরুর সময়ের পরে হতে হবে'
                  : 'End time must be after start time';
            }
          }
        }

        // 4. Validate Description (Required, 20 - 2000 chars)
        if (!formData.description?.trim()) {
          newErrors.description =
            language === 'bn' ? 'বিবরণ দেওয়া আবশ্যক' : 'Description is required';
        } else if (formData.description.trim().length < 20) {
          newErrors.description =
            language === 'bn'
              ? 'বিবরণ অন্তত ২০ অক্ষরের হতে হবে'
              : 'Description must be at least 20 characters';
        } else if (formData.description.length > 2000) {
          newErrors.description =
            language === 'bn'
              ? 'বিবরণটি ২০০০ অক্ষরের মধ্যে সংক্ষিপ্ত করুন।'
              : 'Please shorten the description to 2,000 characters.';
        }

        // 5. Validate Location (Required)
        if (reporterGateState !== 'verified' || !VisitorSessionService.hasValidCurrentReporterLocation()) {
          newErrors.reporterLocation =
            language === 'bn'
              ? 'অভিযোগ চালিয়ে যেতে ডিভাইস লোকেশন চালু করুন।'
              : 'Turn on device location before continuing.';
        }

        const utilityDivObj = getDivisionByStoredName(formData.location?.division);
        if (!utilityDivObj) {
          newErrors.division =
            language === 'bn' ? 'বিভাগ নির্বাচন করুন' : 'Division is required';
        }

        const utilityDistObj = utilityDivObj ? getDistrictByStoredName(formData.location?.district) : undefined;
        if (!utilityDistObj || utilityDistObj.divisionId.toLowerCase() !== utilityDivObj?.id.toLowerCase()) {
          newErrors.district =
            language === 'bn' ? 'জেলা নির্বাচন করুন' : 'District is required';
        }

        const utilityUpazilaObj = utilityDistObj
          ? getUpazilaByStoredName(formData.location?.upazilaOrThana, utilityDistObj.id)
          : undefined;
        if (!utilityUpazilaObj) {
          newErrors.upazilaOrThana =
            language === 'bn' ? 'থানা বা উপজেলা নির্বাচন করুন' : 'Select a thana or upazila';
        }

        if (utilityDivObj && utilityDistObj && utilityUpazilaObj) {
          if (
            formData.location?.division !== utilityDivObj.nameEn ||
            formData.location?.district !== utilityDistObj.nameEn ||
            formData.location?.upazilaOrThana !== utilityUpazilaObj.nameEn
          ) {
            onUpdateFormData({
              location: {
                ...formData.location,
                division: utilityDivObj.nameEn,
                district: utilityDistObj.nameEn,
                upazilaOrThana: utilityUpazilaObj.nameEn,
              },
            });
          }
        }
      } else {
        // Auto-populate title if empty before validating
        let effectiveTitle = formData.title?.trim();
        if (!effectiveTitle && currentSubcategoryOption) {
          effectiveTitle = language === 'bn' ? currentSubcategoryOption.nameBn : currentSubcategoryOption.nameEn;
          onUpdateFormData({ title: effectiveTitle });
        }

        if (!effectiveTitle) {
          newErrors.title =
            language === 'bn' ? 'শিরোনাম দেওয়া আবশ্যক' : 'A report headline is required';
        }

        if (!formData.description?.trim()) {
          newErrors.description =
            language === 'bn' ? 'ঘটনার বিবরণ দেওয়া আবশ্যক' : 'Incident description is required';
        } else if (formData.description.trim().length < 20) {
          newErrors.description =
            language === 'bn'
              ? 'বিবরণ অন্তত ২০ অক্ষরের হতে হবে'
              : 'Description must be at least 20 characters';
        } else if (formData.description.length > 2000) {
          newErrors.description =
            language === 'bn'
              ? 'বিবরণটি ২০০০ অক্ষরের মধ্যে সংক্ষিপ্ত করুন।'
              : 'Please shorten the description to 2,000 characters.';
        }

        if (!formData.incidentDate) {
          newErrors.incidentDate =
            language === 'bn' ? 'ঘটনার তারিখ নির্বাচন করুন' : 'Incident date is required';
        } else if (formData.incidentDate > todayLocal) {
          newErrors.incidentDate =
            language === 'bn'
              ? 'ভবিষ্যতের তারিখ নির্বাচন করা যাবে না'
              : 'Future dates are not allowed';
        }

        if (reporterGateState !== 'verified' || !VisitorSessionService.hasValidCurrentReporterLocation()) {
          newErrors.reporterLocation =
            language === 'bn'
              ? 'অভিযোগ চালিয়ে যেতে ডিভাইস লোকেশন চালু করুন।'
              : 'Turn on device location before continuing.';
        }

        const reportDivObj = getDivisionByStoredName(formData.location?.division);
        if (!reportDivObj) {
          newErrors.division =
            language === 'bn' ? 'বিভাগ নির্বাচন করুন' : 'Division is required';
        }

        const reportDistObj = reportDivObj ? getDistrictByStoredName(formData.location?.district) : undefined;
        if (!reportDistObj || reportDistObj.divisionId.toLowerCase() !== reportDivObj?.id.toLowerCase()) {
          newErrors.district =
            language === 'bn' ? 'জেলা নির্বাচন করুন' : 'District is required';
        }

        const reportUpazilaObj = reportDistObj
          ? getUpazilaByStoredName(formData.location?.upazilaOrThana, reportDistObj.id)
          : undefined;
        if (!reportUpazilaObj) {
          newErrors.upazilaOrThana =
            language === 'bn' ? 'থানা বা উপজেলা নির্বাচন করুন' : 'Select a thana or upazila';
        }

        if (reportDivObj && reportDistObj && reportUpazilaObj) {
          if (
            formData.location?.division !== reportDivObj.nameEn ||
            formData.location?.district !== reportDistObj.nameEn ||
            formData.location?.upazilaOrThana !== reportUpazilaObj.nameEn
          ) {
            onUpdateFormData({
              location: {
                ...formData.location,
                division: reportDivObj.nameEn,
                district: reportDistObj.nameEn,
                upazilaOrThana: reportUpazilaObj.nameEn,
              },
            });
          }
        }

        const detailedAddr = formData.location?.formattedAddress?.trim() || '';
        if (detailedAddr) {
          if (detailedAddr.length < 5) {
            newErrors.formattedAddress =
              language === 'bn'
                ? 'বিস্তারিত ঠিকানা অন্তত ৫ অক্ষরের হতে হবে'
                : 'Detailed address must be at least 5 characters';
          } else if (detailedAddr.length > 500) {
            newErrors.formattedAddress =
              language === 'bn'
                ? 'বিস্তারিত ঠিকানা ৫০০ অক্ষরের মধ্যে লিখুন'
                : 'Detailed address must not exceed 500 characters';
          }
        }

        // Harassment Identity Validation
        if (showsIdentitySection) {
          if (formData.privacyChoice === 'admin_only' && !formData.adminContact?.trim()) {
            newErrors.adminContact =
              language === 'bn'
                ? 'মডারেটরের সাথে যোগাযোগের নম্বর বা ইমেইল দিন'
                : 'Contact info is required for admin follow-up';
          }

          if (formData.privacyChoice === 'public_identity') {
            if (!formData.adminName?.trim()) {
              newErrors.adminName =
                language === 'bn' ? 'আপনার নাম উল্লেখ করুন' : 'Your name is required';
            }
            if (!formData.adminContact?.trim()) {
              newErrors.adminContact =
                language === 'bn' ? 'যোগাযোগের তথ্য দিন' : 'Contact info is required';
            }
          }
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);

        if (
          newErrors.title ||
          newErrors.description ||
          newErrors.incidentDate ||
          newErrors.incidentTime ||
          newErrors.utilityEndTime ||
          newErrors.recentBillMonth ||
          newErrors.recentBillAmount ||
          newErrors.previousBillMonth ||
          newErrors.previousBillAmount
        ) {
          const elem = document.getElementById('composer-section-narrative');
          if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (
          newErrors.reporterLocation ||
          newErrors.division ||
          newErrors.district ||
          newErrors.upazilaOrThana ||
          newErrors.formattedAddress
        ) {
          const elem = document.getElementById('composer-section-location');
          if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (showsIdentitySection && (newErrors.adminContact || newErrors.adminName)) {
          const elem = document.getElementById('composer-section-identity');
          if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        return false;
      }

      setErrors({});
      return true;
    };

    useImperativeHandle(ref, () => ({
      validateAndProceed,
    }));

    // Check if extortion has primary party data
    const hasPrimaryPartyData = Boolean(
      formData.reportedSubject?.trim() ||
      formData.organization?.trim() ||
      formData.identifyingDescription?.trim() ||
      (formData.mentionedParties && formData.mentionedParties.length > 0)
    );

    return (
      <div className="space-y-4 md:space-y-5">
        {/* SECTION 1: What Happened & Timeline (ঘটনার বিবরণ ও সময়কাল) - NON-COLLAPSIBLE */}
        <Accordion
          id="composer-section-narrative"
          isOpen={true}
          collapsible={false}
          onToggle={() => {}}
          title={
            isUtilityReport
              ? isExcessElectricityBill
                ? language === 'bn'
                  ? '১. বিদ্যুৎ বিলের তথ্য ও বিবরণ'
                  : '1. Electricity Bill Details & Narrative'
                : isLoadShedding
                ? language === 'bn'
                  ? '১. লোডশেডিংয়ের সময় ও বিবরণ'
                  : '1. Load Shedding Timing & Details'
                : language === 'bn'
                ? '১. গ্যাস সংকটের সময় ও বিবরণ'
                : '1. Gas Shortage Timing & Details'
              : language === 'bn'
              ? '১. ঘটনার বিবরণ ও সময়কাল'
              : '1. What Happened & Timeline'
          }
          hasError={Boolean(
            errors.title ||
            errors.description ||
            errors.incidentDate ||
            errors.incidentTime ||
            errors.utilityEndTime ||
            errors.recentBillMonth ||
            errors.recentBillAmount ||
            errors.previousBillMonth ||
            errors.previousBillAmount
          )}
          icon={<FileText className="w-5 h-5" />}
        >
          {isUtilityReport ? (
            <div className="space-y-4 pt-1 text-left">
              {/* Title / Headline: Compact with secondary action */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[13px] text-ui-content-secondary">
                  <span className="font-semibold text-ui-content-primary truncate max-w-[70%]">
                    {formData.title ||
                      (isExcessElectricityBill
                        ? language === 'bn'
                          ? 'অতিরিক্ত বিদ্যুৎ বিল'
                          : 'Excess Electricity Bill'
                        : isLoadShedding
                        ? language === 'bn'
                          ? 'লোডশেডিং'
                          : 'Load Shedding'
                        : language === 'bn'
                        ? 'গ্যাস সংকট'
                        : 'Gas Shortage')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTitleField(!showTitleField)}
                    className="text-ui-content-primary hover:underline cursor-pointer font-medium shrink-0 ml-2 min-h-[44px] inline-flex items-center px-2 py-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
                  >
                    {showTitleField
                      ? language === 'bn'
                        ? 'বাতিল'
                        : 'Cancel'
                      : language === 'bn'
                      ? 'শিরোনাম পরিবর্তন'
                      : 'Change title'}
                  </button>
                </div>

                {showTitleField && (
                  <div className="space-y-1 pt-1">
                    <input
                      id="complaint-title-input"
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => {
                        onUpdateFormData({ title: e.target.value });
                        if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                      }}
                      placeholder={
                        language === 'bn' ? 'সংক্ষিপ্ত শিরোনাম' : 'Short headline'
                      }
                      className={`w-full px-3.5 py-2.5 bg-ui-surface border rounded-xl text-[15px] text-ui-content-primary placeholder:text-ui-content-muted focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[44px] ${
                        errors.title ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
                      }`}
                    />
                    {errors.title && (
                      <p className="text-[13px] text-ui-error-text font-semibold">{errors.title}</p>
                    )}
                  </div>
                )}
              </div>

              {isExcessElectricityBill ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Recent Bill Month */}
                    <div>
                      <label
                        htmlFor="recent-bill-month-input"
                        className="block text-[13px] font-bold text-ui-content-primary mb-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-ui-content-primary" />
                          <span>{language === 'bn' ? 'সাম্প্রতিক বিলের মাস *' : 'Recent Bill Month *'}</span>
                        </div>
                      </label>
                      <input
                        id="recent-bill-month-input"
                        type="month"
                        value={formData.recentBillMonth || ''}
                        onChange={(e) => {
                          onUpdateFormData({ recentBillMonth: e.target.value });
                          if (errors.recentBillMonth) setErrors((prev) => ({ ...prev, recentBillMonth: '' }));
                        }}
                        className={`w-full px-3 py-2 bg-ui-surface border rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px] ${
                          errors.recentBillMonth ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
                        }`}
                      />
                      {errors.recentBillMonth && (
                        <p className="text-[12px] text-ui-error-text mt-1 font-semibold">{errors.recentBillMonth}</p>
                      )}
                    </div>

                    {/* Recent Bill Amount */}
                    <div>
                      <label
                        htmlFor="recent-bill-amount-input"
                        className="block text-[13px] font-bold text-ui-content-primary mb-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-ui-content-primary" />
                          <span>{language === 'bn' ? 'সাম্প্রতিক বিলের পরিমাণ (টাকা) *' : 'Recent Bill Amount (BDT) *'}</span>
                        </div>
                      </label>
                      <input
                        id="recent-bill-amount-input"
                        type="number"
                        min="1"
                        step="any"
                        placeholder={language === 'bn' ? 'যেমন: ৫০০০' : 'e.g. 5000'}
                        value={formData.recentBillAmount !== undefined && formData.recentBillAmount !== null ? formData.recentBillAmount : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          onUpdateFormData({ recentBillAmount: val === '' ? undefined : Number(val) });
                          if (errors.recentBillAmount) setErrors((prev) => ({ ...prev, recentBillAmount: '' }));
                        }}
                        className={`w-full px-3 py-2 bg-ui-surface border rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px] ${
                          errors.recentBillAmount ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
                        }`}
                      />
                      {errors.recentBillAmount && (
                        <p className="text-[12px] text-ui-error-text mt-1 font-semibold">{errors.recentBillAmount}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Previous Bill Month */}
                    <div>
                      <label
                        htmlFor="previous-bill-month-input"
                        className="block text-[13px] font-bold text-ui-content-primary mb-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-ui-content-secondary" />
                          <span>{language === 'bn' ? 'আগের বিলের মাস *' : 'Previous Bill Month *'}</span>
                        </div>
                      </label>
                      <input
                        id="previous-bill-month-input"
                        type="month"
                        value={formData.previousBillMonth || ''}
                        onChange={(e) => {
                          onUpdateFormData({ previousBillMonth: e.target.value });
                          if (errors.previousBillMonth) setErrors((prev) => ({ ...prev, previousBillMonth: '' }));
                        }}
                        className={`w-full px-3 py-2 bg-ui-surface border rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px] ${
                          errors.previousBillMonth ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
                        }`}
                      />
                      {errors.previousBillMonth && (
                        <p className="text-[12px] text-ui-error-text mt-1 font-semibold">{errors.previousBillMonth}</p>
                      )}
                    </div>

                    {/* Previous Bill Amount */}
                    <div>
                      <label
                        htmlFor="previous-bill-amount-input"
                        className="block text-[13px] font-bold text-ui-content-primary mb-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-ui-content-secondary" />
                          <span>{language === 'bn' ? 'আগের বিলের পরিমাণ (টাকা) *' : 'Previous Bill Amount (BDT) *'}</span>
                        </div>
                      </label>
                      <input
                        id="previous-bill-amount-input"
                        type="number"
                        min="1"
                        step="any"
                        placeholder={language === 'bn' ? 'যেমন: ১৫০০' : 'e.g. 1500'}
                        value={formData.previousBillAmount !== undefined && formData.previousBillAmount !== null ? formData.previousBillAmount : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          onUpdateFormData({ previousBillAmount: val === '' ? undefined : Number(val) });
                          if (errors.previousBillAmount) setErrors((prev) => ({ ...prev, previousBillAmount: '' }));
                        }}
                        className={`w-full px-3 py-2 bg-ui-surface border rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px] ${
                          errors.previousBillAmount ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
                        }`}
                      />
                      {errors.previousBillAmount && (
                        <p className="text-[12px] text-ui-error-text mt-1 font-semibold">{errors.previousBillAmount}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Date, Start Time & End Time in 3 columns on sm+ screens */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Incident Date */}
                  <div>
                    <label
                      htmlFor="complaint-date-input"
                      className="block text-[13px] font-bold text-ui-content-primary mb-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-ui-content-primary" />
                        <span>{language === 'bn' ? 'তারিখ *' : 'Date *'}</span>
                      </div>
                    </label>
                    <input
                      id="complaint-date-input"
                      type="date"
                      max={todayLocal}
                      value={formData.incidentDate || ''}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        if (selectedDate && selectedDate > todayLocal) {
                          setErrors((prev) => ({
                            ...prev,
                            incidentDate:
                              language === 'bn'
                                ? 'ভবিষ্যতের তারিখ নির্বাচন করা যাবে না'
                                : 'Future dates are not allowed',
                          }));
                          return;
                        }
                        onUpdateFormData({ incidentDate: selectedDate });
                        if (errors.incidentDate) setErrors((prev) => ({ ...prev, incidentDate: '' }));
                      }}
                      className={`w-full px-3 py-2 bg-ui-surface border rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px] ${
                        errors.incidentDate ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
                      }`}
                    />
                    {errors.incidentDate && (
                      <p className="text-[12px] text-ui-error-text mt-1 font-semibold">{errors.incidentDate}</p>
                    )}
                  </div>

                  {/* Start Time (Required) */}
                  <div>
                    <label
                      htmlFor="utility-start-time-input"
                      className="block text-[13px] font-bold text-ui-content-primary mb-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-ui-content-primary" />
                        <span>{language === 'bn' ? 'শুরুর সময় *' : 'Start Time *'}</span>
                      </div>
                    </label>
                    <input
                      id="utility-start-time-input"
                      type="time"
                      value={formData.incidentTime || ''}
                      onChange={(e) => {
                        onUpdateFormData({ incidentTime: e.target.value });
                        if (errors.incidentTime) setErrors((prev) => ({ ...prev, incidentTime: '' }));
                        if (errors.utilityEndTime && formData.utilityEndTime && e.target.value < formData.utilityEndTime) {
                          setErrors((prev) => ({ ...prev, utilityEndTime: '' }));
                        }
                      }}
                      className={`w-full px-3 py-2 bg-ui-surface border rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px] ${
                        errors.incidentTime ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
                      }`}
                    />
                    {errors.incidentTime && (
                      <p className="text-[12px] text-ui-error-text mt-1 font-semibold">{errors.incidentTime}</p>
                    )}
                  </div>

                  {/* End Time (Optional) */}
                  <div>
                    <label
                      htmlFor="utility-end-time-input"
                      className="block text-[13px] font-bold text-ui-content-primary mb-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-ui-content-secondary" />
                        <span>{language === 'bn' ? 'শেষ সময় (ঐচ্ছিক)' : 'End Time (Optional)'}</span>
                      </div>
                    </label>
                    <input
                      id="utility-end-time-input"
                      type="time"
                      value={formData.utilityEndTime || ''}
                      onChange={(e) => {
                        onUpdateFormData({ utilityEndTime: e.target.value });
                        if (errors.utilityEndTime) setErrors((prev) => ({ ...prev, utilityEndTime: '' }));
                      }}
                      className={`w-full px-3 py-2 bg-ui-surface border rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px] ${
                        errors.utilityEndTime ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
                      }`}
                    />
                    {errors.utilityEndTime && (
                      <p className="text-[12px] text-ui-error-text mt-1 font-semibold">{errors.utilityEndTime}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Incident Description */}
              <div className="space-y-1">
                <label
                  htmlFor="complaint-desc-input"
                  className="block text-[14px] font-bold text-ui-content-primary"
                >
                  {language === 'bn' ? 'বিবরণ *' : 'Description *'}
                </label>
                <textarea
                  id="complaint-desc-input"
                  rows={4}
                  maxLength={2000}
                  value={formData.description || ''}
                  onChange={(e) => {
                    onUpdateFormData({ description: e.target.value });
                    if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                  }}
                  placeholder={
                    isExcessElectricityBill
                      ? language === 'bn'
                        ? 'বিদ্যুৎ বিলটি অস্বাভাবিক বেশি বা ভুল মনে হওয়ার কারণ লিখুন।'
                        : 'Describe why you believe the electricity bill is unusually high or incorrect.'
                      : isLoadShedding
                      ? language === 'bn'
                        ? 'লোডশেডিংয়ের প্রভাব, এলাকা বা সময়কাল সম্পর্কিত বিবরণ লিখুন...'
                        : 'Describe the load shedding outage, area affected, or duration details...'
                      : language === 'bn'
                      ? 'গ্যাস সংকট, চাপ কম বা সম্পূর্ণ সরবরাহ বন্ধ থাকার বিবরণ লিখুন...'
                      : 'Describe the gas shortage, low pressure, or outage details...'
                  }
                  className={`w-full px-3.5 py-2.5 bg-ui-surface border rounded-xl text-[15px] text-ui-content-primary placeholder:text-ui-content-muted focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent leading-relaxed ${
                    errors.description ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
                  }`}
                />
                <div className="flex items-center justify-between gap-2">
                  {errors.description ? (
                    <p className="text-[13px] text-ui-error-text font-semibold">{errors.description}</p>
                  ) : (
                    <span />
                  )}
                  {(formData.description?.length || 0) >= 1600 && (
                    <span
                      className={`text-[12px] font-mono shrink-0 ml-auto ${
                        (formData.description?.length || 0) > 2000
                          ? 'text-ui-error-text font-bold'
                          : 'text-ui-content-muted'
                      }`}
                    >
                      {formData.description?.length || 0} / 2000
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
          <div className="space-y-4 pt-1 text-left">
            {/* Title / Headline: Compact with secondary action */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[13px] text-ui-content-secondary">
                <span className="font-semibold text-ui-content-primary truncate max-w-[70%]">
                  {formData.title || (language === 'bn' ? currentSubcategoryOption?.nameBn : currentSubcategoryOption?.nameEn) || (language === 'bn' ? 'অভিযোগ' : 'Complaint')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowTitleField(!showTitleField)}
                  className="text-ui-content-primary hover:underline cursor-pointer font-medium shrink-0 ml-2 min-h-[44px] inline-flex items-center px-2 py-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
                >
                  {showTitleField
                    ? language === 'bn'
                      ? 'বাতিল'
                      : 'Cancel'
                    : language === 'bn'
                    ? 'শিরোনাম পরিবর্তন'
                    : 'Change title'}
                </button>
              </div>

              {showTitleField && (
                <div className="space-y-1 pt-1">
                  <input
                    id="complaint-title-input"
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => {
                      onUpdateFormData({ title: e.target.value });
                      if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                    }}
                    placeholder={
                      language === 'bn' ? 'সংক্ষিপ্ত শিরোনাম' : 'Short headline'
                    }
                    className={`w-full px-3.5 py-2.5 bg-ui-surface border rounded-xl text-[15px] text-ui-content-primary placeholder:text-ui-content-muted focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[44px] ${
                      errors.title ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
                    }`}
                  />
                  {errors.title && (
                    <p className="text-[13px] text-ui-error-text font-semibold">{errors.title}</p>
                  )}
                </div>
              )}
            </div>

            {/* Incident Narrative */}
            <div className="space-y-1">
              <label
                htmlFor="complaint-desc-input"
                className="block text-[14px] font-bold text-ui-content-primary"
              >
                {language === 'bn' ? 'কী ঘটেছিল? *' : 'What happened? *'}
              </label>
              <textarea
                id="complaint-desc-input"
                rows={4}
                maxLength={2000}
                value={formData.description || ''}
                onChange={(e) => {
                  onUpdateFormData({ description: e.target.value });
                  if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                }}
                placeholder={
                  language === 'bn'
                    ? 'ঘটনাটি সংক্ষেপে ও স্পষ্টভাবে লিখুন...'
                    : 'Describe the incident clearly...'
                }
                className={`w-full px-3.5 py-2.5 bg-ui-surface border rounded-xl text-[15px] text-ui-content-primary placeholder:text-ui-content-muted focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent leading-relaxed ${
                  errors.description ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
                }`}
              />
              <div className="flex items-center justify-between gap-2">
                {errors.description ? (
                  <p className="text-[13px] text-ui-error-text font-semibold">{errors.description}</p>
                ) : (
                  <span />
                )}
                {(formData.description?.length || 0) >= 1600 && (
                  <span
                    className={`text-[12px] font-mono shrink-0 ml-auto ${
                      (formData.description?.length || 0) > 2000
                        ? 'text-ui-error-text font-bold'
                        : 'text-ui-content-muted'
                    }`}
                  >
                    {formData.description?.length || 0} / 2000
                  </span>
                )}
              </div>
            </div>

            {/* Incident Date, Time & Frequency */}
            <div className={`grid grid-cols-1 ${hideFrequency ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3`}>
              <div>
                <label
                  htmlFor="complaint-date-input"
                  className="block text-[13px] font-bold text-ui-content-primary mb-1"
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-ui-content-primary" />
                    <span>{language === 'bn' ? 'ঘটনার তারিখ *' : 'Incident Date *'}</span>
                  </div>
                </label>
                <input
                  id="complaint-date-input"
                  type="date"
                  max={todayLocal}
                  value={formData.incidentDate || ''}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    if (selectedDate && selectedDate > todayLocal) {
                      setErrors((prev) => ({
                        ...prev,
                        incidentDate:
                          language === 'bn'
                            ? 'ভবিষ্যতের তারিখ নির্বাচন করা যাবে না'
                            : 'Future dates are not allowed',
                      }));
                      return;
                    }
                    onUpdateFormData({ incidentDate: selectedDate });
                    if (errors.incidentDate) setErrors((prev) => ({ ...prev, incidentDate: '' }));
                  }}
                  className={`w-full px-3 py-2 bg-ui-surface border rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px] ${
                    errors.incidentDate ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
                  }`}
                />
                {errors.incidentDate && (
                  <p className="text-[12px] text-ui-error-text mt-1 font-semibold">{errors.incidentDate}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="complaint-time-input"
                  className="block text-[13px] font-bold text-ui-content-primary mb-1"
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-ui-content-secondary" />
                    <span>{language === 'bn' ? 'সময় (ঐচ্ছিক)' : 'Time (Optional)'}</span>
                  </div>
                </label>
                <input
                  id="complaint-time-input"
                  type="time"
                  value={formData.incidentTime || ''}
                  onChange={(e) => onUpdateFormData({ incidentTime: e.target.value })}
                  className="w-full px-3 py-2 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px]"
                />
              </div>

              {!hideFrequency && (
                <div>
                  <label
                    htmlFor="complaint-frequency-select"
                    className="block text-[13px] font-bold text-ui-content-primary mb-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-ui-content-secondary" />
                      <span>{language === 'bn' ? 'পুনরাবৃত্তি' : 'Frequency'}</span>
                    </div>
                  </label>
                  <select
                    id="complaint-frequency-select"
                    value={formData.frequency || 'one-time'}
                    onChange={(e) =>
                      onUpdateFormData({ frequency: e.target.value as 'one-time' | 'repeated' })
                    }
                    className="w-full px-3 py-2 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent cursor-pointer min-h-[42px]"
                  >
                    <option value="one-time">
                      {language === 'bn' ? 'এককালীন (One-time)' : 'One-time'}
                    </option>
                    <option value="repeated">
                      {language === 'bn' ? 'নিয়মিত / একাধিকবার' : 'Repeated / Ongoing'}
                    </option>
                  </select>
                </div>
              )}
            </div>

            {/* Conditional Digital Threat Questions ONLY for Digital Harassment */}
            {isDigitalHarassment && (
              <div className="p-3.5 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle space-y-3 mt-2">
                <h4 className="text-[13px] font-bold text-ui-content-primary">
                  {language === 'bn' ? 'অনলাইন ও ব্ল্যাকমেইল সংক্রান্ত সুনির্দিষ্ট তথ্য' : 'Digital Threat & Evidence Details'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="intimate-action-select"
                      className="block text-[13px] font-semibold text-ui-content-secondary mb-1"
                    >
                      {language === 'bn' ? 'কী ঘটেছে বা হুমকি দেওয়া হচ্ছে?' : 'Threat Status / Action'}
                    </label>
                    <select
                      id="intimate-action-select"
                      value={formData.intimateWhatHappened || ''}
                      onChange={(e) => onUpdateFormData({ intimateWhatHappened: e.target.value })}
                      className="w-full px-3 py-2 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent cursor-pointer min-h-[42px]"
                    >
                      <option value="">{language === 'bn' ? '-- নির্বাচন করুন --' : '-- Select --'}</option>
                      {INTIMATE_WHAT_HAPPENED_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {language === 'bn' ? opt.nameBn : opt.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="intimate-platform-select"
                      className="block text-[13px] font-semibold text-ui-content-secondary mb-1"
                    >
                      {language === 'bn' ? 'কোন মাধ্যমে হুমকি বা অপপ্রচার হচ্ছে?' : 'Platform / Channel'}
                    </label>
                    <select
                      id="intimate-platform-select"
                      value={formData.intimatePlatform || ''}
                      onChange={(e) => onUpdateFormData({ intimatePlatform: e.target.value })}
                      className="w-full px-3 py-2 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent cursor-pointer min-h-[42px]"
                    >
                      <option value="">{language === 'bn' ? '-- নির্বাচন করুন --' : '-- Select --'}</option>
                      {INTIMATE_PLATFORMS.map((plat) => (
                        <option key={plat.id} value={plat.id}>
                          {language === 'bn' ? plat.nameBn : plat.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        </Accordion>

        {/* SECTION 2: Location (লোকেশন) - NON-COLLAPSIBLE */}
        <Accordion
          id="composer-section-location"
          isOpen={true}
          collapsible={false}
          onToggle={() => {}}
          title={language === 'bn' ? '২. লোকেশন' : '2. Location'}
          hasError={Boolean(
            errors.division ||
            errors.district ||
            errors.upazilaOrThana ||
            (!isUtilityReport && errors.formattedAddress) ||
            errors.reporterLocation
          )}
          icon={<MapPin className="w-5 h-5" />}
        >
          <div className="space-y-3.5 pt-1 text-left">
            {/* Single Short Sentence for Digital Harassment Location Helper */}
            {isDigitalHarassment && (
              <p className="text-[13px] text-ui-content-secondary leading-normal">
                {language === 'bn'
                  ? 'অনলাইন বা ডিজিটাল ঘটনার ক্ষেত্রে প্রাসঙ্গিক এলাকা বা জেলা নির্বাচন করুন।'
                  : 'For online incidents, select the most relevant area or district.'}
              </p>
            )}

            {/* Reporter Device Location Gate */}
            {reporterGateState === 'verified' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ui-success-bg border border-ui-success-border text-ui-success-text text-[12.5px] font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{language === 'bn' ? 'ডিভাইস লোকেশন চালু আছে' : 'Device location is on'}</span>
              </div>
            ) : reporterGateState === 'denied' ? (
              <div className="p-3.5 rounded-xl border border-ui-error-border bg-ui-error-bg space-y-2.5 text-left">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-ui-error-text shrink-0 mt-0.5" />
                  <div className="flex-1 text-[13px] text-ui-content-primary leading-relaxed">
                    {language === 'bn'
                      ? 'লোকেশন অনুমতি পাওয়া যায়নি। ব্রাউজার বা ডিভাইসে লোকেশন চালু করে আবার চেষ্টা করুন।'
                      : 'Location permission was not granted. Please enable location in your browser or device settings and try again.'}
                  </div>
                </div>
                <div className="flex justify-start pt-0.5">
                  <button
                    type="button"
                    onClick={handleRequestDeviceLocation}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-ui-action-bg hover:bg-ui-action-hover text-ui-action-text text-[13px] font-semibold transition-colors cursor-pointer shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus active:scale-95"
                  >
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{language === 'bn' ? 'আবার চেষ্টা করুন' : 'Try again'}</span>
                  </button>
                </div>
              </div>
            ) : reporterGateState === 'unavailable' ? (
              <div className="p-3.5 rounded-xl border border-ui-warning-border bg-ui-warning-bg space-y-2.5 text-left">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-ui-warning-text shrink-0 mt-0.5" />
                  <div className="flex-1 text-[13px] text-ui-content-primary leading-relaxed">
                    {language === 'bn'
                      ? 'লোকেশন পাওয়া যাচ্ছে না। জিপিএস বা ডিভাইস লোকেশন চালু করে আবার চেষ্টা করুন।'
                      : 'Device location could not be detected. Make sure GPS or location services are enabled and try again.'}
                  </div>
                </div>
                <div className="flex justify-start pt-0.5">
                  <button
                    type="button"
                    onClick={handleRequestDeviceLocation}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-ui-warning-text hover:opacity-90 text-ui-surface text-[13px] font-semibold transition-colors cursor-pointer shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus active:scale-95"
                  >
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{language === 'bn' ? 'আবার চেষ্টা করুন' : 'Try again'}</span>
                  </button>
                </div>
              </div>
            ) : reporterGateState === 'requesting' || reporterGateState === 'checking' ? (
              <div className="p-3.5 rounded-xl border border-ui-stroke-subtle bg-ui-surface-subtle/70 space-y-2.5 text-left">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-ui-content-primary shrink-0 mt-0.5" />
                  <div className="flex-1 text-[13px] text-ui-content-primary leading-relaxed">
                    {language === 'bn'
                      ? 'অভিযোগের স্থান নির্বাচন করতে আপনার ডিভাইসের লোকেশন চালু করুন।'
                      : 'Turn on device location before selecting the incident location.'}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-0.5 text-[13px] text-ui-accent font-medium">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>{language === 'bn' ? 'লোকেশন যাচাই হচ্ছে...' : 'Checking location...'}</span>
                </div>
              </div>
            ) : (
              /* 'required' or idle */
              <div className="p-3.5 rounded-xl border border-ui-stroke-subtle bg-ui-surface-subtle/70 space-y-2.5 text-left">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-ui-content-primary shrink-0 mt-0.5" />
                  <div className="flex-1 text-[13px] text-ui-content-primary leading-relaxed">
                    {language === 'bn'
                      ? 'অভিযোগের স্থান নির্বাচন করতে আপনার ডিভাইসের লোকেশন চালু করুন।'
                      : 'Turn on device location before selecting the incident location.'}
                  </div>
                </div>
                <div className="flex justify-start pt-0.5">
                  <button
                    type="button"
                    onClick={handleRequestDeviceLocation}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-ui-action-bg hover:bg-ui-action-hover text-ui-action-text text-[13px] font-semibold transition-colors cursor-pointer shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus active:scale-95"
                  >
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{language === 'bn' ? 'লোকেশন চালু করুন' : 'Allow location'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Prerequisite validation error message */}
            {errors.reporterLocation && (
              <div className="text-[12.5px] text-ui-error-text font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-ui-error-text" />
                <span>{errors.reporterLocation}</span>
              </div>
            )}

            {/* Clean Manual Incident Location Form */}
            <div className="space-y-3 pt-1">
              {/* Administrative Dropdowns (Desktop: 3 columns in 1 row; Tablet: 2 columns with Thana wrapping; Mobile: stacked) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Division */}
                <div>
                  <label
                    htmlFor="complaint-division-select"
                    className="block text-[13px] font-bold text-ui-content-primary mb-1"
                  >
                    {language === 'bn' ? 'বিভাগ *' : 'Division *'}
                  </label>
                  <select
                    id="complaint-division-select"
                    disabled={isLocationLocked}
                    value={resolvedDivision ? resolvedDivision.nameEn : ''}
                    onChange={(e) => handleDivisionChange(e.target.value)}
                    className={`w-full px-3 py-2 bg-ui-surface border rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px] ${
                      isLocationLocked ? 'cursor-not-allowed opacity-60 bg-ui-surface-subtle' : 'cursor-pointer'
                    } ${
                      errors.division ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
                    }`}
                  >
                    <option value="">{language === 'bn' ? '-- বিভাগ বেছে নিন --' : '-- Select Division --'}</option>
                    {DIVISIONS.map((div: DivisionInfo) => (
                      <option key={div.id} value={div.nameEn}>
                        {language === 'bn' ? div.nameBn : div.nameEn}
                      </option>
                    ))}
                  </select>
                  {errors.division && (
                    <p className="text-[12px] text-ui-error-text mt-1 font-semibold">{errors.division}</p>
                  )}
                </div>

                {/* District */}
                <div>
                  <label
                    htmlFor="complaint-district-select"
                    className="block text-[13px] font-bold text-ui-content-primary mb-1"
                  >
                    {language === 'bn' ? 'জেলা *' : 'District *'}
                  </label>
                  <select
                    id="complaint-district-select"
                    disabled={isLocationLocked || !resolvedDivision}
                    value={resolvedDistrict ? resolvedDistrict.nameEn : ''}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className={`w-full px-3 py-2 bg-ui-surface border rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px] ${
                      isLocationLocked || !resolvedDivision ? 'cursor-not-allowed opacity-60 bg-ui-surface-subtle' : 'cursor-pointer'
                    } ${
                      errors.district ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
                    }`}
                  >
                    <option value="">{language === 'bn' ? '-- জেলা বেছে নিন --' : '-- Select District --'}</option>
                    {availableDistricts.map((dst: DistrictInfo) => (
                      <option key={dst.id} value={dst.nameEn}>
                        {language === 'bn' ? dst.nameBn : dst.nameEn}
                      </option>
                    ))}
                  </select>
                  {errors.district && (
                    <p className="text-[12px] text-ui-error-text mt-1 font-semibold">{errors.district}</p>
                  )}
                </div>

                {/* Thana / Upazila */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label
                    htmlFor="complaint-thana-select"
                    className="block text-[13px] font-bold text-ui-content-primary mb-1"
                  >
                    {language === 'bn' ? 'থানা / উপজেলা *' : 'Thana / Upazila *'}
                  </label>
                  <select
                    id="complaint-thana-select"
                    disabled={isLocationLocked || !resolvedDistrict}
                    value={resolvedUpazila ? resolvedUpazila.nameEn : ''}
                    onChange={(e) => handleUpazilaChange(e.target.value)}
                    className={`w-full px-3 py-2 bg-ui-surface border rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px] ${
                      isLocationLocked || !resolvedDistrict ? 'cursor-not-allowed opacity-60 bg-ui-surface-subtle' : 'cursor-pointer'
                    } ${
                      errors.upazilaOrThana ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
                    }`}
                  >
                    <option value="">
                      {language === 'bn' ? '-- থানা / উপজেলা বেছে নিন --' : '-- Select Thana / Upazila --'}
                    </option>
                    {availableUpazilas.map((u: UpazilaInfo) => (
                      <option key={u.id} value={u.nameEn}>
                        {language === 'bn' ? u.nameBn : u.nameEn}
                      </option>
                    ))}
                  </select>
                  {errors.upazilaOrThana && (
                    <p className="text-[12px] text-ui-error-text mt-1 font-semibold">{errors.upazilaOrThana}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Detailed Address (Optional for non-utility, completely omitted for utility) */}
              {!isUtilityReport && (
                <div>
                  <label
                    htmlFor="complaint-address-input"
                    className="block text-[13px] font-bold text-ui-content-primary mb-1"
                  >
                    {language === 'bn' ? 'বিস্তারিত ঠিকানা (ঐচ্ছিক)' : 'Detailed Address (Optional)'}
                  </label>
                  <textarea
                    id="complaint-address-input"
                    rows={3}
                    disabled={isLocationLocked}
                    value={formData.location?.formattedAddress || ''}
                    onChange={(e) => handleManualLocationChange({ formattedAddress: e.target.value })}
                    placeholder={
                      language === 'bn'
                        ? 'বাড়ি/হোল্ডিং, রাস্তা, বাজার, প্রতিষ্ঠান, পরিচিত স্থান বা প্রয়োজনীয় অন্যান্য ঠিকানা লিখুন'
                        : 'Enter house/holding, road, market, institution, landmark, or other useful address details'
                    }
                    className={`w-full px-3 py-2 bg-ui-surface border rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent resize-none leading-relaxed ${
                      isLocationLocked ? 'cursor-not-allowed opacity-60 bg-ui-surface-subtle' : ''
                    } ${
                      errors.formattedAddress ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
                    }`}
                  />
                  {errors.formattedAddress && (
                    <p className="text-[12px] text-ui-error-text mt-1 font-semibold">{errors.formattedAddress}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Accordion>

        {/* SECTION 3 (HARASSMENT): Identity & Privacy (পরিচয় ও গোপনীয়তা) - NON-COLLAPSIBLE */}
        {showsIdentitySection && (
          <Accordion
            id="composer-section-identity"
            isOpen={true}
            collapsible={false}
            onToggle={() => {}}
            title={language === 'bn' ? '৩. পরিচয় ও গোপনীয়তা' : '3. Identity & Privacy'}
            hasError={Boolean(errors.adminContact || errors.adminName)}
            icon={<Shield className="w-5 h-5" />}
          >
            <div className="space-y-3.5 pt-1 text-left">
              {/* Primary Toggle: Keep Identity Private */}
              <div className="p-3.5 rounded-2xl bg-ui-surface-subtle border border-ui-stroke-subtle space-y-3">
                <Toggle
                  id="toggle-keep-identity-private"
                  checked={isIdentityPrivate}
                  onChange={(checked) => handlePrimaryPrivacyToggle(checked)}
                  label={
                    language === 'bn'
                      ? 'আমার পরিচয় ও যোগাযোগের তথ্য গোপন রাখুন'
                      : 'Keep my identity and contact information private'
                  }
                  description={
                    language === 'bn'
                      ? 'ডিফল্টভাবে আপনার পরিচয় ও যোগাযোগের তথ্য প্রকাশ করা হবে না।'
                      : 'Your identity and contact information are private by default.'
                  }
                  className="w-full"
                />

                {/* When Private is OFF -> Reveal Contact Fields */}
                {!isIdentityPrivate && (
                  <div className="pt-3 border-t border-ui-stroke-subtle/70 space-y-3">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-ui-content-primary">
                      <Lock className="w-3.5 h-3.5 text-ui-content-primary" />
                      <span>
                        {language === 'bn'
                          ? 'মডারেটরের সাথে যোগাযোগের তথ্য'
                          : 'Moderator Follow-up Contact Information'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="reporter-admin-name"
                          className="block text-[13px] font-semibold text-ui-content-primary mb-1"
                        >
                          {language === 'bn' ? 'আপনার নাম (ঐচ্ছিক)' : 'Your Name (Optional)'}
                        </label>
                        <input
                          id="reporter-admin-name"
                          type="text"
                          value={formData.adminName || ''}
                          onChange={(e) => onUpdateFormData({ adminName: e.target.value })}
                          placeholder={language === 'bn' ? 'নাম' : 'Name'}
                          className="w-full px-3 py-2 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px]"
                        />
                        {errors.adminName && (
                          <p className="text-[12px] text-ui-error-text mt-1 font-semibold">{errors.adminName}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="reporter-admin-contact"
                          className="block text-[13px] font-semibold text-ui-content-primary mb-1"
                        >
                          {language === 'bn' ? 'মোবাইল নম্বর বা ইমেইল *' : 'Phone Number or Email *'}
                        </label>
                        <input
                          id="reporter-admin-contact"
                          type="text"
                          value={formData.adminContact || ''}
                          onChange={(e) => {
                            onUpdateFormData({ adminContact: e.target.value });
                            if (errors.adminContact)
                              setErrors((prev) => ({ ...prev, adminContact: '' }));
                          }}
                          placeholder={language === 'bn' ? '০১৭xxxxxxxx বা user@example.com' : '017xxxxxxxx or email'}
                          className={`w-full px-3 py-2 bg-ui-surface border rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px] ${
                            errors.adminContact ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
                          }`}
                        />
                        {errors.adminContact && (
                          <p className="text-[12px] text-ui-error-text mt-1 font-semibold">{errors.adminContact}</p>
                        )}
                      </div>
                    </div>

                    {/* Secondary Optional Toggle: Request Public Identity */}
                    <div className="pt-1">
                      <Toggle
                        id="toggle-request-public-identity"
                        checked={isPublicIdentityRequested}
                        onChange={(checked) => handlePublicIdentityToggle(checked)}
                        label={
                          language === 'bn'
                            ? 'অনুমোদিত হলে আমার পরিচয় প্রকাশের অনুরোধ করছি'
                            : 'Request public identity if approved'
                        }
                        description={
                          language === 'bn'
                            ? 'অনুমোদিত হলে প্রকাশযোগ্য সংস্করণে আপনার নাম দেখানো হতে পারে।'
                            : 'If approved for public display, your name may appear in the public version.'
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Workflow Notice */}
              <div className="p-3 rounded-xl bg-ui-surface border border-ui-stroke-subtle flex items-start gap-2 text-[13px] text-ui-content-secondary">
                <Info className="w-4 h-4 text-ui-content-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {isIdentityPrivate
                    ? language === 'bn'
                      ? 'আপনার পরিচয় ও যোগাযোগের তথ্য প্রকাশযোগ্য সংস্করণে অন্তর্ভুক্ত হবে না।'
                      : 'Your identity and contact information will not be included in the public version.'
                    : language === 'bn'
                    ? 'আপনার যোগাযোগের তথ্য ব্যক্তিগত মডারেশন প্রক্রিয়ার মধ্যে থাকবে এবং স্বয়ংক্রিয়ভাবে প্রকাশ করা হবে না।'
                    : 'Your contact details remain within the private moderation workflow and are not automatically shown publicly.'}
                </p>
              </div>
            </div>
          </Accordion>
        )}

        {/* SECTION 3 (RICKSHAW & EXTORTION): Contextual Target / Party Info - NON-COLLAPSIBLE */}
        {/* SECTION 3 (RICKSHAW): Contextual Target / Operator Info - COLLAPSIBLE (DEFAULT: COLLAPSED UNLESS DATA EXISTS) */}
        {showsPartySection && isChargingStationOperator && (
          <Accordion
            id="composer-section-parties"
            isOpen={Boolean(openSections.parties)}
            collapsible={true}
            onToggle={() => toggleSection('parties')}
            title={
              language === 'bn'
                ? '৩. চার্জিং স্টেশন / পরিচালনাকারীর তথ্য (ঐচ্ছিক)'
                : '3. Charging Station / Operator Information (Optional)'
            }
            summary={
              hasChargingStationOperatorData ? (
                <span className="inline-flex items-center gap-1.5 text-ui-accent font-medium text-[13px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-ui-accent inline-block" />
                  {language === 'bn' ? 'তথ্য যোগ করা হয়েছে' : 'Information added'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-ui-content-secondary text-[13px]">
                  <Plus className="w-3.5 h-3.5 text-ui-content-secondary" />
                  <span>{language === 'bn' ? 'তথ্য যোগ করুন' : 'Add information'}</span>
                </span>
              )
            }
            icon={<Users className="w-5 h-5" />}
          >
            <div className="space-y-3.5 pt-1 text-left">
              {/* Row 1: Name / Known Identity (col 1) + Phone / Contact (col 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="operator-subject-name"
                    className="block text-[13px] font-bold text-ui-content-primary mb-1"
                  >
                    {language === 'bn' ? 'নাম / পরিচিতি' : 'Name / Known Identity'}
                  </label>
                  <input
                    id="operator-subject-name"
                    type="text"
                    value={formData.reportedSubject || formData.organization || ''}
                    onChange={(e) => handleOperatorNameChange(e.target.value)}
                    placeholder={
                      language === 'bn'
                        ? 'স্টেশন, গ্যারেজ, ব্যক্তি বা প্রতিষ্ঠানের নাম জানা থাকলে লিখুন'
                        : 'Enter the station, garage, person, or organization name if known'
                    }
                    className="w-full px-3 py-2 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[44px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="operator-contact"
                    className="block text-[13px] font-semibold text-ui-content-secondary mb-1"
                  >
                    {language === 'bn' ? 'ফোন / যোগাযোগ' : 'Phone / Contact'}
                  </label>
                  <input
                    id="operator-contact"
                    type="text"
                    value={formData.publicProfileHandle || ''}
                    onChange={(e) => onUpdateFormData({ publicProfileHandle: e.target.value })}
                    placeholder={
                      language === 'bn'
                        ? 'ফোন নম্বর বা জানা যোগাযোগের তথ্য'
                        : 'Phone number or known contact information'
                    }
                    className="w-full px-3 py-2 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[44px]"
                  />
                </div>
              </div>

              {/* Row 2: Role / Responsibility */}
              <div>
                <label
                  htmlFor="operator-role"
                  className="block text-[13px] font-semibold text-ui-content-secondary mb-1"
                >
                  {language === 'bn' ? 'ভূমিকা / দায়িত্ব' : 'Role / Responsibility'}
                </label>
                <input
                  id="operator-role"
                  type="text"
                  value={formData.roleOrDesignation || ''}
                  onChange={(e) => onUpdateFormData({ roleOrDesignation: e.target.value })}
                  placeholder={
                    language === 'bn'
                      ? 'যেমন: মালিক, ম্যানেজার, পরিচালনাকারী'
                      : 'e.g. Owner, Manager, Operator'
                  }
                  className="w-full px-3 py-2 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[44px]"
                />
              </div>

              {/* Row 3: Other Identifying Details */}
              <div>
                <label
                  htmlFor="operator-identifying-desc"
                  className="block text-[13px] font-semibold text-ui-content-secondary mb-1"
                >
                  {language === 'bn' ? 'অন্যান্য শনাক্তকারী তথ্য' : 'Other Identifying Details'}
                </label>
                <textarea
                  id="operator-identifying-desc"
                  rows={2}
                  value={formData.identifyingDescription || ''}
                  onChange={(e) => onUpdateFormData({ identifyingDescription: e.target.value })}
                  placeholder={
                    language === 'bn'
                      ? 'সাইনবোর্ড, চেহারা, অবস্থান সূত্র বা অন্য কোনো পরিচিত তথ্য'
                      : 'Signage, appearance, location clues, or any other known identifying information'
                  }
                  className="w-full px-3 py-2 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent leading-relaxed min-h-[44px]"
                />
              </div>
            </div>
          </Accordion>
        )}

        {/* SECTION 3 (EXTORTION): Party Info - COLLAPSIBLE (DEFAULT: COLLAPSED UNLESS DATA EXISTS) */}
        {showsPartySection && segment === 'extortion' && (
          <Accordion
            id="composer-section-parties"
            isOpen={Boolean(openSections.parties)}
            collapsible={true}
            onToggle={() => toggleSection('parties')}
            title={
              language === 'bn'
                ? '৩. চাঁদা দাবিকারীর তথ্য (ঐচ্ছিক)'
                : '3. Extortion Party Information (Optional)'
            }
            summary={
              hasExtortionPartyData ? (
                <span className="inline-flex items-center gap-1.5 text-ui-accent font-medium text-[13px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-ui-accent inline-block" />
                  {language === 'bn' ? 'তথ্য যোগ করা হয়েছে' : 'Information added'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-ui-content-secondary text-[13px]">
                  <Plus className="w-3.5 h-3.5 text-ui-content-secondary" />
                  <span>{language === 'bn' ? 'তথ্য যোগ করুন' : 'Add information'}</span>
                </span>
              )
            }
            icon={<Users className="w-5 h-5" />}
          >
            <div className="space-y-4 pt-1 text-left">
              <div className="space-y-3 sm:space-y-3.5">
                {/* Row 1: Name / Known Identity (col 1) + Phone / Contact (col 2) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="extortion-subject-name"
                      className="block text-[13px] font-bold text-ui-content-primary mb-1"
                    >
                      {language === 'bn' ? 'নাম / পরিচিতি' : 'Name / Known Identity'}
                    </label>
                    <input
                      id="extortion-subject-name"
                      type="text"
                      value={formData.reportedSubject || ''}
                      onChange={(e) => onUpdateFormData({ reportedSubject: e.target.value })}
                      placeholder={
                        language === 'bn'
                          ? 'চাঁদা দাবিকারীর নাম বা পরিচিত নাম জানা থাকলে লিখুন'
                          : "Enter the person's or party's name if known"
                      }
                      className="w-full px-3 py-2 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="extortion-contact"
                      className="block text-[13px] font-semibold text-ui-content-secondary mb-1"
                    >
                      {language === 'bn' ? 'ফোন / যোগাযোগ' : 'Phone / Contact'}
                    </label>
                    <input
                      id="extortion-contact"
                      type="text"
                      value={formData.publicProfileHandle || ''}
                      onChange={(e) => onUpdateFormData({ publicProfileHandle: e.target.value })}
                      placeholder={
                        language === 'bn'
                          ? 'ফোন নম্বর, অনলাইন পরিচিতি বা অন্য যোগাযোগের তথ্য'
                          : 'Phone number, online identity, or other contact information'
                      }
                      className="w-full px-3 py-2 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Row 2: Role / Designation (col 1) + Group / Organization / Association (col 2) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="extortion-role"
                      className="block text-[13px] font-semibold text-ui-content-secondary mb-1"
                    >
                      {language === 'bn' ? 'ভূমিকা / পদবি' : 'Role / Designation'}
                    </label>
                    <input
                      id="extortion-role"
                      type="text"
                      value={formData.roleOrDesignation || ''}
                      onChange={(e) => onUpdateFormData({ roleOrDesignation: e.target.value })}
                      placeholder={
                        language === 'bn'
                          ? 'যেমন: লাইনম্যান, ম্যানেজার, স্থানীয় প্রতিনিধি'
                          : 'e.g. Lineman, Manager, Local Representative'
                      }
                      className="w-full px-3 py-2 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="extortion-org"
                      className="block text-[13px] font-semibold text-ui-content-secondary mb-1"
                    >
                      {language === 'bn' ? 'দল / সংগঠন / সমিতি' : 'Group / Organization / Association'}
                    </label>
                    <input
                      id="extortion-org"
                      type="text"
                      value={formData.organization || ''}
                      onChange={(e) => onUpdateFormData({ organization: e.target.value })}
                      placeholder={
                        language === 'bn'
                          ? 'সংশ্লিষ্ট দল, সিন্ডিকেট, সমিতি বা প্রতিষ্ঠানের নাম'
                          : 'Related group, syndicate, association, or organization'
                      }
                      className="w-full px-3 py-2 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Row 3: Other Identifying Details — full width (textarea) */}
                <div>
                  <label
                    htmlFor="extortion-identifying-desc"
                    className="block text-[13px] font-semibold text-ui-content-secondary mb-1"
                  >
                    {language === 'bn' ? 'অন্যান্য শনাক্তকারী তথ্য' : 'Other Identifying Details'}
                  </label>
                  <textarea
                    id="extortion-identifying-desc"
                    rows={2}
                    value={formData.identifyingDescription || ''}
                    onChange={(e) => onUpdateFormData({ identifyingDescription: e.target.value })}
                    placeholder={
                      language === 'bn'
                        ? 'চেহারা, গাড়ির নম্বর, অবস্থান সূত্র বা অন্য কোনো পরিচিত তথ্য'
                        : 'Appearance, vehicle number, location clues, or any other identifying information'
                    }
                    className="w-full px-3 py-2 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent leading-relaxed min-h-[44px]"
                  />
                </div>
              </div>

              {/* Additional Mentioned Parties */}
              <div className="space-y-3 pt-1">
                {formData.mentionedParties && formData.mentionedParties.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[13px] font-bold text-ui-content-primary">
                      {language === 'bn' ? 'অতিরিক্ত সংশ্লিষ্ট পক্ষসমূহ' : 'Additional Mentioned Parties'}
                    </h4>
                    {formData.mentionedParties.map((party, pIdx) => (
                      <div
                        key={party.id || pIdx}
                        className="p-3.5 sm:p-4 rounded-2xl bg-ui-surface border border-ui-stroke-subtle space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-bold text-ui-content-primary">
                            {language === 'bn' ? `পক্ষ #${pIdx + 2}` : `Party #${pIdx + 2}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAdditionalParty(party.id)}
                            className="inline-flex items-center gap-1 text-[12px] text-ui-error-text hover:underline cursor-pointer px-2 py-1 min-h-[44px] min-w-[44px] rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'মুছে ফেলুন' : 'Remove'}</span>
                          </button>
                        </div>

                        {/* Row 1: Name + Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[12px] font-semibold text-ui-content-secondary mb-1">
                              {language === 'bn' ? 'নাম / পরিচিতি' : 'Name / Known Identity'}
                            </label>
                            <input
                              type="text"
                              value={party.name || ''}
                              onChange={(e) => handleUpdateAdditionalParty(party.id, { name: e.target.value })}
                              placeholder={language === 'bn' ? 'নাম বা পরিচিত নাম' : 'Name or known identity'}
                              className="w-full px-2.5 py-1.5 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl text-[13px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus min-h-[40px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-semibold text-ui-content-secondary mb-1">
                              {language === 'bn' ? 'ফোন / যোগাযোগ' : 'Phone / Contact'}
                            </label>
                            <input
                              type="text"
                              value={party.phoneOrContact || party.publicProfileHandle || ''}
                              onChange={(e) =>
                                handleUpdateAdditionalParty(party.id, {
                                  phoneOrContact: e.target.value,
                                  publicProfileHandle: e.target.value,
                                })
                              }
                              placeholder={language === 'bn' ? 'ফোন নম্বর বা যোগাযোগের তথ্য' : 'Phone number or contact info'}
                              className="w-full px-2.5 py-1.5 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl text-[13px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus min-h-[40px]"
                            />
                          </div>
                        </div>

                        {/* Row 2: Role + Group/Organization */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[12px] font-semibold text-ui-content-secondary mb-1">
                              {language === 'bn' ? 'ভূমিকা / পদবি' : 'Role / Designation'}
                            </label>
                            <input
                              type="text"
                              value={party.roleOrDesignation || ''}
                              onChange={(e) =>
                                handleUpdateAdditionalParty(party.id, { roleOrDesignation: e.target.value })
                              }
                              placeholder={language === 'bn' ? 'ভূমিকা বা পদবি' : 'Role or designation'}
                              className="w-full px-2.5 py-1.5 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl text-[13px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus min-h-[40px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-semibold text-ui-content-secondary mb-1">
                              {language === 'bn' ? 'দল / সংগঠন / সমিতি' : 'Group / Organization / Association'}
                            </label>
                            <input
                              type="text"
                              value={party.organization || ''}
                              onChange={(e) =>
                                handleUpdateAdditionalParty(party.id, { organization: e.target.value })
                              }
                              placeholder={language === 'bn' ? 'দল, সমিতি বা প্রতিষ্ঠানের নাম' : 'Group, association, or organization'}
                              className="w-full px-2.5 py-1.5 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl text-[13px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus min-h-[40px]"
                            />
                          </div>
                        </div>

                        {/* Row 3: Other Identifying Details */}
                        <div>
                          <label className="block text-[12px] font-semibold text-ui-content-secondary mb-1">
                            {language === 'bn' ? 'অন্যান্য শনাক্তকারী তথ্য' : 'Other Identifying Details'}
                          </label>
                          <textarea
                            rows={2}
                            value={party.identifyingDescription || ''}
                            onChange={(e) =>
                              handleUpdateAdditionalParty(party.id, { identifyingDescription: e.target.value })
                            }
                            placeholder={language === 'bn' ? 'চেহারা, যানবাহন বা অন্য শনাক্তকারী তথ্য' : 'Appearance, vehicle, or identifying details'}
                            className="w-full px-2.5 py-1.5 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl text-[13px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus min-h-[40px] leading-relaxed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Another Party Action - Only visible after primary party has at least one meaningful info */}
                {hasExtortionPrimaryPartyData && (
                  <div>
                    <button
                      type="button"
                      onClick={handleAddAdditionalParty}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-ui-surface border border-ui-stroke-subtle text-[13px] font-semibold text-ui-content-primary cursor-pointer transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>
                        {language === 'bn'
                          ? '+ আরও একজন / পক্ষ যোগ করুন'
                          : '+ Add another person / party'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Accordion>
        )}

        {/* SECTION 4: Attachments (সংযুক্তি - ঐচ্ছিক) - COLLAPSIBLE - Hidden for Load Shedding & Gas Shortage, enabled for Excess Electricity Bill */}
        {(!isUtilityReport || isExcessElectricityBill) && (
          <Accordion
            id="composer-section-attachments"
            isOpen={Boolean(openSections.attachments)}
            collapsible={true}
            onToggle={() => toggleSection('attachments')}
            title={
              isUtilityReport
                ? language === 'bn'
                  ? '৩. সংযুক্তি (ঐচ্ছিক)'
                  : '3. Attachments (Optional)'
                : language === 'bn'
                ? '৪. সংযুক্তি (ঐচ্ছিক)'
                : '4. Attachments (Optional)'
            }
            summary={
              pendingImages.length > 0
                ? `${pendingImages.length} ${language === 'bn' ? 'টি ছবি সংযুক্ত' : 'images attached'}`
                : language === 'bn'
                ? 'কোনো ছবি সংযুক্ত নেই'
                : 'No images attached'
            }
            badge={
              pendingImages.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-ui-accent-soft text-ui-accent text-[13px] font-bold">
                  {pendingImages.length}
                </span>
              ) : undefined
            }
            icon={<Paperclip className="w-5 h-5" />}
          >
            <div className="space-y-3.5 pt-1 text-left">
              <p className="text-[13px] text-ui-content-secondary">
                {isExcessElectricityBill
                  ? language === 'bn'
                    ? 'বিদ্যুৎ বিলের কপি বা মিটারের ছবি থাকলে সংযুক্ত করুন। এটি সম্পূর্ণ ঐচ্ছিক।'
                    : 'Attach copies of electricity bills or meter photos if available. This is completely optional.'
                  : language === 'bn'
                  ? 'অভিযোগ বুঝতে সহায়ক ছবি বা স্ক্রিনশট থাকলে সংযুক্ত করুন। এটি সম্পূর্ণ ঐচ্ছিক।'
                  : 'Attach images or screenshots if they help explain the complaint. This is completely optional.'}
              </p>

              {formData.pendingEvidenceRecovery &&
                formData.pendingEvidenceRecovery.expectedCount > 0 &&
                pendingImages.length === 0 && (
                  <div
                    id="pending-evidence-recovery-warning"
                    className="p-3.5 rounded-xl border border-ui-warning-border bg-ui-warning-bg text-ui-warning-text space-y-2 text-[13px]"
                  >
                    <div className="flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-ui-warning-text shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold">
                          {language === 'bn'
                            ? 'পূর্বে সংযুক্ত প্রমাণাদি পুনরায় নির্বাচন করুন'
                            : 'Please reattach your previous evidence images'}
                        </p>
                        <p className="text-[12.5px] opacity-90 leading-relaxed">
                          {language === 'bn'
                            ? `আপনার সংরক্ষিত খসড়ায় ${formData.pendingEvidenceRecovery.expectedCount}টি ছবি সংযুক্ত ছিল। জমা সম্পন্ন করতে নিচের ফাইল পিকার থেকে ছবিগুলো পুনরায় নির্বাচন করুন। আপনি চাইলে খসড়া বাতিল করে নতুন অভিযোগও শুরু করতে পারেন।`
                            : `Your saved draft had ${formData.pendingEvidenceRecovery.expectedCount} image(s) attached. Please reattach the files below to complete your submission, or discard the draft to start a new complaint.`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Image Attachment Picker - max 6 images */}
              <ImageAttachmentPicker
                images={pendingImages}
                onChange={(imgs) => {
                  onPendingImagesChange(imgs);
                  onUpdateFormData({
                    hasSupportingInfo: imgs.length > 0,
                  });
                }}
                maxImages={6}
                language={language}
              />
            </div>
          </Accordion>
        )}
      </div>
    );
  }
);
