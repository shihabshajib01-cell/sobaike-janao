import React, { useState, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import {
  Shield,
  FileText,
  MapPin,
  Paperclip,
  ChevronDown,
  Lock,
  Info,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { SectionKey } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { ReportFormData, ReportLocationData, MentionedParty, isMeaningfulMentionedParty } from '../../services/types';
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
  getDistrictsByDivision,
  getDivisionByStoredName,
  getDistrictByStoredName,
} from '../../data/districts';
import {
  getUpazilasByDistrict,
  getUpazilaByStoredName,
} from '../../data/upazilas';
import { Accordion } from '../ui/Accordion';
import { Toggle } from '../ui/Toggle';
import { SearchableSelect } from '../ui/SearchableSelect';
import { Select } from '../ui/Select';
import {
  HARASSMENT_AGE_GROUP_OPTIONS,
  HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS,
  HARASSMENT_REPORTING_FOR_OPTIONS,
} from '../../data/harassmentClassification';
import {
  SEXUAL_HARASSMENT_AGE_GROUP_OPTIONS,
  SEXUAL_HARASSMENT_CONTEXT_OPTIONS,
  SEXUAL_HARASSMENT_FREQUENCY_OPTIONS,
  SEXUAL_HARASSMENT_RELATIONSHIP_OPTIONS,
  SEXUAL_HARASSMENT_TYPE_OPTIONS,
  needsSexualHarassmentInstitution,
} from '../../data/sexualHarassmentOptions';
import { ImageAttachmentPicker, AttachedImagePreview } from '../media/ImageAttachmentPicker';
import { BRIBERY_DEPARTMENT_OPTIONS } from '../../data/briberyOptions';
import { AddressSearchInput } from '../location/AddressSearchInput';
import {
  buildResolvedLocationData,
  isGooglePlacesConfigured,
  ResolvedPlaceResult,
} from '../../services/googlePlacesService';
import { ReportTitleField, REPORT_TITLE_MAX_LENGTH } from './ReportTitleField';
import { TextField } from '../ui/TextField';
import { TextAreaField } from '../ui/TextAreaField';
import { DateField } from '../ui/DateField';
import { TimeField } from '../ui/TimeField';
import { MonthField } from '../ui/MonthField';
import { isValidEmailOrPhone } from '../ui/formValidation';
import { NumberField } from '../ui/NumberField';
import { ContactField } from '../ui/ContactField';

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
  formData: ReportFormData;
  pendingImages: AttachedImagePreview[];
  onPendingImagesChange: (images: AttachedImagePreview[]) => void;
  onUpdateFormData: (updates: Partial<ReportFormData>) => void;
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
    labelEn: 'Charging station / garage',
  },
  {
    value: 'individual',
    labelBn: 'পরিচালনাকারী ব্যক্তি',
    labelEn: 'Individual operator',
  },
  {
    value: 'organization',
    labelBn: 'প্রতিষ্ঠান / ভবন কর্তৃপক্ষ',
    labelEn: 'Organization / building authority',
  },
  {
    value: 'unknown',
    labelBn: 'অজ্ঞাত / নিশ্চিত নই',
    labelEn: 'Unknown / not sure',
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
    const currentMonthLocal = todayLocal.slice(0, 7);

    // Segment structure conditions
    const showsPartySection =
      segment === 'rickshaw' ||
      segment === 'extortion' ||
      segment === 'public_safety' ||
      segment === 'road_transport' ||
      segment === 'illegal_occupation';
    const showsIdentitySection = segment === 'harassment';
    const isUtilityReport = (segment as string) === 'utility' || segment === 'load_shedding';
    const isLoadShedding = isUtilityReport && formData.subcategoryId === 'load-shedding-outage';
    const isGasShortage = isUtilityReport && formData.subcategoryId === 'gas-shortage';
    const isExcessElectricityBill = isUtilityReport && formData.subcategoryId === 'excess-electricity-bill';
    const isBriberyReport = segment === 'extortion' && formData.subcategoryId === 'bribe-demanded-service';
    const isIllegalOccupation = segment === 'illegal_occupation';

    // Determine active subcategory option & context
    const currentSubcategoryOption = (SEGMENT_SUBCATEGORIES[segment] || []).find(
      (s) => s.id === formData.subcategoryId
    );
    const isDigitalHarassment =
      segment === 'harassment' &&
      (currentSubcategoryOption?.categoryGroup === 'digital_intimate' ||
        currentSubcategoryOption?.id === 'blackmail-coercion');
    const isSexualHarassment =
      segment === 'harassment' && formData.subcategoryId === 'sexual-harassment';

    // Contextual subject configuration for categories that benefit from optional party details
    const subjectConfig = getReportSubjectConfig(segment, formData.subcategoryId);

    // Conditional timeline controls: Illegal Occupation is date-only; charging-station reports hide frequency.
    const hideIncidentTime = isIllegalOccupation;
    const hideFrequency =
      isIllegalOccupation ||
      (segment === 'rickshaw' && formData.subcategoryId === 'charging-station-location');

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
        : showsPartySection
        ? (hasExtortionPartyData || initialOpenSection === 'parties')
        : false,
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

    // Auto-expand contextual party details if data is restored/loaded asynchronously
    const prevHasExtortionDataRef = React.useRef(hasExtortionPartyData);
    useEffect(() => {
      if (showsPartySection && !isChargingStationOperator && !prevHasExtortionDataRef.current && hasExtortionPartyData) {
        setOpenSections((prev) => ({ ...prev, parties: true }));
      }
      prevHasExtortionDataRef.current = hasExtortionPartyData;
    }, [showsPartySection, isChargingStationOperator, hasExtortionPartyData]);

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

    const { openLocationConsent } = useApp();

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

    const handleRetryLocationClick = () => {
      openLocationConsent(async () => {
        if (VisitorSessionService.hasValidCurrentReporterLocation()) {
          setReporterGateState('verified');
          setErrors((prev) => {
            if (!prev.reporterLocation) return prev;
            const updated = { ...prev };
            delete updated.reporterLocation;
            return updated;
          });
        } else {
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
        }
      });
    };

    const isLocationLocked = reporterGateState !== 'verified';

    // Progressive disclosure states
    const [showIdentifyingDetails, setShowIdentifyingDetails] = useState<boolean>(false);

    // Toggle specific accordion
    const toggleSection = (secKey: string) => {
      if (secKey === 'narrative' || secKey === 'location') return;
      if (showsIdentitySection && secKey === 'identity') return;
      setOpenSections((prev) => ({
        ...prev,
        [secKey]: !prev[secKey],
      }));
    };

    // Location Handlers
    const handleManualLocationChange = (locUpdates: Partial<ReportLocationData>) => {
      if (isLocationLocked) return;

      // Invalidate coordinates & placeId when manual text/administrative location fields change,
      // preventing stale GPS points from sticking to newly selected/edited addresses.
      const isManualFieldModified = Boolean(
        'division' in locUpdates ||
        'district' in locUpdates ||
        'upazilaOrThana' in locUpdates ||
        'formattedAddress' in locUpdates ||
        'area' in locUpdates ||
        'road' in locUpdates ||
        'landmark' in locUpdates
      );

      const updatedLoc: ReportLocationData = {
        formattedAddress: formData.location?.formattedAddress || '',
        division: formData.location?.division || '',
        district: formData.location?.district || '',
        upazilaOrThana: formData.location?.upazilaOrThana || '',
        area: formData.location?.area || '',
        road: formData.location?.road || '',
        landmark: formData.location?.landmark || '',
        lat: isManualFieldModified && !('lat' in locUpdates) ? undefined : formData.location?.lat,
        lng: isManualFieldModified && !('lng' in locUpdates) ? undefined : formData.location?.lng,
        placeId: isManualFieldModified && !('placeId' in locUpdates) ? undefined : formData.location?.placeId,
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

    const handleAddressSearchPlaceSelected = (place: ResolvedPlaceResult) => {
      if (isLocationLocked) return;
      const currentLoc = formData.location || {
        division: '',
        district: '',
        upazilaOrThana: '',
        formattedAddress: '',
      };
      const resolved = buildResolvedLocationData(currentLoc, place);
      onUpdateFormData({ location: resolved });

      if (resolved.division && errors.division) setErrors((prev) => ({ ...prev, division: '' }));
      if (resolved.district && errors.district) setErrors((prev) => ({ ...prev, district: '' }));
      if (resolved.upazilaOrThana && errors.upazilaOrThana) setErrors((prev) => ({ ...prev, upazilaOrThana: '' }));
      if (resolved.formattedAddress && errors.formattedAddress) setErrors((prev) => ({ ...prev, formattedAddress: '' }));
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

    // Mentioned Parties Handlers (shared contextual party data)
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

      const normalizedTitle = formData.title?.trim() || '';
      if (!normalizedTitle) {
        newErrors.title =
          language === 'bn' ? 'প্রতিবেদনের শিরোনাম লিখুন।' : 'Enter a report title.';
      } else if (normalizedTitle.length > REPORT_TITLE_MAX_LENGTH) {
        newErrors.title =
          language === 'bn'
            ? 'শিরোনাম ১০০ অক্ষরের মধ্যে রাখুন।'
            : 'Keep the report title within 100 characters.';
      }

      if (isUtilityReport) {
        if (isBriberyReport && formData.briberyAmount !== undefined && formData.briberyAmount !== null && String(formData.briberyAmount).trim() !== '') {
          const amount = Number(formData.briberyAmount);
          if (!Number.isFinite(amount) || amount <= 0) {
            newErrors.briberyAmount = language === 'bn' ? 'শূন্যের বেশি টাকার পরিমাণ লিখুন।' : 'Enter an amount greater than 0.';
          }
        }


        if (isExcessElectricityBill) {
          // 1. Validate Recent Bill Month (Required)
          if (!formData.recentBillMonth?.trim()) {
            newErrors.recentBillMonth =
              language === 'bn' ? 'সাম্প্রতিক বিলের মাস নির্বাচন করুন।' : 'Select the recent bill month.';
          } else if (formData.recentBillMonth > currentMonthLocal) {
            newErrors.recentBillMonth =
              language === 'bn' ? 'ভবিষ্যতের বিলের মাস নির্বাচন করা যাবে না।' : 'Recent bill month cannot be in the future.';
          }

          // 2. Validate Recent Bill Amount (Required, numeric > 0)
          const rawRecentAmt = formData.recentBillAmount;
          const numRecentAmt = Number(rawRecentAmt);
          if (rawRecentAmt === undefined || rawRecentAmt === null || String(rawRecentAmt).trim() === '') {
            newErrors.recentBillAmount =
              language === 'bn' ? 'সাম্প্রতিক বিলের পরিমাণ লিখুন।' : 'Enter the recent bill amount.';
          } else if (isNaN(numRecentAmt) || numRecentAmt <= 0) {
            newErrors.recentBillAmount =
              language === 'bn' ? 'শূন্যের বেশি পরিমাণ লিখুন।' : 'Enter an amount greater than 0.';
          }

          // 3. Validate Previous Bill Month (Required)
          if (!formData.previousBillMonth?.trim()) {
            newErrors.previousBillMonth =
              language === 'bn' ? 'আগের বিলের মাস নির্বাচন করুন।' : 'Select the previous bill month.';
          } else if (formData.previousBillMonth > currentMonthLocal) {
            newErrors.previousBillMonth =
              language === 'bn' ? 'ভবিষ্যতের বিলের মাস নির্বাচন করা যাবে না।' : 'Previous bill month cannot be in the future.';
          } else if (
            formData.recentBillMonth?.trim() &&
            formData.previousBillMonth >= formData.recentBillMonth
          ) {
            newErrors.previousBillMonth =
              language === 'bn'
                ? 'আগের বিলের মাস সাম্প্রতিক বিলের মাসের আগে হতে হবে।'
                : 'Previous bill month must be earlier than the recent bill month.';
          }

          // 4. Validate Previous Bill Amount (Required, numeric > 0)
          const rawPrevAmt = formData.previousBillAmount;
          const numPrevAmt = Number(rawPrevAmt);
          if (rawPrevAmt === undefined || rawPrevAmt === null || String(rawPrevAmt).trim() === '') {
            newErrors.previousBillAmount =
              language === 'bn' ? 'আগের বিলের পরিমাণ লিখুন।' : 'Enter the previous bill amount.';
          } else if (isNaN(numPrevAmt) || numPrevAmt <= 0) {
            newErrors.previousBillAmount =
              language === 'bn' ? 'শূন্যের বেশি পরিমাণ লিখুন।' : 'Enter an amount greater than 0.';
          }
        } else {
          // 1. Validate Date (Required)
          if (!formData.incidentDate) {
            newErrors.incidentDate = isLoadShedding
              ? (language === 'bn' ? 'লোডশেডিংয়ের তারিখ নির্বাচন করুন।' : 'Select the load shedding date.')
              : (language === 'bn' ? 'গ্যাস সংকটের তারিখ নির্বাচন করুন।' : 'Select the gas shortage date.');
          } else if (formData.incidentDate > todayLocal) {
            newErrors.incidentDate =
              language === 'bn'
                ? 'আজ বা আগের কোনো তারিখ নির্বাচন করুন।'
                : 'Select today or an earlier date.';
          }

          // 2. Validate Start Time (Required)
          if (!formData.incidentTime?.trim()) {
            newErrors.incidentTime =
              language === 'bn' ? 'শুরুর সময় নির্বাচন করুন।' : 'Select a start time.';
          }

          // 3. End time is optional. An earlier clock time is valid and represents
          // an incident that continued past midnight into the next day.
          if (
            formData.incidentTime?.trim() &&
            formData.utilityEndTime?.trim() &&
            formData.utilityEndTime.trim() === formData.incidentTime.trim()
          ) {
            newErrors.utilityEndTime =
              language === 'bn'
                ? 'শেষ সময় শুরুর সময়ের সমান হতে পারে না।'
                : 'End time cannot be the same as the start time.';
          }
        }

        // 4. Validate Description (Required, 20 - 2000 chars)
        if (!formData.description?.trim()) {
          newErrors.description =
            language === 'bn' ? 'ঘটনার বিবরণ লিখুন।' : 'Describe what happened.';
        } else if (formData.description.trim().length < 20) {
          newErrors.description =
            language === 'bn'
              ? 'অন্তত ২০ অক্ষর লিখুন।'
              : 'Enter at least 20 characters.';
        } else if (formData.description.length > 2000) {
          newErrors.description =
            language === 'bn'
              ? 'বিবরণ ২,০০০ অক্ষরের মধ্যে রাখুন।'
              : 'Keep the description within 2,000 characters.';
        }

        // 5. Validate Location (Required)
        if (reporterGateState !== 'verified' || !VisitorSessionService.hasValidCurrentReporterLocation()) {
          newErrors.reporterLocation =
            language === 'bn'
              ? 'প্রতিবেদন চালিয়ে যেতে ডিভাইসের লোকেশন চালু করুন।'
              : 'Turn on device location to continue.';
        }

        const utilityDivObj = getDivisionByStoredName(formData.location?.division);
        if (!utilityDivObj) {
          newErrors.division =
            language === 'bn' ? 'বিভাগ নির্বাচন করুন।' : 'Select a division.';
        }

        const utilityDistObj = utilityDivObj ? getDistrictByStoredName(formData.location?.district) : undefined;
        if (!utilityDistObj || utilityDistObj.divisionId.toLowerCase() !== utilityDivObj?.id.toLowerCase()) {
          newErrors.district =
            language === 'bn' ? 'জেলা নির্বাচন করুন।' : 'Select a district.';
        }

        const utilityUpazilaObj = utilityDistObj
          ? getUpazilaByStoredName(formData.location?.upazilaOrThana, utilityDistObj.id)
          : undefined;
        if (!utilityUpazilaObj) {
          newErrors.upazilaOrThana =
            language === 'bn' ? 'উপজেলা বা থানা নির্বাচন করুন।' : 'Select an upazila or thana.';
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
        if (isBriberyReport && formData.briberyAmount !== undefined && formData.briberyAmount !== null && String(formData.briberyAmount).trim() !== '') {
          const amount = Number(formData.briberyAmount);
          if (!Number.isFinite(amount) || amount <= 0) {
            newErrors.briberyAmount = language === 'bn' ? 'শূন্যের বেশি টাকার পরিমাণ লিখুন।' : 'Enter an amount greater than 0.';
          }
        }


        if (!formData.description?.trim()) {
          newErrors.description =
            language === 'bn' ? 'ঘটনার বিবরণ লিখুন।' : 'Describe what happened.';
        } else if (formData.description.trim().length < 20) {
          newErrors.description =
            language === 'bn'
              ? 'অন্তত ২০ অক্ষর লিখুন।'
              : 'Enter at least 20 characters.';
        } else if (formData.description.length > 2000) {
          newErrors.description =
            language === 'bn'
              ? 'বিবরণ ২,০০০ অক্ষরের মধ্যে রাখুন।'
              : 'Keep the description within 2,000 characters.';
        }

        if (!formData.incidentDate) {
          newErrors.incidentDate =
            language === 'bn' ? 'ঘটনার তারিখ নির্বাচন করুন।' : 'Select the incident date.';
        } else if (formData.incidentDate > todayLocal) {
          newErrors.incidentDate =
            language === 'bn'
              ? 'আজ বা আগের কোনো তারিখ নির্বাচন করুন।'
              : 'Select today or an earlier date.';
        }

        if (segment === 'harassment') {
          if (!formData.affectedPersonAgeGroup) {
            newErrors.affectedPersonAgeGroup =
              language === 'bn' ? 'প্রভাবিত ব্যক্তির বয়সের গ্রুপ নির্বাচন করুন।' : "Select the affected person's age group.";
          }
          if (!formData.allegedAbuserRelationship) {
            newErrors.allegedAbuserRelationship =
              language === 'bn' ? 'অভিযুক্ত ব্যক্তির সঙ্গে সম্পর্ক নির্বাচন করুন।' : 'Select the relationship with the alleged abuser.';
          }
          if (!formData.reportingFor) {
            newErrors.reportingFor =
              language === 'bn' ? 'কার জন্য প্রতিবেদন করছেন তা নির্বাচন করুন।' : 'Select who you are reporting for.';
          }
          if (isSexualHarassment && !formData.sexualHarassmentType) {
            newErrors.sexualHarassmentType =
              language === 'bn' ? 'হয়রানির ধরন নির্বাচন করুন।' : 'Select the type of harassment.';
          }
          if (isSexualHarassment && !formData.sexualHarassmentContext) {
            newErrors.sexualHarassmentContext =
              language === 'bn' ? 'ঘটনার প্রেক্ষাপট নির্বাচন করুন।' : 'Select where the harassment occurred.';
          }
          if (
            isSexualHarassment &&
            formData.sexualHarassmentInstitution?.trim() &&
            formData.sexualHarassmentInstitution.trim().length > 200
          ) {
            newErrors.sexualHarassmentInstitution =
              language === 'bn'
                ? 'প্রতিষ্ঠান বা সংস্থার নাম ২০০ অক্ষরের মধ্যে রাখুন।'
                : 'Keep the institution or organization within 200 characters.';
          }
        }

        if (reporterGateState !== 'verified' || !VisitorSessionService.hasValidCurrentReporterLocation()) {
          newErrors.reporterLocation =
            language === 'bn'
              ? 'প্রতিবেদন চালিয়ে যেতে ডিভাইসের লোকেশন চালু করুন।'
              : 'Turn on device location to continue.';
        }

        const reportDivObj = getDivisionByStoredName(formData.location?.division);
        if (!reportDivObj) {
          newErrors.division =
            language === 'bn' ? 'বিভাগ নির্বাচন করুন।' : 'Select a division.';
        }

        const reportDistObj = reportDivObj ? getDistrictByStoredName(formData.location?.district) : undefined;
        if (!reportDistObj || reportDistObj.divisionId.toLowerCase() !== reportDivObj?.id.toLowerCase()) {
          newErrors.district =
            language === 'bn' ? 'জেলা নির্বাচন করুন।' : 'Select a district.';
        }

        const reportUpazilaObj = reportDistObj
          ? getUpazilaByStoredName(formData.location?.upazilaOrThana, reportDistObj.id)
          : undefined;
        if (!reportUpazilaObj) {
          newErrors.upazilaOrThana =
            language === 'bn' ? 'উপজেলা বা থানা নির্বাচন করুন।' : 'Select an upazila or thana.';
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
                ? 'অন্তত ৫ অক্ষর লিখুন।'
                : 'Enter at least 5 characters.';
          } else if (detailedAddr.length > 500) {
            newErrors.formattedAddress =
              language === 'bn'
                ? 'বিস্তারিত ঠিকানা ৫০০ অক্ষরের মধ্যে রাখুন।'
                : 'Keep detailed address within 500 characters.';
          }
        }

        // Harassment Identity Validation
        if (showsIdentitySection) {
          const needsContact =
            formData.privacyChoice === 'admin_only' ||
            formData.privacyChoice === 'public_identity';

          if (needsContact && !formData.adminContact?.trim()) {
            newErrors.adminContact =
              language === 'bn'
                ? 'যোগাযোগের জন্য ইমেইল বা ফোন নম্বর লিখুন।'
                : 'Enter an email or phone number for follow-up.';
          } else if (
            needsContact &&
            formData.adminContact?.trim() &&
            !isValidEmailOrPhone(formData.adminContact)
          ) {
            newErrors.adminContact =
              language === 'bn'
                ? 'সঠিক ইমেইল বা ফোন নম্বর লিখুন।'
                : 'Enter a valid email address or phone number.';
          }

          if (formData.privacyChoice === 'public_identity' && !formData.adminName?.trim()) {
            newErrors.adminName =
              language === 'bn' ? 'আপনার নাম লিখুন।' : 'Enter your name.';
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
          newErrors.previousBillAmount ||
          newErrors.affectedPersonAgeGroup ||
          newErrors.allegedAbuserRelationship ||
          newErrors.reportingFor ||
          newErrors.sexualHarassmentType ||
          newErrors.sexualHarassmentContext ||
          newErrors.sexualHarassmentInstitution
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

        window.requestAnimationFrame(() => {
          const controlIds: Array<[string, string]> = [
            ['title', 'complaint-title-input'],
            ['description', 'complaint-desc-input'],
            ['incidentDate', 'complaint-date-input'],
            ['incidentTime', 'utility-start-time-input'],
            ['utilityEndTime', 'utility-end-time-input'],
            ['recentBillMonth', 'recent-bill-month-input'],
            ['recentBillAmount', 'recent-bill-amount-input'],
            ['previousBillMonth', 'previous-bill-month-input'],
            ['previousBillAmount', 'previous-bill-amount-input'],
            ['briberyAmount', 'bribery-amount-input'],
            ['affectedPersonAgeGroup', 'harassment-age-group-select'],
            ['allegedAbuserRelationship', 'harassment-abuser-relationship-select'],
            ['reportingFor', 'harassment-reporting-for-select'],
            ['sexualHarassmentType', 'sexual-harassment-type-select'],
            ['sexualHarassmentContext', 'sexual-harassment-context-select'],
            ['sexualHarassmentInstitution', 'sexual-harassment-institution-input'],
            ['division', 'complaint-division-select'],
            ['district', 'complaint-district-select'],
            ['upazilaOrThana', 'complaint-thana-select'],
            ['formattedAddress', 'complaint-address-input'],
            ['adminName', 'reporter-admin-name'],
            ['adminContact', 'reporter-admin-contact'],
          ];
          const first = controlIds.find(([key]) => Boolean(newErrors[key]))?.[1];
          if (first) {
            document.getElementById(first)?.focus({ preventScroll: true });
          } else if (newErrors.reporterLocation) {
            document.getElementById('reporter-location-allow-btn')?.focus({ preventScroll: true });
          }
        });

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
          className="report-composer-card"
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
            errors.previousBillAmount ||
            errors.briberyAmount ||
            errors.sexualHarassmentType ||
            errors.sexualHarassmentContext ||
            errors.sexualHarassmentInstitution
          )}
          icon={<FileText className="w-5 h-5" />}
        >
          {isUtilityReport ? (
            <div className="space-y-4 pt-1 text-left">
              <ReportTitleField
                value={formData.title || ''}
                error={errors.title}
                language={language}
                onChange={(value) => {
                  onUpdateFormData({ title: value });
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                }}
              />

              {isExcessElectricityBill ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <MonthField
                      id="recent-bill-month-input"
                      language={language}
                      required
                      label={language === 'bn' ? 'সাম্প্রতিক বিলের মাস' : 'Recent bill month'}
                      max={currentMonthLocal}
                      value={formData.recentBillMonth || ''}
                      error={errors.recentBillMonth}
                      onChange={(e) => {
                        onUpdateFormData({ recentBillMonth: e.target.value });
                        if (errors.recentBillMonth) setErrors((prev) => ({ ...prev, recentBillMonth: '' }));
                        if (
                          errors.previousBillMonth &&
                          formData.previousBillMonth &&
                          e.target.value &&
                          formData.previousBillMonth < e.target.value
                        ) {
                          setErrors((prev) => ({ ...prev, previousBillMonth: '' }));
                        }
                      }}
                    />
                    <NumberField
                      id="recent-bill-amount-input"
                      min="1"
                      step="any"
                      inputMode="decimal"
                      required
                      label={language === 'bn' ? 'সাম্প্রতিক বিলের পরিমাণ (টাকা)' : 'Recent bill amount (BDT)'}
                      placeholder={language === 'bn' ? 'যেমন: ৫০০০' : 'e.g. 5000'}
                      value={formData.recentBillAmount !== undefined && formData.recentBillAmount !== null ? formData.recentBillAmount : ''}
                      error={errors.recentBillAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateFormData({ recentBillAmount: val === '' ? undefined : Number(val) });
                        if (errors.recentBillAmount) setErrors((prev) => ({ ...prev, recentBillAmount: '' }));
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <MonthField
                      id="previous-bill-month-input"
                      language={language}
                      required
                      label={language === 'bn' ? 'আগের বিলের মাস' : 'Previous bill month'}
                      max={formData.recentBillMonth || currentMonthLocal}
                      value={formData.previousBillMonth || ''}
                      error={errors.previousBillMonth}
                      onChange={(e) => {
                        onUpdateFormData({ previousBillMonth: e.target.value });
                        if (errors.previousBillMonth) setErrors((prev) => ({ ...prev, previousBillMonth: '' }));
                      }}
                    />
                    <NumberField
                      id="previous-bill-amount-input"
                      min="1"
                      step="any"
                      inputMode="decimal"
                      required
                      label={language === 'bn' ? 'আগের বিলের পরিমাণ (টাকা)' : 'Previous bill amount (BDT)'}
                      placeholder={language === 'bn' ? 'যেমন: ১৫০০' : 'e.g. 1500'}
                      value={formData.previousBillAmount !== undefined && formData.previousBillAmount !== null ? formData.previousBillAmount : ''}
                      error={errors.previousBillAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateFormData({ previousBillAmount: val === '' ? undefined : Number(val) });
                        if (errors.previousBillAmount) setErrors((prev) => ({ ...prev, previousBillAmount: '' }));
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <DateField
                    id="complaint-date-input"
                    language={language}
                    required
                    label={language === 'bn' ? 'তারিখ' : 'Date'}
                    max={todayLocal}
                    value={formData.incidentDate || ''}
                    error={errors.incidentDate}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      if (selectedDate && selectedDate > todayLocal) {
                        setErrors((prev) => ({
                          ...prev,
                          incidentDate:
                            language === 'bn'
                              ? 'আজ বা আগের কোনো তারিখ নির্বাচন করুন।'
                              : 'Select today or an earlier date.',
                        }));
                        return;
                      }
                      onUpdateFormData({ incidentDate: selectedDate });
                      if (errors.incidentDate) setErrors((prev) => ({ ...prev, incidentDate: '' }));
                    }}
                  />
                  <TimeField
                    id="utility-start-time-input"
                    language={language}
                    required
                    label={language === 'bn' ? 'শুরুর সময়' : 'Start time'}
                    value={formData.incidentTime || ''}
                    error={errors.incidentTime}
                    onChange={(e) => {
                      onUpdateFormData({ incidentTime: e.target.value });
                      if (errors.incidentTime) setErrors((prev) => ({ ...prev, incidentTime: '' }));
                      if (errors.utilityEndTime && formData.utilityEndTime && e.target.value !== formData.utilityEndTime) {
                        setErrors((prev) => ({ ...prev, utilityEndTime: '' }));
                      }
                    }}
                  />
                  <TimeField
                    id="utility-end-time-input"
                    language={language}
                    label={language === 'bn' ? 'শেষ সময় (ঐচ্ছিক)' : 'End time (optional)'}
                    helperText={
                      formData.incidentTime && formData.utilityEndTime && formData.utilityEndTime < formData.incidentTime
                        ? language === 'bn'
                          ? 'শেষ সময়টি পরের দিনের হিসেবে ধরা হবে।'
                          : 'This end time is treated as the following day.'
                        : undefined
                    }
                    value={formData.utilityEndTime || ''}
                    error={errors.utilityEndTime}
                    onChange={(e) => {
                      onUpdateFormData({ utilityEndTime: e.target.value });
                      if (errors.utilityEndTime) setErrors((prev) => ({ ...prev, utilityEndTime: '' }));
                    }}
                  />
                </div>
              )}

              {/* Incident Description */}
              <TextAreaField
                id="complaint-desc-input"
                rows={4}
                maxLength={2000}
                required
                label={language === 'bn' ? 'বিবরণ' : 'Description'}
                value={formData.description || ''}
                error={errors.description}
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
                helperText={
                  (formData.description?.length || 0) >= 1600 ? (
                    <div className="text-right type-meta tabular-nums">
                      {formData.description?.length || 0} / 2000
                    </div>
                  ) : undefined
                }
              />
            </div>
          ) : (
          <div className="space-y-4 pt-1 text-left">
            <ReportTitleField
              value={formData.title || ''}
              error={errors.title}
              language={language}
              onChange={(value) => {
                onUpdateFormData({ title: value });
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
            />

            {/* Incident Narrative */}
            <TextAreaField
              id="complaint-desc-input"
              rows={4}
              maxLength={2000}
              required
              label={language === 'bn' ? 'কী ঘটেছিল?' : 'What happened?'}
              value={formData.description || ''}
              error={errors.description}
              onChange={(e) => {
                onUpdateFormData({ description: e.target.value });
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
              placeholder={
                language === 'bn'
                  ? 'ঘটনাটি সংক্ষেপে ও স্পষ্টভাবে লিখুন...'
                  : 'Describe the incident clearly...'
              }
              helperText={
                (formData.description?.length || 0) >= 1600 ? (
                  <div className="text-right type-meta tabular-nums">
                    {formData.description?.length || 0} / 2000
                  </div>
                ) : undefined
              }
            />

            {isBriberyReport && (
              <div className="pt-4 border-t border-ui-stroke-subtle space-y-3">
                <h4 className="type-compact font-[var(--font-weight-bold)] text-ui-content-primary">
                  {language === 'bn' ? 'ঘুষ সংক্রান্ত তথ্য' : 'Bribery details'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <SearchableSelect
                    id="bribery-department-select"
                    label={language === 'bn' ? 'দপ্তর (ঐচ্ছিক)' : 'Department (optional)'}
                    value={formData.briberyDepartment || ''}
                    onChange={(value) => onUpdateFormData({ briberyDepartment: value })}
                    placeholder={language === 'bn' ? 'দপ্তর নির্বাচন করুন' : 'Select department'}
                    searchPlaceholder={language === 'bn' ? 'দপ্তর খুঁজুন...' : 'Search department...'}
                    noResultsText={language === 'bn' ? 'কোনো মিল পাওয়া যায়নি' : 'No matching department'}
                    clearable
                    options={BRIBERY_DEPARTMENT_OPTIONS.map((option) => ({
                      value: option.value,
                      label: language === 'bn' ? option.labelBn : option.labelEn,
                      keywords: [option.labelBn, option.labelEn],
                    }))}
                  />
                  <TextField
                    id="bribery-service-input"
                    type="text"
                    label={language === 'bn' ? 'সেবা বা প্রক্রিয়া (ঐচ্ছিক)' : 'Service or process (optional)'}
                    value={formData.briberyService || ''}
                    onChange={(e) => onUpdateFormData({ briberyService: e.target.value })}
                    placeholder={language === 'bn' ? 'যেমন: মিউটেশন, পাসপোর্ট নবায়ন, লাইসেন্স' : 'e.g. mutation, passport renewal, licence'}
                  />
                  <NumberField
                    id="bribery-amount-input"
                    min="1"
                    step="any"
                    inputMode="decimal"
                    label={language === 'bn' ? 'টাকার পরিমাণ (ঐচ্ছিক)' : 'Amount (BDT) (optional)'}
                    value={formData.briberyAmount !== undefined && formData.briberyAmount !== null ? formData.briberyAmount : ''}
                    error={errors.briberyAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      onUpdateFormData({ briberyAmount: value === '' ? undefined : Number(value) });
                      if (errors.briberyAmount) setErrors((prev) => ({ ...prev, briberyAmount: '' }));
                    }}
                    placeholder={language === 'bn' ? 'যেমন: ৫০০০' : 'e.g. 5000'}
                  />
                </div>
              </div>
            )}

            {/* Incident timeline */}
            <div className={`grid grid-cols-1 ${hideIncidentTime && hideFrequency ? 'sm:grid-cols-1' : hideFrequency ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3`}>
              <DateField
                id="complaint-date-input"
                language={language}
                required
                label={language === 'bn' ? 'ঘটনার তারিখ' : 'Incident date'}
                max={todayLocal}
                value={formData.incidentDate || ''}
                error={errors.incidentDate}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  if (selectedDate && selectedDate > todayLocal) {
                    setErrors((prev) => ({
                      ...prev,
                      incidentDate:
                        language === 'bn'
                          ? 'আজ বা আগের কোনো তারিখ নির্বাচন করুন।'
                          : 'Select today or an earlier date.',
                    }));
                    return;
                  }
                  onUpdateFormData({ incidentDate: selectedDate });
                  if (errors.incidentDate) setErrors((prev) => ({ ...prev, incidentDate: '' }));
                }}
              />

              {!hideIncidentTime && (
                <TimeField
                  id="complaint-time-input"
                  language={language}
                  label={language === 'bn' ? 'সময় (ঐচ্ছিক)' : 'Time (optional)'}
                  value={formData.incidentTime || ''}
                  onChange={(e) => onUpdateFormData({ incidentTime: e.target.value })}
                />
              )}

              {!hideFrequency && (
                <Select
                  id="complaint-frequency-select"
                  label={language === 'bn' ? 'পুনরাবৃত্তি' : 'Frequency'}
                  value={formData.frequency || 'one-time'}
                  onChange={(e) =>
                    onUpdateFormData({ frequency: e.target.value as ReportFormData['frequency'] })
                  }
                  options={(isSexualHarassment
                    ? SEXUAL_HARASSMENT_FREQUENCY_OPTIONS
                    : [
                        { value: 'one-time', labelBn: 'এককালীন (One-time)', labelEn: 'One-time' },
                        { value: 'repeated', labelBn: 'নিয়মিত / একাধিকবার', labelEn: 'Repeated / Ongoing' },
                      ]
                  ).map((option) => ({
                    value: option.value,
                    label: language === 'bn' ? option.labelBn : option.labelEn,
                  }))}
                />
              )}
            </div>

            {isSexualHarassment && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 border-t border-ui-stroke-subtle">
                <Select
                  id="sexual-harassment-type-select"
                  label={language === 'bn' ? 'হয়রানির ধরন' : 'Type of harassment'}
                  required
                  value={formData.sexualHarassmentType || ''}
                  onChange={(event) => {
                    onUpdateFormData({
                      sexualHarassmentType: event.target.value as ReportFormData['sexualHarassmentType'],
                    });
                    if (errors.sexualHarassmentType) {
                      setErrors((prev) => ({ ...prev, sexualHarassmentType: '' }));
                    }
                  }}
                  placeholder={language === 'bn' ? '-- হয়রানির ধরন নির্বাচন করুন --' : '-- Select harassment type --'}
                  error={errors.sexualHarassmentType}
                  options={SEXUAL_HARASSMENT_TYPE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: language === 'bn' ? option.labelBn : option.labelEn,
                  }))}
                />

                <Select
                  id="sexual-harassment-context-select"
                  label={language === 'bn' ? 'ঘটনার প্রেক্ষাপট' : 'Incident context'}
                  required
                  value={formData.sexualHarassmentContext || ''}
                  onChange={(event) => {
                    const value = event.target.value as ReportFormData['sexualHarassmentContext'];
                    onUpdateFormData({
                      sexualHarassmentContext: value,
                      sexualHarassmentInstitution: needsSexualHarassmentInstitution(value)
                        ? formData.sexualHarassmentInstitution
                        : '',
                    });
                    if (errors.sexualHarassmentContext || errors.sexualHarassmentInstitution) {
                      setErrors((prev) => ({
                        ...prev,
                        sexualHarassmentContext: '',
                        sexualHarassmentInstitution: '',
                      }));
                    }
                  }}
                  placeholder={language === 'bn' ? '-- কোথায় / কোন প্রেক্ষাপটে --' : '-- Select incident context --'}
                  error={errors.sexualHarassmentContext}
                  options={SEXUAL_HARASSMENT_CONTEXT_OPTIONS.map((option) => ({
                    value: option.value,
                    label: language === 'bn' ? option.labelBn : option.labelEn,
                  }))}
                />

                {needsSexualHarassmentInstitution(formData.sexualHarassmentContext) && (
                  <TextField
                    id="sexual-harassment-institution-input"
                    type="text"
                    maxLength={200}
                    label={
                      language === 'bn'
                        ? 'প্রতিষ্ঠান / সংস্থার নাম (ঐচ্ছিক)'
                        : 'Institution / organization (optional)'
                    }
                    value={formData.sexualHarassmentInstitution || ''}
                    error={errors.sexualHarassmentInstitution}
                    onChange={(event) => {
                      onUpdateFormData({ sexualHarassmentInstitution: event.target.value });
                      if (errors.sexualHarassmentInstitution) {
                        setErrors((prev) => ({ ...prev, sexualHarassmentInstitution: '' }));
                      }
                    }}
                    placeholder={
                      language === 'bn'
                        ? 'উৎস বা ঘটনার তথ্য অনুযায়ী প্রতিষ্ঠানের নাম'
                        : 'Institution name, if known'
                    }
                  />
                )}
              </div>
            )}

            {segment === 'harassment' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 border-t border-ui-stroke-subtle">
                <Select
                  id="harassment-age-group-select"
                  label={language === 'bn' ? 'প্রভাবিত ব্যক্তির বয়সের গ্রুপ' : "Affected person's age group"}
                  required
                  value={formData.affectedPersonAgeGroup || ''}
                  onChange={(event) => {
                    onUpdateFormData({ affectedPersonAgeGroup: event.target.value as ReportFormData['affectedPersonAgeGroup'] });
                    if (errors.affectedPersonAgeGroup) setErrors((prev) => ({ ...prev, affectedPersonAgeGroup: '' }));
                  }}
                  placeholder={language === 'bn' ? '-- বয়সের গ্রুপ নির্বাচন করুন --' : '-- Select age group --'}
                  error={errors.affectedPersonAgeGroup}
                  options={(isSexualHarassment
                    ? SEXUAL_HARASSMENT_AGE_GROUP_OPTIONS
                    : HARASSMENT_AGE_GROUP_OPTIONS
                  ).map((option) => ({
                    value: option.value,
                    label: language === 'bn' ? option.labelBn : option.labelEn,
                  }))}
                />

                <SearchableSelect
                  id="harassment-abuser-relationship-select"
                  label={language === 'bn' ? 'অভিযুক্ত ব্যক্তির সঙ্গে সম্পর্ক' : 'Relationship with alleged abuser'}
                  required
                  value={formData.allegedAbuserRelationship || ''}
                  onChange={(value) => {
                    onUpdateFormData({ allegedAbuserRelationship: value as ReportFormData['allegedAbuserRelationship'] });
                    if (errors.allegedAbuserRelationship) setErrors((prev) => ({ ...prev, allegedAbuserRelationship: '' }));
                  }}
                  placeholder={language === 'bn' ? 'সম্পর্ক নির্বাচন করুন' : 'Select relationship'}
                  searchPlaceholder={language === 'bn' ? 'সম্পর্ক খুঁজুন...' : 'Search relationship...'}
                  noResultsText={language === 'bn' ? 'কোনো মিল পাওয়া যায়নি' : 'No matching relationship'}
                  error={errors.allegedAbuserRelationship}
                  options={(isSexualHarassment
                    ? SEXUAL_HARASSMENT_RELATIONSHIP_OPTIONS
                    : HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS
                  ).map((option) => ({
                    value: option.value,
                    label: language === 'bn' ? option.labelBn : option.labelEn,
                    keywords: [option.labelBn, option.labelEn],
                  }))}
                />

                <Select
                  id="harassment-reporting-for-select"
                  label={language === 'bn' ? 'কার জন্য প্রতিবেদন করছেন?' : 'Reporting for'}
                  required
                  value={formData.reportingFor || ''}
                  onChange={(event) => {
                    onUpdateFormData({ reportingFor: event.target.value as ReportFormData['reportingFor'] });
                    if (errors.reportingFor) setErrors((prev) => ({ ...prev, reportingFor: '' }));
                  }}
                  placeholder={language === 'bn' ? '-- নির্বাচন করুন --' : '-- Select --'}
                  error={errors.reportingFor}
                  options={HARASSMENT_REPORTING_FOR_OPTIONS.map((option) => ({
                    value: option.value,
                    label: language === 'bn' ? option.labelBn : option.labelEn,
                  }))}
                />
              </div>
            )}

            {/* Conditional Digital Threat Questions ONLY for Digital Harassment */}
            {isDigitalHarassment && (
              <div className="pt-4 border-t border-ui-stroke-subtle space-y-3 mt-2">
                <h4 className="type-compact font-[var(--font-weight-bold)] text-ui-content-primary">
                  {language === 'bn' ? 'অনলাইন ও ব্ল্যাকমেইল সংক্রান্ত সুনির্দিষ্ট তথ্য' : 'Digital threat & evidence details'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    id="intimate-action-select"
                    label={language === 'bn' ? 'কী ঘটেছে বা হুমকি দেওয়া হচ্ছে?' : 'Threat status / action'}
                    value={formData.intimateWhatHappened || ''}
                    onChange={(event) => onUpdateFormData({ intimateWhatHappened: event.target.value })}
                    placeholder={language === 'bn' ? '-- নির্বাচন করুন --' : '-- Select --'}
                    options={INTIMATE_WHAT_HAPPENED_OPTIONS.map((option) => ({
                      value: option.id,
                      label: language === 'bn' ? option.nameBn : option.nameEn,
                    }))}
                  />
                  <Select
                    id="intimate-platform-select"
                    label={language === 'bn' ? 'কোন মাধ্যমে হুমকি বা অপপ্রচার হচ্ছে?' : 'Platform / channel'}
                    value={formData.intimatePlatform || ''}
                    onChange={(event) => onUpdateFormData({ intimatePlatform: event.target.value })}
                    placeholder={language === 'bn' ? '-- নির্বাচন করুন --' : '-- Select --'}
                    options={INTIMATE_PLATFORMS.map((platform) => ({
                      value: platform.id,
                      label: language === 'bn' ? platform.nameBn : platform.nameEn,
                    }))}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        </Accordion>

        {/* SECTION 2: Location (লোকেশন) - NON-COLLAPSIBLE */}
        <Accordion
          id="composer-section-location"
          className="report-composer-card"
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
              <p className="type-compact text-ui-content-secondary leading-normal">
                {language === 'bn'
                  ? 'অনলাইন বা ডিজিটাল ঘটনার ক্ষেত্রে প্রাসঙ্গিক এলাকা বা জেলা নির্বাচন করুন।'
                  : 'For online incidents, select the most relevant area or district.'}
              </p>
            )}

            {/* Reporter Device Location Gate */}
            {reporterGateState === 'verified' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-badge-md)] bg-ui-success-bg border border-ui-success-border text-ui-success-text type-compact font-[var(--font-weight-semibold)]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{language === 'bn' ? 'ডিভাইস লোকেশন চালু আছে' : 'Device location is on'}</span>
              </div>
            ) : reporterGateState === 'denied' ? (
              <div className="p-3.5 rounded-[var(--radius-control)] border border-ui-error-border bg-ui-error-bg space-y-2.5 text-left">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-ui-error-text shrink-0 mt-0.5" />
                  <div className="flex-1 type-compact text-ui-content-primary leading-relaxed">
                    {language === 'bn'
                      ? 'লোকেশন অনুমতি পাওয়া যায়নি। ব্রাউজার বা ডিভাইসে লোকেশন চালু করে আবার চেষ্টা করুন।'
                      : 'Location permission was not granted. Please enable location in your browser or device settings and try again.'}
                  </div>
                </div>
                <div className="flex justify-start pt-0.5">
                  <button
                    id="reporter-location-allow-btn"
                    type="button"
                    onClick={handleRetryLocationClick}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-[var(--radius-control)] bg-ui-action-bg hover:bg-ui-action-hover text-ui-action-text type-compact font-[var(--font-weight-semibold)] transition-colors cursor-pointer shadow-[var(--elevation-xs)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus active:scale-95"
                  >
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{language === 'bn' ? 'আবার চেষ্টা করুন' : 'Try again'}</span>
                  </button>
                </div>
              </div>
            ) : reporterGateState === 'unavailable' ? (
              <div className="p-3.5 rounded-[var(--radius-control)] border border-ui-warning-border bg-ui-warning-bg space-y-2.5 text-left">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-ui-warning-text shrink-0 mt-0.5" />
                  <div className="flex-1 type-compact text-ui-content-primary leading-relaxed">
                    {language === 'bn'
                      ? 'লোকেশন পাওয়া যাচ্ছে না। জিপিএস বা ডিভাইস লোকেশন চালু করে আবার চেষ্টা করুন।'
                      : 'Device location could not be detected. Make sure GPS or location services are enabled and try again.'}
                  </div>
                </div>
                <div className="flex justify-start pt-0.5">
                  <button
                    id="reporter-location-allow-btn"
                    type="button"
                    onClick={handleRetryLocationClick}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-[var(--radius-control)] bg-ui-warning-text hover:opacity-90 text-ui-surface type-compact font-[var(--font-weight-semibold)] transition-colors cursor-pointer shadow-[var(--elevation-xs)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus active:scale-95"
                  >
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{language === 'bn' ? 'আবার চেষ্টা করুন' : 'Try again'}</span>
                  </button>
                </div>
              </div>
            ) : reporterGateState === 'requesting' || reporterGateState === 'checking' ? (
              <div className="p-3.5 rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface-subtle/70 space-y-2.5 text-left">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-ui-content-primary shrink-0 mt-0.5" />
                  <div className="flex-1 type-compact text-ui-content-primary leading-relaxed">
                    {language === 'bn'
                      ? 'অভিযোগের স্থান নির্বাচন করতে আপনার ডিভাইসের লোকেশন চালু করুন।'
                      : 'Turn on device location before selecting the incident location.'}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-0.5 type-compact text-ui-accent font-[var(--font-weight-medium)]">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>{language === 'bn' ? 'লোকেশন যাচাই হচ্ছে...' : 'Checking location...'}</span>
                </div>
              </div>
            ) : (
              /* 'required' or idle */
              <div className="p-3.5 rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface-subtle/70 space-y-2.5 text-left">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-ui-content-primary shrink-0 mt-0.5" />
                  <div className="flex-1 type-compact text-ui-content-primary leading-relaxed">
                    {language === 'bn'
                      ? 'অভিযোগের স্থান নির্বাচন করতে আপনার ডিভাইসের লোকেশন চালু করুন।'
                      : 'Turn on device location before selecting the incident location.'}
                  </div>
                </div>
                <div className="flex justify-start pt-0.5">
                  <button
                    id="reporter-location-allow-btn"
                    type="button"
                    onClick={handleRetryLocationClick}
                    aria-describedby={errors.reporterLocation ? 'reporter-location-error' : undefined}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-[var(--radius-control)] bg-ui-action-bg hover:bg-ui-action-hover text-ui-action-text type-compact font-[var(--font-weight-semibold)] transition-colors cursor-pointer shadow-[var(--elevation-xs)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus active:scale-95"
                  >
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{language === 'bn' ? 'লোকেশন চালু করুন' : 'Allow location'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Prerequisite validation error message */}
            {errors.reporterLocation && (
              <div id="reporter-location-error" role="alert" className="type-compact text-ui-error-text font-[var(--font-weight-semibold)] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-ui-error-text" aria-hidden="true" />
                <span>{errors.reporterLocation}</span>
              </div>
            )}

            {/* Clean Manual Incident Location Form */}
            <div className="space-y-3 pt-1">
              {/* Administrative searchable selects (dependent Division → District → Thana/Upazila) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <SearchableSelect
                  id="complaint-division-select"
                  label={language === 'bn' ? 'বিভাগ' : 'Division'}
                  required
                  disabled={isLocationLocked}
                  value={resolvedDivision ? resolvedDivision.nameEn : ''}
                  onChange={handleDivisionChange}
                  placeholder={language === 'bn' ? 'বিভাগ বেছে নিন' : 'Select division'}
                  searchPlaceholder={language === 'bn' ? 'বিভাগ খুঁজুন...' : 'Search divisions...'}
                  noResultsText={language === 'bn' ? 'কোনো বিভাগ পাওয়া যায়নি' : 'No matching division'}
                  error={errors.division}
                  options={DIVISIONS.map((div) => ({
                    value: div.nameEn,
                    label: language === 'bn' ? div.nameBn : div.nameEn,
                    keywords: [div.nameEn, div.nameBn],
                  }))}
                />

                <SearchableSelect
                  id="complaint-district-select"
                  label={language === 'bn' ? 'জেলা' : 'District'}
                  required
                  disabled={isLocationLocked || !resolvedDivision}
                  value={resolvedDistrict ? resolvedDistrict.nameEn : ''}
                  onChange={handleDistrictChange}
                  placeholder={language === 'bn' ? 'জেলা বেছে নিন' : 'Select district'}
                  searchPlaceholder={language === 'bn' ? 'জেলা খুঁজুন...' : 'Search districts...'}
                  noResultsText={language === 'bn' ? 'কোনো জেলা পাওয়া যায়নি' : 'No matching district'}
                  error={errors.district}
                  options={availableDistricts.map((district) => ({
                    value: district.nameEn,
                    label: language === 'bn' ? district.nameBn : district.nameEn,
                    keywords: [district.nameEn, district.nameBn],
                  }))}
                />

                <SearchableSelect
                  id="complaint-thana-select"
                  label={language === 'bn' ? 'থানা / উপজেলা' : 'Thana / upazila'}
                  required
                  disabled={isLocationLocked || !resolvedDistrict}
                  value={resolvedUpazila ? resolvedUpazila.nameEn : ''}
                  onChange={handleUpazilaChange}
                  placeholder={language === 'bn' ? 'থানা / উপজেলা বেছে নিন' : 'Select thana / upazila'}
                  searchPlaceholder={language === 'bn' ? 'থানা / উপজেলা খুঁজুন...' : 'Search thana / upazila...'}
                  noResultsText={language === 'bn' ? 'কোনো থানা / উপজেলা পাওয়া যায়নি' : 'No matching thana / upazila'}
                  error={errors.upazilaOrThana}
                  className="sm:col-span-2 lg:col-span-1"
                  options={availableUpazilas.map((upazila) => ({
                    value: upazila.nameEn,
                    label: language === 'bn' ? upazila.nameBn : upazila.nameEn,
                    keywords: [upazila.nameEn, upazila.nameBn],
                  }))}
                />
              </div>

              {/* Row 3: Detailed Address (Optional for non-utility, completely omitted for utility) */}
              {!isUtilityReport && (
                <TextAreaField
                  id="complaint-address-input"
                  rows={3}
                  disabled={isLocationLocked}
                  label={language === 'bn' ? 'বিস্তারিত ঠিকানা (ঐচ্ছিক)' : 'Detailed address (optional)'}
                  value={formData.location?.formattedAddress || ''}
                  error={errors.formattedAddress}
                  onChange={(e) => handleManualLocationChange({ formattedAddress: e.target.value })}
                  placeholder={
                    language === 'bn'
                      ? 'বাড়ি/হোল্ডিং, রাস্তা, বাজার, প্রতিষ্ঠান, পরিচিত স্থান বা প্রয়োজনীয় অন্যান্য ঠিকানা লিখুন'
                      : 'Enter house/holding, road, market, institution, landmark, or other useful address details'
                  }
                  maxLength={500}
                  className="resize-none"
                />
              )}

              {/* Optional address/place search; no report-input map */}
              <div className="pt-2 space-y-3">
                {isGooglePlacesConfigured() && (
                  <AddressSearchInput
                    language={language}
                    label={language === 'bn' ? 'ঠিকানা দিয়ে অনুসন্ধান (ঐচ্ছিক)' : 'Search address or place (optional)'}
                    onPlaceSelected={handleAddressSearchPlaceSelected}
                    onClear={() =>
                      onUpdateFormData({
                        location: {
                          ...formData.location,
                          formattedAddress: '',
                          road: '',
                          area: '',
                          landmark: '',
                          placeId: undefined,
                          lat: undefined,
                          lng: undefined,
                        },
                      })
                    }
                    biasCoords={
                      formData.location?.lat && formData.location?.lng
                        ? { lat: formData.location.lat, lng: formData.location.lng }
                        : resolvedDistrict
                        ? { lat: resolvedDistrict.lat, lng: resolvedDistrict.lng }
                        : resolvedDivision
                        ? { lat: resolvedDivision.lat, lng: resolvedDivision.lng }
                        : undefined
                    }
                    initialValue=""
                    disabled={isLocationLocked}
                  />
                )}
              </div>
            </div>
          </div>
        </Accordion>

        {/* SECTION 3 (HARASSMENT): Identity & Privacy (পরিচয় ও গোপনীয়তা) - NON-COLLAPSIBLE */}
        {showsIdentitySection && (
          <Accordion
            id="composer-section-identity"
          className="report-composer-card"
            isOpen={true}
            collapsible={false}
            onToggle={() => {}}
            title={language === 'bn' ? '৩. পরিচয় ও গোপনীয়তা' : '3. Identity & Privacy'}
            hasError={Boolean(errors.adminContact || errors.adminName)}
            icon={<Shield className="w-5 h-5" />}
          >
            <div className="space-y-3.5 pt-1 text-left">
              {/* Primary Toggle: Keep Identity Private */}
              <div className="p-3.5 rounded-[var(--radius-card)] bg-ui-surface-subtle border border-ui-stroke-subtle space-y-3">
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
                    <div className="flex items-center gap-2 type-compact font-[var(--font-weight-semibold)] text-ui-content-primary">
                      <Lock className="w-3.5 h-3.5 text-ui-content-primary" />
                      <span>
                        {language === 'bn'
                          ? 'মডারেটরের সাথে যোগাযোগের তথ্য'
                          : 'Moderator Follow-up Contact Information'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField
                        id="reporter-admin-name"
                        type="text"
                        label={language === 'bn' ? 'আপনার নাম (ঐচ্ছিক)' : 'Your name (optional)'}
                        value={formData.adminName || ''}
                        error={errors.adminName}
                        onChange={(e) => {
                          onUpdateFormData({ adminName: e.target.value });
                          if (errors.adminName) setErrors((prev) => ({ ...prev, adminName: '' }));
                        }}
                        placeholder={language === 'bn' ? 'নাম' : 'Name'}
                        autoComplete="name"
                      />

                      <ContactField
                        id="reporter-admin-contact"
                        required
                        label={language === 'bn' ? 'মোবাইল নম্বর বা ইমেইল' : 'Phone number or email'}
                        value={formData.adminContact || ''}
                        error={errors.adminContact}
                        onChange={(e) => {
                          onUpdateFormData({ adminContact: e.target.value });
                          if (errors.adminContact) setErrors((prev) => ({ ...prev, adminContact: '' }));
                        }}
                        placeholder={language === 'bn' ? '০১৭xxxxxxxx বা user@example.com' : '017xxxxxxxx or email'}
                      />
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
              <div className="p-3 rounded-[var(--radius-control)] bg-ui-surface border border-ui-stroke-subtle flex items-start gap-2 type-compact text-ui-content-secondary">
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
          className="report-composer-card"
            isOpen={Boolean(openSections.parties)}
            collapsible={true}
            onToggle={() => toggleSection('parties')}
            title={
              language === 'bn'
                ? '৩. চার্জিং স্টেশন / পরিচালনাকারীর তথ্য (ঐচ্ছিক)'
                : '3. Charging station / operator information (optional)'
            }
            summary={
              hasChargingStationOperatorData ? (
                <span className="inline-flex items-center gap-1.5 text-ui-accent font-[var(--font-weight-medium)] type-compact">
                  <span className="w-1.5 h-1.5 rounded-[var(--radius-pill)] bg-ui-accent inline-block" />
                  {language === 'bn' ? 'তথ্য যোগ করা হয়েছে' : 'Information added'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-ui-content-secondary type-compact">
                  <Plus className="w-3.5 h-3.5 text-ui-content-secondary" />
                  <span>{language === 'bn' ? 'তথ্য যোগ করুন' : 'Add information'}</span>
                </span>
              )
            }
            icon={<Users className="w-5 h-5" />}
          >
            <div className="space-y-3.5 pt-1 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextField
                  id="operator-subject-name"
                  type="text"
                  label={language === 'bn' ? 'নাম / পরিচিতি' : 'Name / known identity'}
                  value={formData.reportedSubject || formData.organization || ''}
                  onChange={(e) => handleOperatorNameChange(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? 'স্টেশন, গ্যারেজ, ব্যক্তি বা প্রতিষ্ঠানের নাম জানা থাকলে লিখুন'
                      : 'Enter the station, garage, person, or organization name if known'
                  }
                />
                <TextField
                  id="operator-contact"
                  type="text"
                  label={language === 'bn' ? 'ফোন / যোগাযোগ' : 'Phone / contact'}
                  value={formData.publicProfileHandle || ''}
                  onChange={(e) => onUpdateFormData({ publicProfileHandle: e.target.value })}
                  placeholder={
                    language === 'bn'
                      ? 'ফোন নম্বর বা জানা যোগাযোগের তথ্য'
                      : 'Phone number or known contact information'
                  }
                />
              </div>

              <TextField
                id="operator-role"
                type="text"
                label={language === 'bn' ? 'ভূমিকা / দায়িত্ব' : 'Role / responsibility'}
                value={formData.roleOrDesignation || ''}
                onChange={(e) => onUpdateFormData({ roleOrDesignation: e.target.value })}
                placeholder={
                  language === 'bn'
                    ? 'যেমন: মালিক, ম্যানেজার, পরিচালনাকারী'
                    : 'e.g. Owner, Manager, Operator'
                }
              />

              <TextAreaField
                id="operator-identifying-desc"
                rows={2}
                label={language === 'bn' ? 'অন্যান্য শনাক্তকারী তথ্য' : 'Other identifying details'}
                value={formData.identifyingDescription || ''}
                onChange={(e) => onUpdateFormData({ identifyingDescription: e.target.value })}
                placeholder={
                  language === 'bn'
                    ? 'সাইনবোর্ড, চেহারা, অবস্থান সূত্র বা অন্য কোনো পরিচিত তথ্য'
                    : 'Signage, appearance, location clues, or any other known identifying information'
                }
              />
            </div>
          </Accordion>
        )}

        {/* SECTION 3: Contextual Party Info - COLLAPSIBLE (DEFAULT: COLLAPSED UNLESS DATA EXISTS) */}
        {showsPartySection && !isChargingStationOperator && subjectConfig && (
          <Accordion
            id="composer-section-parties"
          className="report-composer-card"
            isOpen={Boolean(openSections.parties)}
            collapsible={true}
            onToggle={() => toggleSection('parties')}
            title={
              language === 'bn'
                ? `৩. ${subjectConfig.sectionTitleBn} (ঐচ্ছিক)`
                : `3. ${subjectConfig.sectionTitleEn} (optional)`
            }
            summary={
              hasExtortionPartyData ? (
                <span className="inline-flex items-center gap-1.5 text-ui-accent font-[var(--font-weight-medium)] type-compact">
                  <span className="w-1.5 h-1.5 rounded-[var(--radius-pill)] bg-ui-accent inline-block" />
                  {language === 'bn' ? 'তথ্য যোগ করা হয়েছে' : 'Information added'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-ui-content-secondary type-compact">
                  <Plus className="w-3.5 h-3.5 text-ui-content-secondary" />
                  <span>{language === 'bn' ? 'তথ্য যোগ করুন' : 'Add information'}</span>
                </span>
              )
            }
            icon={<Users className="w-5 h-5" />}
          >
            <div className="space-y-4 pt-1 text-left">
              <p className="type-compact text-ui-content-secondary leading-relaxed">
                {language === 'bn' ? subjectConfig.questionBn : subjectConfig.questionEn}
              </p>
              <div className="space-y-3 sm:space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField
                    id="extortion-subject-name"
                    type="text"
                    label={
                      language === 'bn'
                        ? subjectConfig.nameLabelBn || 'নাম / পরিচিতি'
                        : subjectConfig.nameLabelEn || 'Name / known identity'
                    }
                    value={formData.reportedSubject || ''}
                    onChange={(e) => onUpdateFormData({ reportedSubject: e.target.value })}
                    placeholder={
                      language === 'bn'
                        ? subjectConfig.namePlaceholderBn || 'নাম বা পরিচিতি জানা থাকলে লিখুন'
                        : subjectConfig.namePlaceholderEn || 'Enter the name or known identity if available'
                    }
                  />
                  <TextField
                    id="extortion-contact"
                    type="text"
                    label={language === 'bn' ? 'ফোন / যোগাযোগ' : 'Phone / contact'}
                    value={formData.publicProfileHandle || ''}
                    onChange={(e) => onUpdateFormData({ publicProfileHandle: e.target.value })}
                    placeholder={
                      language === 'bn'
                        ? 'ফোন নম্বর, অনলাইন পরিচিতি বা অন্য যোগাযোগের তথ্য'
                        : 'Phone number, online identity, or other contact information'
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField
                    id="extortion-role"
                    type="text"
                    label={
                      language === 'bn'
                        ? subjectConfig.roleLabelBn || 'ভূমিকা / পদবি'
                        : subjectConfig.roleLabelEn || 'Role / designation'
                    }
                    value={formData.roleOrDesignation || ''}
                    onChange={(e) => onUpdateFormData({ roleOrDesignation: e.target.value })}
                    placeholder={
                      language === 'bn'
                        ? subjectConfig.rolePlaceholderBn || 'ভূমিকা বা পদবি জানা থাকলে লিখুন'
                        : subjectConfig.rolePlaceholderEn || 'Enter the role or designation if known'
                    }
                  />
                  <TextField
                    id="extortion-org"
                    type="text"
                    label={
                      language === 'bn'
                        ? subjectConfig.organizationLabelBn || 'দল / প্রতিষ্ঠান / সংগঠন'
                        : subjectConfig.organizationLabelEn || 'Group / organization'
                    }
                    value={formData.organization || ''}
                    onChange={(e) => onUpdateFormData({ organization: e.target.value })}
                    placeholder={
                      language === 'bn'
                        ? subjectConfig.organizationPlaceholderBn || 'সংশ্লিষ্ট দল, প্রতিষ্ঠান বা সংগঠনের নাম জানা থাকলে লিখুন'
                        : subjectConfig.organizationPlaceholderEn || 'Enter the related group or organization if known'
                    }
                  />
                </div>

                <TextAreaField
                  id="extortion-identifying-desc"
                  rows={2}
                  label={language === 'bn' ? 'অন্যান্য শনাক্তকারী তথ্য' : 'Other identifying details'}
                  value={formData.identifyingDescription || ''}
                  onChange={(e) => onUpdateFormData({ identifyingDescription: e.target.value })}
                  placeholder={
                    language === 'bn'
                      ? subjectConfig.identifyingPlaceholderBn || 'চেহারা, যানবাহন, অবস্থান সূত্র বা অন্য কোনো শনাক্তকারী তথ্য'
                      : subjectConfig.identifyingPlaceholderEn || 'Appearance, vehicle, location clues, or other identifying details'
                  }
                />
              </div>

              {/* Additional Mentioned Parties */}
              <div className="space-y-3 pt-1">
                {formData.mentionedParties && formData.mentionedParties.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="type-compact font-[var(--font-weight-bold)] text-ui-content-primary">
                      {language === 'bn' ? 'অতিরিক্ত সংশ্লিষ্ট পক্ষসমূহ' : 'Additional mentioned parties'}
                    </h4>
                    {formData.mentionedParties.map((party, pIdx) => (
                      <div
                        key={party.id || pIdx}
                        className="p-3.5 sm:p-4 rounded-[var(--radius-card)] bg-ui-surface border border-ui-stroke-subtle space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="type-compact font-[var(--font-weight-bold)] text-ui-content-primary">
                            {language === 'bn' ? `পক্ষ #${pIdx + 2}` : `Party #${pIdx + 2}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAdditionalParty(party.id)}
                            className="inline-flex items-center gap-1 type-compact text-ui-error-text hover:underline cursor-pointer px-2 py-1 min-h-[44px] min-w-[44px] rounded-[var(--radius-badge-md)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'মুছে ফেলুন' : 'Remove'}</span>
                          </button>
                        </div>

                        {/* Unified additional-party fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <TextField
                            id={`party-${party.id}-name`}
                            type="text"
                            label={
                              language === 'bn'
                                ? subjectConfig.nameLabelBn || 'নাম / পরিচিতি'
                                : subjectConfig.nameLabelEn || 'Name / known identity'
                            }
                            value={party.name || ''}
                            onChange={(e) => handleUpdateAdditionalParty(party.id, { name: e.target.value })}
                            placeholder={language === 'bn' ? 'নাম বা পরিচিত নাম' : 'Name or known identity'}
                          />
                          <TextField
                            id={`party-${party.id}-contact`}
                            type="text"
                            label={language === 'bn' ? 'ফোন / যোগাযোগ' : 'Phone / contact'}
                            value={party.phoneOrContact || party.publicProfileHandle || ''}
                            onChange={(e) =>
                              handleUpdateAdditionalParty(party.id, {
                                phoneOrContact: e.target.value,
                                publicProfileHandle: e.target.value,
                              })
                            }
                            placeholder={language === 'bn' ? 'ফোন নম্বর বা যোগাযোগের তথ্য' : 'Phone number or contact info'}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <TextField
                            id={`party-${party.id}-role`}
                            type="text"
                            label={
                              language === 'bn'
                                ? subjectConfig.roleLabelBn || 'ভূমিকা / পদবি'
                                : subjectConfig.roleLabelEn || 'Role / designation'
                            }
                            value={party.roleOrDesignation || ''}
                            onChange={(e) =>
                              handleUpdateAdditionalParty(party.id, { roleOrDesignation: e.target.value })
                            }
                            placeholder={language === 'bn' ? 'ভূমিকা বা পদবি' : 'Role or designation'}
                          />
                          <TextField
                            id={`party-${party.id}-organization`}
                            type="text"
                            label={
                              language === 'bn'
                                ? subjectConfig.organizationLabelBn || 'দল / প্রতিষ্ঠান / সংগঠন'
                                : subjectConfig.organizationLabelEn || 'Group / organization'
                            }
                            value={party.organization || ''}
                            onChange={(e) =>
                              handleUpdateAdditionalParty(party.id, { organization: e.target.value })
                            }
                            placeholder={language === 'bn' ? 'দল, সমিতি বা প্রতিষ্ঠানের নাম' : 'Group, association, or organization'}
                          />
                        </div>

                        <TextAreaField
                          id={`party-${party.id}-identifying`}
                          rows={2}
                          label={language === 'bn' ? 'অন্যান্য শনাক্তকারী তথ্য' : 'Other identifying details'}
                          value={party.identifyingDescription || ''}
                          onChange={(e) =>
                            handleUpdateAdditionalParty(party.id, { identifyingDescription: e.target.value })
                          }
                          placeholder={language === 'bn' ? 'চেহারা, যানবাহন বা অন্য শনাক্তকারী তথ্য' : 'Appearance, vehicle, or identifying details'}
                        />
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[var(--radius-control)] bg-ui-surface border border-ui-stroke-subtle type-compact font-[var(--font-weight-semibold)] text-ui-content-primary cursor-pointer transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus active:scale-95"
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
          className="report-composer-card"
            isOpen={Boolean(openSections.attachments)}
            collapsible={true}
            onToggle={() => toggleSection('attachments')}
            title={
              isUtilityReport
                ? language === 'bn'
                  ? '৩. সংযুক্তি (ঐচ্ছিক)'
                  : '3. Attachments (optional)'
                : language === 'bn'
                ? '৪. সংযুক্তি (ঐচ্ছিক)'
                : '4. Attachments (optional)'
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
                <span className="px-2 py-0.5 rounded-[var(--radius-pill)] bg-ui-accent-soft text-ui-accent type-compact font-[var(--font-weight-bold)]">
                  {pendingImages.length}
                </span>
              ) : undefined
            }
            icon={<Paperclip className="w-5 h-5" />}
          >
            <div className="space-y-3.5 pt-1 text-left">
              <p className="type-compact text-ui-content-secondary">
                {isExcessElectricityBill
                  ? language === 'bn'
                    ? 'বিদ্যুৎ বিলের কপি বা মিটারের ছবি থাকলে সংযুক্ত করুন। এটি সম্পূর্ণ ঐচ্ছিক।'
                    : 'Attach copies of electricity bills or meter photos if available. This is completely optional.'
                  : language === 'bn'
                  ? 'অভিযোগ বুঝতে সহায়ক ছবি বা স্ক্রিনশট থাকলে সংযুক্ত করুন। এটি সম্পূর্ণ ঐচ্ছিক।'
                  : 'Attach images or screenshots if they help explain the complaint. This is completely optional.'}
              </p>

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
