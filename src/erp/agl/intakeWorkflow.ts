import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';

export interface IntakeActor {
  name: string;
  role: string;
}

export interface CustomerIntakeDetails {
  existingId?: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  customerType: string;
  preferredContact: string;
  notificationsEnabled: boolean;
  acquisitionChannel: string;
  locality?: string;
  address?: string;
  tinOrGhanaCard?: string;
  notes?: string;
}

export interface VehicleIntakeDetails {
  existingId?: string;
  registration: string;
  make: string;
  model: string;
  year?: string;
  color?: string;
  vin?: string;
  engineNumber?: string;
  engineCapacity?: string;
  fuelType?: string;
  transmission?: string;
  mileage?: number;
  fuelLevel?: string;
  keyCount?: number;
  intakeCondition?: string;
  preExistingDamage?: string;
  accessoriesReceived?: string;
  insuranceExpiry?: string;
  roadworthyExpiry?: string;
  evidenceReferences?: string;
}

export interface VisitIntakeDetails {
  service: string;
  reasonForVisit: string;
  customerComplaint: string;
  observedSymptoms?: string;
  date: string;
  time: string;
  expectedCollection?: string;
  mechanic?: string;
  bay?: string;
  advisor: string;
  serviceFeeGhs?: number;
  customerAuthorized: boolean;
  authorityNotes?: string;
  openJobImmediately: boolean;
}

export interface OpenIntakeCommand {
  actor: IntakeActor;
  customer: CustomerIntakeDetails;
  vehicle: VehicleIntakeDetails;
  visit: VisitIntakeDetails;
}

export interface OpenIntakeResult {
  correlationId: string;
  customer: AglOperationalRecord;
  vehicle: AglOperationalRecord;
  intake: AglOperationalRecord;
  appointment: AglOperationalRecord;
  job?: AglOperationalRecord;
}

const requireRecord = (moduleId: string, id: string) => {
  const record = aglErpRepository.list(moduleId).find((candidate) => candidate.id === id);
  if (!record) throw new Error(`${moduleId} record ${id} was not found.`);
  return record;
};

const vehicleDisplay = (vehicle: VehicleIntakeDetails) => (
  `${vehicle.make} ${vehicle.model}${vehicle.registration ? ` · ${vehicle.registration}` : ''}`.trim()
);

export const aglIntakeWorkflow = {
  customers(): AglOperationalRecord[] {
    return aglErpRepository.list('customers');
  },

  vehicles(customerId?: string): AglOperationalRecord[] {
    const vehicles = aglErpRepository.list('vehicles');
    if (!customerId) return vehicles;
    const customer = aglErpRepository.list('customers').find((candidate) => candidate.id === customerId);
    return vehicles.filter((vehicle) => (
      vehicle.customerId === customerId
      || String(vehicle.customer ?? '').toLowerCase() === String(customer?.name ?? '').toLowerCase()
    ));
  },

  intakes(): AglOperationalRecord[] {
    return aglErpRepository.list('intake');
  },

  open(command: OpenIntakeCommand): OpenIntakeResult {
    if (!command.visit.customerAuthorized) {
      throw new Error('Customer work authorization must be confirmed before an appointment or job is opened.');
    }

    const correlationId = `CORR-INTAKE-${Date.now()}`;
    const common = {
      actorName: command.actor.name,
      actorRole: command.actor.role,
      correlationId,
    };
    const existingCustomers = aglErpRepository.list('customers');
    const existingVehicles = aglErpRepository.list('vehicles');
    const normalizedPhone = command.customer.phone.replace(/\s+/g, '');
    const normalizedRegistration = command.vehicle.registration.replace(/\s+/g, '').toUpperCase();

    if (!command.customer.existingId && normalizedPhone && existingCustomers.some(
      (candidate) => String(candidate.phone ?? '').replace(/\s+/g, '') === normalizedPhone,
    )) {
      throw new Error('A customer with this phone already exists. Select the customer master record instead.');
    }
    if (!command.vehicle.existingId && normalizedRegistration && existingVehicles.some(
      (candidate) => String(candidate.registration ?? '').replace(/\s+/g, '').toUpperCase() === normalizedRegistration,
    )) {
      throw new Error('This registration is already in the vehicle registry. Select the registered vehicle instead.');
    }
    if (command.vehicle.existingId && !command.customer.existingId) {
      throw new Error('A registered vehicle must be attached to its existing customer master record.');
    }
    if (command.vehicle.existingId && command.customer.existingId) {
      const selectedCustomer = requireRecord('customers', command.customer.existingId);
      const selectedVehicle = requireRecord('vehicles', command.vehicle.existingId);
      const belongsToCustomer = selectedVehicle.customerId === selectedCustomer.id
        || String(selectedVehicle.customer ?? '').toLowerCase() === String(selectedCustomer.name ?? '').toLowerCase();
      if (!belongsToCustomer) {
        throw new Error('The selected vehicle belongs to another customer record.');
      }
    }

    const customer = command.customer.existingId
      ? requireRecord('customers', command.customer.existingId)
      : aglErpRepository.create({
          ...common,
          moduleId: 'customers',
          values: {
            name: command.customer.name,
            phone: command.customer.phone,
            alternatePhone: command.customer.alternatePhone,
            email: command.customer.email,
            customerType: command.customer.customerType,
            preferredContact: command.customer.preferredContact,
            notificationsEnabled: command.customer.notificationsEnabled,
            acquisitionChannel: command.customer.acquisitionChannel,
            locality: command.customer.locality,
            address: command.customer.address,
            tinOrGhanaCard: command.customer.tinOrGhanaCard,
            owner: command.visit.advisor,
            notes: command.customer.notes,
            status: 'Active',
          },
        });

    const vehicle = command.vehicle.existingId
      ? requireRecord('vehicles', command.vehicle.existingId)
      : aglErpRepository.create({
          ...common,
          moduleId: 'vehicles',
          values: {
            customerId: customer.id,
            customer: String(customer.name),
            registration: command.vehicle.registration,
            vehicle: `${command.vehicle.make} ${command.vehicle.model}${command.vehicle.year ? ` ${command.vehicle.year}` : ''}`,
            make: command.vehicle.make,
            model: command.vehicle.model,
            year: command.vehicle.year,
            color: command.vehicle.color,
            vin: command.vehicle.vin,
            engineNumber: command.vehicle.engineNumber,
            engineCapacity: command.vehicle.engineCapacity,
            fuelType: command.vehicle.fuelType,
            transmission: command.vehicle.transmission,
            mileage: command.vehicle.mileage,
            fuelLevel: command.vehicle.fuelLevel,
            keyCount: command.vehicle.keyCount,
            intakeCondition: command.vehicle.intakeCondition,
            preExistingDamage: command.vehicle.preExistingDamage,
            accessoriesReceived: command.vehicle.accessoriesReceived,
            insuranceExpiry: command.vehicle.insuranceExpiry,
            roadworthyExpiry: command.vehicle.roadworthyExpiry,
            evidenceReferences: command.vehicle.evidenceReferences,
            owner: command.visit.advisor,
            status: 'In workshop',
          },
        });

    const intake = aglErpRepository.create({
      ...common,
      moduleId: 'intake',
      values: {
        customerId: customer.id,
        vehicleId: vehicle.id,
        customer: String(customer.name),
        phone: String(customer.phone ?? command.customer.phone),
        vehicle: String(vehicle.vehicle ?? vehicleDisplay(command.vehicle)),
        registration: String(vehicle.registration ?? command.vehicle.registration),
        concern: command.visit.customerComplaint,
        reasonForVisit: command.visit.reasonForVisit,
        observedSymptoms: command.visit.observedSymptoms,
        intakeCondition: String(vehicle.intakeCondition ?? command.vehicle.intakeCondition ?? ''),
        preExistingDamage: String(vehicle.preExistingDamage ?? command.vehicle.preExistingDamage ?? ''),
        odometer: Number(vehicle.mileage ?? command.vehicle.mileage ?? 0),
        fuelLevel: String(vehicle.fuelLevel ?? command.vehicle.fuelLevel ?? ''),
        accessoriesReceived: String(vehicle.accessoriesReceived ?? command.vehicle.accessoriesReceived ?? ''),
        preferredContact: String(customer.preferredContact ?? command.customer.preferredContact),
        owner: command.visit.advisor,
        customerAuthorizedAt: new Date().toISOString(),
        authorityNotes: command.visit.authorityNotes,
        status: 'Verified',
      },
    });

    const appointment = aglErpRepository.create({
      ...common,
      moduleId: 'appointments',
      values: {
        intakeId: intake.id,
        customerId: customer.id,
        vehicleId: vehicle.id,
        customer: String(customer.name),
        vehicle: String(vehicle.vehicle ?? vehicleDisplay(command.vehicle)),
        registration: String(vehicle.registration ?? command.vehicle.registration),
        service: command.visit.service,
        reasonForVisit: command.visit.reasonForVisit,
        customerComplaint: command.visit.customerComplaint,
        observedSymptoms: command.visit.observedSymptoms,
        date: command.visit.date,
        time: command.visit.time,
        expectedCollection: command.visit.expectedCollection,
        mechanic: command.visit.mechanic || 'Unassigned',
        bay: command.visit.bay || 'Unassigned',
        owner: command.visit.advisor,
        amount: command.visit.serviceFeeGhs ?? 0,
        customerAuthorizedAt: new Date().toISOString(),
        authorityNotes: command.visit.authorityNotes,
        preferredContact: String(customer.preferredContact ?? command.customer.preferredContact),
        intakeCondition: String(vehicle.intakeCondition ?? ''),
        preExistingDamage: String(vehicle.preExistingDamage ?? ''),
        odometer: Number(vehicle.mileage ?? 0),
        fuelLevel: String(vehicle.fuelLevel ?? ''),
        accessoriesReceived: String(vehicle.accessoriesReceived ?? ''),
        status: command.visit.openJobImmediately ? 'Converted' : 'Confirmed',
      },
    });

    const job = aglErpRepository.list('work-orders').find(
      (candidate) => candidate.appointmentId === appointment.id,
    );

    const updatedIntake = aglErpRepository.update({
      ...common,
      moduleId: 'intake',
      recordId: intake.id,
      values: {
        appointmentId: appointment.id,
        jobId: job?.id,
        status: job ? 'Converted to job' : 'Converted to appointment',
      },
    });

    aglErpRepository.update({
      ...common,
      moduleId: 'vehicles',
      recordId: vehicle.id,
      values: {
        latestIntakeId: intake.id,
        latestAppointmentId: appointment.id,
        currentJobId: job?.id,
        status: job ? 'In workshop' : vehicle.status,
      },
    });

    aglErpRepository.update({
      ...common,
      moduleId: 'customers',
      recordId: customer.id,
      values: {
        latestIntakeId: intake.id,
        latestAppointmentId: appointment.id,
        currentJobId: job?.id,
      },
    });

    return {
      correlationId,
      customer: requireRecord('customers', customer.id),
      vehicle: requireRecord('vehicles', vehicle.id),
      intake: updatedIntake,
      appointment,
      job,
    };
  },
};
