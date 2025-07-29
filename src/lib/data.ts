export type Memo = {
  id: number;
  title: string;
  summary: string;
  date: string;
};

export type Task = {
  id: number;
  title:string;
  completed: boolean;
  dueDate: string;
};

export type CalendarEvent = {
  id: number;
  title: string;
  time: string;
  location: string;
};

export const mockMemos: Memo[] = [
  { id: 1, title: "Project Phoenix Kick-off", summary: "Initial meeting notes, outlined key milestones and stakeholders.", date: "2024-08-15" },
  { id: 2, title: "Q3 Marketing Strategy", summary: "Brainstormed ideas for the upcoming campaign, focus on social media.", date: "2024-08-14" },
  { id: 3, title: "Client Feedback - Acme Corp", summary: "Client is happy with the prototype but requested minor UI tweaks.", date: "2024-08-12" },
];

export const mockTasks: Task[] = [
    { id: 1, title: "Draft proposal for Project Apollo", completed: false, dueDate: "2024-08-20" },
    { id: 2, title: "Follow up with design team on mockups", completed: true, dueDate: "2024-08-18" },
    { id: 3, title: "Prepare slides for weekly sync", completed: false, dueDate: "2024-08-19" },
    { id: 4, title: "Review and approve budget for Q4", completed: false, dueDate: "2024-08-22" },
];

export const mockCalendarEvents: CalendarEvent[] = [
    { id: 1, title: "Team Stand-up", time: "9:00 AM", location: "Virtual" },
    { id: 2, title: "Design Review", time: "11:00 AM", location: "Conference Room B" },
    { id: 3, title: "1:1 with Sarah", time: "2:30 PM", location: "Virtual" },
];

export const mockDataString = {
    memos: JSON.stringify(mockMemos.map(m => `${m.title}: ${m.summary}`)),
    tasks: JSON.stringify(mockTasks.map(t => `${t.title} (Due: ${t.dueDate})`)),
    calendarEvents: JSON.stringify(mockCalendarEvents.map(e => `${e.title} at ${e.time}`)),
}
