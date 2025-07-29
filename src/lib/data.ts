export type Memo = {
  id: number;
  title: string;
  summary: string;
  date: string;
};

export type Subtask = {
  id: number;
  title: string;
  completed: boolean;
}

export type Task = {
  id: number;
  title:string;
  completed: boolean;
  dueDate: string;
  subtasks?: Subtask[];
};

export type CalendarEvent = {
  id: number;
  title: string;
  time: string;
  location: string;
};

export type Contact = {
  id: number;
  name: string;
  title: string;
  company: string;
  email: string;
  lastContact: string; // YYYY-MM-DD
  notes: string;
}

export const mockMemos: Memo[] = [
  { id: 1, title: "Project Phoenix Kick-off", summary: "Initial meeting notes, outlined key milestones and stakeholders.", date: "2024-08-15" },
  { id: 2, title: "Q3 Marketing Strategy", summary: "Brainstormed ideas for the upcoming campaign, focus on social media.", date: "2024-08-14" },
  { id: 3, title: "Client Feedback - Acme Corp", summary: "Client is happy with the prototype but requested minor UI tweaks.", date: "2024-08-12" },
];

export const mockTasks: Task[] = [
    { 
      id: 1, 
      title: "Draft proposal for Project Apollo", 
      completed: false, 
      dueDate: "2024-08-20",
      subtasks: [
        { id: 101, title: "Research competitors", completed: true },
        { id: 102, title: "Outline proposal structure", completed: false },
        { id: 103, title: "Write first draft", completed: false },
      ] 
    },
    { id: 2, title: "Follow up with design team on mockups", completed: true, dueDate: "2024-08-18" },
    { id: 3, title: "Prepare slides for weekly sync", completed: false, dueDate: "2024-08-19" },
    { id: 4, title: "Review and approve budget for Q4", completed: false, dueDate: "2024-08-22" },
];

export const mockCalendarEvents: CalendarEvent[] = [
    { id: 1, title: "Team Stand-up", time: "9:00 AM", location: "Virtual" },
    { id: 2, title: "Design Review", time: "11:00 AM", location: "Conference Room B" },
    { id: 3, title: "1:1 with Sarah", time: "2:30 PM", location: "Virtual" },
];

export const mockContacts: Contact[] = [
  { id: 1, name: "Olivia Chen", title: "Product Manager", company: "Innovate Inc.", email: "olivia.chen@innovate.com", lastContact: "2024-07-28", notes: "Key stakeholder for Project Phoenix." },
  { id: 2, name: "Benjamin Carter", title: "Lead Developer", company: "Innovate Inc.", email: "ben.carter@innovate.com", lastContact: "2024-08-10", notes: "Discussed API integration last week." },
  { id: 3, name: "Samuel Rodriguez", title: "Marketing Director", company: "Acme Corp", email: "samuel.r@acme.com", lastContact: "2024-06-15", notes: "Needs follow-up on Q4 campaign ideas." },
  { id: 4, name: "Isabella Nguyen", title: "UX Designer", company: "Creative Solutions", email: "isabella.n@creative.co", lastContact: "2024-08-05", notes: "Provided excellent feedback on the new mockups." },
];

export const mockDataString = {
    memos: JSON.stringify(mockMemos.map(m => `${m.title}: ${m.summary}`)),
    tasks: JSON.stringify(mockTasks.map(t => `${t.title} (Due: ${t.dueDate})`)),
    calendarEvents: JSON.stringify(mockCalendarEvents.map(e => `${e.title} at ${e.time}`)),
    contacts: JSON.stringify(mockContacts.map(c => `${c.name} (${c.company}), last contacted on ${c.lastContact}`)),
}
