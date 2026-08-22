import { compareDates, getDatingLocation } from './datingRules';
import type { DatingArchive, DatingStageContent, DatingStageId } from './types';

export interface DatingArchiveActView {
  actKey: string;
  stageId: DatingStageId;
  stageIndex: number;
  title: string;
  source: DatingStageContent['source'];
  createdAt: string;
  lineCount: number;
  isPlayable: boolean;
  content: DatingStageContent;
}

export interface DatingArchiveEventView {
  eventKey: string;
  appointmentId: string;
  characterId: string;
  characterName: string;
  locationId: DatingArchive['locationId'];
  locationLabel: string;
  date: DatingArchive['date'];
  dateLabel: string;
  quality: DatingArchive['quality'];
  qualityLabel: string;
  archive: DatingArchive;
  acts: DatingArchiveActView[];
}

const STAGE_ORDER: readonly DatingStageId[] = ['main', 'return'];

function getStageIndex(stageId: DatingStageId): number {
  return STAGE_ORDER.indexOf(stageId);
}

function getStageTitle(stageId: DatingStageId, locationLabel: string): string {
  return stageId === 'main' ? `${locationLabel}的时光` : '回程与余韵';
}

function getQualityLabel(quality: DatingArchive['quality']): string {
  if (quality === 'great') return '气氛很好';
  if (quality === 'good') return '相处顺利';
  return '有点笨拙';
}

export function formatDatingArchiveDate(date: DatingArchive['date']): string {
  return `${date.year}年${date.month}月${date.day}日`;
}

export function formatDatingArchiveTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false });
}

function resolveLocationLabel(locationId: DatingArchive['locationId']): string {
  try {
    return getDatingLocation(locationId).label;
  } catch {
    return locationId;
  }
}

function projectStageContent(
  archive: DatingArchive,
  content: DatingStageContent,
  locationLabel: string,
  stageIndex: number,
): DatingArchiveActView {
  return {
    actKey: `${archive.id}:${content.stageId}`,
    stageId: content.stageId,
    stageIndex,
    title: getStageTitle(content.stageId, locationLabel),
    source: content.source,
    createdAt: content.createdAt,
    lineCount: content.lines.length,
    isPlayable: content.lines.length > 0,
    content,
  };
}

export function buildDatingArchiveEventView(archive: DatingArchive, characterName: string): DatingArchiveEventView {
  const locationLabel = resolveLocationLabel(archive.locationId);
  const orderedContents = [...archive.contents].sort(
    (left, right) => getStageIndex(left.stageId) - getStageIndex(right.stageId),
  );
  const acts = orderedContents.map((content, index) => projectStageContent(archive, content, locationLabel, index));
  const dateLabel = formatDatingArchiveDate(archive.date);
  const normalizedCharacterName = characterName.trim() || archive.characterId;

  return {
    eventKey: archive.id,
    appointmentId: archive.appointmentId,
    characterId: archive.characterId,
    characterName: normalizedCharacterName,
    locationId: archive.locationId,
    locationLabel,
    date: archive.date,
    dateLabel,
    quality: archive.quality,
    qualityLabel: getQualityLabel(archive.quality),
    archive,
    acts,
  };
}

export function sortDatingArchiveEventViews(events: readonly DatingArchiveEventView[]): DatingArchiveEventView[] {
  return [...events].sort(
    (left, right) =>
      compareDates(left.date, right.date) ||
      left.archive.createdAt.localeCompare(right.archive.createdAt) ||
      left.eventKey.localeCompare(right.eventKey),
  );
}
