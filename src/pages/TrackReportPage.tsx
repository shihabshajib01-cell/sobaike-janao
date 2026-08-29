import React, { useState, useEffect } from 'react';
import {
  Search,
  Lock,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Info,
  ExternalLink,
  MessageSquarePlus,
  Send,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../services/apiClient';
import { SubmittedReport } from '../services/types';
import { SECTIONS } from '../theme/tokens';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';

export const TrackReportPage: React.FC = () => {
  const { language, navigateTo, queryParams } = useApp();
  const [reportIdInput, setReportIdInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [searchedReport, setSearchedReport] = useState<SubmittedReport | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Clarification response input
  const [clarificationResponse, setClarificationResponse] = useState<string>('');
  const [isSubmittingClarification, setIsSubmittingClarification] = useState<boolean>(false);
  const [clarificationSuccess, setClarificationSuccess] = useState<boolean>(false);
  const [clarificationError, setClarificationError] = useState<string | null>(null);

  // Auto-fill only Report ID from URL hash parameters or AppContext queryParams (PIN is never read from URL)
  useEffect(() => {
    let id = queryParams.id;

    if (!id) {
      const hash = window.location.hash;
      const idMatch = hash.match(/id=([^&]+)/);
      if (idMatch) {
        id = decodeURIComponent(idMatch[1]);
      }
    }

    if (id) {
      setReportIdInput(id);
    }
  }, [queryParams.id]);

  const executeSearch = async (id: string, pin: string) => {
    setSearchError(null);
    setHasSearched(true);
    setClarificationSuccess(false);
    setClarificationError(null);

    if (!id.trim() || !pin.trim()) {
      setSearchError(
        language === 'bn'
          ? 'অনুগ্রহ করে রিপোর্ট আইডি ও ৬-সংখ্যার পিন নম্বর উভয়ই প্রদান করুন।'
          : 'Please enter both Report ID and 6-digit PIN.'
      );
      setSearchedReport(null);
      return;
    }

    setIsSearching(true);
    try {
      const res = await apiClient.trackReport(id.trim(), pin.trim());
      if (res.success && res.report) {
        setSearchedReport(res.report);
        setSearchError(null);
      } else {
        setSearchedReport(null);
        setSearchError(
          language === 'bn'
            ? 'প্রদত্ত আইডি ও পিনের সাথে কোনো প্রতিবেদন মেলেনি। অনুগ্রহ করে তথ্য পুনরায় যাচাই করুন।'
            : 'No report found matching the provided ID and PIN. Please double-check your credentials.'
        );
      }
    } catch (err: any) {
      setSearchedReport(null);
      setSearchError(
        err?.messageBn ||
        err?.message ||
        (language === 'bn'
          ? 'প্রদত্ত আইডি ও পিনের সাথে কোনো প্রতিবেদন মেলেনি। অনুগ্রহ করে তথ্য পুনরায় যাচাই করুন।'
          : 'No report found matching the provided ID and PIN. Please double-check your credentials.')
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(reportIdInput, pinInput);
  };

  const handleClear = () => {
    setReportIdInput('');
    setPinInput('');
    setSearchedReport(null);
    setSearchError(null);
    setHasSearched(false);
    setClarificationResponse('');
    setClarificationError(null);
    setClarificationSuccess(false);
  };

  const handleSendClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchedReport || !clarificationResponse.trim()) return;

    setIsSubmittingClarification(true);
    setClarificationError(null);
    try {
      const res = await apiClient.submitClarificationResponse(
        searchedReport.id,
        pinInput.trim(),
        clarificationResponse.trim()
      );
      if (res.success) {
        setClarificationSuccess(true);
        setClarificationResponse('');
        // Refresh report status from server
        await executeSearch(searchedReport.id, pinInput.trim());
      } else {
        throw new Error('Failed to submit clarification');
      }
    } catch (err: any) {
      console.error('[Clarification response error]', err);
      setClarificationError(
        err?.messageBn ||
        err?.message ||
        (language === 'bn'
          ? 'অতিরিক্ত তথ্য জমা দেওয়া ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।'
          : 'Failed to submit additional information. Please retry.')
      );
    } finally {
      setIsSubmittingClarification(false);
    }
  };

  return (
    <PublicPageContainer id="track-report-page-container">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigateTo('/')}
          className="inline-flex items-center gap-2 text-[16px] leading-[24px] font-medium text-secondary hover:text-primary bg-surface hover:bg-surface-subtle border border-subtle px-4 py-2.5 rounded-xl transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'bn' ? 'মূলপাতায় ফিরে যান' : 'Back to Home'}</span>
        </button>

        <div className="text-[14px] leading-[22px] text-muted font-medium">
          {language === 'bn' ? 'বেনামী প্রতিবেদন ট্র্যাকিং' : 'Anonymous Report Tracking'}
        </div>
      </div>

      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-[32px] leading-[42px] font-bold text-primary tracking-tight">
          {language === 'bn' ? 'জমা দেওয়া প্রতিবেদন ট্র্যাক করুন' : 'Track Your Submitted Report'}
        </h1>
        <p className="text-[16px] leading-[26px] text-secondary">
          {language === 'bn'
            ? 'প্রতিবেদন জমা দেওয়ার সময় প্রাপ্ত রিপোর্ট আইডি (Report ID) এবং ৬-সংখ্যার পিন (PIN) দিয়ে সর্বশেষ মডারেশন ও পর্যালোচনার অবস্থা দেখুন।'
            : 'Enter the Report ID and 6-digit PIN provided during submission to view current moderation status.'}
        </p>
      </div>

      {/* Search Input Form */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-surface border border-subtle rounded-xl p-5 md:p-6 space-y-4 shadow-2xs"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Report ID */}
          <div className="space-y-1.5">
            <label className="block text-[16px] leading-[24px] font-medium text-primary">
              {language === 'bn' ? 'প্রতিবেদন আইডি (Report ID) *' : 'Report ID *'}
            </label>
            <input
              type="text"
              value={reportIdInput}
              onChange={(e) => setReportIdInput(e.target.value)}
              placeholder="উদাঃ SJ-2026-849201"
              className="w-full px-3.5 py-2.5 bg-surface border border-subtle focus:border-[var(--ui-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] rounded-xl text-[16px] text-primary uppercase font-mono font-semibold placeholder:font-normal placeholder:normal-case placeholder:text-muted min-h-[44px]"
            />
          </div>

          {/* Secret PIN */}
          <div className="space-y-1.5">
            <label className="block text-[16px] leading-[24px] font-medium text-primary flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-muted shrink-0" />
              <span>{language === 'bn' ? 'গোপন পিন নম্বর (Secret PIN) *' : 'Secret PIN *'}</span>
            </label>
            <input
              type="password"
              maxLength={8}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="উদাঃ 591240"
              className="w-full px-3.5 py-2.5 bg-surface border border-subtle focus:border-[var(--ui-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] rounded-xl text-[16px] text-primary font-mono placeholder:font-normal placeholder:text-muted min-h-[44px]"
            />
          </div>
        </div>

        {/* Error message */}
        {searchError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-xl text-[14px] leading-[22px] font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          {hasSearched && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 border border-subtle hover:bg-surface-subtle text-secondary text-[16px] font-medium rounded-xl cursor-pointer min-h-[44px]"
            >
              {language === 'bn' ? 'মুছে নতুন খুঁজুন' : 'Reset'}
            </button>
          )}

          <button
            type="submit"
            disabled={isSearching}
            className="btn-primary-action px-6 py-2.5 font-semibold text-[16px] leading-[24px] rounded-xl flex items-center gap-2 min-h-[44px]"
          >
            <Search className="w-4 h-4" />
            <span>{isSearching ? (language === 'bn' ? 'খোঁজা হচ্ছে...' : 'Checking...') : (language === 'bn' ? 'অবস্থা ট্র্যাক করুন' : 'Track Report')}</span>
          </button>
        </div>
      </form>

      {/* Search Result Display */}
      {searchedReport && (
        <div className="bg-surface border border-subtle rounded-xl p-5 md:p-7 space-y-6 shadow-2xs">
          {/* Header row with Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[16px] bg-surface-subtle text-primary border border-subtle px-3 py-1 rounded-lg">
                  {searchedReport.id}
                </span>
                <span
                  className="text-[14px] px-3 py-1 rounded-lg font-semibold border"
                  style={{
                    backgroundColor: `var(--sec-${searchedReport.segment}-bg)`,
                    color: `var(--sec-${searchedReport.segment}-text)`,
                    borderColor: `var(--sec-${searchedReport.segment}-border)`,
                  }}
                >
                  {language === 'bn'
                    ? SECTIONS[searchedReport.segment].nameBn
                    : SECTIONS[searchedReport.segment].nameEn}
                </span>
              </div>
              <p className="text-[14px] text-muted">
                {language === 'bn' ? 'জমা দেওয়ার সময়: ' : 'Submitted on: '}
                {new Date(searchedReport.createdAt).toLocaleDateString(
                  language === 'bn' ? 'bn-BD' : 'en-US',
                  { day: 'numeric', month: 'long', year: 'numeric' }
                )}
              </p>
            </div>

            {/* Current Status Pill */}
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[14px] font-semibold border ${
                searchedReport.status === 'published'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : searchedReport.status === 'more_info_needed'
                  ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  : searchedReport.status === 'not_published'
                  ? 'bg-surface-subtle text-secondary border-subtle'
                  : ''
              }`}
              style={
                searchedReport.status !== 'published' &&
                searchedReport.status !== 'more_info_needed' &&
                searchedReport.status !== 'not_published'
                  ? {
                      backgroundColor: 'var(--ui-info-bg)',
                      borderColor: 'var(--ui-info-border)',
                      color: 'var(--ui-info-text)',
                    }
                  : undefined
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  searchedReport.status === 'published'
                    ? 'bg-emerald-500'
                    : searchedReport.status === 'more_info_needed'
                    ? 'bg-amber-500 animate-pulse'
                    : searchedReport.status === 'not_published'
                    ? 'bg-secondary'
                    : 'bg-accent'
                }`}
              />
              <span>{language === 'bn' ? searchedReport.statusBn : searchedReport.statusEn}</span>
            </div>
          </div>

          {/* Published Action Banner */}
          {searchedReport.status === 'published' && (
            <div className="p-4 sm:p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950 dark:text-emerald-100">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-[16px] leading-[24px]">
                    {language === 'bn'
                      ? 'প্রতিবেদনটি সর্বজনীন ফিডে প্রকাশিত হয়েছে'
                      : 'This report is live on the public feed'}
                  </p>
                  <p className="text-[14px] leading-[22px] text-emerald-800 dark:text-emerald-300">
                    {language === 'bn'
                      ? 'মডারেশন পর্যালোচনা শেষে প্রতিবেদনটির পাবলিক সংস্করণ প্রকাশিত হয়েছে।'
                      : 'The moderated public version of this report has been published.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigateTo(`/report-detail/${searchedReport.id}`)}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-[16px] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[44px]"
              >
                <span>{language === 'bn' ? 'সর্বজনীন বিবরণ দেখুন' : 'View Public Report'}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* More Info Needed Banner & Interactive Response Box */}
          {searchedReport.status === 'more_info_needed' && (
            <div className="p-4 sm:p-5 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/40 rounded-xl space-y-3.5 text-amber-950 dark:text-amber-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-[18px] leading-[28px]">
                    {language === 'bn'
                      ? 'মডারেটরের পক্ষ থেকে অতিরিক্ত তথ্যের অনুরোধ'
                      : 'Additional Information Requested by Moderator'}
                  </h3>
                  <p className="text-[16px] leading-[26px] text-amber-900 dark:text-amber-200">
                    {searchedReport.activeClarification?.message ||
                      (language === 'bn'
                        ? 'প্রতিবেদনটি পর্যালোচনার জন্য কিছু অতিরিক্ত তথ্যের প্রয়োজন।'
                        : 'Additional details are needed to complete the review of this report.')}
                  </p>
                </div>
              </div>

              {clarificationError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 rounded-xl text-[14px] font-medium">
                  {clarificationError}
                </div>
              )}

              {clarificationSuccess ? (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-[14px] font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {language === 'bn'
                      ? 'অতিরিক্ত তথ্য জমা দেওয়া হয়েছে। মডারেটর পুনরায় পর্যালোচনা করছেন।'
                      : 'Additional information submitted successfully. Review resumed.'}
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSendClarification} className="space-y-3 pt-1">
                  <label className="block text-[16px] font-semibold text-amber-950 dark:text-amber-100">
                    {language === 'bn' ? 'আপনার উত্তর / স্পষ্টীকরণ লিখুন:' : 'Your Response / Clarification:'}
                  </label>
                  <textarea
                    rows={3}
                    value={clarificationResponse}
                    onChange={(e) => setClarificationResponse(e.target.value)}
                    placeholder={
                      language === 'bn'
                        ? 'অনুরোধকৃত বিস্তারিত তথ্য বা ব্যাখ্যা এখানে লিখুন...'
                        : 'Provide the requested details or clarification here...'
                    }
                    className="w-full p-3.5 bg-surface border border-amber-300 dark:border-amber-800 focus:border-[var(--ui-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] rounded-xl text-[16px] text-primary placeholder:text-muted min-h-[90px]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingClarification || !clarificationResponse.trim()}
                      className="btn-primary-action px-5 py-2.5 rounded-xl text-[16px] font-semibold flex items-center gap-2 min-h-[44px]"
                    >
                      <Send className="w-4 h-4" />
                      <span>{language === 'bn' ? 'তথ্য জমা দিন' : 'Submit Information'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Submitted Report Summary */}
          <div className="space-y-3 pt-2">
            <span className="text-[14px] font-semibold text-muted uppercase tracking-wide block">
              {language === 'bn' ? 'আপনার জমা দেওয়া প্রতিবেদন' : 'Your Submitted Report'}
            </span>
            <h2 className="text-[20px] leading-[30px] font-semibold text-primary">
              {searchedReport.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-secondary">
              <div className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-muted shrink-0" />
                <span>
                  {searchedReport.location.area || searchedReport.location.formattedAddress},{' '}
                  {searchedReport.location.district}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <Calendar className="w-4 h-4 text-muted shrink-0" />
                <span>
                  {language === 'bn' ? 'ঘটনার তারিখ: ' : 'Incident Date: '}
                  {searchedReport.incidentDate}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-subtle border border-subtle text-[16px] leading-[26px] text-primary">
              <p>{searchedReport.description}</p>
            </div>
          </div>

          {/* Timeline / Progress History */}
          <div className="space-y-4 pt-4 border-t border-subtle">
            <h3 className="text-[18px] leading-[28px] font-semibold text-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted shrink-0" />
              <span>{language === 'bn' ? 'মডারেশন ও অগ্রগতি লগ' : 'Moderation & Progress History'}</span>
            </h3>

            <div className="space-y-4 relative pl-4 border-l-2 border-subtle">
              {searchedReport.history.map((h, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[var(--ui-accent)] border-2 border-surface ring-2 ring-subtle" />
                  <div className="flex items-center justify-between text-[16px] font-semibold text-primary">
                    <span>{language === 'bn' ? h.statusBn : h.statusEn}</span>
                    <span className="text-muted font-normal text-[14px]">{h.date}</span>
                  </div>
                  <p className="text-[16px] leading-[26px] text-secondary">
                    {language === 'bn' ? h.noteBn : h.noteEn}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Moderation Guidance Note */}
          <div className="p-4 bg-surface-subtle rounded-xl border border-subtle flex items-start gap-3 text-[14px] leading-[22px] text-secondary">
            <Info className="w-4 h-4 text-muted shrink-0 mt-0.5" />
            <p>
              {language === 'bn'
                ? 'মডারেশন পর্যালোচনা: সাধারণ অভিযোগসমূহ ক্রমানুসারে পর্যালোচনা করা হয়। কোনো পরিবর্তন বা অতিরিক্ত তথ্যের প্রয়োজন হলে এখানে তা সরাসরি দেখতে পাবেন।'
                : 'Moderation review: Submitted reports are reviewed in sequence. Any status changes or clarification requests will appear here.'}
            </p>
          </div>
        </div>
      )}
    </PublicPageContainer>
  );
};
