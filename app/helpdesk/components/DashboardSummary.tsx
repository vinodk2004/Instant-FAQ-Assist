import React from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  ClockIcon, 
  CheckCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface DashboardSummaryProps {
  totalQueries: number;
  pendingQueries: number;
  resolvedQueries: number;
  totalUsers: number;
}

export default function DashboardSummary({ 
  totalQueries, 
  pendingQueries, 
  resolvedQueries,
  totalUsers
}: DashboardSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Queries Card */}
      <div className="bg-gray-800/70 rounded-xl p-5 border border-gray-700 hover:border-purple-500/50 transition-all group">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Total Queries</h3>
            <p className="text-3xl font-bold text-white">{totalQueries}</p>
          </div>
          <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Pending Queries Card */}
      <div className="bg-gray-800/70 rounded-xl p-5 border border-gray-700 hover:border-yellow-500/50 transition-all group">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Pending</h3>
            <p className="text-3xl font-bold text-white">{pendingQueries}</p>
          </div>
          <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
            <ClockIcon className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Resolved Queries Card */}
      <div className="bg-gray-800/70 rounded-xl p-5 border border-gray-700 hover:border-green-500/50 transition-all group">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Resolved</h3>
            <p className="text-3xl font-bold text-white">{resolvedQueries}</p>
          </div>
          <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
          </div>
        </div>
      </div>

      {/* Total Users Card */}
      <div className="bg-gray-800/70 rounded-xl p-5 border border-gray-700 hover:border-blue-500/50 transition-all group">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Total Users</h3>
            <p className="text-3xl font-bold text-white">{totalUsers}</p>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
            <UserIcon className="w-6 h-6 text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
} 