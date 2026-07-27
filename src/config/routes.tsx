import React from 'react';
import { VerticalId } from '../types';
import { LayoutDashboard, Wrench, Package, ShoppingCart, DollarSign, Users, Bot, MessageSquare, Briefcase, Truck, Activity, FileText, Settings, Heart, Cpu, Home as HomeIcon } from 'lucide-react';

export interface ModuleRoute {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export const getTenantModules = (verticalId: VerticalId, tenantType: string): ModuleRoute[] => {
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
  }

  return [...baseModules, ...verticalModules, ...commonModules];
};
