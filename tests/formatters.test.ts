import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toBanglaDigits,
  formatReportCount,
  formatRankNumber,
  formatBillingMonth,
} from '../src/utils/formatters.ts';

test('toBanglaDigits converts all ASCII digits', () => {
  assert.equal(toBanglaDigits('0123456789'), '০১২৩৪৫৬৭৮৯');
  assert.equal(toBanglaDigits(2026), '২০২৬');
});

test('formatReportCount handles Bangla and English singular/plural', () => {
  assert.equal(formatReportCount(0, 'bn'), '০টি');
  assert.equal(formatReportCount(1, 'bn'), '১টি');
  assert.equal(formatReportCount(1, 'en'), '1 report');
  assert.equal(formatReportCount(2, 'en'), '2 reports');
});

test('formatRankNumber respects language digits', () => {
  assert.equal(formatRankNumber(7, 'bn'), '৭');
  assert.equal(formatRankNumber(7, 'en'), '7');
});

test('formatBillingMonth formats valid English month values', () => {
  assert.equal(formatBillingMonth('2026-01', 'en'), 'January 2026');
  assert.equal(formatBillingMonth('2026-12', 'en'), 'December 2026');
});

test('formatBillingMonth formats valid Bangla month values', () => {
  assert.equal(formatBillingMonth('2026-01', 'bn'), 'জানুয়ারি ২০২৬');
  assert.equal(formatBillingMonth('2026-12', 'bn'), 'ডিসেম্বর ২০২৬');
});

test('formatBillingMonth safely handles missing and malformed values', () => {
  assert.equal(formatBillingMonth(undefined, 'en'), '-');
  assert.equal(formatBillingMonth('', 'bn'), '-');
  assert.equal(formatBillingMonth('2026-13', 'en'), '2026-13');
  assert.equal(formatBillingMonth('not-a-month', 'en'), 'not-a-month');
});
