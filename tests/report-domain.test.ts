import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isMeaningfulMentionedParty,
  isValidIncidentCoordinates,
} from '../src/services/types.ts';
import { CATEGORY_ORDER } from '../src/data/categoryOrder.ts';

test('isMeaningfulMentionedParty rejects empty data', () => {
  assert.equal(isMeaningfulMentionedParty(null), false);
  assert.equal(isMeaningfulMentionedParty(undefined), false);
  assert.equal(isMeaningfulMentionedParty({}), false);
  assert.equal(isMeaningfulMentionedParty({ name: '   ' }), false);
});

test('isMeaningfulMentionedParty accepts every supported meaningful field', () => {
  assert.equal(isMeaningfulMentionedParty({ name: 'Person' }), true);
  assert.equal(isMeaningfulMentionedParty({ roleOrDesignation: 'Officer' }), true);
  assert.equal(isMeaningfulMentionedParty({ organization: 'Office' }), true);
  assert.equal(isMeaningfulMentionedParty({ phoneOrContact: '0123' }), true);
  assert.equal(isMeaningfulMentionedParty({ publicProfileHandle: '@name' }), true);
  assert.equal(isMeaningfulMentionedParty({ address: 'Dhaka' }), true);
  assert.equal(isMeaningfulMentionedParty({ identifyingDescription: 'Description' }), true);
});

test('isValidIncidentCoordinates accepts valid Bangladesh coordinates', () => {
  assert.equal(isValidIncidentCoordinates(23.8103, 90.4125), true);
  assert.equal(isValidIncidentCoordinates(24.8949, 91.8687), true);
});

test('isValidIncidentCoordinates rejects invalid and placeholder coordinates', () => {
  assert.equal(isValidIncidentCoordinates(undefined, 90), false);
  assert.equal(isValidIncidentCoordinates(23, undefined), false);
  assert.equal(isValidIncidentCoordinates(Number.NaN, 90), false);
  assert.equal(isValidIncidentCoordinates(23, Number.POSITIVE_INFINITY), false);
  assert.equal(isValidIncidentCoordinates(91, 90), false);
  assert.equal(isValidIncidentCoordinates(-91, 90), false);
  assert.equal(isValidIncidentCoordinates(23, 181), false);
  assert.equal(isValidIncidentCoordinates(23, -181), false);
  assert.equal(isValidIncidentCoordinates(0, 0), false);
});

test('canonical reporting category order remains complete and stable', () => {
  assert.deepEqual(CATEGORY_ORDER, [
    'harassment',
    'load_shedding',
    'extortion',
    'public_safety',
    'road_transport',
    'illegal_occupation',
    'rickshaw',
  ]);
  assert.equal(new Set(CATEGORY_ORDER).size, 7);
});
