import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';

export type AbsenceType = 'None' | 'Holiday' | 'PTO' | 'Sickday';

export interface AttendanceActor {
  name: string;
  role: string;
}

export interface AttendanceEntryInput {
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut: string;
  absenceType: AbsenceType;
  source: 'Biometric' | 'QR kiosk' | 'Manager correction' | 'Imported record' | 'Mobile';
  notes: string;
}

export interface AttendanceSummary {
  expectedDays: number;
  loggedDays: number;
  payableDays: number;
  excusedDays: number;
  unloggedDays: number;
  unloggedDates: string[];
  lateCount: number;
  missedIn: number;
  missedOut: number;
  totalHours: number;
  overtimeHours: number;
}

const dateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const minutes = (value: unknown) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? ''));
  if (!match) return undefined;
  return Number(match[1]) * 60 + Number(match[2]);
};

const hoursBetween = (clockIn: string, clockOut: string) => {
  const start = minutes(clockIn);
  const end = minutes(clockOut);
  if (start === undefined || end === undefined || end <= start) return 0;
  return Number(((end - start) / 60).toFixed(2));
};

const isWorkday = (date: Date) => date.getDay() !== 0 && date.getDay() !== 6;

const workdaysForMonth = (year: number, month: number, through = new Date()) => {
  const dates: string[] = [];
  const lastDay = new Date(year, month, 0).getDate();
  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(year, month - 1, day);
    if (date > through || !isWorkday(date)) continue;
    dates.push(dateOnly(date));
  }
  return dates;
};

const requireEmployee = (employeeId: string) => {
  const employee = aglErpRepository.list('employees').find((item) => item.id === employeeId);
  if (!employee) throw new Error(`Employee ${employeeId} was not found.`);
  if (!['Active', 'On leave'].includes(employee.status)) {
    throw new Error(`${String(employee.name)} is not active for attendance reporting.`);
  }
  if (employee.payrollOnly === true) {
    throw new Error(`${String(employee.name)} is marked payroll-only and does not participate in attendance.`);
  }
  return employee;
};

const entryValues = (employee: AglOperationalRecord, input: AttendanceEntryInput) => {
  const excused = input.absenceType !== 'None';
  const hours = excused ? 0 : hoursBetween(input.clockIn, input.clockOut);
  const clockInMinutes = minutes(input.clockIn);
  const clockOutMinutes = minutes(input.clockOut);
  const expectedStartMinutes = minutes(String(employee.workStart ?? '08:00')) ?? 8 * 60;
  const expectedEndMinutes = minutes(String(employee.workEnd ?? '18:00')) ?? 18 * 60;
  return {
    name: employee.name,
    reference: employee.id,
    employeeId: employee.id,
    date: input.date,
    clockIn: excused ? '' : input.clockIn,
    clockOut: excused ? '' : input.clockOut,
    hours,
    overtimeHours: excused || clockOutMinutes === undefined
      ? 0
      : Number((Math.max(0, clockOutMinutes - expectedEndMinutes) / 60).toFixed(2)),
    isLate: excused || clockInMinutes === undefined ? false : clockInMinutes > expectedStartMinutes,
    expectedWorkStart: employee.workStart ?? '08:00',
    expectedWorkEnd: employee.workEnd ?? '18:00',
    absenceType: input.absenceType,
    source: input.source,
    owner: 'Alex Morgan',
    notes: input.notes,
    status: excused
      ? 'Excused'
      : !input.clockIn || !input.clockOut
        ? 'Correction requested'
        : 'Recorded',
  };
};

const entriesForEmployee = (employeeId: string, year: number, month: number) => (
  aglErpRepository.list('attendance').filter((entry) => (
    entry.reference === employeeId
    && String(entry.date ?? '').startsWith(`${year}-${String(month).padStart(2, '0')}`)
  ))
);

const createOrUpdateAttendance = (
  actor: AttendanceActor,
  input: AttendanceEntryInput,
  recordId?: string,
) => {
  const employee = requireEmployee(input.employeeId);
  if (!input.date) throw new Error('A work date is required.');
  if (input.absenceType === 'None' && !input.clockIn && !input.clockOut) {
    throw new Error('Provide a clock time or legal absence type.');
  }
  if (input.absenceType === 'None' && input.clockIn && input.clockOut && hoursBetween(input.clockIn, input.clockOut) <= 0) {
    throw new Error('Clock-out must be later than clock-in.');
  }
  const duplicate = aglErpRepository.list('attendance').find((entry) => (
    entry.reference === employee.id
    && entry.date === input.date
    && entry.id !== recordId
  ));
  if (duplicate) throw new Error(`${String(employee.name)} already has an attendance record for ${input.date}.`);
  const values = entryValues(employee, input);
  if (recordId) {
    return aglErpRepository.update({
      moduleId: 'attendance',
      recordId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-ATTENDANCE-CORRECTION-${Date.now()}`,
      values,
    });
  }
  return aglErpRepository.create({
    moduleId: 'attendance',
    actorName: actor.name,
    actorRole: actor.role,
    correlationId: `CORR-ATTENDANCE-MANUAL-${Date.now()}`,
    values,
  });
};

export const aglAttendanceWorkflow = {
  employees() {
    return aglErpRepository.list('employees').filter((employee) => (
      ['Active', 'On leave'].includes(employee.status) && employee.payrollOnly !== true
    ));
  },

  entries() {
    return aglErpRepository.list('attendance');
  },

  leaveRequests() {
    return aglErpRepository.list('leave');
  },

  recordManual(actor: AttendanceActor, input: AttendanceEntryInput) {
    return createOrUpdateAttendance(actor, input);
  },

  correct(actor: AttendanceActor, recordId: string, input: AttendanceEntryInput) {
    return createOrUpdateAttendance(actor, input, recordId);
  },

  clockIn(actor: AttendanceActor, employeeId: string, date = dateOnly(new Date()), time = new Date().toTimeString().slice(0, 5), context?: { source?: AttendanceEntryInput['source']; notes?: string }) {
    const existing = this.entries().find((entry) => entry.reference === employeeId && entry.date === date);
    if (existing?.clockIn) throw new Error('This employee is already clocked in for the selected date.');
    if (existing) {
      return createOrUpdateAttendance(actor, {
        employeeId,
        date,
        clockIn: time,
        clockOut: String(existing.clockOut ?? ''),
        absenceType: 'None',
        source: context?.source ?? 'Manager correction',
        notes: context?.notes ?? 'Live clock-in recorded from the operational ERP.',
      }, existing.id);
    }
    return createOrUpdateAttendance(actor, {
      employeeId,
      date,
      clockIn: time,
      clockOut: '',
      absenceType: 'None',
      source: context?.source ?? 'Biometric',
      notes: context?.notes ?? 'Live clock-in recorded from the operational ERP.',
    });
  },

  clockOut(actor: AttendanceActor, employeeId: string, date = dateOnly(new Date()), time = new Date().toTimeString().slice(0, 5), context?: { notes?: string }) {
    const existing = this.entries().find((entry) => entry.reference === employeeId && entry.date === date);
    if (!existing?.clockIn) throw new Error('Clock-in must be recorded before clock-out.');
    if (existing.clockOut) throw new Error('This employee is already clocked out for the selected date.');
    return createOrUpdateAttendance(actor, {
      employeeId,
      date,
      clockIn: String(existing.clockIn),
      clockOut: time,
      absenceType: 'None',
      source: String(existing.source ?? 'Biometric') as AttendanceEntryInput['source'],
      notes: context?.notes ?? String(existing.notes ?? ''),
    }, existing.id);
  },

  summary(employeeId: string, year: number, month: number, through = new Date()): AttendanceSummary {
    const employee = requireEmployee(employeeId);
    const expected = workdaysForMonth(year, month, through);
    const employmentStart = String(employee.startDate ?? '');
    const expectedForEmployee = employmentStart
      ? expected.filter((date) => date >= employmentStart)
      : expected;
    const entries = entriesForEmployee(employeeId, year, month);
    const loggedDates = new Set(entries.map((entry) => String(entry.date)));
    const unloggedDates = expectedForEmployee.filter((date) => !loggedDates.has(date));
    return entries.reduce<AttendanceSummary>((summary, entry) => {
      const excused = String(entry.absenceType ?? 'None') !== 'None' || entry.status === 'Excused';
      const hasIn = Boolean(entry.clockIn);
      const hasOut = Boolean(entry.clockOut);
      summary.loggedDays += 1;
      summary.excusedDays += excused ? 1 : 0;
      summary.payableDays += excused || (hasIn && hasOut) ? 1 : 0;
      summary.lateCount += !excused && Boolean(entry.isLate) ? 1 : 0;
      summary.missedIn += !excused && !hasIn ? 1 : 0;
      summary.missedOut += !excused && !hasOut ? 1 : 0;
      summary.totalHours += Number(entry.hours ?? 0);
      summary.overtimeHours += Number(entry.overtimeHours ?? 0);
      return summary;
    }, {
      expectedDays: expectedForEmployee.length,
      loggedDays: 0,
      payableDays: 0,
      excusedDays: 0,
      unloggedDays: unloggedDates.length,
      unloggedDates,
      lateCount: 0,
      missedIn: 0,
      missedOut: 0,
      totalHours: 0,
      overtimeHours: 0,
    });
  },

  organizationSummary(year: number, month: number, through = new Date()) {
    return this.employees().map((employee) => ({
      employee,
      summary: this.summary(employee.id, year, month, through),
    }));
  },

  requestLeave(actor: AttendanceActor, values: {
    employeeId: string;
    absenceType: Exclude<AbsenceType, 'None'>;
    startDate: string;
    endDate: string;
    reason: string;
    requestedBy: string;
  }) {
    const employee = requireEmployee(values.employeeId);
    if (!values.startDate || !values.endDate || values.endDate < values.startDate) {
      throw new Error('Provide a valid leave date range.');
    }
    if (!values.reason.trim()) throw new Error('A leave reason is required.');
    return aglErpRepository.create({
      moduleId: 'leave',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        name: employee.name,
        reference: employee.id,
        employeeId: employee.id,
        absenceType: values.absenceType,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason,
        requestedBy: values.requestedBy,
        owner: 'Alex Morgan',
        status: 'Pending',
      },
    });
  },

  approveLeave(actor: AttendanceActor, leaveId: string, approver: string) {
    const request = this.leaveRequests().find((item) => item.id === leaveId);
    if (!request) throw new Error(`Leave request ${leaveId} was not found.`);
    if (request.status !== 'Pending') throw new Error('Only a pending leave request can be approved.');
    if (!approver.trim()) throw new Error('A named approver is required.');
    const employeeId = String(request.employeeId ?? request.reference);
    const start = new Date(`${String(request.startDate)}T12:00:00`);
    const end = new Date(`${String(request.endDate)}T12:00:00`);
    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      if (!isWorkday(cursor)) continue;
      const date = dateOnly(cursor);
      const existing = this.entries().find((entry) => entry.reference === employeeId && entry.date === date);
      if (existing) continue;
      createOrUpdateAttendance(actor, {
        employeeId,
        date,
        clockIn: '',
        clockOut: '',
        absenceType: String(request.absenceType) as Exclude<AbsenceType, 'None'>,
        source: 'Manager correction',
        notes: `Approved leave ${leaveId}: ${String(request.reason)}`,
      });
    }
    return aglErpRepository.changeStatus({
      moduleId: 'leave',
      recordId: leaveId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-LEAVE-APPROVAL-${Date.now()}`,
      status: 'Approved',
      values: { approvedBy: approver, approvedAt: new Date().toISOString() },
    });
  },

  rejectLeave(actor: AttendanceActor, leaveId: string, approver: string, reason: string) {
    if (!approver.trim() || !reason.trim()) throw new Error('Approver and rejection reason are required.');
    return aglErpRepository.changeStatus({
      moduleId: 'leave',
      recordId: leaveId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-LEAVE-REJECTION-${Date.now()}`,
      status: 'Closed',
      values: { rejectedBy: approver, rejectionReason: reason, rejectedAt: new Date().toISOString() },
    });
  },
};
