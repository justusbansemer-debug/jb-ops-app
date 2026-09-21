"use client";

import { ICONS } from "./SideMenuIcons";

// The grouped link lists the menu drawer renders.

const GROUPS = [
  {
    key: "create",
    label: "Create",
    icon: ICONS.plus,
    accent: true,
    items: [
      { href: "/quotes#add", label: "New estimate" },
      { href: "/customers#add", label: "New customer" },
      { href: "/jobs#add", label: "New job" },
      { href: "/invoices#add", label: "New invoice" },
    ],
  },
  {
    key: "crm",
    label: "Customers",
    icon: ICONS.people,
    items: [
      { href: "/customers", label: "All customers" },
      { href: "/contacts", label: "Contact list" },
    ],
  },
  {
    key: "work",
    label: "Work",
    icon: ICONS.tools,
    items: [
      { href: "/today", label: "Today's jobs" },
      { href: "/jobs", label: "All jobs" },
      { href: "/menu", label: "Measure a property" },
    ],
  },
  {
    key: "money",
    label: "Money",
    icon: ICONS.money,
    items: [
      { href: "/quotes", label: "Estimates" },
      { href: "/invoices", label: "Invoices" },
    ],
  },
  {
    key: "setup",
    label: "Settings",
    icon: ICONS.gear,
    items: [
      { href: "/settings/services", label: "My services" },
      { href: "/settings/business", label: "Business info" },
      { href: "/settings/terms", label: "Terms & conditions" },
      { href: "/settings/calendar", label: "Calendar sync" },
      { href: "/settings", label: "All settings" },
      { href: "/menu", label: "Everything menu" },
    ],
  },
];

export { GROUPS };
