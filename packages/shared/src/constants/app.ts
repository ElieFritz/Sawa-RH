import { z } from 'zod';

export const userRoleValues = [
  'ADMIN',
  'MODERATOR',
  'RH_PRO',
  'CANDIDATE',
  'RECRUITER',
] as const;

export const selfServeRoleValues = ['RH_PRO', 'CANDIDATE', 'RECRUITER'] as const;
export const verificationQueueRoleValues = ['RH_PRO', 'RECRUITER'] as const;

export const profileCompletionStatusValues = [
  'INCOMPLETE',
  'COMPLETE',
] as const;

export const verificationStatusValues = [
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
] as const;

export const cvStatusValues = ['DRAFT', 'ACTIVE', 'HIDDEN', 'DELETED'] as const;

export const reviewRequestStatusValues = [
  'OPEN',
  'ASSIGNED',
  'SUBMITTED',
  'CLOSED',
] as const;

export const reportTargetTypeValues = ['CV', 'USER'] as const;

export const reportStatusValues = ['OPEN', 'RESOLVED', 'REJECTED'] as const;

export const auditActionValues = [
  'VIEW_CV',
  'DOWNLOAD_CV',
  'SEARCH_CV',
  'UPLOAD_CV',
  'DELETE_CV',
  'ASSIGN_REQUEST',
  'SUBMIT_REVIEW',
  'BAN_USER',
  'HIDE_CV',
  'APPROVE_VERIFICATION',
] as const;

export const localeValues = ['fr', 'en'] as const;

export type UserRole = (typeof userRoleValues)[number];
export type SelfServeUserRole = (typeof selfServeRoleValues)[number];
export type VerificationQueueRole = (typeof verificationQueueRoleValues)[number];
export type ProfileCompletionStatus = (typeof profileCompletionStatusValues)[number];
export type VerificationStatus = (typeof verificationStatusValues)[number];
export type CvStatus = (typeof cvStatusValues)[number];
export type ReviewRequestStatus = (typeof reviewRequestStatusValues)[number];
export type ReportTargetType = (typeof reportTargetTypeValues)[number];
export type ReportStatus = (typeof reportStatusValues)[number];
export type AuditAction = (typeof auditActionValues)[number];
export type AppLocale = (typeof localeValues)[number];

export const userRoleSchema = z.enum(userRoleValues);
export const selfServeRoleSchema = z.enum(selfServeRoleValues);
export const verificationQueueRoleSchema = z.enum(verificationQueueRoleValues);
export const profileCompletionStatusSchema = z.enum(profileCompletionStatusValues);
export const verificationStatusSchema = z.enum(verificationStatusValues);
export const localeSchema = z.enum(localeValues);

export const appName = 'SAWA RH';
