import React from 'react';
import { VerticalId } from '../types';
import {
  Activity,
  Archive,
  BadgeDollarSign,
  Banknote,
  Bell,
  Bot,
  Briefcase,
  Building2,
  CalendarClock,
  Car,
  ClipboardCheck,
  ClipboardList,
  ClipboardSignature,
  ContactRound,
  Cpu,
  CreditCard,
  DollarSign,
  FileChartColumn,
  FileClock,
  FileText,
  Gauge,
  GraduationCap,
  Heart,
  History,
  Home as HomeIcon,
  LayoutDashboard,
  MessageSquare,
  Megaphone,
  MapPin,
  Package,
  PackageCheck,
  PackageOpen,
  ReceiptText,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Siren,
  Truck,
  UserCog,
  UserRound,
  Users,
  WalletCards,
  Warehouse,
  Wrench,
  Zap,
} from 'lucide-react';

export interface ModuleRoute {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export interface ModuleSection {
  label: string;
  modules: ModuleRoute[];
}

export const getTenantModules = (verticalId: VerticalId, _tenantType: string): ModuleRoute[] => {
  const baseModules: ModuleRoute[] = [
    { name: 'Command Center', path: '', icon: <LayoutDashboard size={18} /> },
  ];

  const commonModules: ModuleRoute[] = [
    { name: 'Finance', path: 'finance', icon: <DollarSign size={18} /> },
    { name: 'HR & Workforce', path: 'hr', icon: <Users size={18} /> },
    { name: 'Marketing', path: 'marketing', icon: <Activity size={18} /> },
    { name: 'Reports & Audit', path: 'reports', icon: <FileText size={18} /> },
    { name: 'Settings', path: 'settings', icon: <Settings size={18} /> },
  ];

  let verticalModules: ModuleRoute[] = [];

  if (verticalId === 'autos') {
    verticalModules = [
      { name: 'FixBot', path: 'fixbot', icon: <Bot size={18} /> },
      { name: 'Workshop Board', path: 'workshop', icon: <Wrench size={18} /> },
      { name: 'Vehicles & Fleet', path: 'vehicles', icon: <Briefcase size={18} /> },
      { name: 'Customers & CRM', path: 'crm', icon: <Heart size={18} /> },
      { name: 'Inventory & Parts', path: 'inventory', icon: <Package size={18} /> },
      { name: 'Sales & POS', path: 'sales', icon: <ShoppingCart size={18} /> },
      { name: 'BLKK Operations', path: 'blkk-ops', icon: <MessageSquare size={18} /> },
    ];
  } else if (verticalId === 'merchant') {
    verticalModules = [
      { name: 'Catalog & Products', path: 'catalog', icon: <Package size={18} /> },
      { name: 'Inventory', path: 'inventory', icon: <Wrench size={18} /> }, // Using Wrench just as placeholder
      { name: 'Orders & Fulfillment', path: 'orders', icon: <ShoppingCart size={18} /> },
      { name: 'Customers & CRM', path: 'crm', icon: <Heart size={18} /> },
      { name: 'BLKK Operations', path: 'blkk-ops', icon: <MessageSquare size={18} /> },
    ];
  } else if (verticalId === 'estate') {
    verticalModules = [
      { name: 'Listings', path: 'listings', icon: <HomeIcon size={18} /> },
      { name: 'Leads & Enquiries', path: 'leads', icon: <Users size={18} /> },
      { name: 'Inspections', path: 'inspections', icon: <Activity size={18} /> },
      { name: 'Leases & Escrow', path: 'leases', icon: <FileText size={18} /> },
      { name: 'Maintenance', path: 'maintenance', icon: <Wrench size={18} /> },
      { name: 'BLKK Operations', path: 'blkk-ops', icon: <MessageSquare size={18} /> },
    ];
  } else if (verticalId === 'farmers') {
    verticalModules = [
      { name: 'Farm Plots & Yield', path: 'plots', icon: <Activity size={18} /> },
      { name: 'Livestock', path: 'livestock', icon: <Heart size={18} /> },
      { name: 'Inventory & Aggregation', path: 'inventory', icon: <Package size={18} /> },
      { name: 'Orders', path: 'orders', icon: <ShoppingCart size={18} /> },
      { name: 'Logistics', path: 'logistics', icon: <Truck size={18} /> },
      { name: 'Credit', path: 'credit', icon: <DollarSign size={18} /> },
      { name: 'BLKK Operations', path: 'blkk-ops', icon: <MessageSquare size={18} /> },
    ];
  } else if (verticalId === 'label') {
    verticalModules = [
      { name: 'Collections', path: 'collections', icon: <Package size={18} /> },
      { name: 'Design & Production', path: 'production', icon: <Cpu size={18} /> },
      { name: 'Inventory', path: 'inventory', icon: <Wrench size={18} /> },
      { name: 'Orders & Fulfillment', path: 'orders', icon: <ShoppingCart size={18} /> },
      { name: 'Franchise Ops', path: 'franchise', icon: <Briefcase size={18} /> },
      { name: 'BLKK Operations', path: 'blkk-ops', icon: <MessageSquare size={18} /> },
    ];
  } else if (verticalId === 'gold') {
      verticalModules = [
          { name: 'Inventory & Lots', path: 'inventory', icon: <Package size={18} /> },
          { name: 'Orders', path: 'orders', icon: <ShoppingCart size={18} /> },
          { name: 'Logistics & Vault', path: 'vault', icon: <Briefcase size={18} /> },
          { name: 'BLKK Operations', path: 'blkk-ops', icon: <MessageSquare size={18} /> },
      ]
  } else if (verticalId === 'agents') {
    verticalModules = [
      { name: 'Assignments', path: 'assignments', icon: <Briefcase size={18} /> },
      { name: 'Field Visits', path: 'visits', icon: <Activity size={18} /> },
      { name: 'Verification Queue', path: 'verification', icon: <Shield size={18} /> },
      { name: 'Listings Capture', path: 'listings', icon: <Package size={18} /> },
      { name: 'Merchant Onboarding', path: 'onboarding', icon: <Users size={18} /> },
      { name: 'Collections', path: 'collections', icon: <DollarSign size={18} /> },
      { name: 'Commissions', path: 'commissions', icon: <ShoppingCart size={18} /> },
      { name: 'Offline Sync', path: 'sync', icon: <Cpu size={18} /> },
      { name: 'Quality & Risk', path: 'quality', icon: <Shield size={18} /> },
    ];
  }

  return [...baseModules, ...verticalModules, ...commonModules];
};

/**
 * AGL is the reference operational tenant. These routes deliberately exclude a
 * dashboard and BI: the sibling Analytics application owns those concerns.
 */
export const getAglErpModuleSections = (): ModuleSection[] => [
  {
    label: 'Service operations',
    modules: [
      { name: 'FixBot', path: 'fixbot', icon: <Bot size={18} /> },
      { name: 'Customer intake', path: 'intake', icon: <ContactRound size={18} /> },
      { name: 'Appointments', path: 'appointments', icon: <CalendarClock size={18} /> },
      { name: 'Job board', path: 'job-board', icon: <Gauge size={18} /> },
      { name: 'Work orders', path: 'work-orders', icon: <ClipboardList size={18} /> },
      { name: 'Vehicles', path: 'vehicles', icon: <Car size={18} /> },
      { name: 'Mechanic tracker', path: 'mechanics', icon: <Wrench size={18} /> },
      { name: 'Inspections & QC', path: 'inspections', icon: <ClipboardCheck size={18} /> },
      { name: 'Recalls', path: 'recalls', icon: <Siren size={18} /> },
      { name: 'Complaints', path: 'complaints', icon: <MessageSquare size={18} /> },
    ],
  },
  {
    label: 'Inventory & procurement',
    modules: [
      { name: 'Parts catalogue', path: 'parts', icon: <Package size={18} /> },
      { name: 'Stock ledger', path: 'stock-ledger', icon: <Warehouse size={18} /> },
      { name: 'Stock movements', path: 'stock-movements', icon: <PackageOpen size={18} /> },
      { name: 'Purchase orders', path: 'purchase-orders', icon: <PackageCheck size={18} /> },
      { name: 'Suppliers', path: 'suppliers', icon: <Building2 size={18} /> },
    ],
  },
  {
    label: 'Sales & customers',
    modules: [
      { name: 'New sale', path: 'new-sale', icon: <ShoppingCart size={18} /> },
      { name: 'Sales ledger', path: 'sales-ledger', icon: <ReceiptText size={18} /> },
      { name: 'Customers', path: 'customers', icon: <Users size={18} /> },
      { name: 'Quotations', path: 'quotations', icon: <FileText size={18} /> },
      { name: 'Invoices', path: 'invoices', icon: <ReceiptText size={18} /> },
      { name: 'Payments', path: 'payments', icon: <CreditCard size={18} /> },
      { name: 'Subscriptions', path: 'subscriptions', icon: <CalendarClock size={18} /> },
    ],
  },
  {
    label: 'Marketing',
    modules: [
      { name: 'Campaigns', path: 'campaigns', icon: <Megaphone size={18} /> },
      { name: 'Promotions', path: 'promotions', icon: <BadgeDollarSign size={18} /> },
      { name: 'Leads', path: 'leads', icon: <ContactRound size={18} /> },
      { name: 'Marketing spend', path: 'marketing-spend', icon: <DollarSign size={18} /> },
    ],
  },
  {
    label: 'Finance',
    modules: [
      { name: 'Profit & loss', path: 'profit-loss', icon: <FileChartColumn size={18} /> },
      { name: 'Expenses', path: 'expenses', icon: <BadgeDollarSign size={18} /> },
      { name: 'Petty cash', path: 'petty-cash', icon: <WalletCards size={18} /> },
      { name: 'Creditors', path: 'creditors', icon: <Banknote size={18} /> },
      { name: 'Debtors', path: 'debtors', icon: <DollarSign size={18} /> },
      { name: 'Reconciliation', path: 'reconciliation', icon: <ShieldCheck size={18} /> },
    ],
  },
  {
    label: 'People',
    modules: [
      { name: 'Employees', path: 'employees', icon: <Users size={18} /> },
      { name: 'Departments', path: 'departments', icon: <Building2 size={18} /> },
      { name: 'Attendance', path: 'attendance', icon: <FileClock size={18} /> },
      { name: 'Leave & overtime', path: 'leave', icon: <CalendarClock size={18} /> },
      { name: 'Payroll', path: 'payroll', icon: <Banknote size={18} /> },
      { name: 'Payslips', path: 'payslips', icon: <ReceiptText size={18} /> },
      { name: 'Performance', path: 'performance', icon: <Activity size={18} /> },
      { name: 'Schedules', path: 'schedules', icon: <CalendarClock size={18} /> },
      { name: 'Training', path: 'training', icon: <GraduationCap size={18} /> },
      { name: 'Contracts', path: 'contracts', icon: <ClipboardSignature size={18} /> },
      { name: 'Employee cases', path: 'employee-cases', icon: <ShieldCheck size={18} /> },
    ],
  },
  {
    label: 'Management & records',
    modules: [
      { name: 'Manager desk', path: 'manager-desk', icon: <UserCog size={18} /> },
      { name: 'Documents', path: 'documents', icon: <FileText size={18} /> },
      { name: 'Business reports', path: 'business-reports', icon: <FileChartColumn size={18} /> },
      { name: 'Managerial reports', path: 'managerial-reports', icon: <Briefcase size={18} /> },
      { name: 'Forms', path: 'forms', icon: <ClipboardSignature size={18} /> },
      { name: 'Data archives', path: 'archives', icon: <Archive size={18} /> },
      { name: 'Exports', path: 'exports', icon: <DownloadIcon /> },
      { name: 'Notifications', path: 'notifications', icon: <Bell size={18} /> },
      { name: 'Audit log', path: 'audit-log', icon: <History size={18} /> },
    ],
  },
  {
    label: 'Administration',
    modules: [
      { name: 'Roles & permissions', path: 'roles', icon: <Shield size={18} /> },
      { name: 'Users', path: 'users', icon: <UserRound size={18} /> },
      { name: 'Branches & locations', path: 'locations', icon: <MapPin size={18} /> },
      { name: 'Integrations', path: 'integrations', icon: <Zap size={18} /> },
      { name: 'ERP settings', path: 'settings', icon: <Settings size={18} /> },
    ],
  },
];

const DownloadIcon = () => <FileText size={18} />;
