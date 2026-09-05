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
} from 'lucide-react';
import { SectionKey } from '../../theme/tokens';
import { DraftReport, ReportLocationData, MentionedParty, isValidIncidentCoordinates, isMeaningfulMentionedParty } from '../../services/types';
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
  BANGLADESH_DISTRICTS,
  DivisionInfo,
  DistrictInfo,
} from '../../data/districts';
import { Accordion } from '../ui/Accordion';
import { Toggle } from '../ui/Toggle';
import { ImageAttachmentPicker, AttachedImagePreview } from '../media/ImageAttachmentPicker';
import { GoogleMapPicker } from '../location/GoogleMapPicker';
import { AddressSearchInput } from '../location/AddressSearchInput';
import {
  loadGooglePlacesScript,
  ResolvedPlaceResult,
  buildResolvedLocationData,
} from '../../services/googlePlacesService';

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
      attachments: initialOpenSection === 'attachments',
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

      // Check if user changed a geographic address field that invalidates the selected map point
      const isGeographicFieldChanged =
        ('division' in locUpdates && locUpdates.division !== formData.location?.division) ||
        ('district' in locUpdates && locUpdates.district !== formData.location?.district) ||
        ('area' in locUpdates && locUpdates.area !== formData.location?.area) ||
        ('upazilaOrThana' in locUpdates && locUpdates.upazilaOrThana !== formData.location?.upazilaOrThana) ||
        ('road' in locUpdates && locUpdates.road !== formData.location?.road) ||
        ('landmark' in locUpdates && locUpdates.landmark !== formData.location?.landmark);

      const hadValidCoords = isValidIncidentCoordinates(formData.location?.lat, formData.location?.lng);

      const updatedLoc: ReportLocationData = {
        formattedAddress: formData.location?.formattedAddress || '',
        division: formData.location?.division || '',
        district: formData.location?.district || '',
        upazilaOrThana: formData.location?.upazilaOrThana || '',
        area: formData.location?.area || '',
        road: formData.location?.road || '',
        landmark: formData.location?.landmark || '',
        lat: isGeographicFieldChanged ? undefined : formData.location?.lat,
        lng: isGeographicFieldChanged ? undefined : formData.location?.lng,
        placeId: isGeographicFieldChanged ? undefined : formData.location?.placeId,
        ...locUpdates,
      };

      // Construct formattedAddress from real entered values
      const parts = [
        updatedLoc.road,
        updatedLoc.area,
        updatedLoc.upazilaOrThana,
        updatedLoc.district,
        updatedLoc.division,
      ].filter((s) => Boolean(s && s.trim()));
      updatedLoc.formattedAddress = parts.join(', ');

      onUpdateFormData({ location: updatedLoc });

      if (locUpdates.division && errors.division) {
        setErrors((prev) => ({ ...prev, division: '' }));
      }
      if (locUpdates.district && errors.district) {
        setErrors((prev) => ({ ...prev, district: '' }));
      }
      if (isGeographicFieldChanged && hadValidCoords) {
        setErrors((prev) => ({
          ...prev,
          coordinates:
            language === 'bn'
              ? 'ঠিকানা পরিবর্তনের কারণে ম্যাপে পুনরায় ঘটনাস্থল নির্বাচন করুন।'
              : 'Address changed. Please re-select the incident location on the map.',
        }));
      }
    };

    const handleMapPointChange = (lat: number, lng: number) => {
      if (isLocationLocked) return;

      const updatedLoc: ReportLocationData = {
        formattedAddress: formData.location?.formattedAddress || '',
        division: formData.location?.division || '',
        district: formData.location?.district || '',
        upazilaOrThana: formData.location?.upazilaOrThana || '',
        area: formData.location?.area || '',
        road: formData.location?.road || '',
        landmark: formData.location?.landmark || '',
        lat,
        lng,
      };

      onUpdateFormData({ location: updatedLoc });

      if (errors.coordinates) {
        setErrors((prev) => ({ ...prev, coordinates: '' }));
      }
    };

    // Google Places availability state
    const [isPlacesAvailable, setIsPlacesAvailable] = useState<boolean>(false);
    const [placesCheckDone, setPlacesCheckDone] = useState<boolean>(false);
    const [mapCenterTarget, setMapCenterTarget] = useState<{
      lat: number;
      lng: number;
      zoom?: number;
      timestamp: number;
    } | undefined>(undefined);

    useEffect(() => {
      let isMounted = true;
      loadGooglePlacesScript()
        .then((available) => {
          if (isMounted) {
            setIsPlacesAvailable(available);
            setPlacesCheckDone(true);
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsPlacesAvailable(false);
            setPlacesCheckDone(true);
          }
        });
      return () => {
        isMounted = false;
      };
    }, []);

    // Bias Google Places search towards selected district or division if available
    const searchBiasCoords = useMemo(() => {
      if (formData.location?.district) {
        const matched = BANGLADESH_DISTRICTS.find(
          (d) => d.nameEn === formData.location?.district || d.nameBn === formData.location?.district
        );
        if (matched) {
          return { lat: matched.lat, lng: matched.lng };
        }
      }
      if (formData.location?.division) {
        const matchedDiv = DIVISIONS.find(
          (d) => d.nameEn === formData.location?.division || d.nameBn === formData.location?.division
        );
        if (matchedDiv) {
          return { lat: matchedDiv.lat, lng: matchedDiv.lng };
        }
      }
      return undefined;
    }, [formData.location?.district, formData.location?.division]);

    // Dedicated coherent update path for Google Places search resolution
    const handleSearchResultSelected = (place: ResolvedPlaceResult) => {
      if (isLocationLocked) return;

      const currentLoc = formData.location || {
        formattedAddress: '',
        division: '',
        district: '',
        upazilaOrThana: '',
        area: '',
        road: '',
        landmark: '',
      };

      const updatedLoc: ReportLocationData = buildResolvedLocationData(currentLoc, place);

      // Single intentional atomic location update
      onUpdateFormData({ location: updatedLoc });

      // Clear errors for resolved fields
      setErrors((prev) => ({
        ...prev,
        ...(updatedLoc.division ? { division: '' } : {}),
        ...(updatedLoc.district ? { district: '' } : {}),
        coordinates: '',
      }));

      // Move Leaflet map and update marker
      setMapCenterTarget({
        lat: place.lat,
        lng: place.lng,
        zoom: 16,
        timestamp: Date.now(),
      });
    };

    const handleToggleDetailedLocation = (enabled: boolean) => {
      if (isLocationLocked) return;
      onUpdateFormData({ isDetailedLocation: enabled });
    };

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

    // Filter districts based on selected division
    const selectedDivisionObj = DIVISIONS.find(
      (d: DivisionInfo) => d.nameEn === formData.location?.division || d.nameBn === formData.location?.division
    );
    const availableDistricts = selectedDivisionObj
      ? BANGLADESH_DISTRICTS.filter((dst: DistrictInfo) => dst.divisionId === selectedDivisionObj.id)
      : [];

    // Validation & Progress Logic
    const validateAndProceed = (): boolean => {
      const newErrors: Record<string, string> = {};

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

      if (!formData.location?.division) {
        newErrors.division =
          language === 'bn' ? 'বিভাগ নির্বাচন করুন' : 'Division is required';
      }

      if (!formData.location?.district) {
        newErrors.district =
          language === 'bn' ? 'জেলা নির্বাচন করুন' : 'District is required';
      }

      if (!isValidIncidentCoordinates(formData.location?.lat, formData.location?.lng)) {
        newErrors.coordinates =
          language === 'bn'
            ? 'এগিয়ে যাওয়ার আগে ম্যাপে ঘটনাস্থল নির্বাচন করুন।'
            : 'Select the incident location on the map before continuing.';
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

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);

        if (newErrors.title || newErrors.description || newErrors.incidentDate) {
          const elem = document.getElementById('composer-section-narrative');
          if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (newErrors.reporterLocation || newErrors.division || newErrors.district || newErrors.coordinates) {
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
          title={language === 'bn' ? '১. ঘটনার বিবরণ ও সময়কাল' : '1. What Happened & Timeline'}
          hasError={Boolean(errors.title || errors.description || errors.incidentDate)}
          icon={<FileText className="w-5 h-5" />}
        >
          <div className="space-y-4 pt-1 text-left">
            {/* Title / Headline: Compact with secondary action */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[13px] text-secondary">
                <span className="font-semibold text-primary truncate max-w-[70%]">
                  {formData.title || (language === 'bn' ? currentSubcategoryOption?.nameBn : currentSubcategoryOption?.nameEn) || (language === 'bn' ? 'অভিযোগ' : 'Complaint')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowTitleField(!showTitleField)}
                  className="text-primary hover:underline cursor-pointer py-0.5 font-medium shrink-0 ml-2"
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
                    className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-[15px] text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px] ${
                      errors.title ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                    }`}
                  />
                  {errors.title && (
                    <p className="text-[13px] text-red-500 font-semibold">{errors.title}</p>
                  )}
                </div>
              )}
            </div>

            {/* Incident Narrative */}
            <div className="space-y-1">
              <label
                htmlFor="complaint-desc-input"
                className="block text-[14px] font-bold text-primary"
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
                className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-[15px] text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent leading-relaxed ${
                  errors.description ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                }`}
              />
              <div className="flex items-center justify-between gap-2">
                {errors.description ? (
                  <p className="text-[13px] text-red-500 font-semibold">{errors.description}</p>
                ) : (
                  <span />
                )}
                {(formData.description?.length || 0) >= 1600 && (
                  <span
                    className={`text-[12px] font-mono shrink-0 ml-auto ${
                      (formData.description?.length || 0) > 2000
                        ? 'text-red-500 font-bold'
                        : 'text-muted'
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
                  className="block text-[13px] font-bold text-primary mb-1"
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
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
                  className={`w-full px-3 py-2 bg-surface border rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px] ${
                    errors.incidentDate ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                  }`}
                />
                {errors.incidentDate && (
                  <p className="text-[12px] text-red-500 mt-1 font-semibold">{errors.incidentDate}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="complaint-time-input"
                  className="block text-[13px] font-bold text-primary mb-1"
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-secondary" />
                    <span>{language === 'bn' ? 'সময় (ঐচ্ছিক)' : 'Time (Optional)'}</span>
                  </div>
                </label>
                <input
                  id="complaint-time-input"
                  type="time"
                  value={formData.incidentTime || ''}
                  onChange={(e) => onUpdateFormData({ incidentTime: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px]"
                />
              </div>

              {!hideFrequency && (
                <div>
                  <label
                    htmlFor="complaint-frequency-select"
                    className="block text-[13px] font-bold text-primary mb-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-secondary" />
                      <span>{language === 'bn' ? 'পুনরাবৃত্তি' : 'Frequency'}</span>
                    </div>
                  </label>
                  <select
                    id="complaint-frequency-select"
                    value={formData.frequency || 'one-time'}
                    onChange={(e) =>
                      onUpdateFormData({ frequency: e.target.value as 'one-time' | 'repeated' })
                    }
                    className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent cursor-pointer min-h-[42px]"
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
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-subtle space-y-3 mt-2">
                <h4 className="text-[13px] font-bold text-primary">
                  {language === 'bn' ? 'অনলাইন ও ব্ল্যাকমেইল সংক্রান্ত সুনির্দিষ্ট তথ্য' : 'Digital Threat & Evidence Details'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="intimate-action-select"
                      className="block text-[13px] font-semibold text-secondary mb-1"
                    >
                      {language === 'bn' ? 'কী ঘটেছে বা হুমকি দেওয়া হচ্ছে?' : 'Threat Status / Action'}
                    </label>
                    <select
                      id="intimate-action-select"
                      value={formData.intimateWhatHappened || ''}
                      onChange={(e) => onUpdateFormData({ intimateWhatHappened: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent cursor-pointer min-h-[42px]"
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
                      className="block text-[13px] font-semibold text-secondary mb-1"
                    >
                      {language === 'bn' ? 'কোন মাধ্যমে হুমকি বা অপপ্রচার হচ্ছে?' : 'Platform / Channel'}
                    </label>
                    <select
                      id="intimate-platform-select"
                      value={formData.intimatePlatform || ''}
                      onChange={(e) => onUpdateFormData({ intimatePlatform: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent cursor-pointer min-h-[42px]"
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
        </Accordion>

        {/* SECTION 2: Location (লোকেশন) - NON-COLLAPSIBLE */}
        <Accordion
          id="composer-section-location"
          isOpen={true}
          collapsible={false}
          onToggle={() => {}}
          title={language === 'bn' ? '২. লোকেশন' : '2. Location'}
          hasError={Boolean(errors.division || errors.district || errors.coordinates || errors.reporterLocation)}
          icon={<MapPin className="w-5 h-5" />}
        >
          <div className="space-y-3.5 pt-1 text-left">
            {/* Single Short Sentence for Digital Harassment Location Helper */}
            {isDigitalHarassment && (
              <p className="text-[13px] text-secondary leading-normal">
                {language === 'bn'
                  ? 'অনলাইন বা ডিজিটাল ঘটনার ক্ষেত্রে প্রাসঙ্গিক এলাকা বা জেলা নির্বাচন করুন।'
                  : 'For online incidents, select the most relevant area or district.'}
              </p>
            )}

            {/* Reporter Device Location Gate */}
            {reporterGateState === 'verified' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[12.5px] font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{language === 'bn' ? 'ডিভাইস লোকেশন চালু আছে' : 'Device location is on'}</span>
              </div>
            ) : reporterGateState === 'denied' ? (
              <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/5 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 text-[13px] text-primary leading-relaxed">
                    {language === 'bn'
                      ? 'লোকেশন অনুমতি ছাড়া অভিযোগের স্থান নির্বাচন করা যাবে না। ব্রাউজার বা ডিভাইস সেটিংস থেকে লোকেশন অনুমতি চালু করে আবার চেষ্টা করুন।'
                      : 'Incident location cannot be selected without location permission. Allow location access in your browser or device settings, then try again.'}
                  </div>
                </div>
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={handleRequestDeviceLocation}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{language === 'bn' ? 'আবার চেষ্টা করুন' : 'Try again'}</span>
                  </button>
                </div>
              </div>
            ) : reporterGateState === 'unavailable' ? (
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 text-[13px] text-primary leading-relaxed">
                    {language === 'bn'
                      ? 'আপনার ডিভাইসের লোকেশন পাওয়া যাচ্ছে না। জিপিএস চালু আছে কিনা দেখে আবার চেষ্টা করুন।'
                      : 'Your device location could not be detected. Make sure location services are enabled and try again.'}
                  </div>
                </div>
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={handleRequestDeviceLocation}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[13px] font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{language === 'bn' ? 'আবার চেষ্টা করুন' : 'Try again'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* 'required' or 'requesting' or 'checking' */
              <div className="p-3.5 rounded-xl border border-subtle bg-surface-subtle/70 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 text-[13px] text-primary leading-relaxed">
                    {language === 'bn'
                      ? 'অভিযোগের স্থান নির্বাচন করতে আপনার ডিভাইসের লোকেশন চালু করুন।'
                      : 'Turn on device location before selecting the incident location.'}
                  </div>
                </div>
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={handleRequestDeviceLocation}
                    disabled={reporterGateState === 'requesting'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
                  >
                    {reporterGateState === 'requesting' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>{language === 'bn' ? 'লোকেশন যাচাই হচ্ছে...' : 'Checking location...'}</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>{language === 'bn' ? 'লোকেশন চালু করুন' : 'Turn on location'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Prerequisite validation error message */}
            {errors.reporterLocation && (
              <div className="text-[12.5px] text-red-500 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errors.reporterLocation}</span>
              </div>
            )}

            {/* State A: When Google Places is available */}
            {isPlacesAvailable ? (
              <>
                {/* Division & District (2 Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Division */}
                  <div>
                    <label
                      htmlFor="complaint-division-select"
                      className="block text-[13px] font-bold text-primary mb-1"
                    >
                      {language === 'bn' ? 'বিভাগ *' : 'Division *'}
                    </label>
                    <select
                      id="complaint-division-select"
                      disabled={isLocationLocked}
                      value={formData.location?.division || ''}
                      onChange={(e) => {
                        const divVal = e.target.value;
                        handleManualLocationChange({ division: divVal, district: '' });
                      }}
                      className={`w-full px-3 py-2 bg-surface border rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px] ${
                        isLocationLocked ? 'cursor-not-allowed opacity-60 bg-surface-subtle' : 'cursor-pointer'
                      } ${
                        errors.division ? 'border-red-500 bg-red-500/5' : 'border-subtle'
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
                      <p className="text-[12px] text-red-500 mt-1 font-semibold">{errors.division}</p>
                    )}
                  </div>

                  {/* District */}
                  <div>
                    <label
                      htmlFor="complaint-district-select"
                      className="block text-[13px] font-bold text-primary mb-1"
                    >
                      {language === 'bn' ? 'জেলা *' : 'District *'}
                    </label>
                    {availableDistricts.length > 0 ? (
                      <select
                        id="complaint-district-select"
                        disabled={isLocationLocked}
                        value={formData.location?.district || ''}
                        onChange={(e) => {
                          handleManualLocationChange({ district: e.target.value });
                        }}
                        className={`w-full px-3 py-2 bg-surface border rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px] ${
                          isLocationLocked ? 'cursor-not-allowed opacity-60 bg-surface-subtle' : 'cursor-pointer'
                        } ${
                          errors.district ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                        }`}
                      >
                        <option value="">{language === 'bn' ? '-- জেলা বেছে নিন --' : '-- Select District --'}</option>
                        {availableDistricts.map((dst: DistrictInfo) => (
                          <option key={dst.id} value={dst.nameEn}>
                            {language === 'bn' ? dst.nameBn : dst.nameEn}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="complaint-district-input"
                        type="text"
                        disabled={isLocationLocked}
                        value={formData.location?.district || ''}
                        onChange={(e) => {
                          handleManualLocationChange({ district: e.target.value });
                        }}
                        placeholder={language === 'bn' ? 'যেমন: ঢাকা / চট্টগ্রাম' : 'e.g. Dhaka, Chittagong'}
                        className={`w-full px-3 py-2 bg-surface border rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px] ${
                          isLocationLocked ? 'cursor-not-allowed opacity-60 bg-surface-subtle' : ''
                        } ${
                          errors.district ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                        }`}
                      />
                    )}
                    {errors.district && (
                      <p className="text-[12px] text-red-500 mt-1 font-semibold">{errors.district}</p>
                    )}
                  </div>
                </div>

                {/* Single Search Control After Division + District */}
                <div className="pt-0.5">
                  <AddressSearchInput
                    disabled={isLocationLocked}
                    language={language}
                    onPlaceSelected={handleSearchResultSelected}
                    biasCoords={searchBiasCoords}
                    initialValue={formData.location?.formattedAddress || ''}
                  />
                </div>

                {/* Map Coordinate Picker */}
                <div className="pt-2">
                  <GoogleMapPicker
                    disabled={isLocationLocked}
                    location={
                      formData.location || {
                        division: '',
                        district: '',
                        area: '',
                        formattedAddress: '',
                        road: '',
                        landmark: '',
                        upazilaOrThana: '',
                      }
                    }
                    onMapPointChange={handleMapPointChange}
                    language={language}
                    error={errors.coordinates}
                    centerTarget={mapCenterTarget}
                  />
                </div>
              </>
            ) : (
              /* State B: When Places is unavailable (missing key, load error, or network failure) */
              <>
                {/* Fallback subtle notice */}
                {placesCheckDone && (
                  <div className="text-[12px] text-secondary bg-surface-subtle border border-subtle/80 rounded-lg px-3 py-2 flex items-center gap-1.5">
                    <span>
                      {language === 'bn'
                        ? 'ঠিকানা অনুসন্ধান এখন পাওয়া যাচ্ছে না। ঠিকানা লিখে ম্যাপে স্থান নির্বাচন করুন।'
                        : 'Address search is unavailable. Enter the location manually and select the point on the map.'}
                    </span>
                  </div>
                )}

                {/* Manual Location Fields (Division, District, Area) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Division */}
                  <div>
                    <label
                      htmlFor="complaint-division-select"
                      className="block text-[13px] font-bold text-primary mb-1"
                    >
                      {language === 'bn' ? 'বিভাগ *' : 'Division *'}
                    </label>
                    <select
                      id="complaint-division-select"
                      disabled={isLocationLocked}
                      value={formData.location?.division || ''}
                      onChange={(e) => {
                        const divVal = e.target.value;
                        handleManualLocationChange({ division: divVal, district: '' });
                      }}
                      className={`w-full px-3 py-2 bg-surface border rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px] ${
                        isLocationLocked ? 'cursor-not-allowed opacity-60 bg-surface-subtle' : 'cursor-pointer'
                      } ${
                        errors.division ? 'border-red-500 bg-red-500/5' : 'border-subtle'
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
                      <p className="text-[12px] text-red-500 mt-1 font-semibold">{errors.division}</p>
                    )}
                  </div>

                  {/* District */}
                  <div>
                    <label
                      htmlFor="complaint-district-select"
                      className="block text-[13px] font-bold text-primary mb-1"
                    >
                      {language === 'bn' ? 'জেলা *' : 'District *'}
                    </label>
                    {availableDistricts.length > 0 ? (
                      <select
                        id="complaint-district-select"
                        disabled={isLocationLocked}
                        value={formData.location?.district || ''}
                        onChange={(e) => {
                          handleManualLocationChange({ district: e.target.value });
                        }}
                        className={`w-full px-3 py-2 bg-surface border rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px] ${
                          isLocationLocked ? 'cursor-not-allowed opacity-60 bg-surface-subtle' : 'cursor-pointer'
                        } ${
                          errors.district ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                        }`}
                      >
                        <option value="">{language === 'bn' ? '-- জেলা বেছে নিন --' : '-- Select District --'}</option>
                        {availableDistricts.map((dst: DistrictInfo) => (
                          <option key={dst.id} value={dst.nameEn}>
                            {language === 'bn' ? dst.nameBn : dst.nameEn}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="complaint-district-input"
                        type="text"
                        disabled={isLocationLocked}
                        value={formData.location?.district || ''}
                        onChange={(e) => {
                          handleManualLocationChange({ district: e.target.value });
                        }}
                        placeholder={language === 'bn' ? 'যেমন: ঢাকা / চট্টগ্রাম' : 'e.g. Dhaka, Chittagong'}
                        className={`w-full px-3 py-2 bg-surface border rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px] ${
                          isLocationLocked ? 'cursor-not-allowed opacity-60 bg-surface-subtle' : ''
                        } ${
                          errors.district ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                        }`}
                      />
                    )}
                    {errors.district && (
                      <p className="text-[12px] text-red-500 mt-1 font-semibold">{errors.district}</p>
                    )}
                  </div>

                  {/* Area / Neighborhood */}
                  <div>
                    <label
                      htmlFor="complaint-area-input"
                      className="block text-[13px] font-bold text-primary mb-1"
                    >
                      {isDigitalHarassment
                        ? language === 'bn'
                          ? 'এলাকা / প্রাসঙ্গিক স্থান'
                          : 'Area / Relevant location'
                        : language === 'bn'
                        ? 'এলাকা / মহল্লা'
                        : 'Area / Neighborhood'}
                    </label>
                    <input
                      id="complaint-area-input"
                      type="text"
                      disabled={isLocationLocked}
                      value={formData.location?.area || ''}
                      onChange={(e) => handleManualLocationChange({ area: e.target.value })}
                      placeholder={language === 'bn' ? 'এলাকা বা মহল্লার নাম' : 'Area or neighborhood'}
                      className={`w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px] ${
                        isLocationLocked ? 'cursor-not-allowed opacity-60 bg-surface-subtle' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Map Coordinate Picker */}
                <div className="pt-2">
                  <GoogleMapPicker
                    disabled={isLocationLocked}
                    location={
                      formData.location || {
                        division: '',
                        district: '',
                        area: '',
                        formattedAddress: '',
                        road: '',
                        landmark: '',
                        upazilaOrThana: '',
                      }
                    }
                    onMapPointChange={handleMapPointChange}
                    language={language}
                    error={errors.coordinates}
                    centerTarget={mapCenterTarget}
                  />
                </div>

                {/* Optional Detailed Location Toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={isLocationLocked}
                    onClick={() => handleToggleDetailedLocation(!formData.isDetailedLocation)}
                    className={`inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline py-1 ${
                      isLocationLocked ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
                    }`}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        formData.isDetailedLocation ? 'rotate-180' : ''
                      }`}
                    />
                    <span>
                      {formData.isDetailedLocation
                        ? language === 'bn'
                          ? 'অতিরিক্ত ঠিকানার ঘরগুলো লুকান'
                          : 'Hide additional address fields'
                        : language === 'bn'
                        ? '+ বিস্তারিত ঠিকানা যোগ করুন (থানা, রাস্তা, ল্যান্ডমার্ক)'
                        : '+ Add detailed address (Thana, Road, Landmark)'}
                    </span>
                  </button>

                  {formData.isDetailedLocation && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-subtle/60 mt-1.5">
                      <div>
                        <label
                          htmlFor="complaint-thana-input"
                          className="block text-[13px] font-semibold text-secondary mb-1"
                        >
                          {language === 'bn' ? 'থানা / উপজেলা' : 'Thana / Upazila'}
                        </label>
                        <input
                          id="complaint-thana-input"
                          type="text"
                          disabled={isLocationLocked}
                          value={formData.location?.upazilaOrThana || ''}
                          onChange={(e) => handleManualLocationChange({ upazilaOrThana: e.target.value })}
                          placeholder={language === 'bn' ? 'যেমন: মিরপুর মডেল' : 'e.g. Mirpur Model'}
                          className={`w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px] ${
                            isLocationLocked ? 'cursor-not-allowed opacity-60 bg-surface-subtle' : ''
                          }`}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="complaint-road-input"
                          className="block text-[13px] font-semibold text-secondary mb-1"
                        >
                          {language === 'bn' ? 'রাস্তা / লেন' : 'Road / Lane'}
                        </label>
                        <input
                          id="complaint-road-input"
                          type="text"
                          disabled={isLocationLocked}
                          value={formData.location?.road || ''}
                          onChange={(e) => handleManualLocationChange({ road: e.target.value })}
                          placeholder={language === 'bn' ? 'যেমন: রোড ৪, ব্লক বি' : 'e.g. Road 4, Block B'}
                          className={`w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px] ${
                            isLocationLocked ? 'cursor-not-allowed opacity-60 bg-surface-subtle' : ''
                          }`}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="complaint-landmark-input"
                          className="block text-[13px] font-semibold text-secondary mb-1"
                        >
                          {language === 'bn' ? 'নিকটবর্তী ল্যান্ডমার্ক' : 'Nearby Landmark'}
                        </label>
                        <input
                          id="complaint-landmark-input"
                          type="text"
                          disabled={isLocationLocked}
                          value={formData.location?.landmark || ''}
                          onChange={(e) => handleManualLocationChange({ landmark: e.target.value })}
                          placeholder={language === 'bn' ? 'যেমন: মসজিদের পিছনে' : 'e.g. Behind mosque'}
                          className={`w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px] ${
                            isLocationLocked ? 'cursor-not-allowed opacity-60 bg-surface-subtle' : ''
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
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
              <div className="p-3.5 rounded-2xl bg-surface-subtle border border-subtle space-y-3">
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
                  <div className="pt-3 border-t border-subtle/70 space-y-3">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-primary">
                      <Lock className="w-3.5 h-3.5 text-primary" />
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
                          className="block text-[13px] font-semibold text-primary mb-1"
                        >
                          {language === 'bn' ? 'আপনার নাম (ঐচ্ছিক)' : 'Your Name (Optional)'}
                        </label>
                        <input
                          id="reporter-admin-name"
                          type="text"
                          value={formData.adminName || ''}
                          onChange={(e) => onUpdateFormData({ adminName: e.target.value })}
                          placeholder={language === 'bn' ? 'নাম' : 'Name'}
                          className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px]"
                        />
                        {errors.adminName && (
                          <p className="text-[12px] text-red-500 mt-1 font-semibold">{errors.adminName}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="reporter-admin-contact"
                          className="block text-[13px] font-semibold text-primary mb-1"
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
                          className={`w-full px-3 py-2 bg-surface border rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[42px] ${
                            errors.adminContact ? 'border-red-500 bg-red-500/5' : 'border-subtle'
                          }`}
                        />
                        {errors.adminContact && (
                          <p className="text-[12px] text-red-500 mt-1 font-semibold">{errors.adminContact}</p>
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
              <div className="p-3 rounded-xl bg-surface border border-subtle flex items-start gap-2 text-[13px] text-secondary">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
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
                <span className="inline-flex items-center gap-1.5 text-accent font-medium text-[13px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                  {language === 'bn' ? 'তথ্য যোগ করা হয়েছে' : 'Information added'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-secondary text-[13px]">
                  <Plus className="w-3.5 h-3.5 text-secondary" />
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
                    className="block text-[13px] font-bold text-primary mb-1"
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
                    className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="operator-contact"
                    className="block text-[13px] font-semibold text-secondary mb-1"
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
                    className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px]"
                  />
                </div>
              </div>

              {/* Row 2: Role / Responsibility */}
              <div>
                <label
                  htmlFor="operator-role"
                  className="block text-[13px] font-semibold text-secondary mb-1"
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
                  className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px]"
                />
              </div>

              {/* Row 3: Other Identifying Details */}
              <div>
                <label
                  htmlFor="operator-identifying-desc"
                  className="block text-[13px] font-semibold text-secondary mb-1"
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
                  className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent leading-relaxed min-h-[44px]"
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
                <span className="inline-flex items-center gap-1.5 text-accent font-medium text-[13px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                  {language === 'bn' ? 'তথ্য যোগ করা হয়েছে' : 'Information added'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-secondary text-[13px]">
                  <Plus className="w-3.5 h-3.5 text-secondary" />
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
                      className="block text-[13px] font-bold text-primary mb-1"
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
                      className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="extortion-contact"
                      className="block text-[13px] font-semibold text-secondary mb-1"
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
                      className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Row 2: Role / Designation (col 1) + Group / Organization / Association (col 2) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="extortion-role"
                      className="block text-[13px] font-semibold text-secondary mb-1"
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
                      className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="extortion-org"
                      className="block text-[13px] font-semibold text-secondary mb-1"
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
                      className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Row 3: Other Identifying Details — full width (textarea) */}
                <div>
                  <label
                    htmlFor="extortion-identifying-desc"
                    className="block text-[13px] font-semibold text-secondary mb-1"
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
                    className="w-full px-3 py-2 bg-surface border border-subtle rounded-xl text-[14px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-accent leading-relaxed min-h-[44px]"
                  />
                </div>
              </div>

              {/* Additional Mentioned Parties */}
              <div className="space-y-3 pt-1">
                {formData.mentionedParties && formData.mentionedParties.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[13px] font-bold text-primary">
                      {language === 'bn' ? 'অতিরিক্ত সংশ্লিষ্ট পক্ষসমূহ' : 'Additional Mentioned Parties'}
                    </h4>
                    {formData.mentionedParties.map((party, pIdx) => (
                      <div
                        key={party.id || pIdx}
                        className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-subtle space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-bold text-primary">
                            {language === 'bn' ? `পক্ষ #${pIdx + 2}` : `Party #${pIdx + 2}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAdditionalParty(party.id)}
                            className="inline-flex items-center gap-1 text-[12px] text-red-500 hover:underline cursor-pointer p-1 min-h-[32px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'মুছে ফেলুন' : 'Remove'}</span>
                          </button>
                        </div>

                        {/* Row 1: Name + Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[12px] font-semibold text-secondary mb-1">
                              {language === 'bn' ? 'নাম / পরিচিতি' : 'Name / Known Identity'}
                            </label>
                            <input
                              type="text"
                              value={party.name || ''}
                              onChange={(e) => handleUpdateAdditionalParty(party.id, { name: e.target.value })}
                              placeholder={language === 'bn' ? 'নাম বা পরিচিত নাম' : 'Name or known identity'}
                              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-subtle rounded-xl text-[13px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-semibold text-secondary mb-1">
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
                              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-subtle rounded-xl text-[13px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
                            />
                          </div>
                        </div>

                        {/* Row 2: Role + Group/Organization */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[12px] font-semibold text-secondary mb-1">
                              {language === 'bn' ? 'ভূমিকা / পদবি' : 'Role / Designation'}
                            </label>
                            <input
                              type="text"
                              value={party.roleOrDesignation || ''}
                              onChange={(e) =>
                                handleUpdateAdditionalParty(party.id, { roleOrDesignation: e.target.value })
                              }
                              placeholder={language === 'bn' ? 'ভূমিকা বা পদবি' : 'Role or designation'}
                              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-subtle rounded-xl text-[13px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-semibold text-secondary mb-1">
                              {language === 'bn' ? 'দল / সংগঠন / সমিতি' : 'Group / Organization / Association'}
                            </label>
                            <input
                              type="text"
                              value={party.organization || ''}
                              onChange={(e) =>
                                handleUpdateAdditionalParty(party.id, { organization: e.target.value })
                              }
                              placeholder={language === 'bn' ? 'দল, সমিতি বা প্রতিষ্ঠানের নাম' : 'Group, association, or organization'}
                              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-subtle rounded-xl text-[13px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
                            />
                          </div>
                        </div>

                        {/* Row 3: Other Identifying Details */}
                        <div>
                          <label className="block text-[12px] font-semibold text-secondary mb-1">
                            {language === 'bn' ? 'অন্যান্য শনাক্তকারী তথ্য' : 'Other Identifying Details'}
                          </label>
                          <textarea
                            rows={2}
                            value={party.identifyingDescription || ''}
                            onChange={(e) =>
                              handleUpdateAdditionalParty(party.id, { identifyingDescription: e.target.value })
                            }
                            placeholder={language === 'bn' ? 'চেহারা, যানবাহন বা অন্য শনাক্তকারী তথ্য' : 'Appearance, vehicle, or identifying details'}
                            className="w-full px-2.5 py-1.5 bg-surface-subtle border border-subtle rounded-xl text-[13px] text-primary focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px] leading-relaxed"
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
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface hover:bg-surface-subtle border border-subtle text-[13px] font-semibold text-primary cursor-pointer transition-colors min-h-[40px]"
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

        {/* SECTION 4: Attachments (সংযুক্তি - ঐচ্ছিক) - COLLAPSIBLE */}
        <Accordion
          id="composer-section-attachments"
          isOpen={Boolean(openSections.attachments)}
          collapsible={true}
          onToggle={() => toggleSection('attachments')}
          title={language === 'bn' ? '৪. সংযুক্তি (ঐচ্ছিক)' : '4. Attachments (Optional)'}
          summary={
            pendingImages.length > 0
              ? `${pendingImages.length} ${language === 'bn' ? 'টি ছবি সংযুক্ত' : 'images attached'}`
              : language === 'bn'
              ? 'কোনো ছবি সংযুক্ত নেই'
              : 'No images attached'
          }
          badge={
            pendingImages.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-accent-soft text-accent text-[13px] font-bold">
                {pendingImages.length}
              </span>
            ) : undefined
          }
          icon={<Paperclip className="w-5 h-5" />}
        >
          <div className="space-y-3.5 pt-1 text-left">
            <p className="text-[13px] text-secondary">
              {language === 'bn'
                ? 'অভিযোগ বুঝতে সহায়ক ছবি বা স্ক্রিনশট থাকলে সংযুক্ত করুন। এটি সম্পূর্ণ ঐচ্ছিক।'
                : 'Attach images or screenshots if they help explain the complaint. This is completely optional.'}
            </p>

            {formData.pendingEvidenceRecovery &&
              formData.pendingEvidenceRecovery.expectedCount > 0 &&
              pendingImages.length === 0 && (
                <div
                  id="pending-evidence-recovery-warning"
                  className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 space-y-2 text-[13px]"
                >
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
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
      </div>
    );
  }
);
