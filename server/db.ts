// Simple in-memory storage for Vercel deployment (no database required)
import type {
  User,
  InsertUser,
  Category,
  InsertCategory,
  Document,
  InsertDocument,
  File,
  InsertFile,
  BlogPost,
  InsertBlogPost,
  Comment,
  InsertComment,
  Like,
  InsertLike,
  Notification,
  InsertNotification,
  HealthRecord,
  InsertHealthRecord,
  Transaction,
  InsertTransaction,
  Balance,
  InsertBalance,
} from "../drizzle/schema";

// In-memory storage
let users: User[] = [];
let categories: Category[] = [
  {
    id: 1,
    name: "技术",
    slug: "tech",
    description: "技术相关文章",
    color: "#3b82f6",
    createdAt: new Date(),
  },
  {
    id: 2,
    name: "生活",
    slug: "life",
    description: "生活随笔",
    color: "#10b981",
    createdAt: new Date(),
  },
];
let documents: Document[] = [];
let files: File[] = [];
let blogPosts: BlogPost[] = [];
let comments: Comment[] = [];
let likes: Like[] = [];
let notifications: Notification[] = [];
let healthRecords: HealthRecord[] = [];
let transactions: Transaction[] = [];
let balances: Balance[] = [];

let userIdCounter = 1;
let categoryIdCounter = 3;
let documentIdCounter = 1;
let fileIdCounter = 1;
let blogPostIdCounter = 1;
let commentIdCounter = 1;
let likeIdCounter = 1;
let notificationIdCounter = 1;
let healthRecordIdCounter = 1;
let transactionIdCounter = 1;
let balanceIdCounter = 1;

// Create a default user for demo purposes
const defaultUser: User = {
  id: userIdCounter++,
  openId: "demo_user",
  name: "Demo User",
  email: "demo@example.com",
  loginMethod: null,
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};
users.push(defaultUser);

// ========== User Operations ==========
export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  return users.find((u) => u.openId === openId);
}

export async function upsertUser(data: Partial<InsertUser> & { openId: string }): Promise<void> {
  const existing = users.find((u) => u.openId === data.openId);
  if (existing) {
    Object.assign(existing, {
      ...data,
      updatedAt: new Date(),
    });
    return;
  }

  const newUser: User = {
    id: userIdCounter++,
    openId: data.openId,
    name: data.name ?? null,
    email: data.email ?? null,
    loginMethod: data.loginMethod ?? null,
    role: data.role ?? "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: data.lastSignedIn ?? new Date(),
  };
  users.push(newUser);
}

// ========== Category Operations ==========
export async function getAllCategories() {
  return categories;
}

export async function getCategoryById(id: number) {
  return categories.find((c) => c.id === id);
}

export async function createCategory(data: InsertCategory) {
  const newCategory: Category = {
    id: categoryIdCounter++,
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    color: data.color ?? "#ef4444",
    createdAt: new Date(),
  };
  categories.push(newCategory);
  return { insertId: newCategory.id };
}

// ========== Document Operations ==========
export async function getDocumentsByAuthor(authorId: number) {
  return documents
    .filter((d) => d.authorId === authorId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getDocumentById(id: number) {
  return documents.find((d) => d.id === id);
}

export async function createDocument(data: InsertDocument) {
  const newDocument: Document = {
    id: documentIdCounter++,
    title: data.title,
    content: data.content,
    format: data.format ?? "markdown",
    categoryId: data.categoryId ?? null,
    authorId: data.authorId,
    tags: data.tags ?? null,
    isPublic: data.isPublic ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  documents.push(newDocument);
  return { insertId: newDocument.id };
}

export async function updateDocument(id: number, data: Partial<InsertDocument>) {
  const doc = documents.find((d) => d.id === id);
  if (doc) {
    Object.assign(doc, {
      ...data,
      updatedAt: new Date(),
    });
  }
  return { affectedRows: doc ? 1 : 0 };
}

export async function deleteDocument(id: number) {
  const index = documents.findIndex((d) => d.id === id);
  if (index !== -1) {
    documents.splice(index, 1);
  }
  return { affectedRows: index !== -1 ? 1 : 0 };
}

export async function searchDocuments(query: string, authorId?: number) {
  let result = documents;
  if (authorId) {
    result = result.filter((d) => d.authorId === authorId);
  }
  return result
    .filter((d) => d.title.includes(query) || d.content.includes(query))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

// ========== File Operations ==========
export async function getFilesByUploader(uploaderId: number) {
  return files
    .filter((f) => f.uploaderId === uploaderId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getFileById(id: number) {
  return files.find((f) => f.id === id);
}

export async function createFile(data: InsertFile) {
  const newFile: File = {
    id: fileIdCounter++,
    filename: data.filename,
    fileKey: data.fileKey,
    url: data.url,
    mimeType: data.mimeType ?? null,
    size: data.size ?? null,
    uploaderId: data.uploaderId,
    documentId: data.documentId ?? null,
    createdAt: new Date(),
  };
  files.push(newFile);
  return { insertId: newFile.id };
}

export async function deleteFile(id: number) {
  const index = files.findIndex((f) => f.id === id);
  if (index !== -1) {
    files.splice(index, 1);
  }
  return { affectedRows: index !== -1 ? 1 : 0 };
}

// ========== Blog Post Operations ==========
export async function getAllBlogPosts(includeUnpublished: boolean = false) {
  let result = blogPosts;
  if (!includeUnpublished) {
    result = result.filter((p) => p.isPublished);
  }
  return result.sort((a, b) => {
    const aTime = a.publishedAt?.getTime() ?? a.createdAt.getTime();
    const bTime = b.publishedAt?.getTime() ?? b.createdAt.getTime();
    return bTime - aTime;
  });
}

export async function getBlogPostsByCategory(categoryId: number) {
  return blogPosts
    .filter((p) => p.categoryId === categoryId && p.isPublished)
    .sort((a, b) => {
      const aTime = a.publishedAt?.getTime() ?? a.createdAt.getTime();
      const bTime = b.publishedAt?.getTime() ?? b.createdAt.getTime();
      return bTime - aTime;
    });
}

export async function getBlogPostBySlug(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}

export async function getBlogPostById(id: number) {
  return blogPosts.find((p) => p.id === id);
}

export async function createBlogPost(data: InsertBlogPost) {
  const newPost: BlogPost = {
    id: blogPostIdCounter++,
    title: data.title,
    slug: data.slug,
    content: data.content,
    excerpt: data.excerpt ?? null,
    coverImage: data.coverImage ?? null,
    categoryId: data.categoryId ?? null,
    authorId: data.authorId,
    tags: data.tags ?? null,
    viewCount: 0,
    isPublished: data.isPublished ?? false,
    publishedAt: data.publishedAt ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  blogPosts.push(newPost);
  return { insertId: newPost.id };
}

export async function updateBlogPost(id: number, data: Partial<InsertBlogPost>) {
  const post = blogPosts.find((p) => p.id === id);
  if (post) {
    Object.assign(post, {
      ...data,
      updatedAt: new Date(),
    });
  }
  return { affectedRows: post ? 1 : 0 };
}

export async function deleteBlogPost(id: number) {
  const index = blogPosts.findIndex((p) => p.id === id);
  if (index !== -1) {
    blogPosts.splice(index, 1);
  }
  return { affectedRows: index !== -1 ? 1 : 0 };
}

export async function incrementBlogPostViews(id: number) {
  const post = blogPosts.find((p) => p.id === id);
  if (post) {
    post.viewCount++;
  }
  return { affectedRows: post ? 1 : 0 };
}

export async function searchBlogPosts(query: string) {
  return blogPosts
    .filter((p) => p.isPublished && (p.title.includes(query) || p.content.includes(query)))
    .sort((a, b) => {
      const aTime = a.publishedAt?.getTime() ?? a.createdAt.getTime();
      const bTime = b.publishedAt?.getTime() ?? b.createdAt.getTime();
      return bTime - aTime;
    });
}

// ========== Comment Operations ==========
export async function getCommentsByPost(postId: number) {
  return comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function createComment(data: InsertComment) {
  const newComment: Comment = {
    id: commentIdCounter++,
    content: data.content,
    postId: data.postId,
    authorId: data.authorId,
    parentId: data.parentId ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  comments.push(newComment);
  return { insertId: newComment.id };
}

export async function deleteComment(id: number) {
  const index = comments.findIndex((c) => c.id === id);
  if (index !== -1) {
    comments.splice(index, 1);
  }
  return { affectedRows: index !== -1 ? 1 : 0 };
}

// ========== Like Operations ==========
export async function getLikesByPost(postId: number) {
  return likes.filter((l) => l.postId === postId);
}

export async function getUserLikeForPost(postId: number, userId: number) {
  return likes.find((l) => l.postId === postId && l.userId === userId);
}

export async function createLike(data: InsertLike) {
  const newLike: Like = {
    id: likeIdCounter++,
    postId: data.postId,
    userId: data.userId,
    createdAt: new Date(),
  };
  likes.push(newLike);
  return { insertId: newLike.id };
}

export async function deleteLike(postId: number, userId: number) {
  const index = likes.findIndex((l) => l.postId === postId && l.userId === userId);
  if (index !== -1) {
    likes.splice(index, 1);
  }
  return { affectedRows: index !== -1 ? 1 : 0 };
}

// ========== Notification Operations ==========
export async function getNotificationsByUser(userId: number, unreadOnly: boolean = false) {
  let result = notifications.filter((n) => n.userId === userId);
  if (unreadOnly) {
    result = result.filter((n) => !n.isRead);
  }
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createNotification(data: InsertNotification) {
  const newNotification: Notification = {
    id: notificationIdCounter++,
    userId: data.userId,
    type: data.type,
    title: data.title,
    content: data.content ?? null,
    relatedId: data.relatedId ?? null,
    isRead: false,
    createdAt: new Date(),
  };
  notifications.push(newNotification);
  return { insertId: newNotification.id };
}

export async function markNotificationAsRead(id: number) {
  const notification = notifications.find((n) => n.id === id);
  if (notification) {
    notification.isRead = true;
  }
  return { affectedRows: notification ? 1 : 0 };
}

export async function markAllNotificationsAsRead(userId: number) {
  let count = 0;
  notifications.forEach((n) => {
    if (n.userId === userId && !n.isRead) {
      n.isRead = true;
      count++;
    }
  });
  return { affectedRows: count };
}

// ========== Health Records Operations ==========
export async function createHealthRecord(data: InsertHealthRecord) {
  const newRecord: HealthRecord = {
    id: healthRecordIdCounter++,
    userId: data.userId,
    date: data.date,
    sleepHours: data.sleepHours ?? null,
    sleepQuality: data.sleepQuality ?? null,
    meals: data.meals ?? null,
    water: data.water ?? null,
    exercise: data.exercise ?? null,
    exerciseDuration: data.exerciseDuration ?? null,
    mood: data.mood ?? null,
    notes: data.notes ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  healthRecords.push(newRecord);
  return { insertId: newRecord.id };
}

export async function getHealthRecordsByUser(userId: number, limit: number = 30) {
  return healthRecords
    .filter((h) => h.userId === userId)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}

export async function getHealthRecordById(id: number) {
  return healthRecords.find((h) => h.id === id);
}

export async function updateHealthRecord(id: number, data: Partial<InsertHealthRecord>) {
  const record = healthRecords.find((h) => h.id === id);
  if (record) {
    Object.assign(record, {
      ...data,
      updatedAt: new Date(),
    });
  }
  return { affectedRows: record ? 1 : 0 };
}

export async function deleteHealthRecord(id: number) {
  const index = healthRecords.findIndex((h) => h.id === id);
  if (index !== -1) {
    healthRecords.splice(index, 1);
  }
  return { affectedRows: index !== -1 ? 1 : 0 };
}

// ========== Financial Transactions Operations ==========
export async function createTransaction(data: InsertTransaction) {
  const newTransaction: Transaction = {
    id: transactionIdCounter++,
    userId: data.userId,
    type: data.type,
    category: data.category,
    amount: data.amount,
    currency: data.currency ?? "CNY",
    description: data.description ?? null,
    date: data.date,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  transactions.push(newTransaction);
  return { insertId: newTransaction.id };
}

export async function getTransactionsByUser(userId: number, limit: number = 100) {
  return transactions
    .filter((t) => t.userId === userId)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}

export async function getTransactionById(id: number) {
  return transactions.find((t) => t.id === id);
}

export async function updateTransaction(id: number, data: Partial<InsertTransaction>) {
  const transaction = transactions.find((t) => t.id === id);
  if (transaction) {
    Object.assign(transaction, {
      ...data,
      updatedAt: new Date(),
    });
  }
  return { affectedRows: transaction ? 1 : 0 };
}

export async function deleteTransaction(id: number) {
  const index = transactions.findIndex((t) => t.id === id);
  if (index !== -1) {
    transactions.splice(index, 1);
  }
  return { affectedRows: index !== -1 ? 1 : 0 };
}

export async function getTransactionsSummary(userId: number, startDate: Date, endDate: Date) {
  const userTransactions = transactions.filter(
    (t) => t.userId === userId && t.date >= startDate && t.date <= endDate
  );

  const income = userTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = userTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome: income,
    totalExpense: expense,
    balance: income - expense,
  };
}

// ========== Balance Operations ==========
export async function createBalance(data: InsertBalance) {
  const newBalance: Balance = {
    id: balanceIdCounter++,
    userId: data.userId,
    amount: data.amount,
    currency: data.currency ?? "CNY",
    date: data.date,
    createdAt: new Date(),
  };
  balances.push(newBalance);
  return { insertId: newBalance.id };
}

export async function getLatestBalance(userId: number) {
  const userBalances = balances
    .filter((b) => b.userId === userId)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  return userBalances[0];
}

export async function getBalanceHistory(userId: number, limit: number = 30) {
  return balances
    .filter((b) => b.userId === userId)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}
