import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';

export interface DocumentActor {
  name: string;
  role: string;
}

const requireDocument = (documentId: string) => {
  const document = aglErpRepository.list('documents').find((candidate) => candidate.id === documentId);
  if (!document) throw new Error(`Document ${documentId} was not found.`);
  return document;
};

export const aglDocumentWorkflow = {
  documents(): AglOperationalRecord[] {
    return aglErpRepository.list('documents');
  },

  versions(documentId?: string): AglOperationalRecord[] {
    const versions = aglErpRepository.list('document-versions');
    return documentId ? versions.filter((version) => version.documentId === documentId) : versions;
  },

  register(actor: DocumentActor, values: {
    name: string;
    category: string;
    documentOwner: string;
    accessClass: string;
    retentionRule: string;
    description: string;
  }) {
    if (!values.name.trim() || !values.category.trim() || !values.documentOwner.trim()) {
      throw new Error('Document name, category, and accountable owner are required.');
    }
    if (!values.retentionRule.trim()) throw new Error('A retention rule is required.');
    return aglErpRepository.create({
      moduleId: 'documents',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-DOCUMENT-${Date.now()}`,
      values: {
        ...values,
        owner: values.documentOwner,
        reference: 'Version pending',
        currentVersion: 0,
        status: 'Draft',
      },
    });
  },

  addVersion(documentId: string, actor: DocumentActor, values: {
    versionLabel: string;
    effectiveDate: string;
    evidenceReference: string;
    changeSummary: string;
    author: string;
    approver: string;
  }) {
    const document = requireDocument(documentId);
    if (document.status === 'Archived') throw new Error('Archived documents cannot receive new versions.');
    if (!values.versionLabel.trim() || !values.evidenceReference.trim() || !values.changeSummary.trim() || !values.author.trim()) {
      throw new Error('Version, file evidence, change summary, and author are required.');
    }
    if (!values.approver.trim()) throw new Error('An approver is required before a version becomes effective.');
    if (values.approver.trim().toLowerCase() === values.author.trim().toLowerCase()) {
      throw new Error('The document author cannot approve their own effective version.');
    }
    if (this.versions(documentId).some((version) => String(version.versionLabel).toLowerCase() === values.versionLabel.trim().toLowerCase())) {
      throw new Error(`Version ${values.versionLabel} already exists for this document.`);
    }
    const correlationId = `CORR-DOCUMENT-VERSION-${Date.now()}`;
    this.versions(documentId).filter((version) => version.status === 'Effective').forEach((version) => {
      aglErpRepository.changeStatus({
        moduleId: 'document-versions',
        recordId: version.id,
        actorName: actor.name,
        actorRole: actor.role,
        correlationId,
        status: 'Superseded',
        values: { supersededAt: new Date().toISOString(), supersededBy: values.versionLabel },
      });
    });
    const version = aglErpRepository.create({
      moduleId: 'document-versions',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        documentId,
        name: document.name,
        category: document.category,
        versionLabel: values.versionLabel,
        effectiveDate: values.effectiveDate,
        evidenceReference: values.evidenceReference,
        reference: values.evidenceReference,
        changeSummary: values.changeSummary,
        author: values.author,
        approver: values.approver,
        accessClass: document.accessClass,
        retentionRule: document.retentionRule,
        owner: document.owner,
        status: 'Effective',
      },
    });
    aglErpRepository.changeStatus({
      moduleId: 'documents',
      recordId: document.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status: 'Active',
      values: {
        currentVersion: values.versionLabel,
        currentVersionId: version.id,
        reference: values.evidenceReference,
        effectiveDate: values.effectiveDate,
        approvedBy: values.approver,
      },
    });
    return version;
  },

  archive(documentId: string, actor: DocumentActor, archiveBasis: string) {
    const document = requireDocument(documentId);
    if (document.status === 'Archived') throw new Error('This document is already archived.');
    if (document.accessClass === 'Legal hold') throw new Error('Remove the legal hold through an authorized records decision before archival.');
    if (!archiveBasis.trim()) throw new Error('Archive basis is required.');
    return aglErpRepository.changeStatus({
      moduleId: 'documents',
      recordId: documentId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-DOCUMENT-ARCHIVE-${Date.now()}`,
      status: 'Archived',
      values: { archiveBasis, archivedBy: actor.name, archivedAt: new Date().toISOString() },
    });
  },
};
