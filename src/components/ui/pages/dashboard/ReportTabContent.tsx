'use client';
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import { useTranslate } from '@/components/hooks/useTranslate';

// Generic item interface for assignments or exams
interface ReportItem {
  id: string;
  title: string;
  feedback: string;
  obtainedPoints: number;
  totalPoints: number;
}

// Status data interface
interface StatusData {
  name: string;
  value: number;
  color: string;
}

// Props for the ReportTabContent component
interface ReportTabContentProps {
  // Title for the left card (e.g., "Total Assignments" or "Total Exams")
  cardTitle: string;
  // Total count for display (e.g., "1")
  totalCount: string;
  // Status data for the circular chart (Pending and Submitted/Completed)
  statusData: StatusData[];
  // Label for the second status (e.g., "Submitted" or "Completed")
  statusLabel: string;
  // Note text at the bottom of left card
  noteText: string;
  // Total points
  totalPoints: number;
  // Total obtained points
  totalObtained: number;
  // Percentage
  percentage: number;
  // Section title for the list (e.g., "Assignments Points" or "Exams Points")
  sectionTitle: string;
  // List of items (assignments or exams)
  items: ReportItem[];
  // Attempted text
  attemptedText: string;
}

/**
 * ReportTabContent Component
 *
 * Reusable component for displaying report data in tabs
 * Shows circular progress charts and a list of items with points
 */
export default function ReportTabContent({
  cardTitle,
  totalCount,
  statusData,
  statusLabel,
  noteText,
  totalPoints,
  totalObtained,
  percentage,
  sectionTitle,
  items,
  attemptedText,
}: ReportTabContentProps) {
    const translate = useTranslate();
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Top Cards Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Card - Total Items */}
        <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-200 ">
          <h3 className="text-sm sm:text-base font-medium text-center text-gray-900 mb-4 sm:mb-6">
            {cardTitle} - &gt; {totalCount}
          </h3>

          {/* Full Circular Progress Chart with layered rings */}
          <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
            <div className="relative h-[180px] sm:h-[210px] mb-4 sm:mb-6 flex items-center justify-center">
              <div className="relative w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    {/* Outer ring - Pending (Red) */}
                    <Pie
                      data={[
                        { value: statusData[0].value },
                        { value: statusData[1].value },
                      ]}
                      cx="50%"
                      cy="50%"
                      startAngle={270}
                      endAngle={650}
                      innerRadius="80%"
                      outerRadius="90%"
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#EF4444" />
                      <Cell fill="#E5E7EB" />
                    </Pie>

                    {/* Inner ring - Submitted/Completed (Green) */}
                    <Pie
                      data={[
                        { value: statusData[1].value },
                        { value: statusData[0].value },
                      ]}
                      cx="50%"
                      cy="50%"
                      startAngle={270}
                      endAngle={650}
                      innerRadius="60%"
                      outerRadius="70%"
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#84CC16" />
                      <Cell fill="#E5E7EB" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Pending - Red background with red left border */}
              <div className="bg-red-50 rounded-lg p-2.5 sm:p-3 border-l-4 border-red-500 flex items-center justify-between">
                <div className="">
                  <p className="text-sm sm:text-base font-medium text-red-500">
                    {attemptedText}
                  </p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {statusData[0].value}
                  </p>
                </div>
              </div>

              {/* Submitted/Completed - Light green background */}
              <div className="bg-lime-50 rounded-lg p-2.5 sm:p-3 border-l-4 border-lime-500 flex items-center justify-between">
                <div className="">
                  <p className="text-sm sm:text-base font-medium text-lime-600">
                    {statusLabel}
                  </p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {statusData[1].value}
                  </p>
                </div>
              </div>
            </div>

            {/* Note */}
            <p className="text-xs sm:text-sm font-normal text-gray-500 mt-3 sm:mt-4">
              {noteText}
            </p>
          </div>
        </div>

        {/* Right Card - Total Points */}
        <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-200">
          <h3 className="text-sm sm:text-base font-medium text-center text-gray-900 mb-4 sm:mb-6">
            {translate('totalPoints')} - &gt; {totalPoints}
          </h3>

          {/* Circular Progress Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Obtained Points Chart */}
            <div className="text-center bg-white rounded-[12px] p-4 sm:p-6 border border-gray-200 flex flex-col items-center">
              <h4 className="text-lg sm:text-xl font-bold text-gray-700 mb-2 sm:mb-3">
                {translate('obtainedPoints')}
              </h4>
              <div className="w-[200px] sm:w-[250px] h-[200px] sm:h-[250px] relative">
                {/* Thin background trail circle */}
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="95%"
                    barSize={5}
                    data={[{ value: 100, fill: '#D1FAE5' }]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      angleAxisId={0}
                      tick={false}
                    />
                    <RadialBar
                      dataKey="value"
                      background={false}
                      isAnimationActive={false}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                {/* Thick progress bar on top */}
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="100%"
                      barSize={12}
                      data={[
                        {
                          value: (totalObtained / totalPoints) * 100,
                          fill: '#14B8A6',
                        },
                      ]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        background={false}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-3xl sm:text-4xl font-bold">
                    {totalObtained}
                  </p>
                </div>
              </div>
            </div>

            {/* Percentage Chart */}
            <div className="text-center bg-white rounded-[12px] p-4 sm:p-6 border border-gray-200 flex flex-col items-center">
              <h4 className="text-lg sm:text-xl font-bold text-gray-700 mb-2 sm:mb-3">
                {translate('percentage')}
              </h4>
              <div className="w-[200px] sm:w-[250px] h-[200px] sm:h-[250px] relative">
                {/* Thin background trail circle */}
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="95%"
                    barSize={5}
                    data={[{ value: 100, fill: '#FED7AA' }]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      angleAxisId={0}
                      tick={false}
                    />
                    <RadialBar
                      dataKey="value"
                      background={false}
                      isAnimationActive={false}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                {/* Thick progress bar on top */}
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="100%"
                      barSize={12}
                      data={[{ value: percentage, fill: '#EA580C' }]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        background={false}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                    {percentage.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Points Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-200 bg-[var(--light-primary-color)]">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">
            {sectionTitle}
          </h3>
        </div>

        {/* Items List */}
        <div className="divide-y divide-gray-200">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3 sm:p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                {/* Item Info */}
                <div className="flex-1">
                  <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {item.feedback}
                  </p>
                </div>

                {/* Points Badge */}
                <div className="sm:ml-4 bg-gray-100 rounded-lg px-3 sm:px-4 py-2 text-center min-w-[100px] sm:min-w-[120px] self-start">
                  <p className="text-xs sm:text-sm">
                    {translate('points')} -{' '}
                    <span className="font-semibold text-gray-900">
                      {item.obtainedPoints}
                    </span>{' '}
                    / {item.totalPoints}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
