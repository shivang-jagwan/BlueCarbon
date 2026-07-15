'use client';

import dynamic from 'next/dynamic';

export const LineChart = dynamic(() => import('recharts').then((mod) => mod.LineChart), { ssr: false });
export const AreaChart = dynamic(() => import('recharts').then((mod) => mod.AreaChart), { ssr: false });
// @ts-expect-error dynamic import type mismatch with recharts sub-component
export const Area = dynamic(() => import('recharts').then((mod) => mod.Area), { ssr: false });
export const BarChart = dynamic(() => import('recharts').then((mod) => mod.BarChart), { ssr: false });
// @ts-expect-error dynamic import type mismatch with recharts sub-component
export const Bar = dynamic(() => import('recharts').then((mod) => mod.Bar), { ssr: false });
export const PieChart = dynamic(() => import('recharts').then((mod) => mod.PieChart), { ssr: false });
// @ts-expect-error dynamic import type mismatch with recharts sub-component
export const Pie = dynamic(() => import('recharts').then((mod) => mod.Pie), { ssr: false });
export const Cell = dynamic(() => import('recharts').then((mod) => mod.Cell), { ssr: false });
// @ts-expect-error dynamic import type mismatch with recharts sub-component
export const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
// @ts-expect-error dynamic import type mismatch with recharts sub-component
export const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
// @ts-expect-error dynamic import type mismatch with recharts sub-component
export const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });
// @ts-expect-error dynamic import type mismatch with recharts sub-component
export const Legend = dynamic(() => import('recharts').then((mod) => mod.Legend), { ssr: false });
export const ResponsiveContainer = dynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer), { ssr: false });
