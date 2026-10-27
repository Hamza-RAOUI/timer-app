import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RPG_CONFIG } from '../config';
import { evolutionFor, familyForSkill, familyLevels, flowkeeperStatus, ROCK_JOKES, stageForLevel } from '../evolution';

const all = (level: number) => ({ study: level, work: level, hobby: level, personal: level });

describe('familyForSkill', () => {
  it('maps built-in skills to their family', () => {
    assert.equal(familyForSkill('study'), 'scholar');
    assert.equal(familyForSkill('work'), 'builder');
    assert.equal(familyForSkill('hobby'), 'creator');
    assert.equal(familyForSkill('personal'), 'wanderer');
  });
  it('gives custom skills a stable family', () => {
    assert.equal(familyForSkill('skill-abc123'), familyForSkill('skill-abc123'));
  });
});

describe('stageForLevel', () => {
  it('follows the configured thresholds', () => {
    const [, s2, s3, s4] = RPG_CONFIG.evolution.stageLevels;
    assert.equal(stageForLevel(1, false), 1);
    assert.equal(stageForLevel(s2 - 1, false), 1);
    assert.equal(stageForLevel(s2, false), 2);
    assert.equal(stageForLevel(s3, false), 3);
    assert.equal(stageForLevel(s4, false), 4);
  });
  it('caps at stage 4 until the Flowkeeper is unlocked', () => {
    assert.equal(stageForLevel(40, false), 4);
    assert.equal(stageForLevel(40, true), 5);
  });
});

describe('flowkeeperStatus', () => {
  it('needs every family at the required level', () => {
    const need = RPG_CONFIG.evolution.flowkeeperFamilyLevel;
    assert.equal(flowkeeperStatus(all(need)).unlocked, true);
    const s = flowkeeperStatus({ ...all(need), hobby: need - 1 });
    assert.equal(s.unlocked, false);
    assert.deepEqual(s.missing, ['creator']);
  });
  it('lets a custom skill count toward its family', () => {
    const custom = 'skill-x';
    const fam = familyForSkill(custom);
    const levels = familyLevels({ [custom]: 12 });
    assert.equal(levels[fam], 12);
  });
});

describe('evolutionFor', () => {
  it('starts every skill as a stage-1 creature', () => {
    const e = evolutionFor('study', {});
    assert.equal(e.stage, 1);
    assert.equal(e.name, 'Grain Scholar');
    assert.equal(e.quip, 'Unemployed Grain');
    assert.equal(e.next?.stage, 2);
  });
  it('flags a stage-5 wait when only other families lag', () => {
    const e = evolutionFor('work', { work: 20 });
    assert.equal(e.stage, 4);
    assert.equal(e.quip, 'Corporate Survivor');
    assert.equal(e.next?.stage, 5);
    assert.equal(e.next?.needsAllFamilies, true);
  });
  it('becomes the Flowkeeper when all families are trained', () => {
    const e = evolutionFor('hobby', { ...all(10), hobby: 15 });
    assert.equal(e.stage, 5);
    assert.equal(e.name, 'The Flowkeeper');
    assert.equal(e.next, null);
  });
  it('honours a dev preview level without touching real progress', () => {
    assert.equal(evolutionFor('personal', {}, { previewLevel: 6 }).stage, 3);
    assert.equal(evolutionFor('personal', {}, { previewLevel: 15 }).stage, 5);
  });
  it('has rock jokes for the easter egg', () => {
    assert.ok(ROCK_JOKES.length >= 5);
  });
});
