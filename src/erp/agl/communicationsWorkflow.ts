import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';

export interface CommunicationsActor {
  name: string;
  role: string;
}

export interface CampaignInput {
  name: string;
  platform: string;
  objective: string;
  startDate: string;
  endDate: string;
  spendGhs: number;
  impressions: number;
  clicks: number;
  conversions: number;
  attributedRevenueGhs: number;
  owner: string;
  notes: string;
}

export interface ReminderInput {
  templateId: string;
  customerId: string;
  vehicleId?: string;
  channel: 'WhatsApp' | 'SMS' | 'Email' | 'Phone';
  body: string;
}

const correlation = () => `COM-${Date.now().toString(36).toUpperCase()}`;

const requireText = (value: string, label: string) => {
  if (!value.trim()) throw new Error(`${label} is required.`);
};

export const aglCommunicationsWorkflow = {
  campaigns() {
    return aglErpRepository.list('campaigns');
  },

  createCampaign(actor: CommunicationsActor, values: CampaignInput) {
    requireText(values.name, 'Campaign name');
    requireText(values.platform, 'Platform');
    requireText(values.objective, 'Objective');
    if (values.spendGhs < 0 || values.impressions < 0 || values.clicks < 0 || values.conversions < 0) {
      throw new Error('Campaign quantities cannot be negative.');
    }
    if (values.clicks > values.impressions) throw new Error('Clicks cannot exceed impressions.');
    if (values.conversions > values.clicks) throw new Error('Conversions cannot exceed clicks.');
    const correlationId = correlation();
    const campaign = aglErpRepository.create({
      moduleId: 'campaigns',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        ...values,
        reference: `${values.platform.toUpperCase().slice(0, 3)}-${new Date().getFullYear()}`,
        amount: values.attributedRevenueGhs,
        roas: values.spendGhs ? values.attributedRevenueGhs / values.spendGhs : 0,
        ctr: values.impressions ? (values.clicks / values.impressions) * 100 : 0,
        conversionRate: values.clicks ? (values.conversions / values.clicks) * 100 : 0,
      },
    });
    const active = aglErpRepository.changeStatus({
      moduleId: 'campaigns',
      recordId: campaign.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status: 'Active',
      values: {},
    });
    if (values.spendGhs > 0) {
      aglErpRepository.create({
        moduleId: 'marketing-spend',
        actorName: actor.name,
        actorRole: actor.role,
        correlationId,
        values: {
          name: values.name,
          reference: active.id,
          category: values.platform,
          amount: values.spendGhs,
          date: values.startDate,
          owner: values.owner,
          notes: `Campaign spend posted from ${active.id}.`,
        },
      });
    }
    return active;
  },

  updateCampaign(actor: CommunicationsActor, record: AglOperationalRecord, values: CampaignInput) {
    requireText(values.name, 'Campaign name');
    if (values.clicks > values.impressions || values.conversions > values.clicks) {
      throw new Error('Campaign funnel quantities are inconsistent.');
    }
    return aglErpRepository.update({
      moduleId: 'campaigns',
      recordId: record.id,
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        ...values,
        amount: values.attributedRevenueGhs,
        roas: values.spendGhs ? values.attributedRevenueGhs / values.spendGhs : 0,
        ctr: values.impressions ? (values.clicks / values.impressions) * 100 : 0,
        conversionRate: values.clicks ? (values.conversions / values.clicks) * 100 : 0,
      },
    });
  },

  createLead(actor: CommunicationsActor, values: { name: string; contact: string; source: string; interest: string; owner: string }) {
    requireText(values.name, 'Lead name');
    requireText(values.contact, 'Contact');
    return aglErpRepository.create({
      moduleId: 'leads',
      actorName: actor.name,
      actorRole: actor.role,
      values: { ...values, reference: `LEAD-${String(Date.now()).slice(-6)}`, notes: values.interest },
    });
  },

  progressLead(actor: CommunicationsActor, recordId: string, status: string, note = '') {
    return aglErpRepository.changeStatus({
      moduleId: 'leads',
      recordId,
      actorName: actor.name,
      actorRole: actor.role,
      status,
      values: note ? { notes: note } : {},
    });
  },

  createPromotion(actor: CommunicationsActor, values: { name: string; campaignId: string; code: string; discount: number; starts: string; ends: string; owner: string }) {
    requireText(values.name, 'Promotion name');
    requireText(values.code, 'Promotion code');
    if (values.discount <= 0 || values.discount > 100) throw new Error('Discount must be between 0 and 100%.');
    return aglErpRepository.create({
      moduleId: 'promotions',
      actorName: actor.name,
      actorRole: actor.role,
      values: { ...values, reference: values.code, amount: values.discount, notes: `${values.discount}% controlled promotion.` },
    });
  },

  templates() {
    return aglErpRepository.list('reminder-templates');
  },

  createTemplate(actor: CommunicationsActor, values: { name: string; category: string; channel: string; body: string; owner: string }) {
    requireText(values.name, 'Template name');
    requireText(values.body, 'Message body');
    if (!values.body.includes('{{customer}}')) throw new Error('Templates must include {{customer}} so the recipient is identified.');
    return aglErpRepository.create({
      moduleId: 'reminder-templates',
      actorName: actor.name,
      actorRole: actor.role,
      values: { ...values, reference: `TPL-${String(Date.now()).slice(-6)}`, notes: 'Active customer communication template.' },
    });
  },

  sendReminder(actor: CommunicationsActor, input: ReminderInput) {
    const customer = aglErpRepository.list('customers').find((item) => item.id === input.customerId);
    if (!customer) throw new Error('Select a valid customer.');
    const template = aglErpRepository.list('reminder-templates').find((item) => item.id === input.templateId);
    if (!template && !input.body.trim()) throw new Error('Select a template or enter a message.');
    const vehicle = input.vehicleId
      ? aglErpRepository.list('vehicles').find((item) => item.id === input.vehicleId)
      : undefined;
    const sourceBody = input.body.trim() || String(template?.body ?? '');
    const rendered = sourceBody
      .split('{{customer}}').join(String(customer.name ?? 'Customer'))
      .split('{{vehicle}}').join(String(vehicle?.name ?? vehicle?.registration ?? 'your vehicle'))
      .split('{{business}}').join('Automobiles Ghana Limited');
    const correlationId = correlation();
    const delivery = aglErpRepository.create({
      moduleId: 'reminder-deliveries',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        name: String(customer.name),
        customerId: customer.id,
        vehicleId: vehicle?.id,
        reference: template?.id ?? 'MANUAL',
        channel: input.channel,
        recipient: customer.phone ?? customer.email,
        body: rendered,
        sentAt: new Date().toISOString(),
        owner: actor.name,
        notes: `Delivery prepared for ${String(customer.phone ?? customer.email ?? 'configured contact')}.`,
      },
    });
    const sent = aglErpRepository.changeStatus({
      moduleId: 'reminder-deliveries',
      recordId: delivery.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status: 'Completed',
      values: {},
    });
    aglErpRepository.create({
      moduleId: 'notifications',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        name: `Reminder sent to ${String(customer.name)}`,
        reference: sent.id,
        category: 'Customer communication',
        owner: actor.name,
        read: false,
        notes: `${input.channel}: ${rendered}`,
      },
    });
    return sent;
  },

  markNotification(actor: CommunicationsActor, recordId: string, read: boolean) {
    return aglErpRepository.update({
      moduleId: 'notifications',
      recordId,
      actorName: actor.name,
      actorRole: actor.role,
      values: { read, readAt: read ? new Date().toISOString() : '' },
    });
  },
};
