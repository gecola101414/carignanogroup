#!/bin/bash
sed -i 's/          {tabs.map((tab) => {/          {tabs.filter(t => userRole === "admin" || t.id !== "financials").map((tab) => {/g' src/components/NavigationTabs.tsx
