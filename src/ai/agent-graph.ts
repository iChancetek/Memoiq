
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, MessagesState, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { format } from "date-fns";
import { getServerFirebase } from "@/firebase/server";
import { sendGoogleEmail, createGoogleEvent } from "@/services/google-sync";
import { sendMicrosoftEmail, createMicrosoftEvent } from "@/services/microsoft-sync";

const { firestore: db } = getServerFirebase();

// --- TOOLS DEFINITION ---

export const getTasksTool = new DynamicStructuredTool({
    name: "getTasks",
    description: "Retrieve a list of the user's tasks. Can be filtered by status (e.g., 'completed', 'pending').",
    schema: z.object({
        userId: z.string().describe("The user's unique ID."),
        status: z.enum(['completed', 'pending']).optional().describe('The status of tasks to retrieve.'),
    }),
    func: async ({ userId, status }) => {
        let q: any = db.collection(`users/${userId}/tasks`);
        if (status) {
            q = q.where('completed', '==', status === 'completed');
        }
        const snapshot = await q.get();
        return JSON.stringify(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    }
});

export const getCalendarEventsTool = new DynamicStructuredTool({
    name: "getCalendarEvents",
    description: "Retrieve calendar events or appointments for a given date range. Default is today.",
    schema: z.object({
        userId: z.string().describe("The user's unique ID."),
        startDate: z.string().optional().describe("Start date in YYYY-MM-DD format."),
        endDate: z.string().optional().describe("End date in YYYY-MM-DD format."),
    }),
    func: async ({ userId, startDate, endDate }) => {
        const start = startDate ? new Date(startDate) : new Date();
        start.setHours(0, 0, 0, 0);
        const end = endDate ? new Date(endDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
        end.setHours(23, 59, 59, 999);
        
        const snapshot = await db.collection(`users/${userId}/events`)
            .where('startTime', '>=', start)
            .where('startTime', '<=', end)
            .get();

        return JSON.stringify(snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                startTime: data.startTime.toDate(),
                endTime: data.endTime.toDate(),
            };
        }));
    }
});

export const getEmailsTool = new DynamicStructuredTool({
    name: "getEmails",
    description: "Retrieve a list of the user's recent emails from their integrated accounts (Gmail/Outlook).",
    schema: z.object({
        userId: z.string().describe("The user's unique ID."),
        count: z.number().optional().default(10).describe('The number of emails to retrieve.'),
    }),
    func: async ({ userId, count }) => {
        const snapshot = await db.collection(`users/${userId}/emails`)
            .orderBy('receivedAt', 'desc')
            .limit(count || 10)
            .get();
        return JSON.stringify(snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                from: data.from,
                subject: data.subject,
                snippet: data.snippet,
                receivedAt: data.receivedAt?.toDate(),
                provider: data.provider,
                accountEmail: data.accountEmail,
            };
        }));
    }
});

export const createTaskTool = new DynamicStructuredTool({
    name: "createTask",
    description: "Create a new task for the user.",
    schema: z.object({
        userId: z.string().describe("The user's unique ID."),
        title: z.string().describe("The title of the task."),
        dueDate: z.string().optional().describe("Due date in YYYY-MM-DD format."),
        priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
    }),
    func: async ({ userId, title, dueDate, priority }) => {
        const taskRef = db.collection(`users/${userId}/tasks`).doc();
        const taskData = {
            title,
            dueDate: dueDate ? new Date(dueDate) : null,
            priority,
            completed: false,
            createdAt: new Date(),
        };
        await taskRef.set(taskData);
        return `Successfully created task: ${title} (ID: ${taskRef.id})`;
    }
});

export const createEventTool = new DynamicStructuredTool({
    name: "createEvent",
    description: "Create a new calendar event. Supports both Google and Microsoft 365.",
    schema: z.object({
        userId: z.string().describe("The user's unique ID."),
        title: z.string().describe("The title of the event."),
        startTime: z.string().describe("Start time in ISO format (e.g. 2024-03-19T10:00:00)"),
        endTime: z.string().describe("End time in ISO format."),
        accountType: z.enum(['google', 'microsoft']).describe("The type of account to create the event in."),
        accountEmail: z.string().describe("The email of the account to use."),
    }),
    func: async ({ userId, title, startTime, endTime, accountType, accountEmail }) => {
        try {
            if (accountType === 'microsoft') {
                await createMicrosoftEvent(userId, accountEmail, {
                    subject: title,
                    start: { dateTime: startTime, timeZone: 'UTC' },
                    end: { dateTime: endTime, timeZone: 'UTC' },
                });
                return `Successfully created Microsoft 365 event: ${title}`;
            } else {
                await createGoogleEvent(userId, accountEmail, {
                    title,
                    startTime: new Date(startTime),
                    endTime: new Date(endTime),
                });
                return `Successfully created Google Calendar event: ${title}`;
            }
        } catch (error: any) {
            return `Failed to create event: ${error.message}`;
        }
    }
});

export const sendEmailTool = new DynamicStructuredTool({
    name: "sendEmail",
    description: "Send an email to a recipient. Supports both Gmail and Microsoft 365.",
    schema: z.object({
        userId: z.string().describe("The user's unique ID."),
        to: z.string().describe("The recipient's email address."),
        subject: z.string().describe("The subject of the email."),
        body: z.string().describe("The HTML or text content of the email."),
        accountType: z.enum(['google', 'microsoft']).describe("The type of account to use."),
        accountEmail: z.string().describe("The email of the account to send from."),
    }),
    func: async ({ userId, to, subject, body, accountType, accountEmail }) => {
        try {
            if (accountType === 'microsoft') {
                await sendMicrosoftEmail(userId, accountEmail, to, subject, body);
                return `Successfully sent email via Microsoft 365 from ${accountEmail}`;
            } else {
                await sendGoogleEmail(userId, accountEmail, to, subject, body);
                return `Successfully sent email via Gmail from ${accountEmail}`;
            }
        } catch (error: any) {
            return `Failed to send email: ${error.message}`;
        }
    }
});

export const searchContactsTool = new DynamicStructuredTool({
    name: "searchContacts",
    description: "Search for a contact by name or email.",
    schema: z.object({
        userId: z.string().describe("The user's unique ID."),
        query: z.string().describe("The name or email to search for."),
    }),
    func: async ({ userId, query }) => {
        const snapshot = await db.collection(`users/${userId}/contacts`)
            .get();
        const contacts = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        const filtered = contacts.filter((c: any) => 
            c.displayName?.toLowerCase().includes(query.toLowerCase()) || 
            c.email?.toLowerCase().includes(query.toLowerCase())
        );
        return JSON.stringify(filtered);
    }
});

// --- GRAPH DEFINITION ---

const tools = [
    getTasksTool, 
    getCalendarEventsTool, 
    getEmailsTool, 
    createTaskTool, 
    createEventTool,
    sendEmailTool,
    searchContactsTool
];
const toolNode = new ToolNode(tools);

// Map GPT-5.4 to gpt-4o as requested for "enhanced intelligence"
const model = new ChatOpenAI({
    modelName: "gpt-5.4",
    temperature: 0,
}).bindTools(tools);

function shouldContinue(state: MessagesState) {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
        return "tools";
    }
    return END;
}

async function callModel(state: MessagesState) {
    const response = await model.invoke(state.messages);
    return { messages: [response] };
}

const workflow = new StateGraph(MessagesState)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent");

export const agentApp = workflow.compile();

/**
 * Helper to run the agent.
 */
export async function runAgent(messages: any[], userId: string) {
    const systemMessage = {
        role: "system",
        content: `You are iSkylar (v5.4 Agentic Edition), a friendly and highly intelligent AI Assistant for the MemoIQ platform.
        
        Your Mission: Help the user manage their tasks, calendar, and emails with autonomous intelligence.
        
        Today's date is ${format(new Date(), 'EEEE, MMMM d, yyyy')}.
        User ID: ${userId}. You must use this ID for all tool calls.
        
        You have direct access to:
        1. Google Mail/Calendar
        2. Microsoft 365 (M365) accounts
        3. Real-time MemoIQ data (Tasks, Memos, MediScribe)
        
        Think before you act. If you need information, use your tools.`
    };

    const finalMessages = [systemMessage, ...messages];
    const result = await agentApp.invoke({ messages: finalMessages });
    const lastMessage = result.messages[result.messages.length - 1];
    
    return {
        text: typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content)
    };
}
