import { aglErpRepository } from './repository';

export interface CustomerActor {
  name: string;
  role: string;
}

export interface CustomerInput {
  name: string;
  phone: string;
  alternatePhone: string;
  email: string;
  customerType: string;
  preferredContact: string;
  acquisitionChannel: string;
  locality: string;
  address: string;
  tinOrGhanaCard: string;
  owner: string;
  notes: string;
}

export interface VehicleInput {
  registration: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  engineNumber: string;
  engineCapacity: string;
  fuelType: string;
  transmission: string;
  mileage: number;
  insuranceExpiry: string;
  roadworthyExpiry: string;
  nextService: string;
  notes: string;
}

export interface SubscriptionPlanInput {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  benefits: string[];
  isActive: boolean;
  owner: string;
}

export interface SubscriptionEnrollmentInput {
  customerId: string;
  vehicleId: string;
  planId: string;
  startDate: string;
  autoRenew: boolean;
  owner: string;
}

const requireCustomer = (customerId: string) => {
  const customer = aglErpRepository.list('customers').find((item) => item.id === customerId);
  if (!customer) throw new Error(`Customer ${customerId} was not found.`);
  return customer;
};

export const aglCustomerWorkflow = {
  customers() {
    return aglErpRepository.list('customers');
  },

  vehicles() {
    return aglErpRepository.list('vehicles');
  },

  subscriptions() {
    return aglErpRepository.list('subscriptions');
  },

  subscriptionPlans() {
    return aglErpRepository.list('subscription-plans');
  },

  createSubscriptionPlan(actor: CustomerActor, values: SubscriptionPlanInput) {
    if (!values.name.trim()) throw new Error('Plan name is required.');
    if (values.monthlyPrice <= 0 || values.yearlyPrice <= 0) throw new Error('Monthly and yearly prices must be greater than zero.');
    if (this.subscriptionPlans().some((plan) => String(plan.name).toLowerCase() === values.name.trim().toLowerCase())) {
      throw new Error(`A plan named ${values.name.trim()} already exists.`);
    }
    return aglErpRepository.create({
      moduleId: 'subscription-plans',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        ...values,
        name: values.name.trim(),
        reference: `PLAN-${String(Date.now()).slice(-6)}`,
        benefits: JSON.stringify(values.benefits.filter(Boolean)),
        amount: values.monthlyPrice,
        status: values.isActive ? 'Active' : 'Draft',
      },
    });
  },

  enrollSubscription(actor: CustomerActor, values: SubscriptionEnrollmentInput) {
    const plan = this.subscriptionPlans().find((item) => item.id === values.planId);
    if (!plan || plan.status !== 'Active') throw new Error('Select an active subscription plan.');
    const cycle = 'Monthly';
    const start = new Date(values.startDate);
    if (Number.isNaN(start.getTime())) throw new Error('Choose a valid start date.');
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    const nextBill = new Date(start);
    nextBill.setMonth(nextBill.getMonth() + 1);
    return this.createSubscription(actor, {
      customerId: values.customerId,
      vehicleId: values.vehicleId,
      plan: String(plan.name),
      planId: plan.id,
      startDate: values.startDate,
      endDate: end.toISOString().slice(0, 10),
      nextBillingDate: nextBill.toISOString().slice(0, 10),
      autoRenew: values.autoRenew,
      amount: Number(plan.monthlyPrice ?? plan.amount ?? 0),
      billingCycle: cycle,
      owner: values.owner,
    });
  },

  createCustomer(actor: CustomerActor, values: CustomerInput, vehicle?: VehicleInput) {
    if (!values.name.trim() || !values.phone.trim()) throw new Error('Customer name and primary phone are required.');
    const duplicate = this.customers().find((customer) => (
      String(customer.phone).replace(/\s/g, '') === values.phone.replace(/\s/g, '')
      || (values.email && String(customer.email).toLowerCase() === values.email.toLowerCase())
    ));
    if (duplicate) throw new Error(`A matching customer already exists: ${String(duplicate.name)} (${duplicate.id}).`);
    const correlationId = `CORR-CUSTOMER-${Date.now()}`;
    const customer = aglErpRepository.create({
      moduleId: 'customers',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: { ...values, status: 'Active' },
    });
    const createdVehicle = vehicle?.registration.trim()
      ? this.addVehicle(actor, customer.id, vehicle, correlationId)
      : undefined;
    return { customer, vehicle: createdVehicle };
  },

  updateCustomer(actor: CustomerActor, customerId: string, values: Partial<CustomerInput>) {
    requireCustomer(customerId);
    return aglErpRepository.update({
      moduleId: 'customers',
      recordId: customerId,
      actorName: actor.name,
      actorRole: actor.role,
      values,
    });
  },

  retireCustomer(actor: CustomerActor, customerId: string, reason: string) {
    const snapshot = this.snapshot(customerId);
    if (!reason.trim()) throw new Error('Record why the customer relationship is being retired.');
    const hasHistory = snapshot.vehicles.length + snapshot.jobs.length + snapshot.sales.length + snapshot.subscriptions.length > 0;
    if (hasHistory) {
      const customer = aglErpRepository.update({
        moduleId: 'customers',
        recordId: customerId,
        actorName: actor.name,
        actorRole: actor.role,
        values: { status: 'Archived', retirementReason: reason, retiredAt: new Date().toISOString(), retiredBy: actor.name },
      });
      return { action: 'archived' as const, customer };
    }
    aglErpRepository.delete({ moduleId: 'customers', recordId: customerId, actorName: actor.name, actorRole: actor.role });
    return { action: 'deleted' as const };
  },

  addVehicle(actor: CustomerActor, customerId: string, values: VehicleInput, correlationId?: string) {
    const customer = requireCustomer(customerId);
    if (!values.registration.trim() || !values.make.trim() || !values.model.trim() || !values.vin.trim()) {
      throw new Error('Registration, make, model, and VIN are required.');
    }
    const duplicate = this.vehicles().find((vehicle) => (
      String(vehicle.registration).replace(/\s/g, '').toLowerCase() === values.registration.replace(/\s/g, '').toLowerCase()
      || String(vehicle.vin).toLowerCase() === values.vin.toLowerCase()
    ));
    if (duplicate) throw new Error(`Vehicle already exists: ${String(duplicate.registration)} (${duplicate.id}).`);
    const vehicle = aglErpRepository.create({
      moduleId: 'vehicles',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        ...values,
        vehicle: `${values.make} ${values.model}${values.year ? ` ${values.year}` : ''}`,
        customer: customer.name,
        customerId: customer.id,
        owner: actor.name,
        status: 'Active',
      },
    });
    aglErpRepository.update({
      moduleId: 'customers',
      recordId: customer.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        vehicleCount: this.vehicles().filter((item) => item.customerId === customer.id).length,
        lastVehicleId: vehicle.id,
      },
    });
    return vehicle;
  },

  retireVehicle(actor: CustomerActor, vehicleId: string, reason: string) {
    const vehicle = this.vehicles().find((item) => item.id === vehicleId);
    if (!vehicle) throw new Error(`Vehicle ${vehicleId} was not found.`);
    if (!reason.trim()) throw new Error('Record why the vehicle is being retired.');
    const jobs = aglErpRepository.list('work-orders').filter((item) => item.vehicleId === vehicleId || String(item.vehicle).includes(String(vehicle.registration)));
    const subscriptions = this.subscriptions().filter((item) => item.vehicleId === vehicleId);
    if (jobs.length || subscriptions.length) {
      return {
        action: 'archived' as const,
        vehicle: aglErpRepository.update({
          moduleId: 'vehicles',
          recordId: vehicleId,
          actorName: actor.name,
          actorRole: actor.role,
          values: { status: 'Archived', retirementReason: reason, retiredAt: new Date().toISOString(), retiredBy: actor.name },
        }),
      };
    }
    aglErpRepository.delete({ moduleId: 'vehicles', recordId: vehicleId, actorName: actor.name, actorRole: actor.role });
    return { action: 'deleted' as const };
  },

  snapshot(customerId: string) {
    const customer = requireCustomer(customerId);
    const vehicles = this.vehicles().filter((vehicle) => (
      vehicle.customerId === customer.id
      || String(vehicle.customer).toLowerCase() === String(customer.name).toLowerCase()
    ));
    const vehicleIds = new Set(vehicles.map((vehicle) => vehicle.id));
    const registrations = vehicles.map((vehicle) => String(vehicle.registration ?? ''));
    const jobs = aglErpRepository.list('work-orders').filter((job) => (
      job.customerId === customer.id
      || String(job.customer).toLowerCase() === String(customer.name).toLowerCase()
      || vehicleIds.has(String(job.vehicleId))
      || registrations.some((registration) => registration && String(job.vehicle).includes(registration))
    ));
    const sales = aglErpRepository.list('sales-ledger').filter((sale) => (
      sale.customerId === customer.id
      || String(sale.customer ?? '').toLowerCase() === String(customer.name).toLowerCase()
    ));
    const subscriptions = this.subscriptions().filter((subscription) => (
      subscription.customerId === customer.id
      || String(subscription.customer ?? subscription.name).toLowerCase().includes(String(customer.name).toLowerCase())
    ));
    return {
      customer,
      vehicles,
      jobs,
      sales,
      subscriptions,
      lifetimeSpendGhs: sales.reduce((sum, sale) => sum + Number(sale.amount ?? 0), Number(customer.lifetimeSpendGhs ?? 0)),
    };
  },

  createSubscription(actor: CustomerActor, values: {
    customerId: string;
    vehicleId: string;
    plan: string;
    planId?: string;
    startDate: string;
    endDate: string;
    nextBillingDate?: string;
    autoRenew?: boolean;
    amount: number;
    billingCycle: string;
    owner: string;
  }) {
    const customer = requireCustomer(values.customerId);
    const vehicle = this.vehicles().find((item) => item.id === values.vehicleId);
    if (!vehicle) throw new Error('Select a registered vehicle.');
    if (!values.plan.trim() || !values.startDate || !values.endDate) throw new Error('Plan and coverage dates are required.');
    return aglErpRepository.create({
      moduleId: 'subscriptions',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        ...values,
        name: `${String(customer.name)} · ${values.plan}`,
        customer: customer.name,
        vehicle: vehicle.vehicle,
        reference: vehicle.registration,
        status: 'Active',
      },
    });
  },
};
