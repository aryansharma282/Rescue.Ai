/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  duration?: string;
  startTime?: string;
  endTime?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // ISO String or Date representation
  priority: TaskPriority;
  completed: boolean;
  createdAt: string;
  category?: string;
  subTasks?: SubTask[];
  reminderMinutes?: number; // Minutes before due date to alert
}

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind hex color or class name
}

export interface Habit {
  id: string;
  name: string;
  completed: boolean;
  startTime?: string;
  endTime?: string;
  alarmEnabled?: boolean;
}
