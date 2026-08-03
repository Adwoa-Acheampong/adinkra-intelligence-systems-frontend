import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';

export interface AppointmentActor {
  name: string;
  role: string;
}

export interface AppointmentBooking {
  customerId: string;
  vehicleId: string;
  service: string;
  customerComplaint: string;
  date: string;
  time: string;
  durationMinutes: number;
  mechanic: string;
  bay: string;
  advisor: string;
  expectedCollection?: string;
  notes?: string;
  confirmNow: boolean;
}

export interface CapacityConflict {
  type: 'bay' | 'mechanic';
  message: string;
  appointmentId: string;
}

const minutes = (time: string) => {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return hour * 60 + minute;
};

const overlaps = (startA: number, durationA: number, startB: number, durationB: number) => (
  startA < startB + durationB && startB < startA + durationA
);

const activeStatuses = new Set(['Requested', 'Confirmed', 'Checked in', 'Converted']);
const requireRecord = (moduleId: string, recordId: string) => {
  const record = aglErpRepository.list(moduleId).find((candidate) => candidate.id === recordId);
  if (!record) throw new Error(`${recordId} was not found in ${moduleId}.`);
  return record;
};

export const aglAppointmentWorkflow = {
  appointments(): AglOperationalRecord[] {
    return aglErpRepository.list('appointments');
  },

  customers(): AglOperationalRecord[] {
    return aglErpRepository.list('customers');
  },

  vehicles(customerId?: string): AglOperationalRecord[] {
    const vehicles = aglErpRepository.list('vehicles');
    if (!customerId) return vehicles;
    const customer = this.customers().find((candidate) => candidate.id === customerId);
    return vehicles.filter((vehicle) => (
      vehicle.customerId === customerId
      || String(vehicle.customer ?? '').toLowerCase() === String(customer?.name ?? '').toLowerCase()
    ));
  },

  mechanics(): AglOperationalRecord[] {
    return aglErpRepository.list('mechanics');
  },

  conflicts(
    candidate: Pick<AppointmentBooking, 'date' | 'time' | 'durationMinutes' | 'mechanic' | 'bay'>,
    excludeId?: string,
  ): CapacityConflict[] {
    const start = minutes(candidate.time);
    return this.appointments()
      .filter((appointment) => (
        appointment.id !== excludeId
        && appointment.date === candidate.date
        && activeStatuses.has(appointment.status)
        && overlaps(
          start,
          candidate.durationMinutes,
          minutes(String(appointment.time ?? '00:00')),
          Number(appointment.durationMinutes ?? 60),
        )
      ))
      .flatMap((appointment) => {
        const conflicts: CapacityConflict[] = [];
        if (candidate.bay !== 'Unassigned' && appointment.bay === candidate.bay) {
          conflicts.push({
            type: 'bay',
            appointmentId: appointment.id,
            message: `${candidate.bay} is occupied by ${appointment.id} at ${String(appointment.time)}.`,
          });
        }
        if (candidate.mechanic !== 'Unassigned' && appointment.mechanic === candidate.mechanic) {
          conflicts.push({
            type: 'mechanic',
            appointmentId: appointment.id,
            message: `${candidate.mechanic} is assigned to ${appointment.id} at ${String(appointment.time)}.`,
          });
        }
        return conflicts;
      });
  },

  book(command: { actor: AppointmentActor; booking: AppointmentBooking }) {
    const customer = requireRecord('customers', command.booking.customerId);
    const vehicle = requireRecord('vehicles', command.booking.vehicleId);
    const belongsToCustomer = vehicle.customerId === customer.id
      || String(vehicle.customer ?? '').toLowerCase() === String(customer.name ?? '').toLowerCase();
    if (!belongsToCustomer) throw new Error('The selected vehicle does not belong to this customer.');
    if (!command.booking.customerComplaint.trim()) throw new Error('Record the customer complaint before booking.');
    const conflicts = this.conflicts(command.booking);
    if (conflicts.length) throw new Error(conflicts[0].message);

    const correlationId = `CORR-APPOINTMENT-${Date.now()}`;
    return aglErpRepository.create({
      moduleId: 'appointments',
      actorName: command.actor.name,
      actorRole: command.actor.role,
      correlationId,
      values: {
        customerId: customer.id,
        vehicleId: vehicle.id,
        customer: String(customer.name),
        phone: String(customer.phone ?? ''),
        preferredContact: String(customer.preferredContact ?? 'Phone'),
        vehicle: String(vehicle.vehicle ?? ''),
        registration: String(vehicle.registration ?? ''),
        service: command.booking.service,
        customerComplaint: command.booking.customerComplaint,
        date: command.booking.date,
        time: command.booking.time,
        durationMinutes: command.booking.durationMinutes,
        expectedCollection: command.booking.expectedCollection,
        mechanic: command.booking.mechanic,
        bay: command.booking.bay,
        owner: command.booking.advisor,
        notes: command.booking.notes,
        status: command.booking.confirmNow ? 'Confirmed' : 'Requested',
      },
    });
  },

  confirm(appointmentId: string, actor: AppointmentActor) {
    const appointment = requireRecord('appointments', appointmentId);
    if (appointment.status !== 'Requested') throw new Error('Only requested appointments can be confirmed.');
    const conflicts = this.conflicts({
      date: String(appointment.date),
      time: String(appointment.time),
      durationMinutes: Number(appointment.durationMinutes ?? 60),
      mechanic: String(appointment.mechanic ?? 'Unassigned'),
      bay: String(appointment.bay ?? 'Unassigned'),
    }, appointmentId);
    if (conflicts.length) throw new Error(conflicts[0].message);
    return aglErpRepository.changeStatus({
      moduleId: 'appointments',
      recordId: appointmentId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-APPOINTMENT-${Date.now()}`,
      status: 'Confirmed',
      values: { confirmedAt: new Date().toISOString(), confirmedBy: actor.name },
    });
  },

  checkIn(appointmentId: string, actor: AppointmentActor) {
    const appointment = requireRecord('appointments', appointmentId);
    if (!['Requested', 'Confirmed'].includes(appointment.status)) {
      throw new Error('Only requested or confirmed appointments can be checked in.');
    }
    return aglErpRepository.changeStatus({
      moduleId: 'appointments',
      recordId: appointmentId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-CHECKIN-${Date.now()}`,
      status: 'Checked in',
      values: { checkedInAt: new Date().toISOString(), checkedInBy: actor.name },
    });
  },

  openJob(appointmentId: string, actor: AppointmentActor) {
    const appointment = requireRecord('appointments', appointmentId);
    if (!['Confirmed', 'Checked in'].includes(appointment.status)) {
      throw new Error('Confirm or check in the appointment before opening a job.');
    }
    const correlationId = `CORR-CONVERSION-${Date.now()}`;
    const converted = aglErpRepository.changeStatus({
      moduleId: 'appointments',
      recordId: appointmentId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status: 'Converted',
      values: { convertedAt: new Date().toISOString(), convertedBy: actor.name },
    });
    const job = aglErpRepository.list('work-orders').find(
      (candidate) => candidate.appointmentId === appointmentId,
    );
    if (!job) throw new Error('The appointment converted but no linked work order was created.');
    return { appointment: converted, job };
  },

  cancel(appointmentId: string, actor: AppointmentActor, reason: string) {
    const appointment = requireRecord('appointments', appointmentId);
    if (['Converted', 'Cancelled'].includes(appointment.status)) {
      throw new Error('Converted or cancelled appointments cannot be cancelled here.');
    }
    if (!reason.trim()) throw new Error('A cancellation reason is required.');
    return aglErpRepository.changeStatus({
      moduleId: 'appointments',
      recordId: appointmentId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-CANCELLATION-${Date.now()}`,
      status: 'Cancelled',
      values: { cancellationReason: reason, cancelledAt: new Date().toISOString(), cancelledBy: actor.name },
    });
  },
};
